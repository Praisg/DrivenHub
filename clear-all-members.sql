-- Clear all members from database
-- Run this in your Supabase SQL Editor

-- Delete all members (keeps admins)
DELETE FROM members WHERE role = 'member';

-- Also clear member_skills (cascade should handle this, but being explicit)
DELETE FROM member_skills;

-- Verify deletion
SELECT COUNT(*) as remaining_members FROM members WHERE role = 'member';

