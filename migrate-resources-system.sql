-- Migration to refactor Resources system
-- Supporting role-based (Lab Member, Alumni) and cohort-based access

-- 1. Update members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS cohort INTEGER;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_lab_member BOOLEAN DEFAULT TRUE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_alumni BOOLEAN DEFAULT FALSE;

-- 2. Update resources table
-- First, add new columns
ALTER TABLE resources ADD COLUMN IF NOT EXISTS visibility_lab BOOLEAN DEFAULT TRUE;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS visibility_alumni BOOLEAN DEFAULT FALSE;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS is_cohort_specific BOOLEAN DEFAULT FALSE;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS cohorts INTEGER[] DEFAULT '{}';

-- 3. Cleanup old fields and tables (optional but recommended for "clean" refactor)
-- We'll keep the columns for now but mark them as unused, or drop if we're sure.
-- The user said "remove any unnecessary fields or logic".
ALTER TABLE resources DROP COLUMN IF EXISTS category_id;
ALTER TABLE resources DROP COLUMN IF EXISTS visibility;
ALTER TABLE resources DROP COLUMN IF EXISTS cover_image_url; -- thumbnail_url is used

-- Drop tables that are no longer needed
DROP TABLE IF EXISTS resource_assignments CASCADE;
DROP TABLE IF EXISTS resource_categories CASCADE;

-- 4. Update RLS policies for resources
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
DROP POLICY IF EXISTS "Allow admin to manage resources" ON resources;
CREATE POLICY "Allow admin to manage resources"
  ON resources
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid() AND members.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = auth.uid() AND members.role = 'admin'
    )
  );

-- Members can view resources based on their role and cohort
-- Lab Member: Lab-wide (is_cohort_specific=false AND visibility_lab=true) OR (is_cohort_specific=true AND visibility_lab=true AND cohort = user_cohort)
-- Alumni: (is_cohort_specific=true AND visibility_alumni=true AND cohort = user_cohort)
-- User who is both: Union of both.

-- Simplified RLS for members:
DROP POLICY IF EXISTS "Allow members to view accessible resources" ON resources;
CREATE POLICY "Allow members to view accessible resources"
  ON resources
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = auth.uid()
      AND (
        -- Lab Member rules
        (m.is_lab_member = true AND resources.visibility_lab = true AND (
          resources.is_cohort_specific = false OR m.cohort = ANY(resources.cohorts)
        ))
        OR
        -- Alumni rules
        (m.is_alumni = true AND resources.visibility_alumni = true AND (
          resources.is_cohort_specific = true AND m.cohort = ANY(resources.cohorts)
        ))
      )
    )
  );

-- Note: In this app, auth.uid() might not match members.id if custom auth is used.
-- Looking at existing code, it seems the app uses a custom `userId` query param in many places,
-- but the backend should ideally use Supabase auth. 
-- For now, I'll keep the RLS broad or rely on backend filtering if Supabase auth isn't fully utilized.
-- The user query said "Enforce access server-side (Supabase RLS or backend filtering)".
-- Given the current codebase uses `getSupabase()` (which usually uses service role or anon key), 
-- I will implement both RLS (for best practice) and backend filtering in the API routes.

