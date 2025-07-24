-- Option 1: Disable RLS temporarily for testing (NOT recommended for production)
ALTER TABLE visitors DISABLE ROW LEVEL SECURITY;
ALTER TABLE page_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE web_vitals DISABLE ROW LEVEL SECURITY;

-- Option 2: Fix RLS policies (RECOMMENDED)
-- First, check if RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('visitors', 'page_visits', 'web_vitals');

-- If you want to keep RLS enabled (recommended), uncomment and run these instead:
-- ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE web_vitals ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
-- DROP POLICY IF EXISTS "public_visitors_select" ON visitors;
-- DROP POLICY IF EXISTS "public_visitors_insert" ON visitors;
-- DROP POLICY IF EXISTS "public_visitors_update" ON visitors;
-- DROP POLICY IF EXISTS "public_page_visits_select" ON page_visits;
-- DROP POLICY IF EXISTS "public_page_visits_insert" ON page_visits;
-- DROP POLICY IF EXISTS "public_web_vitals_select" ON web_vitals;
-- DROP POLICY IF EXISTS "public_web_vitals_insert" ON web_vitals;

-- Create permissive policies
-- CREATE POLICY "Enable all access for visitors" ON visitors FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Enable all access for page_visits" ON page_visits FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Enable all access for web_vitals" ON web_vitals FOR ALL USING (true) WITH CHECK (true);