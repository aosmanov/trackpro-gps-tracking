# TrackPro Database Setup

This directory contains the SQL migration files for setting up the TrackPro database schema in Supabase.

## Files

- `001_initial_schema.sql` - Core database schema (companies, users, jobs, locations)
- `002_trust_features.sql` - Extended schema for trust and credibility features  
- `003_sample_data.sql` - Sample data for development and testing (optional)

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from the project settings
3. Go to the SQL Editor in your Supabase dashboard

### 2. Run Migration Files

Execute the SQL files in order:

1. **Core Schema**: Copy and paste the contents of `001_initial_schema.sql` into the SQL Editor and run it
2. **Trust Features**: Copy and paste the contents of `002_trust_features.sql` into the SQL Editor and run it  
3. **Sample Data** (optional): Copy and paste the contents of `003_sample_data.sql` for development data

### 3. Configure Row Level Security (RLS) Policies

The tables have RLS enabled but you'll need to create policies based on your authentication setup. Example policies:

```sql
-- Allow companies to see their own data
CREATE POLICY "Companies can view own data" ON jobs
    FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE auth.uid() = id));

-- Allow technicians to update their assigned jobs
CREATE POLICY "Technicians can update assigned jobs" ON jobs
    FOR UPDATE USING (technician_id = (SELECT id FROM users WHERE auth.uid() = id));

-- Public access to tracking pages (with tracking code)
CREATE POLICY "Public tracking access" ON jobs
    FOR SELECT USING (tracking_code IS NOT NULL);
```

### 4. Environment Variables

Update your backend `.env` file with your Supabase credentials:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

## Database Schema Overview

### Core Tables
- `companies` - Service business accounts
- `users` - Dispatchers and technicians
- `customers` - Customer information
- `jobs` - Service requests and assignments
- `job_locations` - Real-time GPS tracking points
- `job_status_history` - Audit trail of status changes

### Trust & Credibility Tables
- `technician_profiles` - Photos, certifications, background checks
- `company_branding` - Logo, colors, review settings
- `job_photos` - Customer uploads and technician confirmations
- `messages` - Two-way communication
- `notifications` - SMS delivery tracking
- `company_reviews` - Google My Business review cache
- `social_proof_feed` - Nearby completed jobs display
- `customer_feedback` - Post-job ratings and reviews

## Key Features

- **Automatic tracking codes** - 6-character codes generated for customer tracking URLs
- **Job numbering** - Auto-generated job numbers (e.g., `BWR-20240624-001`)
- **Real-time location tracking** - GPS points stored with timestamp and accuracy
- **Social proof automation** - Completed jobs automatically added to social proof feed
- **Audit trails** - All job status changes are logged
- **Flexible branding** - Company-specific colors, logos, and messaging