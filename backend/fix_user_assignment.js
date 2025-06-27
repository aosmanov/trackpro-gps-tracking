const { supabaseAdmin } = require('./config/supabase');

async function fixUserAssignment() {
  try {
    // The correct user ID from frontend
    const currentUserId = '5c91524c-7a97-4831-8161-6f12cb54c51b';
    
    console.log('Assigning all jobs to current user:', currentUserId);
    
    // Update all jobs to be assigned to the current user
    const { data: updatedJobs, error } = await supabaseAdmin
      .from('jobs')
      .update({
        technician_id: currentUserId
      })
      .eq('technician_id', 'b34e4679-cdfe-4872-8657-1c5a430dca0a')
      .select('job_number, service_type, tracking_code');
    
    if (error) {
      console.log('❌ Error updating jobs:', error.message);
      return;
    }
    
    console.log('✅ Jobs successfully reassigned!');
    console.log('📋 Updated jobs:');
    updatedJobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.job_number} - ${job.service_type} (${job.tracking_code})`);
    });
    
    console.log('');
    console.log('🧪 Test Instructions:');
    console.log('1. Refresh: http://localhost:5173/tech');
    console.log('2. You should now see all 6 jobs including "Enhanced Tracking Test"');
    console.log('3. Click "🚗 Start Traveling" on Enhanced Tracking Test');
    console.log('4. Watch customer tracking: http://localhost:5173/track/UBER001');
    
  } catch (e) {
    console.log('Error:', e.message);
  }
}

fixUserAssignment();