const { supabaseAdmin } = require('./config/supabase');

async function createEnhancedTestJob() {
  try {
    // Create a customer first
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert({
        first_name: 'John',
        last_name: 'TestUser',
        phone: '555-ENHANCED',
        email: 'test@enhanced.com',
        address: '16 Richardson Street',
        city: 'Somerville',
        state: 'MA',
        zip_code: '02143'
      })
      .select()
      .single();

    if (customerError) {
      console.log('Customer creation error:', customerError.message);
      return;
    }

    // Create a test job for enhanced tracking
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .insert({
        job_number: 'ENHANCED-001',
        tracking_code: 'UBER001',
        customer_address: '16 Richardson Street, Somerville, MA 02143',
        service_type: 'Enhanced Tracking Test',
        description: 'Testing Uber-style enhanced location tracking features',
        status: 'pending',
        company_id: 'ff6475dc-1b0d-4ed4-93e2-a28fd80886d7',
        customer_id: customer.id,
        technician_id: 'b34e4679-cdfe-4872-8657-1c5a430dca0a' // Assign to default technician
      })
      .select()
      .single();
    
    if (error) {
      console.log('Error creating enhanced test job:', error.message);
    } else {
      console.log('✅ Enhanced test job created successfully!');
      console.log('🎯 Tracking Code:', job.tracking_code);
      console.log('📍 Customer Address:', job.customer_address);
      console.log('👤 Status:', job.status);
      console.log('');
      console.log('🧪 Test URLs:');
      console.log('📱 Technician App: http://localhost:5173/technician');
      console.log('🗺️  Customer Tracking: http://localhost:5173/track/' + job.tracking_code);
      console.log('');
      console.log('📋 Test Steps:');
      console.log('1. Open technician app and start tracking');
      console.log('2. Open customer tracking page in another tab');
      console.log('3. Change job status to "en_route" to start enhanced tracking');
      console.log('4. Watch real-time location updates with driving metrics');
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

createEnhancedTestJob();