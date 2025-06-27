const { supabaseAdmin } = require('./config/supabase');

async function checkJobStatus() {
  try {
    const { data: jobs, error } = await supabaseAdmin
      .from('jobs')
      .select('job_number, tracking_code, status, updated_at')
      .eq('technician_id', '5c91524c-7a97-4831-8161-6f12cb54c51b')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log('📋 Current Job Statuses:');
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.job_number} (${job.tracking_code}): ${job.status}`);
      console.log(`   Updated: ${new Date(job.updated_at).toLocaleString()}`);
    });
    
  } catch (e) {
    console.log('Error:', e.message);
  }
}

checkJobStatus();