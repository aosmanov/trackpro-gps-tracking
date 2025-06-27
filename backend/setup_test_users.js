const { supabaseAdmin } = require('./config/supabase');
const bcrypt = require('bcryptjs');

async function setupTestUsers() {
  console.log('🚀 Setting up TrackPro test users...\n');
  
  try {
    // Check if we have a working database connection
    const { data: testConnection, error: connectionError } = await supabaseAdmin
      .from('companies')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError.message);
      console.log('\n📋 Next steps:');
      console.log('1. Make sure your Supabase database is running');
      console.log('2. Execute the database schema files in order:');
      console.log('   - database/001_initial_schema.sql');
      console.log('   - database/002_trust_features.sql');
      console.log('   - database/003_sample_data.sql (updated with valid password hashes)');
      return;
    }
    
    // Check if sample data already exists
    const { data: existingUsers, error: userError } = await supabaseAdmin
      .from('users')
      .select('email, role')
      .eq('email', 'sarah@bostonwater.com');
    
    if (userError) {
      console.log('⚠️  Users table not found. Please run the database schema files first.');
      console.log('\n📋 Database setup steps:');
      console.log('1. Create your Supabase project');
      console.log('2. Run: database/001_initial_schema.sql');
      console.log('3. Run: database/002_trust_features.sql');
      console.log('4. Run: database/003_sample_data.sql');
      return;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('✅ Sample users already exist in database!\n');
    } else {
      console.log('⚠️  No sample users found. Run database/003_sample_data.sql first.\n');
    }
    
    // Test login credentials
    console.log('🔐 Testing login credentials...\n');
    
    const testCredentials = [
      { email: 'sarah@bostonwater.com', password: 'password123', role: 'dispatcher', company: 'Boston Water Restoration' },
      { email: 'lisa@quickfixplumbing.com', password: 'password123', role: 'dispatcher', company: 'Quick Fix Plumbing' },
      { email: 'admin@elitehvac.com', password: 'password123', role: 'dispatcher', company: 'Elite HVAC Services' },
    ];
    
    for (const cred of testCredentials) {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('email, password_hash, role, companies(name)')
        .eq('email', cred.email)
        .eq('role', cred.role)
        .single();
      
      if (user) {
        const isValidPassword = await bcrypt.compare(cred.password, user.password_hash);
        console.log(`${isValidPassword ? '✅' : '❌'} ${cred.company}`);
        console.log(`   Email: ${cred.email}`);
        console.log(`   Password: ${cred.password}`);
        console.log(`   Role: ${cred.role}`);
        console.log(`   Valid: ${isValidPassword ? 'YES' : 'NO'}`);
        console.log('');
      } else {
        console.log(`❌ ${cred.company} - User not found`);
        console.log('');
      }
    }
    
    // Test technician credentials
    console.log('🔧 Testing technician credentials...\n');
    
    const techCredentials = [
      { phone: '(617) 555-0102', pin: 'tech123', name: 'Mike Davis', company: 'Boston Water' },
      { phone: '(617) 555-0103', pin: 'tech123', name: 'John Smith', company: 'Boston Water' },
      { phone: '(617) 555-0202', pin: 'tech123', name: 'Carlos Rodriguez', company: 'Quick Fix' },
      { phone: '(617) 555-0302', pin: 'tech123', name: 'David Brown', company: 'Elite HVAC' },
    ];
    
    for (const cred of techCredentials) {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('phone, password_hash, role, first_name, last_name')
        .eq('phone', cred.phone)
        .eq('role', 'technician')
        .single();
      
      if (user) {
        const isValidPin = await bcrypt.compare(cred.pin, user.password_hash);
        console.log(`${isValidPin ? '✅' : '❌'} ${cred.name} (${cred.company})`);
        console.log(`   Phone: ${cred.phone}`);
        console.log(`   PIN: ${cred.pin}`);
        console.log(`   Valid: ${isValidPin ? 'YES' : 'NO'}`);
        console.log('');
      } else {
        console.log(`❌ ${cred.name} - User not found`);
        console.log('');
      }
    }
    
    console.log('📱 Mobile App Login Instructions:');
    console.log('');
    console.log('For dispatcher login:');
    console.log('- Use any of the dispatcher emails above');
    console.log('- Password: password123');
    console.log('');
    console.log('For technician login:');
    console.log('- Use any of the phone numbers above');
    console.log('- PIN: tech123');
    console.log('');
    console.log('🌐 API Endpoint: /api/auth/login/dispatcher');
    console.log('🌐 API Endpoint: /api/auth/login/technician');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nIf you see a connection error, make sure:');
    console.log('1. Your Supabase project is active');
    console.log('2. The .env file has correct SUPABASE_URL and SUPABASE_SERVICE_KEY');
    console.log('3. The database schema has been applied');
  }
}

// Also provide a function to create a new test user
async function createNewTestUser(email, password, role = 'dispatcher') {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // First, we need a company ID - let's use Boston Water's ID
    const companyId = '550e8400-e29b-41d4-a716-446655440001';
    
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        company_id: companyId,
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        first_name: 'Test',
        last_name: 'User',
        role: role,
        is_active: true
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create user:', error.message);
    } else {
      console.log('✅ Test user created successfully!');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`   Role: ${role}`);
    }
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
  }
}

// Run the setup
if (require.main === module) {
  setupTestUsers();
}

module.exports = { setupTestUsers, createNewTestUser };