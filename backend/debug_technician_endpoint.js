const { supabaseAdmin } = require('./config/supabase');

async function testTechnicianEndpoint() {
  try {
    // Test the exact query the frontend would make
    const technicianId = 'b34e4679-cdfe-4872-8657-1c5a430dca0a';
    const statuses = ['assigned', 'en_route', 'arrived', 'in_progress'];
    
    console.log('Testing technician jobs endpoint...');
    console.log('Technician ID:', technicianId);
    console.log('Statuses:', statuses);
    
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

    // Add status filter
    query = query.in('status', statuses);

    const { data: jobs, error } = await query;

    if (error) {
      console.error('❌ Database error:', error.message);
      return;
    }

    console.log('✅ Query successful!');
    console.log('📋 Jobs found:', jobs.length);
    
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.job_number} - ${job.service_type}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Customer: ${job.customers?.first_name} ${job.customers?.last_name}`);
      console.log(`   Tracking: ${job.tracking_code}`);
      console.log('');
    });
    
    if (jobs.length === 0) {
      console.log('❌ No jobs found with the specified criteria');
      console.log('🔍 Double-checking all jobs for this technician...');
      
      const { data: allJobs } = await supabaseAdmin
        .from('jobs')
        .select('job_number, status, service_type')
        .eq('technician_id', technicianId);
      
      console.log('All jobs for technician (any status):');
      allJobs.forEach(job => {
        console.log(`- ${job.job_number}: ${job.status} (${job.service_type})`);
      });
    }
    
  } catch (e) {
    console.log('Error:', e.message);
  }
}

testTechnicianEndpoint();