const { supabaseAdmin } = require('./config/supabase');

async function assignJobToCurrentDispatcher() {
  try {
    // Find the dispatcher user (Arsen Osmanov based on previous data)
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('first_name', 'Arsen')
      .eq('last_name', 'Osmanov');
    
    if (usersError) {
      console.log('Error fetching users:', usersError.message);
      return;
    }
    
    if (users.length === 0) {
      console.log('❌ Current user not found');
      return;
    }
    
    const currentUser = users[0];
    console.log('✅ Found current user:', currentUser.first_name, currentUser.last_name);
    console.log('📧 Email:', currentUser.email);
    console.log('👤 Role:', currentUser.role);
    
    // Assign UBER001 job to current user
    const { error: assignError } = await supabaseAdmin
      .from('jobs')
      .update({
        technician_id: currentUser.id,
        status: 'assigned'
      })
      .eq('tracking_code', 'UBER001');
      
    if (assignError) {
      console.log('❌ Error assigning job:', assignError.message);
    } else {
      console.log('✅ Job UBER001 assigned to current user');
      console.log('');
      console.log('🧪 Test Instructions:');
      console.log('1. Refresh: http://localhost:5173/tech');
      console.log('2. You should now see "Enhanced Tracking Test" job');
      console.log('3. Click "🚗 Start Traveling" to begin enhanced tracking');
      console.log('4. Watch customer side: http://localhost:5173/track/UBER001');
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

assignJobToCurrentDispatcher();