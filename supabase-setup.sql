-- Supabase SQL for database setup
-- Run this in your Supabase SQL editor

-- Create members table
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  assigned_skills JSONB DEFAULT '[]',
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

-- Create skills table (if you want to manage skills in database)
CREATE TABLE skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  description TEXT,
  category TEXT
);

-- Insert sample skills
INSERT INTO skills (id, name, level, description, category) VALUES
('primary-1', 'JavaScript Fundamentals', 'primary', 'Core JavaScript concepts', 'Programming'),
('primary-2', 'React Basics', 'primary', 'React component development', 'Frontend'),
('secondary-1', 'Node.js', 'secondary', 'Server-side JavaScript', 'Backend'),
('secondary-2', 'Database Design', 'secondary', 'SQL and database concepts', 'Database'),
('tertiary-1', 'AWS Deployment', 'tertiary', 'Cloud deployment strategies', 'DevOps'),
('tertiary-2', 'Microservices', 'tertiary', 'Microservices architecture', 'Architecture');

-- Enable Row Level Security (RLS)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- Create policies for members table
CREATE POLICY "Members can view their own data" ON members
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all members" ON members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can insert members" ON members
  FOR INSERT WITH CHECK (true);

-- Create policies for member_skills table
CREATE POLICY "Members can view their own skills" ON member_skills
  FOR SELECT USING (member_id::text = auth.uid()::text);

CREATE POLICY "Admins can manage all skills" ON member_skills
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Create policies for skills table
CREATE POLICY "Anyone can view skills" ON skills
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage skills" ON skills
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
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

-- Create index for efficient email lookups
CREATE INDEX idx_events_attendees_emails ON events USING GIN(attendees_emails);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_google_event_id ON events(google_event_id);

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

-- Enable RLS on new tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for events table
-- Users can only see events where their email is in attendees_emails
CREATE POLICY "Users can view events they're invited to" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.email = ANY(events.attendees_emails)
      AND members.id::text = auth.uid()::text
    )
  );

-- Admins can view all events
CREATE POLICY "Admins can view all events" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Admins can manage events
CREATE POLICY "Admins can manage events" ON events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );

-- Create policies for google_oauth_tokens table
-- Users can only access their own tokens
CREATE POLICY "Users can manage their own tokens" ON google_oauth_tokens
  FOR ALL USING (user_id::text = auth.uid()::text);

-- Admins can view all tokens (for debugging)
CREATE POLICY "Admins can view all tokens" ON google_oauth_tokens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin'
    )
  );



