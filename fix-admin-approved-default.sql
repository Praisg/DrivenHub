-- Fix admin_approved default value for new skill assignments
-- New assignments should have admin_approved = NULL (not false)
-- Only explicitly rejected skills should have admin_approved = false

-- Update existing records: if admin_approved = false but status is NOT_STARTED or IN_PROGRESS,
-- and there's no admin rejection action, set it to NULL (these are likely new assignments, not rejections)
UPDATE member_skills 
SET admin_approved = NULL 
WHERE admin_approved = false 
  AND status IN ('NOT_STARTED', 'IN_PROGRESS')
  AND admin_notes IS NULL;

-- Change the default value for new rows to NULL instead of FALSE
-- Note: This requires dropping and recreating the column or using ALTER COLUMN SET DEFAULT
ALTER TABLE member_skills 
ALTER COLUMN admin_approved DROP DEFAULT;

ALTER TABLE member_skills 
ALTER COLUMN admin_approved SET DEFAULT NULL;

-- Verify: Check how many records have admin_approved = false vs NULL
-- SELECT 
--   COUNT(*) FILTER (WHERE admin_approved IS NULL) as null_count,
--   COUNT(*) FILTER (WHERE admin_approved = false) as false_count,
--   COUNT(*) FILTER (WHERE admin_approved = true) as true_count
-- FROM member_skills;

