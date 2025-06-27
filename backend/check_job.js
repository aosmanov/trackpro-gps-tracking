const { supabase } = require('./config/supabase');

async function checkSpecificJob() {
  try {
    // First check all jobs
    const { data: allJobs, error: allError } = await supabase
      .from('jobs')
      .select('tracking_code, customer_address, job_number');
    
    if (allError) {
      console.log('Error getting all jobs:', allError.message);
    } else {
      console.log('All jobs in database:');
      allJobs.forEach(job => {
        console.log(`${job.tracking_code}: ${job.customer_address}`);
      });
    }
    
    // Then check specific job
    console.log('\nLooking for job with tracking code 1080A0...');
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('tracking_code', '1080A0');
    
    if (error) {
      console.log('Error finding job:', error.message);
    } else if (jobs.length === 0) {
      console.log('No job found with tracking code 1080A0');
    } else {
      console.log(`Found ${jobs.length} job(s):`);
      jobs.forEach(job => {
        console.log('Job Number:', job.job_number);
        console.log('Customer Address:', job.customer_address);
        console.log('Status:', job.status);
        console.log('Tracking Code:', job.tracking_code);
        console.log('---');
      });
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

checkSpecificJob();