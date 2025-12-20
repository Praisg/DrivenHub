-- Add order_index column to announcements table
-- This allows admins to reorder announcements, with newest first as default

-- Add order_index column
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_announcements_order_index ON announcements(order_index);

-- Backfill existing announcements: newest gets 0, next gets 1, etc.
-- This ensures newest announcements appear first
WITH ordered_announcements AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at DESC) - 1 AS new_order_index
  FROM announcements
)
UPDATE announcements a
SET order_index = oa.new_order_index
FROM ordered_announcements oa
WHERE a.id = oa.id;

-- Update RLS policies
-- Note: Since this app uses custom auth (not Supabase Auth), RLS policies
-- cannot directly check the current user's role. Security is primarily
-- enforced in API routes. These policies provide basic structure.

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Allow all to manage announcements" ON announcements;

-- Drop policies if they exist (to allow re-running this migration)
DROP POLICY IF EXISTS "Allow all to view announcements" ON announcements;
DROP POLICY IF EXISTS "Allow admin operations via API" ON announcements;

-- Allow all to SELECT (view announcements) - members need to see them
CREATE POLICY "Allow all to view announcements"
  ON announcements
  FOR SELECT
  USING (true);

-- Allow all operations - admin checks enforced in API routes
-- This maintains compatibility with the current auth system
-- API routes verify admin status before allowing updates
CREATE POLICY "Allow admin operations via API"
  ON announcements
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Note: Security is enforced in API routes which check members.role = 'admin'
-- before allowing any UPDATE/DELETE operations. The RLS policies above
-- allow operations, but API routes will reject non-admin requests.
-- This is the current pattern used throughout the application.

