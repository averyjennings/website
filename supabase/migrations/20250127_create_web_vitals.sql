-- Create web_vitals table to store performance metrics
CREATE TABLE IF NOT EXISTS web_vitals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (name IN ('CLS', 'FCP', 'LCP', 'TTFB', 'INP')),
  value DECIMAL NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  delta DECIMAL,
  timestamp TIMESTAMPTZ NOT NULL,
  url TEXT NOT NULL,
  navigation_type TEXT,
  user_id TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_web_vitals_timestamp ON web_vitals(timestamp DESC);
CREATE INDEX idx_web_vitals_name ON web_vitals(name);
CREATE INDEX idx_web_vitals_user_session ON web_vitals(user_id, session_id);
CREATE INDEX idx_web_vitals_url ON web_vitals(url);

-- Enable RLS
ALTER TABLE web_vitals ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to insert their own metrics
CREATE POLICY "Allow all users to insert metrics" ON web_vitals
  FOR INSERT TO public
  WITH CHECK (true);

-- Create policy to allow all users to read all metrics (for aggregated dashboard)
CREATE POLICY "Allow all users to read all metrics" ON web_vitals
  FOR SELECT TO public
  USING (true);

-- Create function to get aggregated metric stats
CREATE OR REPLACE FUNCTION get_web_vitals_stats(
  p_metric_name TEXT DEFAULT NULL,
  p_time_range INTERVAL DEFAULT INTERVAL '24 hours'
)
RETURNS TABLE (
  metric_name TEXT,
  avg_value DECIMAL,
  min_value DECIMAL,
  max_value DECIMAL,
  p95_value DECIMAL,
  count BIGINT,
  good_count BIGINT,
  needs_improvement_count BIGINT,
  poor_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wv.name as metric_name,
    AVG(wv.value) as avg_value,
    MIN(wv.value) as min_value,
    MAX(wv.value) as max_value,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY wv.value) as p95_value,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE wv.rating = 'good') as good_count,
    COUNT(*) FILTER (WHERE wv.rating = 'needs-improvement') as needs_improvement_count,
    COUNT(*) FILTER (WHERE wv.rating = 'poor') as poor_count
  FROM web_vitals wv
  WHERE 
    (p_metric_name IS NULL OR wv.name = p_metric_name)
    AND wv.timestamp > NOW() - p_time_range
  GROUP BY wv.name;
END;
$$;

-- Create function to cleanup old metrics (optional, for data management)
CREATE OR REPLACE FUNCTION cleanup_old_web_vitals()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM web_vitals
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;