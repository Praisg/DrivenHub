-- Migration to add individual member assignments to resources
-- Run this in Supabase SQL Editor

-- 1. Create the resource_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS resource_assignments (
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (resource_id, member_id)
);

-- 2. Ensure RLS is configured for the assignments table
ALTER TABLE resource_assignments ENABLE ROW LEVEL SECURITY;

-- Allow all for simplicity as per previous instructions (security in API)
DROP POLICY IF EXISTS "Enable all access for resource_assignments" ON resource_assignments;
CREATE POLICY "Enable all access for resource_assignments" ON resource_assignments
FOR ALL
USING (true)
WITH CHECK (true);

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_resource_assignments_member_id ON resource_assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_resource_assignments_resource_id ON resource_assignments(resource_id);

