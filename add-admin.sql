-- Add admin user: praisegavi (gavipraise@gmail.com)
-- Run this in your Supabase SQL Editor

-- Insert or update the admin user
INSERT INTO members (name, email, role, assigned_skills)
VALUES ('praisegavi', 'gavipraise@gmail.com', 'admin', '[]'::jsonb)
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'admin',
  name = 'praisegavi';

-- Verify the admin was created/updated
SELECT id, name, email, role, created_at 
FROM members 
WHERE email = 'gavipraise@gmail.com';

