-- Verify Theresa's user ID and check if it matches what's being used
-- Run this to see what userId Theresa should have

-- 1. Get Theresa's user ID from database
SELECT 
  id as user_id,
  name,
  email,
  LENGTH(id::text) as id_length
FROM members 
WHERE email = 'theresaonwuka15@gmail.com';

-- 2. Check all mappings for Theresa
SELECT 
  ue.id as mapping_id,
  ue.user_id,
  ue.event_id,
  e.title as event_title,
  e.start_time,
  CASE 
    WHEN e.start_time >= NOW() THEN 'Future'
    ELSE 'Past'
  END as event_status
FROM user_events ue
JOIN members m ON ue.user_id = m.id
JOIN events e ON ue.event_id = e.id
WHERE m.email = 'theresaonwuka15@gmail.com'
ORDER BY e.start_time DESC;

-- 3. Count future vs past events for Theresa
SELECT 
  COUNT(*) FILTER (WHERE e.start_time >= NOW()) as future_events,
  COUNT(*) FILTER (WHERE e.start_time < NOW()) as past_events,
  COUNT(*) as total_events
FROM user_events ue
JOIN members m ON ue.user_id = m.id
JOIN events e ON ue.event_id = e.id
WHERE m.email = 'theresaonwuka15@gmail.com';

