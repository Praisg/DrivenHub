-- Fix RLS policies for user_skill_content_progress table
-- The current policy checks auth.uid() which doesn't work with server-side API routes
-- Update to allow all operations like other tables (similar to skill_content)

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own progress" ON user_skill_content_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_skill_content_progress;

-- Create new policies that allow all operations
-- Since we're using server-side API routes with anon key, we need to allow all operations
-- The API routes themselves handle authentication/authorization
CREATE POLICY "Allow all to view user progress" ON user_skill_content_progress
  FOR SELECT USING (true);

CREATE POLICY "Allow all to manage user progress" ON user_skill_content_progress
  FOR ALL USING (true);

