-- Test query to verify Theresa can see events
-- Run this to check if mappings exist and if the query works

-- 1. Get Theresa's user ID
SELECT id, name, email FROM members WHERE email = 'theresaonwuka15@gmail.com';

-- 2. Check if any mappings exist for Theresa
SELECT 
  ue.id as mapping_id,
  ue.user_id,
  ue.event_id,
  e.title as event_title,
  e.start_time
FROM user_events ue
JOIN events e ON ue.event_id = e.id
WHERE ue.user_id = (SELECT id FROM members WHERE email = 'theresaonwuka15@gmail.com')
ORDER BY e.start_time DESC;

-- 3. Manually create a mapping for testing (replace event_id with actual event ID)
-- First, get an event ID:
SELECT id, title, start_time FROM events WHERE start_time >= NOW() ORDER BY start_time ASC LIMIT 5;

-- Then create mapping (replace the event_id with one from above):
-- INSERT INTO user_events (user_id, event_id)
-- SELECT 
--   (SELECT id FROM members WHERE email = 'theresaonwuka15@gmail.com'),
--   '7a543799-b35b-4dcb-8c86-506a785da01d' -- Replace with actual event ID
-- ON CONFLICT (user_id, event_id) DO NOTHING;

-- 4. Test the exact query the API uses
SELECT 
  e.*
FROM events e
WHERE e.id IN (
  SELECT event_id 
  FROM user_events 
  WHERE user_id = (SELECT id FROM members WHERE email = 'theresaonwuka15@gmail.com')
)
AND e.start_time >= NOW()
ORDER BY e.start_time ASC;

