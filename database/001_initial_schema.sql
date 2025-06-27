-- TrackPro Database Schema
-- Core tables for MVP functionality

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Companies table (service businesses)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (dispatchers and technicians)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255),
    phone VARCHAR(50),
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('dispatcher', 'technician')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email, company_id),
    UNIQUE(phone, company_id)
);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES users(id) ON DELETE SET NULL,
    job_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'assigned', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    service_type VARCHAR(100),
    description TEXT,
    notes TEXT,
    estimated_duration INTEGER, -- in minutes
    scheduled_start TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    customer_address TEXT NOT NULL,
    customer_latitude DECIMAL(10, 8),
    customer_longitude DECIMAL(11, 8),
    tracking_code VARCHAR(10) UNIQUE NOT NULL, -- Short code for customer tracking URL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job locations table (for real-time tracking)
CREATE TABLE job_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2), -- GPS accuracy in meters
    speed DECIMAL(8, 2), -- Speed in km/h
    heading INTEGER, -- Direction in degrees (0-359)
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job status history (audit trail)
CREATE TABLE job_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_technician_id ON jobs(technician_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_tracking_code ON jobs(tracking_code);
CREATE INDEX idx_job_locations_job_id ON job_locations(job_id);
CREATE INDEX idx_job_locations_timestamp ON job_locations(timestamp);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_role ON users(role);

-- Enable Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_status_history ENABLE ROW LEVEL SECURITY;

-- Function to generate tracking codes
CREATE OR REPLACE FUNCTION generate_tracking_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    exists_already BOOLEAN;
BEGIN
    LOOP
        -- Generate 6-character alphanumeric code
        code := substr(md5(random()::text), 1, 6);
        code := upper(code);
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM jobs WHERE tracking_code = code) INTO exists_already;
        
        -- Exit loop if code is unique
        EXIT WHEN NOT exists_already;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to generate job numbers
CREATE OR REPLACE FUNCTION generate_job_number(company_id UUID)
RETURNS TEXT AS $$
DECLARE
    company_prefix TEXT;
    job_count INTEGER;
    job_number TEXT;
BEGIN
    -- Get company name prefix (first 3 characters)
    SELECT upper(left(replace(name, ' ', ''), 3)) INTO company_prefix 
    FROM companies WHERE id = company_id;
    
    -- Get count of jobs for this company today
    SELECT count(*) INTO job_count 
    FROM jobs 
    WHERE jobs.company_id = generate_job_number.company_id 
    AND DATE(created_at) = CURRENT_DATE;
    
    -- Format: ABC-YYYYMMDD-001
    job_number := company_prefix || '-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || lpad((job_count + 1)::text, 3, '0');
    
    RETURN job_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate tracking code and job number
CREATE OR REPLACE FUNCTION set_job_defaults()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tracking_code IS NULL THEN
        NEW.tracking_code := generate_tracking_code();
    END IF;
    
    IF NEW.job_number IS NULL THEN
        NEW.job_number := generate_job_number(NEW.company_id);
    END IF;
    
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_job_defaults
    BEFORE INSERT OR UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION set_job_defaults();

-- Trigger to log job status changes
CREATE OR REPLACE FUNCTION log_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO job_status_history (job_id, old_status, new_status, notes)
        VALUES (NEW.id, OLD.status, NEW.status, 'Status changed automatically');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_job_status_change
    AFTER UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION log_job_status_change();

-- Updated at triggers for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();