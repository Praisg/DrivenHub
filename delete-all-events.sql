-- Delete all synced events and user_events mappings
-- Run this in Supabase SQL Editor to clear all events and start fresh

-- Delete all user_events mappings first (due to foreign key constraint)
DELETE FROM user_events;

-- Delete all events
DELETE FROM events;

-- Verify deletion
SELECT COUNT(*) as remaining_user_events FROM user_events;
SELECT COUNT(*) as remaining_events FROM events;

-- You should see:
-- remaining_user_events: 0
-- remaining_events: 0

