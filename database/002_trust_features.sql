-- Trust & Credibility Features Schema
-- Extended tables for technician profiles, branding, and social proof

-- Technician profiles table (identity verification)
CREATE TABLE technician_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    technician_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    photo_url TEXT,
    video_intro_url TEXT,
    license_number VARCHAR(100),
    license_type VARCHAR(100),
    license_expiry DATE,
    certifications JSONB DEFAULT '[]', -- Array of certification objects
    background_check_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (background_check_status IN ('pending', 'approved', 'failed', 'expired')),
    background_check_date DATE,
    background_check_provider VARCHAR(100),
    years_experience INTEGER,
    specialties TEXT[],
    bio TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company branding and settings
CREATE TABLE company_branding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
    primary_color VARCHAR(7) DEFAULT '#2563eb', -- Hex color
    secondary_color VARCHAR(7) DEFAULT '#64748b',
    logo_url TEXT,
    website_url TEXT,
    google_my_business_id VARCHAR(100),
    trust_pledge TEXT DEFAULT 'We never begin work without your signed approval.',
    review_widget_enabled BOOLEAN DEFAULT true,
    show_technician_photos BOOLEAN DEFAULT true,
    show_background_check_badge BOOLEAN DEFAULT true,
    show_nearby_jobs BOOLEAN DEFAULT true,
    sms_template_en_route TEXT DEFAULT 'Hi {customer_name}! {technician_name} from {company_name} is on the way to your location. Track their progress: {tracking_url}',
    sms_template_arrived TEXT DEFAULT '{technician_name} has arrived at your location and is waiting at your door.',
    sms_template_completed TEXT DEFAULT 'Your service has been completed. Thank you for choosing {company_name}!',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job photos table (customer uploads and technician confirmations)
CREATE TABLE job_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    uploaded_by_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL if uploaded by customer
    photo_url TEXT NOT NULL,
    photo_type VARCHAR(20) NOT NULL CHECK (photo_type IN ('customer_damage', 'technician_arrival', 'before_work', 'after_work', 'vehicle')),
    description TEXT,
    metadata JSONB DEFAULT '{}', -- EXIF data, GPS coordinates, etc.
    is_customer_uploaded BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (two-way communication)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL if sent by customer
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('customer', 'technician', 'dispatcher')),
    sender_name VARCHAR(200) NOT NULL,
    sender_phone VARCHAR(50),
    message_text TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'photo', 'location')),
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    delivery_status VARCHAR(20) DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table (SMS delivery tracking)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    customer_phone VARCHAR(50) NOT NULL,
    notification_type VARCHAR(30) NOT NULL CHECK (notification_type IN ('job_assigned', 'en_route', 'arrived', 'completed', 'custom')),
    message_text TEXT NOT NULL,
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
    twilio_sid VARCHAR(100), -- Twilio message SID for tracking
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company reviews cache (Google My Business integration)
CREATE TABLE company_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    google_review_id VARCHAR(200) UNIQUE,
    reviewer_name VARCHAR(200),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_date TIMESTAMP WITH TIME ZONE,
    response_text TEXT,
    response_date TIMESTAMP WITH TIME ZONE,
    is_visible BOOLEAN DEFAULT true,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social proof feed (anonymized completed jobs)
CREATE TABLE social_proof_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    service_type VARCHAR(100),
    general_location VARCHAR(100), -- e.g., "Downtown Boston", "Cambridge Area"
    completion_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    is_featured BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '48 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer feedback table
CREATE TABLE customer_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES users(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    would_recommend BOOLEAN,
    service_quality_rating INTEGER CHECK (service_quality_rating >= 1 AND service_quality_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_technician_profiles_technician_id ON technician_profiles(technician_id);
CREATE INDEX idx_job_photos_job_id ON job_photos(job_id);
CREATE INDEX idx_job_photos_type ON job_photos(photo_type);
CREATE INDEX idx_messages_job_id ON messages(job_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_notifications_job_id ON notifications(job_id);
CREATE INDEX idx_notifications_status ON notifications(delivery_status);
CREATE INDEX idx_company_reviews_company_id ON company_reviews(company_id);
CREATE INDEX idx_social_proof_company_id ON social_proof_feed(company_id);
CREATE INDEX idx_social_proof_expires_at ON social_proof_feed(expires_at);

-- Enable Row Level Security
ALTER TABLE technician_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_proof_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;

-- Function to create social proof entry when job is completed
CREATE OR REPLACE FUNCTION create_social_proof_entry()
RETURNS TRIGGER AS $$
DECLARE
    company_record companies%ROWTYPE;
    general_loc TEXT;
BEGIN
    -- Only create entry when job status changes to 'completed'
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
        -- Get company info
        SELECT * INTO company_record FROM companies WHERE id = NEW.company_id;
        
        -- Create generalized location (city + state)
        general_loc := COALESCE(
            (SELECT city || ', ' || state FROM customers WHERE id = NEW.customer_id),
            'Service Area'
        );
        
        -- Insert social proof entry
        INSERT INTO social_proof_feed (
            company_id,
            job_id,
            service_type,
            general_location,
            completion_time,
            duration_minutes
        ) VALUES (
            NEW.company_id,
            NEW.id,
            NEW.service_type,
            general_loc,
            NEW.actual_end,
            EXTRACT(EPOCH FROM (NEW.actual_end - NEW.actual_start)) / 60
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_social_proof
    AFTER UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION create_social_proof_entry();

-- Function to clean up expired social proof entries
CREATE OR REPLACE FUNCTION cleanup_expired_social_proof()
RETURNS void AS $$
BEGIN
    DELETE FROM social_proof_feed WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Updated at triggers for new tables
CREATE TRIGGER trigger_technician_profiles_updated_at BEFORE UPDATE ON technician_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_company_branding_updated_at BEFORE UPDATE ON company_branding FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();