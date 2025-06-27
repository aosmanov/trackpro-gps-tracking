const { supabaseAdmin } = require('./config/supabase');

async function fixJobStatus() {
  try {
    // Update UBER001 job status to en_route
    const { data: job, error } = await supabaseAdmin
      .from('jobs')
      .update({
        status: 'en_route'
      })
      .eq('tracking_code', 'UBER001')
      .select()
      .single();
    
    if (error) {
      console.log('❌ Error updating job status:', error.message);
    } else {
      console.log('✅ Job status updated successfully');
      console.log('📋 Job:', job.job_number);
      console.log('📊 New Status:', job.status);
      console.log('🎯 Tracking Code:', job.tracking_code);
      console.log('');
      console.log('🧪 Now refresh customer tracking: http://localhost:5173/track/UBER001');
      console.log('👨‍🔧 Technician should now appear on the map!');
    }
    
  } catch (e) {
    console.log('Error:', e.message);
  }
}

fixJobStatus();