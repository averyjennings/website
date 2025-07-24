-- Create visitors table
CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  visit_count INTEGER DEFAULT 1
);

-- Create page_visits table
CREATE TABLE IF NOT EXISTS page_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  url TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  referrer TEXT
);

-- Create web_vitals table
CREATE TABLE IF NOT EXISTS web_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id TEXT NOT NULL,
  name TEXT NOT NULL,
  value REAL NOT NULL,
  rating TEXT NOT NULL,
  delta REAL,
  url TEXT NOT NULL,
  navigation_type TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT,
  session_id TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visitors_user_id ON visitors(user_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_user_id ON page_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_timestamp ON page_visits(timestamp);
CREATE INDEX IF NOT EXISTS idx_web_vitals_timestamp ON web_vitals(timestamp);
CREATE INDEX IF NOT EXISTS idx_web_vitals_name ON web_vitals(name);

-- Enable Row Level Security
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_vitals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read/write access
CREATE POLICY "Allow public read access" ON visitors FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON visitors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON visitors FOR UPDATE USING (true);

CREATE POLICY "Allow public read access" ON page_visits FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON page_visits FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access" ON web_vitals FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON web_vitals FOR INSERT WITH CHECK (true);

-- Verify tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('visitors', 'page_visits', 'web_vitals');