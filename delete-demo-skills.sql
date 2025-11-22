-- Delete all demo/sample skills from database
-- Run this in Supabase SQL Editor to clean up demo data

-- First, delete related data (cascade should handle this, but being explicit)
DELETE FROM user_skill_content_progress WHERE content_id IN (
  SELECT id FROM skill_content WHERE skill_id IN (
    SELECT id FROM skills 
    WHERE name ILIKE '%microservice%' 
       OR name ILIKE '%aws%' 
       OR name ILIKE '%javascript%'
       OR name ILIKE '%react%'
       OR name ILIKE '%node%'
       OR name ILIKE '%database%'
       OR name ILIKE '%demo%'
       OR name ILIKE '%sample%'
       OR name ILIKE '%test%'
       OR name ILIKE '%fundamental%'
       OR name ILIKE '%basic%'
  )
);

DELETE FROM member_skills WHERE skill_id IN (
  SELECT id FROM skills 
  WHERE name ILIKE '%microservice%' 
     OR name ILIKE '%aws%' 
     OR name ILIKE '%javascript%'
     OR name ILIKE '%react%'
     OR name ILIKE '%node%'
     OR name ILIKE '%database%'
     OR name ILIKE '%demo%'
     OR name ILIKE '%sample%'
     OR name ILIKE '%test%'
     OR name ILIKE '%fundamental%'
     OR name ILIKE '%basic%'
);

DELETE FROM skill_content WHERE skill_id IN (
  SELECT id FROM skills 
  WHERE name ILIKE '%microservice%' 
     OR name ILIKE '%aws%' 
     OR name ILIKE '%javascript%'
     OR name ILIKE '%react%'
     OR name ILIKE '%node%'
     OR name ILIKE '%database%'
     OR name ILIKE '%demo%'
     OR name ILIKE '%sample%'
     OR name ILIKE '%test%'
     OR name ILIKE '%fundamental%'
     OR name ILIKE '%basic%'
);

-- Delete the demo skills themselves
DELETE FROM skills 
WHERE name ILIKE '%microservice%' 
   OR name ILIKE '%aws%' 
   OR name ILIKE '%javascript%'
   OR name ILIKE '%react%'
   OR name ILIKE '%node%'
   OR name ILIKE '%database%'
   OR name ILIKE '%demo%'
   OR name ILIKE '%sample%'
   OR name ILIKE '%test%'
   OR name ILIKE '%fundamental%'
   OR name ILIKE '%basic%';

-- Optional: Delete ALL skills if you want a completely clean slate (uncomment if needed):
-- DELETE FROM user_skill_content_progress;
-- DELETE FROM member_skills;
-- DELETE FROM skill_content;
-- DELETE FROM skills;

