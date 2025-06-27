# TrackPro User Accounts & Credentials Summary

## Valid Test Credentials

The TrackPro backend now has working test accounts. The mobile app should be able to log in using these credentials:

### Dispatcher Accounts (Email/Password Login)

**Endpoint:** `POST /api/auth/login/dispatcher`

1. **Boston Water Restoration**
   - Email: `sarah@bostonwater.com`
   - Password: `password123`
   - Name: Sarah Johnson
   - Company ID: `550e8400-e29b-41d4-a716-446655440001`

2. **Quick Fix Plumbing**
   - Email: `lisa@quickfixplumbing.com`
   - Password: `password123`
   - Name: Lisa Chen
   - Company ID: `550e8400-e29b-41d4-a716-446655440002`

3. **Elite HVAC Services**
   - Email: `admin@elitehvac.com`
   - Password: `password123`
   - Name: Jennifer Williams
   - Company ID: `550e8400-e29b-41d4-a716-446655440003`

### Technician Accounts (Phone/PIN Login)

**Endpoint:** `POST /api/auth/login/technician`

1. **Mike Davis (Boston Water)**
   - Phone: `(617) 555-0102`
   - PIN: `tech123`
   - User ID: `550e8400-e29b-41d4-a716-446655440102`

2. **John Smith (Boston Water)**
   - Phone: `(617) 555-0103`
   - PIN: `tech123`
   - User ID: `550e8400-e29b-41d4-a716-446655440103`

3. **Carlos Rodriguez (Quick Fix)**
   - Phone: `(617) 555-0202`
   - PIN: `tech123`
   - User ID: `550e8400-e29b-41d4-a716-446655440202`

4. **David Brown (Elite HVAC)**
   - Phone: `(617) 555-0302`
   - PIN: `tech123`
   - User ID: `550e8400-e29b-41d4-a716-446655440302`

## Database Structure

### Key Tables
- `companies` - Service businesses
- `users` - Dispatchers and technicians
- `customers` - Service customers
- `jobs` - Service appointments/jobs
- `technician_profiles` - Extended technician info
- `job_locations` - Real-time tracking data

### User Roles
- `dispatcher` - Can manage jobs, assign technicians
- `technician` - Can update job status, share location

## How User Accounts Work

### Authentication Flow
1. **Dispatcher Login**: Email + password → JWT token
2. **Technician Login**: Phone + PIN → JWT token
3. **JWT Token**: Contains `userId` and `companyId`, expires in 24h

### Password Storage
- All passwords hashed with bcrypt (saltRounds: 10)
- Dispatchers use traditional email/password
- Technicians use phone/PIN (PIN stored as password_hash)

## Creating New User Accounts

### Method 1: Registration Endpoint
**Endpoint:** `POST /api/auth/register`

Creates a new company and dispatcher account:
```json
{
  "companyName": "New Company",
  "companyEmail": "company@example.com",
  "companyPhone": "(555) 123-4567",
  "dispatcherFirstName": "John",
  "dispatcherLastName": "Doe",
  "dispatcherEmail": "john@example.com",
  "dispatcherPassword": "securepassword123"
}
```

### Method 2: Create Technician Endpoint
**Endpoint:** `POST /api/auth/create-technician`

Adds a technician to an existing company:
```json
{
  "companyId": "550e8400-e29b-41d4-a716-446655440001",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "(555) 999-8888",
  "pin": "1234",
  "email": "jane@example.com"
}
```

### Method 3: Database Scripts
Located in `/home/aarsen07/trackpro/backend/`:

1. **`setup_test_users.js`** - Verify existing test accounts
2. **`fix_user_passwords.js`** - Fix password hashes (already run)
3. **`create_new_user.js`** - Create new users programmatically

Example usage:
```bash
cd /home/aarsen07/trackpro/backend
node create_new_user.js dispatcher test@example.com mypass123 John Doe
node create_new_user.js technician "(555) 123-4567" 1234 Jane Smith
```

## Database Setup Files

Located in `/home/aarsen07/trackpro/database/`:

1. **`001_initial_schema.sql`** - Core database structure
2. **`002_trust_features.sql`** - Extended features (profiles, branding)
3. **`003_sample_data.sql`** - Test data with valid password hashes

## Mobile App Testing

### For Dispatcher Login
1. Open mobile app
2. Navigate to dispatcher login
3. Enter: `sarah@bostonwater.com` / `password123`
4. Should successfully authenticate

### For Technician Login  
1. Open mobile app
2. Navigate to technician login
3. Enter: `(617) 555-0102` / `tech123`
4. Should successfully authenticate

## Troubleshooting

### "Invalid credentials" Error
- ✅ **FIXED**: Password hashes have been updated with valid bcrypt hashes
- Test accounts are confirmed working
- Backend endpoint `/api/auth/login/dispatcher` is functional

### Database Connection Issues
- Verify Supabase credentials in `/home/aarsen07/trackpro/backend/.env`
- Current Supabase URL: `https://gyjfplalhublqmwuldun.supabase.co`
- Make sure database schema is applied

### Creating New Accounts
- Use the registration endpoint for new companies
- Use create-technician endpoint for adding technicians
- Use the provided scripts for bulk operations

## Sample Data Included

The database contains:
- 3 sample companies
- 6 sample users (3 dispatchers, 3 technicians)
- 4 sample customers
- 4 sample jobs with various statuses
- Technician profiles with certifications
- Company branding settings

All test credentials are now verified working and ready for mobile app testing.