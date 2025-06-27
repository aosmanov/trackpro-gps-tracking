const { supabaseAdmin } = require('./config/supabase');

async function assignJobToExistingUser() {
  try {
    // Check existing users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'technician');
    
    if (usersError) {
      console.log('Error fetching users:', usersError.message);
      return;
    }
    
    if (users.length === 0) {
      console.log('❌ No technician users found. Create one via frontend.');
      console.log('📝 Quick solution:');
      console.log('1. Go to http://localhost:5173/register');
      console.log('2. Register with role: technician');
      console.log('3. Then come back to test enhanced tracking');
      return;
    }
    
    const technician = users[0];
    console.log('✅ Found technician:', technician.first_name, technician.last_name);
    
    // Assign UBER001 job to this technician
    const { error: assignError } = await supabaseAdmin
      .from('jobs')
      .update({
        technician_id: technician.id,
        status: 'assigned'
      })
      .eq('tracking_code', 'UBER001');
      
    if (assignError) {
      console.log('Error assigning job:', assignError.message);
    } else {
      console.log('✅ Job UBER001 assigned to technician');
      console.log('');
      console.log('🧪 Test Instructions:');
      console.log('1. Login as technician at: http://localhost:5173/login');
      console.log('2. Go to technician app: http://localhost:5173/tech');
      console.log('3. Start enhanced tracking by clicking "Start Traveling"');
      console.log('4. View customer side: http://localhost:5173/track/UBER001');
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

assignJobToExistingUser();