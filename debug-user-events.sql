-- Diagnostic queries to check if user_events mappings are being created
-- Run these in Supabase SQL Editor to debug

-- 1. Check if user_events table exists and has data
SELECT COUNT(*) as total_mappings FROM user_events;

-- 2. Check all user_events mappings
SELECT 
  ue.id,
  ue.user_id,
  ue.event_id,
  m.name as member_name,
  m.email as member_email,
  e.title as event_title,
  e.start_time
FROM user_events ue
JOIN members m ON ue.user_id = m.id
JOIN events e ON ue.event_id = e.id
ORDER BY e.start_time DESC
LIMIT 20;

-- 3. Check events and their attendee emails
SELECT 
  id,
  title,
  attendees_emails,
  start_time
FROM events
ORDER BY start_time DESC
LIMIT 10;

-- 4. Check members table
SELECT 
  id,
  name,
  email
FROM members
ORDER BY created_at DESC;

-- 5. Find events for a specific member (replace with actual member email)
-- Example: Find events for theresaonwuka15@gmail.com
SELECT 
  e.id,
  e.title,
  e.start_time,
  e.attendees_emails,
  ue.id as mapping_id
FROM events e
LEFT JOIN user_events ue ON e.id = ue.event_id
LEFT JOIN members m ON ue.user_id = m.id
WHERE m.email = 'theresaonwuka15@gmail.com'
ORDER BY e.start_time DESC;

