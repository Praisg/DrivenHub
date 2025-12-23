-- Migration to add 'Practice' and 'Mentorship' to skill levels
-- Run this in Supabase SQL Editor

-- 1. Drop existing constraint
ALTER TABLE skills DROP CONSTRAINT IF EXISTS skills_level_check;

-- 2. Add new constraint with updated values
ALTER TABLE skills ADD CONSTRAINT skills_level_check CHECK (level IN ('Awareness', 'Practice', 'Embodiment', 'Mastery', 'Mentorship'));

-- 3. Update any existing skill mappings if necessary (none needed here as we are just adding new options)

