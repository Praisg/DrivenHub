-- Update skills table to include all necessary fields
-- Run this in Supabase SQL Editor

-- Add new columns to skills table if they don't exist
ALTER TABLE skills ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS secondary_skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS tertiary_skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS learning_path JSONB DEFAULT '[]'::jsonb;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS prerequisites JSONB DEFAULT '[]'::jsonb;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'system';
ALTER TABLE skills ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update member_skills table to include more fields
ALTER TABLE member_skills ADD COLUMN IF NOT EXISTS current_milestone TEXT DEFAULT 'milestone-1';
ALTER TABLE member_skills ADD COLUMN IF NOT EXISTS completed_milestones JSONB DEFAULT '[]'::jsonb;
ALTER TABLE member_skills ADD COLUMN IF NOT EXISTS milestone_progress JSONB DEFAULT '{}'::jsonb;
ALTER TABLE member_skills ADD COLUMN IF NOT EXISTS next_task TEXT;
ALTER TABLE member_skills ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb;
ALTER TABLE member_skills ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE member_skills ADD COLUMN IF NOT EXISTS admin_notes TEXT;

