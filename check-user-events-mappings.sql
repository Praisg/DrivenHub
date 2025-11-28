-- Check if user_events mappings exist and verify the data
-- Run this after syncing events

-- 1. Check all user_events mappings
SELECT 
  ue.id as mapping_id,
  ue.user_id,
  ue.event_id,
  m.name as member_name,
  m.email as member_email,
  e.title as event_title,
  e.start_time,
  e.attendees_emails
FROM user_events ue
JOIN members m ON ue.user_id = m.id
JOIN events e ON ue.event_id = e.id
ORDER BY e.start_time DESC;

-- 2. Check specifically for Theresa
SELECT 
  ue.id as mapping_id,
  ue.user_id,
  ue.event_id,
  m.id as member_db_id,
  m.email as member_email,
  e.id as event_db_id,
  e.title as event_title,
  e.start_time
FROM user_events ue
JOIN members m ON ue.user_id = m.id
JOIN events e ON ue.event_id = e.id
WHERE m.email = 'theresaonwuka15@gmail.com'
ORDER BY e.start_time DESC;

-- 3. Count total mappings
SELECT COUNT(*) as total_mappings FROM user_events;

-- 4. Check if events have attendees_emails populated
SELECT 
  id,
  title,
  attendees_emails,
  start_time
FROM events
WHERE start_time >= NOW()
ORDER BY start_time ASC
LIMIT 10;

