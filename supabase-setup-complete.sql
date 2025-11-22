-- Complete Supabase Database Setup
-- Run this entire script in your Supabase SQL Editor
-- This creates all tables, indexes, policies, and initial data

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  assigned_skills JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create member_skills table
CREATE TABLE IF NOT EXISTS member_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  level TEXT NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT CHECK (status IN ('assigned', 'in-progress', 'completed', 'on-hold')) DEFAULT 'assigned',
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_approved BOOLEAN DEFAULT FALSE
);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  description TEXT,
  category TEXT
);

-- Create events table for Google Calendar integration
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  google_event_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  organizer_email TEXT NOT NULL,
  attendees_emails TEXT[] DEFAULT '{}',
  zoom_url TEXT,
  eventbrite_url TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create google_oauth_tokens table for storing OAuth refresh tokens
CREATE TABLE IF NOT EXISTS google_oauth_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES members(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

-- Indexes for events table
CREATE INDEX IF NOT EXISTS idx_events_attendees_emails ON events USING GIN(attendees_emails);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_google_event_id ON events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_events_organizer_email ON events(organizer_email);

-- Indexes for members table
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_role ON members(role);

-- Indexes for member_skills table
CREATE INDEX IF NOT EXISTS idx_member_skills_member_id ON member_skills(member_id);
CREATE INDEX IF NOT EXISTS idx_member_skills_skill_id ON member_skills(skill_id);

-- Indexes for google_oauth_tokens table
CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_user_id ON google_oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_email ON google_oauth_tokens(email);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- Note: These policies allow access based on email matching
-- since we're using email-based auth, not Supabase Auth
-- ============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Members can view their own data" ON members;
DROP POLICY IF EXISTS "Admins can view all members" ON members;
DROP POLICY IF EXISTS "Anyone can insert members" ON members;
DROP POLICY IF EXISTS "Members can view their own skills" ON member_skills;
DROP POLICY IF EXISTS "Admins can manage all skills" ON member_skills;
DROP POLICY IF EXISTS "Anyone can view skills" ON skills;
DROP POLICY IF EXISTS "Admins can manage skills" ON skills;
DROP POLICY IF EXISTS "Users can view events they're invited to" ON events;
DROP POLICY IF EXISTS "Admins can view all events" ON events;
DROP POLICY IF EXISTS "Admins can manage events" ON events;
DROP POLICY IF EXISTS "Users can manage their own tokens" ON google_oauth_tokens;
DROP POLICY IF EXISTS "Admins can view all tokens" ON google_oauth_tokens;

-- Members table policies
-- Allow anyone to insert (for registration)
CREATE POLICY "Anyone can insert members" ON members
  FOR INSERT WITH CHECK (true);

-- Allow members to view their own data (by email - will be enforced in application layer)
-- For now, allow all SELECT for development (you can restrict this later)
CREATE POLICY "Allow all members to view members" ON members
  FOR SELECT USING (true);

-- Allow admins to update members (enforced in application layer)
CREATE POLICY "Allow all members to update" ON members
  FOR UPDATE USING (true);

-- Member skills table policies
CREATE POLICY "Allow all to view member_skills" ON member_skills
  FOR SELECT USING (true);

CREATE POLICY "Allow all to manage member_skills" ON member_skills
  FOR ALL USING (true);

-- Skills table policies
CREATE POLICY "Anyone can view skills" ON skills
  FOR SELECT USING (true);

CREATE POLICY "Allow all to manage skills" ON skills
  FOR ALL USING (true);

-- Events table policies
-- Allow all to view events (filtering by email happens in application layer)
CREATE POLICY "Allow all to view events" ON events
  FOR SELECT USING (true);

-- Allow all to manage events (admin check in application layer)
CREATE POLICY "Allow all to manage events" ON events
  FOR ALL USING (true);

-- Google OAuth tokens table policies
CREATE POLICY "Allow all to manage google_oauth_tokens" ON google_oauth_tokens
  FOR ALL USING (true);

-- ============================================
-- 5. INSERT INITIAL DATA
-- ============================================

-- Insert sample skills (only if they don't exist)
INSERT INTO skills (id, name, level, description, category) VALUES
('primary-1', 'JavaScript Fundamentals', 'primary', 'Core JavaScript concepts', 'Programming'),
('primary-2', 'React Basics', 'primary', 'React component development', 'Frontend'),
('secondary-1', 'Node.js', 'secondary', 'Server-side JavaScript', 'Backend'),
('secondary-2', 'Database Design', 'secondary', 'SQL and database concepts', 'Database'),
('tertiary-1', 'AWS Deployment', 'tertiary', 'Cloud deployment strategies', 'DevOps'),
('tertiary-2', 'Microservices', 'tertiary', 'Microservices architecture', 'Architecture')
ON CONFLICT (id) DO NOTHING;

-- Create admin user: praisegavi (gavipraise@gmail.com)
INSERT INTO members (name, email, role, assigned_skills)
VALUES ('praisegavi', 'gavipraise@gmail.com', 'admin', '[]'::jsonb)
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'admin',
  name = 'praisegavi';

-- ============================================
-- 6. VERIFY SETUP
-- ============================================

-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('members', 'member_skills', 'skills', 'events', 'google_oauth_tokens')
ORDER BY table_name;

-- Check admin user was created
SELECT id, name, email, role, created_at 
FROM members 
WHERE email = 'gavipraise@gmail.com';

-- Check skills were inserted
SELECT COUNT(*) as skill_count FROM skills;

