-- Create Resources System Tables
-- Run this in Supabase SQL Editor

-- Create resource_categories table
CREATE TABLE IF NOT EXISTS resource_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  category_id UUID REFERENCES resource_categories(id) ON DELETE SET NULL,
  cover_image_url TEXT,
  thumbnail_url TEXT,
  provider TEXT, -- e.g. "youtube", "dropbox", "drive", "zoom", "generic"
  visibility TEXT NOT NULL DEFAULT 'all' CHECK (visibility IN ('all', 'selected')),
  created_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resource_assignments table (for selected visibility)
CREATE TABLE IF NOT EXISTS resource_assignments (
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (resource_id, member_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_resources_category_id ON resources(category_id);
CREATE INDEX IF NOT EXISTS idx_resources_visibility ON resources(visibility);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resource_assignments_resource_id ON resource_assignments(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_assignments_member_id ON resource_assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_resource_categories_sort_order ON resource_categories(sort_order);

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resource_categories
-- SELECT: All authenticated users can view categories
DROP POLICY IF EXISTS "Allow all to view categories" ON resource_categories;
CREATE POLICY "Allow all to view categories"
  ON resource_categories
  FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE: Admins only (enforced via API routes)
DROP POLICY IF EXISTS "Allow admin to manage categories" ON resource_categories;
CREATE POLICY "Allow admin to manage categories"
  ON resource_categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for resources
-- SELECT: Admins can read all, members can read accessible resources
-- Note: Complex member access logic handled in API routes due to custom auth
DROP POLICY IF EXISTS "Allow all to view resources" ON resources;
CREATE POLICY "Allow all to view resources"
  ON resources
  FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE: Admins only (enforced via API routes)
DROP POLICY IF EXISTS "Allow admin to manage resources" ON resources;
CREATE POLICY "Allow admin to manage resources"
  ON resources
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for resource_assignments
-- SELECT: Admins can read all, members can read their own (enforced via API)
DROP POLICY IF EXISTS "Allow all to view assignments" ON resource_assignments;
CREATE POLICY "Allow all to view assignments"
  ON resource_assignments
  FOR SELECT
  USING (true);

-- INSERT/DELETE: Admins only (enforced via API routes)
DROP POLICY IF EXISTS "Allow admin to manage assignments" ON resource_assignments;
CREATE POLICY "Allow admin to manage assignments"
  ON resource_assignments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert default categories
INSERT INTO resource_categories (name, sort_order) VALUES
  ('Videos', 1),
  ('Documents', 2),
  ('Podcasts', 3),
  ('Links', 4)
ON CONFLICT (name) DO NOTHING;

-- Note: Security is primarily enforced in API routes which verify admin status
-- via members.role = 'admin'. RLS policies provide basic structure but allow
-- operations - API routes will reject non-admin requests.

