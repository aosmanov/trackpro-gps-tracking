-- Sample data for development and testing
-- This file should only be used in development environments

-- Insert sample companies
INSERT INTO companies (id, name, email, phone, address, city, state, zip_code) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Boston Water Restoration', 'dispatch@bostonwater.com', '(617) 555-0100', '123 Harbor St', 'Boston', 'MA', '02101'),
('550e8400-e29b-41d4-a716-446655440002', 'Quick Fix Plumbing', 'office@quickfixplumbing.com', '(617) 555-0200', '456 Commonwealth Ave', 'Cambridge', 'MA', '02142'),
('550e8400-e29b-41d4-a716-446655440003', 'Elite HVAC Services', 'contact@elitehvac.com', '(617) 555-0300', '789 Newbury St', 'Boston', 'MA', '02116');

-- Insert sample users (dispatchers and technicians)
-- Dispatcher password: password123
-- Technician PIN: tech123
INSERT INTO users (id, company_id, email, phone, password_hash, first_name, last_name, role) VALUES
-- Boston Water Restoration users
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'sarah@bostonwater.com', '(617) 555-0101', '$2b$10$a7JlbNrGC3pFZVUGDaDjau0baZ/Orejzq3/TQ.FtEYHM/J4og/9n6', 'Sarah', 'Johnson', 'dispatcher'),
('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440001', 'mike@bostonwater.com', '(617) 555-0102', '$2b$10$n2ag9PN5QbkXzTulKPe2x.19o/9Ntrn7tf3MgDqJNrIwxd/WJ0N.u', 'Mike', 'Davis', 'technician'),
('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440001', 'john@bostonwater.com', '(617) 555-0103', '$2b$10$n2ag9PN5QbkXzTulKPe2x.19o/9Ntrn7tf3MgDqJNrIwxd/WJ0N.u', 'John', 'Smith', 'technician'),

-- Quick Fix Plumbing users
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440002', 'lisa@quickfixplumbing.com', '(617) 555-0201', '$2b$10$a7JlbNrGC3pFZVUGDaDjau0baZ/Orejzq3/TQ.FtEYHM/J4og/9n6', 'Lisa', 'Chen', 'dispatcher'),
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440002', 'carlos@quickfixplumbing.com', '(617) 555-0202', '$2b$10$n2ag9PN5QbkXzTulKPe2x.19o/9Ntrn7tf3MgDqJNrIwxd/WJ0N.u', 'Carlos', 'Rodriguez', 'technician'),

-- Elite HVAC users
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440003', 'admin@elitehvac.com', '(617) 555-0301', '$2b$10$a7JlbNrGC3pFZVUGDaDjau0baZ/Orejzq3/TQ.FtEYHM/J4og/9n6', 'Jennifer', 'Williams', 'dispatcher'),
('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440003', 'david@elitehvac.com', '(617) 555-0302', '$2b$10$n2ag9PN5QbkXzTulKPe2x.19o/9Ntrn7tf3MgDqJNrIwxd/WJ0N.u', 'David', 'Brown', 'technician');

-- Insert sample customers
INSERT INTO customers (id, first_name, last_name, email, phone, address, city, state, zip_code, latitude, longitude) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Emily', 'Anderson', 'emily.anderson@email.com', '(617) 555-1001', '100 Beacon St, Apt 5B', 'Boston', 'MA', '02108', 42.3601, -71.0589),
('660e8400-e29b-41d4-a716-446655440002', 'Robert', 'Thompson', 'robert.t@email.com', '(617) 555-1002', '25 Harvard St', 'Cambridge', 'MA', '02139', 42.3736, -71.1190),
('660e8400-e29b-41d4-a716-446655440003', 'Maria', 'Garcia', 'maria.garcia@email.com', '(617) 555-1003', '88 Charles St', 'Boston', 'MA', '02114', 42.3584, -71.0646),
('660e8400-e29b-41d4-a716-446655440004', 'James', 'Wilson', 'j.wilson@email.com', '(617) 555-1004', '200 Mass Ave', 'Cambridge', 'MA', '02140', 42.3499, -71.0834);

-- Insert sample jobs
INSERT INTO jobs (id, company_id, customer_id, technician_id, status, service_type, description, customer_address, customer_latitude, customer_longitude, tracking_code) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440102', 'en_route', 'Water Damage Restoration', 'Basement flooding from burst pipe', '100 Beacon St, Apt 5B, Boston, MA 02108', 42.3601, -71.0589, 'ABC123'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440202', 'assigned', 'Plumbing Repair', 'Kitchen sink leak repair', '25 Harvard St, Cambridge, MA 02139', 42.3736, -71.1190, 'DEF456'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440302', 'completed', 'HVAC Maintenance', 'Annual heating system inspection', '88 Charles St, Boston, MA 02114', 42.3584, -71.0646, 'GHI789'),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440103', 'pending', 'Water Damage Assessment', 'Insurance assessment for ceiling water damage', '200 Mass Ave, Cambridge, MA 02140', 42.3499, -71.0834, 'JKL012');

-- Insert sample technician profiles
INSERT INTO technician_profiles (technician_id, license_number, license_type, certifications, background_check_status, years_experience, specialties, bio, is_verified) VALUES
('550e8400-e29b-41d4-a716-446655440102', 'WR-2024-001', 'Water Restoration Technician', '[{"name": "IICRC Water Damage Restoration", "issuer": "IICRC", "year": 2023}]', 'approved', 8, '{"Water extraction", "Mold remediation", "Structural drying"}', 'Experienced water damage restoration specialist with 8 years in the field.', true),
('550e8400-e29b-41d4-a716-446655440103', 'WR-2024-002', 'Water Restoration Technician', '[{"name": "IICRC Fire & Smoke Restoration", "issuer": "IICRC", "year": 2022}]', 'approved', 5, '{"Fire damage", "Smoke removal", "Odor control"}', 'Certified fire and smoke damage restoration expert.', true),
('550e8400-e29b-41d4-a716-446655440202', 'PL-MA-2024-100', 'Master Plumber', '[{"name": "Master Plumber License", "issuer": "MA State Board", "year": 2020}]', 'approved', 12, '{"Residential plumbing", "Emergency repairs", "Pipe installation"}', 'Licensed Master Plumber serving the Greater Boston area for over 12 years.', true),
('550e8400-e29b-41d4-a716-446655440302', 'HVAC-MA-2024-200', 'HVAC Technician', '[{"name": "EPA 608 Certification", "issuer": "EPA", "year": 2021}]', 'approved', 10, '{"Residential HVAC", "Commercial systems", "Energy efficiency"}', 'EPA certified HVAC technician specializing in energy-efficient systems.', true);

-- Insert sample company branding
INSERT INTO company_branding (company_id, primary_color, trust_pledge, google_my_business_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', '#1e40af', 'We never begin work without your signed approval and will explain all options before starting.', 'boston-water-restoration-12345'),
('550e8400-e29b-41d4-a716-446655440002', '#dc2626', 'Your satisfaction is guaranteed. We provide upfront pricing with no hidden fees.', 'quick-fix-plumbing-67890'),
('550e8400-e29b-41d4-a716-446655440003', '#059669', 'We are licensed, insured, and committed to providing the highest quality HVAC services.', 'elite-hvac-services-54321');

-- Insert sample location data for active job
INSERT INTO job_locations (job_id, technician_id, latitude, longitude, accuracy, timestamp) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440102', 42.3505, -71.0709, 5.0, NOW() - INTERVAL '5 minutes'),
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440102', 42.3520, -71.0680, 4.2, NOW() - INTERVAL '3 minutes'),
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440102', 42.3580, -71.0620, 3.8, NOW() - INTERVAL '1 minute');

-- Insert sample social proof entries
INSERT INTO social_proof_feed (company_id, job_id, service_type, general_location, completion_time, duration_minutes) VALUES
('550e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 'Water Damage Restoration', 'Back Bay, Boston', NOW() - INTERVAL '2 hours', 180),
('550e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440003', 'Emergency Plumbing', 'Harvard Square, Cambridge', NOW() - INTERVAL '4 hours', 45),
('550e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', 'HVAC Repair', 'Beacon Hill, Boston', NOW() - INTERVAL '6 hours', 120);