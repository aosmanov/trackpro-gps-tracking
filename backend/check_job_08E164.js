const { supabaseAdmin } = require('./config/supabase');

async function checkJob08E164() {
  try {
    const trackingCode = '08E164';
    
    // Check job details
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('tracking_code', trackingCode)
      .single();
    
    if (jobError) {
      console.log('❌ Job error:', jobError.message);
      return;
    }
    
    console.log('📋 Job 08E164 Details:');
    console.log('Job Number:', job.job_number);
    console.log('Status:', job.status);
    console.log('Technician ID:', job.technician_id);
    console.log('Updated:', new Date(job.updated_at).toLocaleString());
    console.log('Customer Address:', job.customer_address);
    console.log('');
    
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
    if (locations.length > 0) {
      locations.forEach((loc, index) => {
        console.log(`${index + 1}. ${loc.latitude}, ${loc.longitude} at ${new Date(loc.timestamp).toLocaleString()}`);
      });
    } else {
      console.log('No location tracking data found for this job.');
      console.log('');
      console.log('💡 To fix this:');
      console.log('1. The assigned technician needs to log into the technician app');
      console.log('2. Find this job in their job list');
      console.log('3. Click "🚗 Start Traveling" to begin location tracking');
    }
    
  } catch (e) {
    console.log('Error:', e.message);
  }
}

checkJob08E164();