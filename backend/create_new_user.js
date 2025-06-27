const { supabaseAdmin } = require('./config/supabase');
const bcrypt = require('bcryptjs');

async function createNewUser(email, password, role = 'dispatcher', firstName = 'New', lastName = 'User') {
  console.log(`🆕 Creating new ${role} user...`);
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Use Boston Water's company ID as default
    const companyId = '550e8400-e29b-41d4-a716-446655440001';
    
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        company_id: companyId,
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role: role,
        is_active: true
      })
      .select(`
        *,
        companies (
          id,
          name,
          email
        )
      `)
      .single();
    
    if (error) {
      console.error('❌ Failed to create user:', error.message);
      return null;
    }
    
    console.log('✅ User created successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${role}`);
    console.log(`   Name: ${firstName} ${lastName}`);
    console.log(`   Company: ${user.companies.name}`);
    
    return user;
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    return null;
  }
}

async function createNewTechnician(phone, pin, firstName, lastName) {
  console.log('🔧 Creating new technician...');
  
  try {
    // Hash the PIN
    const hashedPin = await bcrypt.hash(pin, 10);
    
    // Use Boston Water's company ID as default
    const companyId = '550e8400-e29b-41d4-a716-446655440001';
    
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        company_id: companyId,
        phone: phone,
        password_hash: hashedPin,
        first_name: firstName,
        last_name: lastName,
        role: 'technician',
        is_active: true
      })
      .select(`
        *,
        companies (
          id,
          name,
          email
        )
      `)
      .single();
    
    if (error) {
      console.error('❌ Failed to create technician:', error.message);
      return null;
    }
    
    // Create technician profile
    const { error: profileError } = await supabaseAdmin
      .from('technician_profiles')
      .insert({
        technician_id: user.id
      });
    
    if (profileError) {
      console.warn('⚠️  Failed to create technician profile:', profileError.message);
    }
    
    console.log('✅ Technician created successfully!');
    console.log(`   Phone: ${phone}`);
    console.log(`   PIN: ${pin}`);
    console.log(`   Name: ${firstName} ${lastName}`);
    console.log(`   Company: ${user.companies.name}`);
    
    return user;
  } catch (error) {
    console.error('❌ Error creating technician:', error.message);
    return null;
  }
}

// Example usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage examples:');
    console.log('node create_new_user.js dispatcher test@example.com mypassword123 John Doe');
    console.log('node create_new_user.js technician "(555) 123-4567" 1234 Jane Smith');
    return;
  }
  
  const [type, ...params] = args;
  
  if (type === 'dispatcher') {
    const [email, password, firstName, lastName] = params;
    createNewUser(email, password, 'dispatcher', firstName, lastName);
  } else if (type === 'technician') {
    const [phone, pin, firstName, lastName] = params;
    createNewTechnician(phone, pin, firstName, lastName);
  } else {
    console.log('First argument must be "dispatcher" or "technician"');
  }
}

module.exports = { createNewUser, createNewTechnician };