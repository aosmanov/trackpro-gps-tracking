const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { authenticateToken, requireRole, requireCompanyAccess } = require('../middleware/auth');
const router = express.Router();

// Public tracking endpoint (no auth required)
router.get('/track/:trackingCode', async (req, res) => {
  try {
    const { trackingCode } = req.params;

    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .select(`
        id,
        job_number,
        status,
        service_type,
        description,
        customer_address,
        customer_latitude,
        customer_longitude,
        scheduled_start,
        actual_start,
        created_at,
        customers (
          first_name,
          last_name
        ),
        users!jobs_technician_id_fkey (
          id,
          first_name,
          last_name,
          phone
        ),
        companies (
          id,
          name,
          phone
        )
      `)
      .eq('tracking_code', trackingCode.toUpperCase())
      .single();

    if (error || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get latest location if technician is en route
    let latestLocation = null;
    if (job.status === 'en_route' && job.users) {
      const { data: location } = await supabaseAdmin
        .from('job_locations')
        .select('latitude, longitude, timestamp')
        .eq('job_id', job.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      latestLocation = location;
    }

    res.json({
      ...job,
      latest_location: latestLocation
    });
  } catch (error) {
    console.error('Job tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Apply authentication to all other routes
router.use(authenticateToken);

// Get all jobs for a company
router.get('/company/:companyId', requireCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('jobs')
      .select(`
        *,
        customers (
          id,
          first_name,
          last_name,
          phone,
          email
        ),
        users!jobs_technician_id_fkey (
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Jobs fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch jobs' });
    }

    res.json(jobs);
  } catch (error) {
    console.error('Jobs fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get jobs assigned to a technician
router.get('/technician/:technicianId', async (req, res) => {
  try {
    const { technicianId } = req.params;
    const { status } = req.query;

    // Verify technician belongs to same company as requesting user
    if (req.user.role === 'technician' && req.user.id !== technicianId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = supabaseAdmin
      .from('jobs')
      .select(`
        *,
        customers (
          id,
          first_name,
          last_name,
          phone,
          email,
          address
        )
      `)
      .eq('technician_id', technicianId)
      .order('created_at', { ascending: false });

    if (status) {
      // Handle comma-separated status values
      const statusArray = status.split(',').map(s => s.trim());
      console.log('Status filter received:', status);
      console.log('Status array:', statusArray);
      query = query.in('status', statusArray);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Technician jobs fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch jobs' });
    }

    res.json(jobs);
  } catch (error) {
    console.error('Technician jobs fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new job
router.post('/', requireRole(['dispatcher']), async (req, res) => {
  try {
    const {
      customerFirstName,
      customerLastName,
      customerPhone,
      customerEmail,
      customerAddress,
      customerCity,
      customerState,
      customerZipCode,
      serviceType,
      description,
      priority = 'medium',
      scheduledStart
    } = req.body;

    // Validate required fields
    if (!customerFirstName || !customerLastName || !customerPhone || !customerAddress || !serviceType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create or find customer
    let customer;
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('phone', customerPhone)
      .single();

    if (existingCustomer) {
      // Update existing customer info
      const { data: updatedCustomer, error: updateError } = await supabaseAdmin
        .from('customers')
        .update({
          first_name: customerFirstName,
          last_name: customerLastName,
          email: customerEmail,
          address: customerAddress,
          city: customerCity,
          state: customerState,
          zip_code: customerZipCode
        })
        .eq('id', existingCustomer.id)
        .select()
        .single();

      if (updateError) {
        console.error('Customer update error:', updateError);
        return res.status(500).json({ error: 'Failed to update customer' });
      }
      customer = updatedCustomer;
    } else {
      // Create new customer
      const { data: newCustomer, error: createError } = await supabaseAdmin
        .from('customers')
        .insert({
          first_name: customerFirstName,
          last_name: customerLastName,
          phone: customerPhone,
          email: customerEmail,
          address: customerAddress,
          city: customerCity,
          state: customerState,
          zip_code: customerZipCode
        })
        .select()
        .single();

      if (createError) {
        console.error('Customer creation error:', createError);
        return res.status(500).json({ error: 'Failed to create customer' });
      }
      customer = newCustomer;
    }

    // Build complete address for better geocoding
    let fullAddress = customerAddress;
    if (customerCity) fullAddress += `, ${customerCity}`;
    if (customerState) fullAddress += `, ${customerState}`;
    if (customerZipCode) fullAddress += ` ${customerZipCode}`;

    // Create job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert({
        company_id: req.user.company_id,
        customer_id: customer.id,
        service_type: serviceType,
        description,
        priority,
        scheduled_start: scheduledStart,
        customer_address: fullAddress,
        status: 'pending'
      })
      .select(`
        *,
        customers (
          id,
          first_name,
          last_name,
          phone,
          email
        )
      `)
      .single();

    if (jobError) {
      console.error('Job creation error:', jobError);
      return res.status(500).json({ error: 'Failed to create job' });
    }

    res.status(201).json(job);
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign technician to job
router.put('/:jobId/assign', requireRole(['dispatcher']), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({ error: 'Technician ID is required' });
    }

    // Verify technician belongs to same company
    const { data: technician } = await supabaseAdmin
      .from('users')
      .select('id, company_id, first_name, last_name')
      .eq('id', technicianId)
      .eq('company_id', req.user.company_id)
      .eq('role', 'technician')
      .single();

    if (!technician) {
      return res.status(400).json({ error: 'Invalid technician' });
    }

    // Update job
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .update({
        technician_id: technicianId,
        status: 'assigned'
      })
      .eq('id', jobId)
      .eq('company_id', req.user.company_id)
      .select(`
        *,
        customers (
          id,
          first_name,
          last_name,
          phone,
          email
        ),
        users!jobs_technician_id_fkey (
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .single();

    if (error) {
      console.error('Job assignment error:', error);
      return res.status(500).json({ error: 'Failed to assign job' });
    }

    res.json(job);
  } catch (error) {
    console.error('Job assignment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update job status
router.put('/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'assigned', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Build update object
    const updateData = { status };
    
    // Set timestamps based on status
    if (status === 'in_progress' && !notes) {
      updateData.actual_start = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.actual_end = new Date().toISOString();
    }

    // Update job
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .update(updateData)
      .eq('id', jobId)
      .eq('company_id', req.user.company_id)
      .select(`
        *,
        customers (
          id,
          first_name,
          last_name,
          phone,
          email
        ),
        users!jobs_technician_id_fkey (
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .single();

    if (error) {
      console.error('Job status update error:', error);
      return res.status(500).json({ error: 'Failed to update job status' });
    }

    // Log status change if notes provided
    if (notes) {
      await supabaseAdmin
        .from('job_status_history')
        .insert({
          job_id: jobId,
          user_id: req.user.id,
          new_status: status,
          notes
        });
    }

    res.json(job);
  } catch (error) {
    console.error('Job status update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update technician location
router.post('/:jobId/location', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { latitude, longitude, accuracy, speed, heading } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Verify job belongs to technician or company
    const { data: job } = await supabaseAdmin
      .from('jobs')
      .select('id, technician_id, company_id')
      .eq('id', jobId)
      .single();

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (req.user.role === 'technician' && job.technician_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (job.company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Insert location data
    const { error } = await supabaseAdmin
      .from('job_locations')
      .insert({
        job_id: jobId,
        technician_id: job.technician_id,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        speed: speed ? parseFloat(speed) : null,
        heading: heading ? parseInt(heading) : null
      });

    if (error) {
      console.error('Location update error:', error);
      return res.status(500).json({ error: 'Failed to update location' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;