const bcrypt = require('bcryptjs');
require('dotenv').config();

async function generateHashedPasswords() {
  console.log('=== TrackPro Test User Credentials ===\n');
  
  // Generate real password hashes
  const password123Hash = await bcrypt.hash('password123', 10);
  const dispatcher123Hash = await bcrypt.hash('dispatcher123', 10);
  const tech123Hash = await bcrypt.hash('tech123', 10);
  
  console.log('--- Sample Data SQL Updates ---');
  console.log('Replace the password_hash values in 003_sample_data.sql with these:');
  console.log('');
  console.log('For password "password123":');
  console.log(`'${password123Hash}'`);
  console.log('');
  console.log('For password "dispatcher123":');
  console.log(`'${dispatcher123Hash}'`);
  console.log('');
  console.log('For password "tech123":');
  console.log(`'${tech123Hash}'`);
  console.log('');
  
  console.log('--- Test Credentials for Login ---');
  console.log('');
  console.log('DISPATCHER ACCOUNTS:');
  console.log('1. Boston Water Restoration');
  console.log('   Email: sarah@bostonwater.com');
  console.log('   Password: password123');
  console.log('');
  console.log('2. Quick Fix Plumbing');
  console.log('   Email: lisa@quickfixplumbing.com');
  console.log('   Password: password123');
  console.log('');
  console.log('3. Elite HVAC Services');
  console.log('   Email: admin@elitehvac.com');
  console.log('   Password: password123');
  console.log('');
  
  console.log('TECHNICIAN ACCOUNTS:');
  console.log('1. Mike Davis (Boston Water)');
  console.log('   Phone: (617) 555-0102');
  console.log('   PIN: tech123');
  console.log('');
  console.log('2. John Smith (Boston Water)');
  console.log('   Phone: (617) 555-0103');
  console.log('   PIN: tech123');
  console.log('');
  console.log('3. Carlos Rodriguez (Quick Fix)');
  console.log('   Phone: (617) 555-0202');
  console.log('   PIN: tech123');
  console.log('');
  console.log('4. David Brown (Elite HVAC)');
  console.log('   Phone: (617) 555-0302');
  console.log('   PIN: tech123');
  console.log('');
  
  console.log('--- Updated SQL for 003_sample_data.sql ---');
  console.log(`
-- Updated INSERT with real password hashes (password: password123, tech PIN: tech123)
INSERT INTO users (id, company_id, email, phone, password_hash, first_name, last_name, role) VALUES
-- Boston Water Restoration users
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'sarah@bostonwater.com', '(617) 555-0101', '${password123Hash}', 'Sarah', 'Johnson', 'dispatcher'),
('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440001', 'mike@bostonwater.com', '(617) 555-0102', '${tech123Hash}', 'Mike', 'Davis', 'technician'),
('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440001', 'john@bostonwater.com', '(617) 555-0103', '${tech123Hash}', 'John', 'Smith', 'technician'),

-- Quick Fix Plumbing users  
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440002', 'lisa@quickfixplumbing.com', '(617) 555-0201', '${password123Hash}', 'Lisa', 'Chen', 'dispatcher'),
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440002', 'carlos@quickfixplumbing.com', '(617) 555-0202', '${tech123Hash}', 'Carlos', 'Rodriguez', 'technician'),

-- Elite HVAC users
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440003', 'admin@elitehvac.com', '(617) 555-0301', '${password123Hash}', 'Jennifer', 'Williams', 'dispatcher'),
('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440003', 'david@elitehvac.com', '(617) 555-0302', '${tech123Hash}', 'David', 'Brown', 'technician');
`);
}

generateHashedPasswords().catch(console.error);