-- Check if data is being stored in Supabase
SELECT 'Visitors' as table_name, COUNT(*) as row_count FROM visitors
UNION ALL
SELECT 'Page Visits', COUNT(*) FROM page_visits
UNION ALL
SELECT 'Web Vitals', COUNT(*) FROM web_vitals;

-- Check recent visitor records
SELECT * FROM visitors ORDER BY last_visit DESC LIMIT 5;

-- Check recent page visits
SELECT * FROM page_visits ORDER BY timestamp DESC LIMIT 5;

-- Check recent web vitals
SELECT * FROM web_vitals ORDER BY timestamp DESC LIMIT 5;