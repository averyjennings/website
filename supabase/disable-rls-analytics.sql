-- Disable RLS on analytics schema tables
ALTER TABLE analytics.visitors DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.page_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.web_vitals DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'analytics' 
AND tablename IN ('visitors', 'page_visits', 'web_vitals');