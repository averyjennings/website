-- Create test data to verify Supabase connection
-- Run this in Supabase SQL Editor

-- Insert test visitor
INSERT INTO visitors (user_id, first_visit, last_visit, visit_count, user_agent)
VALUES (
  'test_user_' || gen_random_uuid()::text,
  NOW() - INTERVAL '1 hour',
  NOW(),
  5,
  'Mozilla/5.0 Test Browser'
);

-- Insert test page visits
INSERT INTO page_visits (user_id, session_id, url, timestamp, viewport_width, viewport_height)
VALUES 
  ('test_user_1', 'session_1', 'http://localhost:5173/', NOW() - INTERVAL '30 minutes', 1920, 1080),
  ('test_user_1', 'session_1', 'http://localhost:5173/dashboard', NOW() - INTERVAL '25 minutes', 1920, 1080),
  ('test_user_2', 'session_2', 'http://localhost:5173/', NOW() - INTERVAL '20 minutes', 1366, 768),
  ('test_user_3', 'session_3', 'http://localhost:5173/', NOW() - INTERVAL '10 minutes', 414, 896);

-- Check the data
SELECT COUNT(*) as visitor_count FROM visitors;
SELECT COUNT(*) as page_visit_count FROM page_visits;