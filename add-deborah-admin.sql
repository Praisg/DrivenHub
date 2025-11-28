-- Add/Update Admin User: deborah (deb@drivenpros.com)
-- Run this in Supabase SQL Editor

-- Insert or update the admin user
INSERT INTO members (name, email, role, assigned_skills)
VALUES ('deborah', 'deb@drivenpros.com', 'admin', '[]'::jsonb)
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'admin',
  name = 'deborah';

-- Verify the admin was created/updated
SELECT id, name, email, role, created_at 
FROM members 
WHERE email = 'deb@drivenpros.com';

