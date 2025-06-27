const { supabaseAdmin } = require('./config/supabase');
const bcrypt = require('bcryptjs');

async function createTestTechnician() {
  try {
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    // Create test technician user
    const { data: technician, error } = await supabaseAdmin
      .from('users')
      .insert({
        email: 'tech@test.com',
        password: hashedPassword,
        first_name: 'Test',
        last_name: 'Technician',
        phone: '555-TECH-001',
        role: 'technician',
        company_id: 'ff6475dc-1b0d-4ed4-93e2-a28fd80886d7'
      })
      .select()
      .single();
    
    if (error) {
      console.log('Error creating technician:', error.message);
    } else {
      console.log('✅ Test technician created successfully!');
      console.log('📧 Email: tech@test.com');
      console.log('🔑 Password: test123');
      console.log('');
      console.log('🧪 Testing Steps:');
      console.log('1. Logout from current dispatcher account');
      console.log('2. Login with: tech@test.com / test123');
      console.log('3. Go to http://localhost:5173/tech');
      console.log('4. Start enhanced tracking test!');
      
      // Also assign the UBER001 job to this technician
      const { error: assignError } = await supabaseAdmin
        .from('jobs')
        .update({
          technician_id: technician.id,
          status: 'assigned'
        })
        .eq('tracking_code', 'UBER001');
        
      if (!assignError) {
        console.log('✅ Job UBER001 assigned to test technician');
      }
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

createTestTechnician();