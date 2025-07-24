-- Check if analytics schema accepts API calls
SELECT 
    n.nspname AS schema_name,
    n.nspacl AS permissions
FROM pg_namespace n
WHERE n.nspname = 'analytics';

-- Check if anon role has access to analytics schema
SELECT has_schema_privilege('anon', 'analytics', 'USAGE');

-- Grant usage on analytics schema to anon role if needed
GRANT USAGE ON SCHEMA analytics TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA analytics TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA analytics TO anon;

-- Verify permissions
SELECT 
    schemaname,
    tablename,
    has_table_privilege('anon', schemaname||'.'||tablename, 'SELECT') as can_select,
    has_table_privilege('anon', schemaname||'.'||tablename, 'INSERT') as can_insert
FROM pg_tables 
WHERE schemaname = 'analytics' 
AND tablename IN ('visitors', 'page_visits', 'web_vitals');