const { supabaseAdmin } = require('./config/supabase');

async function testLocationBroadcast() {
  try {
    // Insert a test location directly into the database
    const jobId = '5b9be570-4a72-4f95-944e-3c583e072c63'; // UBER001 job
    const technicianId = '5c91524c-7a97-4831-8161-6f12cb54c51b';
    
    console.log('Inserting test location for job:', jobId);
    
    const { error } = await supabaseAdmin
      .from('job_locations')
      .insert({
        job_id: jobId,
        technician_id: technicianId,
        latitude: 42.387688,
        longitude: -71.089928,
        accuracy: 391,
        speed: 0,
        heading: 0,
        timestamp: new Date().toISOString()
      });
    
    if (error) {
      console.log('❌ Error inserting location:', error.message);
    } else {
      console.log('✅ Test location inserted successfully');
      console.log('📍 Location: 42.387688, -71.089928 (Boston)');
      console.log('🗺️ Check customer tracking: http://localhost:5173/track/UBER001');
      console.log('');
      console.log('If technician still not showing, the issue is:');
      console.log('1. Customer tracking not reading latest location from database');
      console.log('2. WebSocket real-time updates not working');
      console.log('3. Map initialization issue');
    }
    
  } catch (e) {
    console.log('Error:', e.message);
  }
}

testLocationBroadcast();