-- Set password for admin user (gavipraise@gmail.com)
-- Default password: "password"
-- Run this in Supabase SQL Editor after running add-password-field.sql

-- Note: This uses a bcrypt hash for "password"
-- You can generate a new hash at: https://bcrypt-generator.com/
-- Or use the API to set passwords programmatically

UPDATE members 
SET password_hash = '$2b$10$u2ZuEF4ShFvuEnjCI.YoLOGxAg.vjVPsOSuxiAq9By.jV8ZsDFtkm'
WHERE email = 'gavipraise@gmail.com';

-- Verify the update
SELECT email, name, role, 
       CASE WHEN password_hash IS NOT NULL THEN 'Password set' ELSE 'No password' END as password_status
FROM members 
WHERE email = 'gavipraise@gmail.com';

