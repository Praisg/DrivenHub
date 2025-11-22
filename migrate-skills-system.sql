-- Complete Skills System Migration
-- Run this in Supabase SQL Editor to set up the new skills system

-- Update skills table to support new model
ALTER TABLE skills DROP COLUMN IF EXISTS secondary_skills;
ALTER TABLE skills DROP COLUMN IF EXISTS tertiary_skills;
ALTER TABLE skills DROP COLUMN IF EXISTS learning_path;
ALTER TABLE skills DROP COLUMN IF EXISTS prerequisites;

-- Update level column to use new values
-- First drop existing constraint
ALTER TABLE skills DROP CONSTRAINT IF EXISTS skills_level_check;

-- Update existing rows to map old values to new values
-- Handle both lowercase and any case variations
UPDATE skills SET level = 'Awareness' WHERE LOWER(level) = 'primary' OR level = 'primary';
UPDATE skills SET level = 'Embodiment' WHERE LOWER(level) = 'secondary' OR level = 'secondary';
UPDATE skills SET level = 'Mastery' WHERE LOWER(level) = 'tertiary' OR level = 'tertiary';

-- Set default for any remaining invalid values (safety fallback)
UPDATE skills SET level = 'Awareness' WHERE level NOT IN ('Awareness', 'Embodiment', 'Mastery');

-- Now add new constraint with new values
ALTER TABLE skills ADD CONSTRAINT skills_level_check CHECK (level IN ('Awareness', 'Embodiment', 'Mastery'));

-- Add new fields if they don't exist
ALTER TABLE skills ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create skill_content table for content items (books, videos, articles, etc.)
CREATE TABLE IF NOT EXISTS skill_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BOOK', 'VIDEO', 'ARTICLE', 'LINK', 'OTHER')),
  url TEXT,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_skill_content_skill_id ON skill_content(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_content_order ON skill_content(skill_id, display_order);

-- Update member_skills table to use new status values
ALTER TABLE member_skills DROP CONSTRAINT IF EXISTS member_skills_status_check;

-- Update existing rows to map old status values to new values
UPDATE member_skills SET status = 'NOT_STARTED' WHERE status = 'assigned' OR status IS NULL;
UPDATE member_skills SET status = 'IN_PROGRESS' WHERE status = 'learning' OR status = 'in-progress';
UPDATE member_skills SET status = 'COMPLETED' WHERE status = 'completed' OR status = 'mastered';

-- Add new constraint with new status values
ALTER TABLE member_skills ADD CONSTRAINT member_skills_status_check CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'));

-- Create user_skill_content_progress table
CREATE TABLE IF NOT EXISTS user_skill_content_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES skill_content(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_content_progress_user ON user_skill_content_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_content_progress_content ON user_skill_content_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_user_content_progress_completed ON user_skill_content_progress(user_id, is_completed);

-- Enable RLS on new tables
ALTER TABLE skill_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_content_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skill_content (admins can manage, members can view)
CREATE POLICY "Anyone can view active skill content" ON skill_content
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage skill content" ON skill_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id::text = auth.uid()::text
      AND members.role = 'admin'
    )
  );

-- RLS Policies for user_skill_content_progress (users can only see their own progress)
CREATE POLICY "Users can view their own progress" ON user_skill_content_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = user_skill_content_progress.user_id
      AND members.id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update their own progress" ON user_skill_content_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = user_skill_content_progress.user_id
      AND members.id::text = auth.uid()::text
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skill_content_updated_at BEFORE UPDATE ON skill_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_content_progress_updated_at BEFORE UPDATE ON user_skill_content_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

