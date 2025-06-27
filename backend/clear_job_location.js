const { supabaseAdmin } = require('./config/supabase');

async function clearJobLocation() {
  try {
    const trackingCode = '08E164';
    
    // Get job ID
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('id, job_number')
      .eq('tracking_code', trackingCode)
      .single();
    
    if (jobError) {
      console.log('❌ Job error:', jobError.message);
      return;
    }
    
    console.log(`🗑️ Clearing location data for job ${job.job_number} (${trackingCode})`);
    
    // Delete all location records for this job
    const { data, error } = await supabaseAdmin
      .from('job_locations')
      .delete()
      .eq('job_id', job.id);
    
    if (error) {
      console.log('❌ Delete error:', error.message);
      return;
    }
    
    console.log('✅ Location data cleared successfully');
    console.log('💡 Now start location tracking again to get fresh GPS coordinates');
    
  } catch (e) {
    console.log('Error:', e.message);
  }
}

clearJobLocation();