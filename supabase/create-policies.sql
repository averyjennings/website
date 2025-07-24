-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON visitors;
DROP POLICY IF EXISTS "Allow public insert access" ON visitors;
DROP POLICY IF EXISTS "Allow public update access" ON visitors;
DROP POLICY IF EXISTS "Allow public read access" ON page_visits;
DROP POLICY IF EXISTS "Allow public insert access" ON page_visits;
DROP POLICY IF EXISTS "Allow public read access" ON web_vitals;
DROP POLICY IF EXISTS "Allow public insert access" ON web_vitals;

-- Enable Row Level Security (RLS)
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_vitals ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
-- Visitors table policies
CREATE POLICY "public_visitors_select" ON visitors FOR SELECT USING (true);
CREATE POLICY "public_visitors_insert" ON visitors FOR INSERT WITH CHECK (true);
CREATE POLICY "public_visitors_update" ON visitors FOR UPDATE USING (true);

-- Page visits table policies  
CREATE POLICY "public_page_visits_select" ON page_visits FOR SELECT USING (true);
CREATE POLICY "public_page_visits_insert" ON page_visits FOR INSERT WITH CHECK (true);

-- Web vitals table policies
CREATE POLICY "public_web_vitals_select" ON web_vitals FOR SELECT USING (true);
CREATE POLICY "public_web_vitals_insert" ON web_vitals FOR INSERT WITH CHECK (true);

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('visitors', 'page_visits', 'web_vitals');