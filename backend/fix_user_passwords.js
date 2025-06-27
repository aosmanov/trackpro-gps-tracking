const { supabaseAdmin } = require('./config/supabase');
const bcrypt = require('bcryptjs');

async function fixUserPasswords() {
  console.log('🔧 Fixing user password hashes...\n');
  
  try {
    // Generate correct password hashes
    const password123Hash = await bcrypt.hash('password123', 10);
    const tech123Hash = await bcrypt.hash('tech123', 10);
    
    console.log('Generated hashes:');
    console.log('password123:', password123Hash);
    console.log('tech123:', tech123Hash);
    console.log();
    
    // Update dispatcher passwords
    const dispatcherEmails = [
      'sarah@bostonwater.com',
      'lisa@quickfixplumbing.com', 
      'admin@elitehvac.com'
    ];
    
    console.log('Updating dispatcher passwords...');
    for (const email of dispatcherEmails) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ password_hash: password123Hash })
        .eq('email', email)
        .eq('role', 'dispatcher')
        .select('email, first_name, last_name');
      
      if (error) {
        console.log(`❌ Failed to update ${email}:`, error.message);
      } else if (data && data.length > 0) {
        console.log(`✅ Updated ${data[0].first_name} ${data[0].last_name} (${email})`);
      } else {
        console.log(`⚠️  User not found: ${email}`);
      }
    }
    
    // Update technician PINs
    const technicianPhones = [
      '(617) 555-0102',
      '(617) 555-0103',
      '(617) 555-0202',
      '(617) 555-0302'
    ];
    
    console.log('\nUpdating technician PINs...');
    for (const phone of technicianPhones) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ password_hash: tech123Hash })
        .eq('phone', phone)
        .eq('role', 'technician')
        .select('phone, first_name, last_name');
      
      if (error) {
        console.log(`❌ Failed to update ${phone}:`, error.message);
      } else if (data && data.length > 0) {
        console.log(`✅ Updated ${data[0].first_name} ${data[0].last_name} (${phone})`);
      } else {
        console.log(`⚠️  User not found: ${phone}`);
      }
    }
    
    console.log('\n🎉 Password fix complete!');
    console.log('\n📝 Test these credentials now:');
    console.log('\nDISPATCHER LOGIN:');
    console.log('Email: sarah@bostonwater.com');
    console.log('Password: password123');
    console.log('\nTECHNICIAN LOGIN:');
    console.log('Phone: (617) 555-0102');
    console.log('PIN: tech123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixUserPasswords();