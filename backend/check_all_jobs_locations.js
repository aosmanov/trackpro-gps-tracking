const { supabaseAdmin } = require('./config/supabase');

async function checkAllJobsLocations() {
  try {
    // Get all jobs with their latest location
    const { data: jobs, error } = await supabaseAdmin
      .from('jobs')
      .select(`
        job_number,
        tracking_code,
        status,
        technician_id,
        updated_at
      `)
      .eq('technician_id', '5c91524c-7a97-4831-8161-6f12cb54c51b')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log('📋 Checking location data for all technician jobs:\n');
    
    for (const job of jobs) {
      console.log(`📍 ${job.job_number} (${job.tracking_code}) - Status: ${job.status}`);
      console.log(`   Updated: ${new Date(job.updated_at).toLocaleString()}`);
      
      // Get job ID first
      const { data: jobDetail, error: jobError } = await supabaseAdmin
        .from('jobs')
        .select('id')
        .eq('tracking_code', job.tracking_code)
        .single();
        
      if (!jobError && jobDetail) {
        // Check location records
        const { data: locations, error: locError } = await supabaseAdmin
          .from('job_locations')
          .select('latitude, longitude, timestamp')
          .eq('job_id', jobDetail.id)
          .order('timestamp', { ascending: false })
          .limit(1);
        
        if (!locError && locations && locations.length > 0) {
          const loc = locations[0];
          console.log(`   ✅ Has location: ${loc.latitude}, ${loc.longitude}`);
          console.log(`   📅 Last location: ${new Date(loc.timestamp).toLocaleString()}`);
        } else {
          console.log(`   ❌ No location data`);
        }
      }
      console.log('');
    }
    
  } catch (e) {
    console.log('Error:', e.message);
  }
}

checkAllJobsLocations();