-- Update Resources for file uploads and flexible visibility
-- 1. Update the table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS is_lab_wide BOOLEAN DEFAULT TRUE;
ALTER TABLE resources DROP COLUMN IF EXISTS is_cohort_specific;

-- Update existing data if any
UPDATE resources SET is_lab_wide = visibility_lab;
ALTER TABLE resources DROP COLUMN IF EXISTS visibility_lab;

-- 2. Create Storage Bucket for resources
-- Note: In Supabase, bucket creation is usually via API or dashboard,
-- but we can add the policy setup here.

-- Policies for 'resources' bucket
-- These assume the bucket 'resources' is created
-- DROP POLICY IF EXISTS "Allow public read access to resources" ON storage.objects;
-- CREATE POLICY "Allow public read access to resources" ON storage.objects FOR SELECT USING (bucket_id = 'resources');
-- DROP POLICY IF EXISTS "Allow public upload to resources" ON storage.objects;
-- CREATE POLICY "Allow public upload to resources" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resources');
-- DROP POLICY IF EXISTS "Allow public update to resources" ON storage.objects;
-- CREATE POLICY "Allow public update to resources" ON storage.objects FOR UPDATE USING (bucket_id = 'resources');
-- DROP POLICY IF EXISTS "Allow public delete from resources" ON storage.objects;
-- CREATE POLICY "Allow public delete from resources" ON storage.objects FOR DELETE USING (bucket_id = 'resources');

