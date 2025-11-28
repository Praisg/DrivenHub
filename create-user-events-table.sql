-- Create user_events table for mapping members to events
-- This replaces array-based filtering with explicit join table
-- Run this in Supabase SQL Editor

-- Create user_events linking table
CREATE TABLE IF NOT EXISTS user_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, event_id) -- One row per user per event
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event_id ON user_events(event_id);
CREATE INDEX IF NOT EXISTS idx_user_events_user_event ON user_events(user_id, event_id);

-- Enable Row Level Security
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own event mappings
CREATE POLICY "Users can view their own event mappings" ON user_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.id = user_events.user_id
      AND members.id::text = auth.uid()::text
    )
  );

-- Policy: Allow all operations for server-side API routes (using anon key)
CREATE POLICY "Allow all operations on user_events" ON user_events
  FOR ALL USING (true);

