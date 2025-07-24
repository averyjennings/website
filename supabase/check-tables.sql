-- Check all tables in all schemas
SELECT 
    table_schema,
    table_name 
FROM information_schema.tables 
WHERE table_name IN ('visitors', 'page_visits', 'web_vitals')
ORDER BY table_schema, table_name;

-- Check if tables exist in public schema specifically
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'visitors'
) as visitors_exists,
EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'page_visits'
) as page_visits_exists,
EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'web_vitals'
) as web_vitals_exists;

-- List all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;