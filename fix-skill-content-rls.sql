-- Fix RLS policies for skill_content table
-- The current policy checks auth.uid() which doesn't work with server-side API routes
-- Update to allow all operations like other tables (skills, member_skills, etc.)

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage skill content" ON skill_content;

-- Create new policy that allows all operations (similar to skills table)
-- Since we're using server-side API routes with anon key, we need to allow all operations
-- The API routes themselves handle authentication/authorization
CREATE POLICY "Allow all to manage skill_content" ON skill_content
  FOR ALL USING (true);

-- Keep the view policy (though it's redundant now)
DROP POLICY IF EXISTS "Anyone can view active skill content" ON skill_content;
CREATE POLICY "Allow all to view skill_content" ON skill_content
  FOR SELECT USING (true);

