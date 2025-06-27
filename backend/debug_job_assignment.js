const { supabaseAdmin } = require('./config/supabase');

async function debugJobAssignment() {
  try {
    // Check the UBER001 job status
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select(`
        *,
        users!jobs_technician_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('tracking_code', 'UBER001')
      .single();
    
    if (jobError) {
      console.log('❌ Error fetching job:', jobError.message);
      return;
    }
    
    console.log('🔍 Job UBER001 Details:');
    console.log('📋 Job ID:', job.id);
    console.log('👤 Technician ID:', job.technician_id);
    console.log('📊 Status:', job.status);
    console.log('🎯 Tracking Code:', job.tracking_code);
    console.log('🏢 Company ID:', job.company_id);
    
    if (job.users) {
      console.log('👨‍🔧 Assigned Technician:', job.users.first_name, job.users.last_name);
      console.log('📧 Technician Email:', job.users.email);
    }
    
    console.log('');
    
    // Check all technician jobs for this user
    const { data: allJobs, error: allJobsError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('technician_id', job.technician_id);
    
    if (allJobsError) {
      console.log('❌ Error fetching all jobs:', allJobsError.message);
    } else {
      console.log('📋 All jobs for this technician:');
      allJobs.forEach((j, index) => {
        console.log(`${index + 1}. ${j.job_number} - Status: ${j.status} - Service: ${j.service_type}`);
      });
    }
    
    console.log('');
    console.log('🔧 If job is not showing in /tech:');
    console.log('1. Check if status is one of: assigned, en_route, arrived, in_progress');
    console.log('2. Check if technician_id matches current user ID');
    console.log('3. Check browser console for API errors');
    
  } catch (e) {
    console.log('Error:', e.message);
  }
}

debugJobAssignment();