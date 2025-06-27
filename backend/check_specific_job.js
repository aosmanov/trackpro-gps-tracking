const { supabaseAdmin } = require('./config/supabase');

async function checkSpecificJob() {
  try {
    const trackingCode = 'FA8738';
    
    // Check job status
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('tracking_code', trackingCode)
      .single();
    
    if (jobError) {
      console.log('❌ Job error:', jobError.message);
      return;
    }
    
    console.log('📋 Job FA8738 Details:');
    console.log('Status:', job.status);
    console.log('Updated:', new Date(job.updated_at).toLocaleString());
    console.log('Technician ID:', job.technician_id);
    
    // Check if there are any location records
    const { data: locations, error: locError } = await supabaseAdmin
      .from('job_locations')
      .select('*')
      .eq('job_id', job.id)
      .order('timestamp', { ascending: false })
      .limit(5);
    
    if (locError) {
      console.log('❌ Location error:', locError.message);
      return;
    }
    
    console.log('📍 Location Records:', locations.length);
    locations.forEach((loc, index) => {
      console.log(`${index + 1}. ${loc.latitude}, ${loc.longitude} at ${new Date(loc.timestamp).toLocaleString()}`);
    });
    
    // Test what the tracking API returns
    console.log('');
    console.log('🌐 Testing tracking API...');
    
  } catch (e) {
    console.log('Error:', e.message);
  }
}

checkSpecificJob();