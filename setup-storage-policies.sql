-- Setup Storage Policies for skill-content bucket
-- Run this in Supabase SQL Editor after creating the bucket
-- This allows the anon key to upload files to the bucket

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access to skill-content" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload to skill-content" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update to skill-content" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from skill-content" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on skill-content" ON storage.objects;

-- Policy to allow anyone to read files from skill-content bucket
CREATE POLICY "Allow public read access to skill-content"
ON storage.objects
FOR SELECT
USING (bucket_id = 'skill-content');

-- Policy to allow anyone to upload files (since we're using anon key server-side)
CREATE POLICY "Allow public upload to skill-content"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'skill-content');

-- Policy to allow anyone to update files
CREATE POLICY "Allow public update to skill-content"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'skill-content');

-- Policy to allow anyone to delete files
CREATE POLICY "Allow public delete from skill-content"
ON storage.objects
FOR DELETE
USING (bucket_id = 'skill-content');

-- Alternative simpler policy (if the above doesn't work):
-- This allows ALL operations on skill-content bucket
-- Uncomment if the individual policies above don't work
/*
DROP POLICY IF EXISTS "Allow all operations on skill-content" ON storage.objects;
CREATE POLICY "Allow all operations on skill-content"
ON storage.objects
FOR ALL
USING (bucket_id = 'skill-content')
WITH CHECK (bucket_id = 'skill-content');
*/

