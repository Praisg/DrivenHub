-- Fix Resource Visibility: Work like Skill Assignment
-- Run this in Supabase SQL Editor

-- 1. Reset all existing resources to NOT be lab-wide by default
-- This ensures only specifically assigned people see them from now on
UPDATE resources SET is_lab_wide = false;

-- 2. Make RLS more restrictive (Security handled in API, but let's be safer)
-- We'll allow SELECT only if the member matches the criteria
DROP POLICY IF EXISTS "Enable all access for resources" ON resources;

CREATE POLICY "Resources restricted access" ON resources
FOR SELECT
USING (
  is_lab_wide = true
  OR 
  id IN (
    SELECT resource_id FROM resource_assignments 
    WHERE member_id = auth.uid()
  )
  -- Or part of a cohort (handled by API filtering usually, but here for DB safety)
);

-- Note: Since the app uses custom userId in many API calls, 
-- we rely primarily on the API filtering in src/app/api/member/resources/route.ts

