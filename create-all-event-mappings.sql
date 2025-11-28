-- Create user_events mappings for all existing events
-- This will map events to members based on attendee emails
-- Run this AFTER syncing events to create mappings for existing events

-- For each event, find members whose emails match attendees_emails
INSERT INTO user_events (user_id, event_id)
SELECT DISTINCT
  m.id as user_id,
  e.id as event_id
FROM events e
CROSS JOIN LATERAL unnest(e.attendees_emails) AS attendee_email
JOIN members m ON LOWER(TRIM(m.email)) = LOWER(TRIM(attendee_email))
WHERE e.start_time >= NOW() -- Only future events
ON CONFLICT (user_id, event_id) DO NOTHING;

-- Verify mappings were created
SELECT 
  COUNT(*) as total_mappings,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT event_id) as unique_events
FROM user_events;

-- Check Theresa's mappings specifically
SELECT 
  ue.id as mapping_id,
  m.name as member_name,
  m.email as member_email,
  e.title as event_title,
  e.start_time
FROM user_events ue
JOIN members m ON ue.user_id = m.id
JOIN events e ON ue.event_id = e.id
WHERE m.email = 'theresaonwuka15@gmail.com'
ORDER BY e.start_time ASC;

