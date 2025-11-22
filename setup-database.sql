-- Complete Database Setup - Copy everything below this line
-- Run in Supabase SQL Editor: https://app.supabase.com/project/wbleojuizxhjojwhhfqo/sql/new

-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS google_oauth_tokens CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS member_skills CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- Create members table
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  assigned_skills JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create member_skills table
CREATE TABLE member_skills (
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
CREATE TABLE skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  description TEXT,
  category TEXT
);

-- Create events table for Google Calendar integration
CREATE TABLE events (
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
CREATE TABLE google_oauth_tokens (
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

-- Create indexes
CREATE INDEX idx_events_attendees_emails ON events USING GIN(attendees_emails);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_google_event_id ON events(google_event_id);
CREATE INDEX idx_events_organizer_email ON events(organizer_email);
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_role ON members(role);
CREATE INDEX idx_member_skills_member_id ON member_skills(member_id);
CREATE INDEX idx_member_skills_skill_id ON member_skills(skill_id);
CREATE INDEX idx_google_oauth_tokens_user_id ON google_oauth_tokens(user_id);
CREATE INDEX idx_google_oauth_tokens_email ON google_oauth_tokens(email);

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert members" ON members;
DROP POLICY IF EXISTS "Allow all members to view members" ON members;
DROP POLICY IF EXISTS "Allow all members to update" ON members;
DROP POLICY IF EXISTS "Allow all to view member_skills" ON member_skills;
DROP POLICY IF EXISTS "Allow all to manage member_skills" ON member_skills;
DROP POLICY IF EXISTS "Anyone can view skills" ON skills;
DROP POLICY IF EXISTS "Allow all to manage skills" ON skills;
DROP POLICY IF EXISTS "Allow all to view events" ON events;
DROP POLICY IF EXISTS "Allow all to manage events" ON events;
DROP POLICY IF EXISTS "Allow all to manage google_oauth_tokens" ON google_oauth_tokens;

-- Create RLS policies
CREATE POLICY "Anyone can insert members" ON members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all members to view members" ON members FOR SELECT USING (true);
CREATE POLICY "Allow all members to update" ON members FOR UPDATE USING (true);
CREATE POLICY "Allow all to view member_skills" ON member_skills FOR SELECT USING (true);
CREATE POLICY "Allow all to manage member_skills" ON member_skills FOR ALL USING (true);
CREATE POLICY "Anyone can view skills" ON skills FOR SELECT USING (true);
CREATE POLICY "Allow all to manage skills" ON skills FOR ALL USING (true);
CREATE POLICY "Allow all to view events" ON events FOR SELECT USING (true);
CREATE POLICY "Allow all to manage events" ON events FOR ALL USING (true);
CREATE POLICY "Allow all to manage google_oauth_tokens" ON google_oauth_tokens FOR ALL USING (true);

-- Insert initial skills
INSERT INTO skills (id, name, level, description, category) VALUES
('primary-1', 'JavaScript Fundamentals', 'primary', 'Core JavaScript concepts', 'Programming'),
('primary-2', 'React Basics', 'primary', 'React component development', 'Frontend'),
('secondary-1', 'Node.js', 'secondary', 'Server-side JavaScript', 'Backend'),
('secondary-2', 'Database Design', 'secondary', 'SQL and database concepts', 'Database'),
('tertiary-1', 'AWS Deployment', 'tertiary', 'Cloud deployment strategies', 'DevOps'),
('tertiary-2', 'Microservices', 'tertiary', 'Microservices architecture', 'Architecture')
ON CONFLICT (id) DO NOTHING;

-- Create admin user
INSERT INTO members (name, email, role, assigned_skills)
VALUES ('praisegavi', 'gavipraise@gmail.com', 'admin', '[]'::jsonb)
ON CONFLICT (email) 
DO UPDATE SET 
  role = 'admin',
  name = 'praisegavi';
