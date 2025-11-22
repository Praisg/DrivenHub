-- Test query to verify events filtering works
-- Run this in Supabase SQL Editor to check if events are being filtered correctly

-- Check all events with attendees
SELECT 
  id,
  title,
  organizer_email,
  attendees_emails,
  start_time
FROM events
ORDER BY start_time DESC
LIMIT 10;

-- Test filtering by specific email (replace with actual user email)
-- Example: Check if events for 'user@example.com' are returned
SELECT 
  id,
  title,
  organizer_email,
  attendees_emails,
  start_time
FROM events
WHERE 'user@example.com' = ANY(attendees_emails)
  AND start_time >= NOW()
ORDER BY start_time ASC;

-- Check if events table has the right structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name = 'attendees_emails';

