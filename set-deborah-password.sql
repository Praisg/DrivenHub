-- Set password for admin user deborah (deb@drivenpros.com)
-- Password: "Password"
-- Run this in Supabase SQL Editor after running add-deborah-admin.sql

-- Note: This uses a bcrypt hash for "Password"
-- Hash generated with bcryptjs (10 salt rounds)

UPDATE members 
SET password_hash = '$2b$10$6a4QgJJ6gS0E/DLtrRreFOKWgRgmxQ3UGrZOvPMQaA7qKSi.aDepW'
WHERE email = 'deb@drivenpros.com';

-- Verify the update
SELECT email, name, role, 
       CASE WHEN password_hash IS NOT NULL THEN 'Password set' ELSE 'No password' END as password_status
FROM members 
WHERE email = 'deb@drivenpros.com';

