-- Move tables from analytics schema to public schema
-- First, drop any existing tables in public schema to avoid conflicts
DROP TABLE IF EXISTS public.visitors CASCADE;
DROP TABLE IF EXISTS public.page_visits CASCADE;
DROP TABLE IF EXISTS public.web_vitals CASCADE;

-- Move visitors table
ALTER TABLE analytics.visitors SET SCHEMA public;

-- Move page_visits table  
ALTER TABLE analytics.page_visits SET SCHEMA public;

-- Move web_vitals table
ALTER TABLE analytics.web_vitals SET SCHEMA public;

-- Verify tables are now in public schema
SELECT 
    table_schema,
    table_name 
FROM information_schema.tables 
WHERE table_name IN ('visitors', 'page_visits', 'web_vitals')
ORDER BY table_schema, table_name;