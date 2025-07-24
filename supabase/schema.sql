-- Supabase Analytics Database Schema
-- Run this in your Supabase SQL Editor after creating your project

-- Create analytics schema
CREATE SCHEMA IF NOT EXISTS analytics;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Visitors table - tracks unique visitors
CREATE TABLE analytics.visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  first_visit TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_visit TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visit_count INTEGER NOT NULL DEFAULT 1,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Page visits table - tracks every page load
CREATE TABLE analytics.page_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  url TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  viewport_width INTEGER,
  viewport_height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Web vitals metrics table - tracks performance metrics
CREATE TABLE analytics.web_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (name IN ('CLS', 'FCP', 'LCP', 'TTFB', 'INP')),
  value DECIMAL NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  delta DECIMAL DEFAULT 0,
  url TEXT NOT NULL,
  navigation_type TEXT DEFAULT 'navigate',
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_visitors_user_id ON analytics.visitors(user_id);
CREATE INDEX idx_visitors_first_visit ON analytics.visitors(first_visit DESC);
CREATE INDEX idx_visitors_last_visit ON analytics.visitors(last_visit DESC);

CREATE INDEX idx_page_visits_user_id ON analytics.page_visits(user_id);
CREATE INDEX idx_page_visits_session_id ON analytics.page_visits(session_id);
CREATE INDEX idx_page_visits_timestamp ON analytics.page_visits(timestamp DESC);
CREATE INDEX idx_page_visits_url ON analytics.page_visits(url);
CREATE INDEX idx_page_visits_timestamp_user ON analytics.page_visits(timestamp DESC, user_id);

CREATE INDEX idx_web_vitals_name ON analytics.web_vitals(name);
CREATE INDEX idx_web_vitals_timestamp ON analytics.web_vitals(timestamp DESC);
CREATE INDEX idx_web_vitals_user_id ON analytics.web_vitals(user_id);
CREATE INDEX idx_web_vitals_rating ON analytics.web_vitals(rating);
CREATE INDEX idx_web_vitals_name_timestamp ON analytics.web_vitals(name, timestamp DESC);

-- Row Level Security (RLS) - Enable security
ALTER TABLE analytics.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.web_vitals ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public read/write for analytics (no authentication needed)
-- Visitors policies
CREATE POLICY "Public read access for visitors" ON analytics.visitors
  FOR SELECT USING (true);

CREATE POLICY "Public insert access for visitors" ON analytics.visitors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access for visitors" ON analytics.visitors
  FOR UPDATE USING (true);

-- Page visits policies  
CREATE POLICY "Public read access for page_visits" ON analytics.page_visits
  FOR SELECT USING (true);

CREATE POLICY "Public insert access for page_visits" ON analytics.page_visits
  FOR INSERT WITH CHECK (true);

-- Web vitals policies
CREATE POLICY "Public read access for web_vitals" ON analytics.web_vitals
  FOR SELECT USING (true);

CREATE POLICY "Public insert access for web_vitals" ON analytics.web_vitals
  FOR INSERT WITH CHECK (true);

-- Utility functions for analytics

-- Function to increment visitor count atomically
CREATE OR REPLACE FUNCTION analytics.increment_visitor_count(
  p_user_id TEXT,
  p_last_visit TIMESTAMPTZ
) RETURNS VOID AS $$
BEGIN
  UPDATE analytics.visitors 
  SET 
    last_visit = p_last_visit,
    visit_count = visit_count + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- If no update occurred, insert new visitor
  IF NOT FOUND THEN
    INSERT INTO analytics.visitors (user_id, first_visit, last_visit, visit_count)
    VALUES (p_user_id, p_last_visit, p_last_visit, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      last_visit = EXCLUDED.last_visit,
      visit_count = analytics.visitors.visit_count + 1,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get page visits time series data
CREATE OR REPLACE FUNCTION analytics.get_page_visits_time_series(
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  interval_minutes INTEGER DEFAULT 60
) RETURNS TABLE (
  time_bucket TIMESTAMPTZ,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('hour', pv.timestamp) + 
    (EXTRACT(minute FROM pv.timestamp)::INTEGER / interval_minutes) * 
    (interval_minutes || ' minutes')::INTERVAL AS time_bucket,
    COUNT(*) AS count
  FROM analytics.page_visits pv
  WHERE pv.timestamp BETWEEN start_time AND end_time
  GROUP BY time_bucket
  ORDER BY time_bucket;
END;
$$ LANGUAGE plpgsql;

-- Function to get unique visitors time series data
CREATE OR REPLACE FUNCTION analytics.get_unique_visitors_time_series(
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  interval_minutes INTEGER DEFAULT 60
) RETURNS TABLE (
  time_bucket TIMESTAMPTZ,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('hour', v.first_visit) + 
    (EXTRACT(minute FROM v.first_visit)::INTEGER / interval_minutes) * 
    (interval_minutes || ' minutes')::INTERVAL AS time_bucket,
    COUNT(DISTINCT v.user_id) AS count
  FROM analytics.visitors v
  WHERE v.first_visit BETWEEN start_time AND end_time
  GROUP BY time_bucket
  ORDER BY time_bucket;
END;
$$ LANGUAGE plpgsql;

-- Function for keep-alive queries (used by GitHub Actions)
CREATE OR REPLACE FUNCTION analytics.keep_alive() 
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'timestamp', NOW(),
    'visitors_count', (SELECT COUNT(*) FROM analytics.visitors),
    'page_visits_count', (SELECT COUNT(*) FROM analytics.page_visits),
    'web_vitals_count', (SELECT COUNT(*) FROM analytics.web_vitals),
    'status', 'active'
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION analytics.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to visitors table
CREATE TRIGGER update_visitors_updated_at 
    BEFORE UPDATE ON analytics.visitors
    FOR EACH ROW 
    EXECUTE FUNCTION analytics.update_updated_at_column();

-- Optional: Add data retention policy (automatically delete old data)
-- Uncomment if you want to automatically clean up old data

-- CREATE OR REPLACE FUNCTION analytics.cleanup_old_data() 
-- RETURNS VOID AS $$
-- BEGIN
--   -- Delete page visits older than 90 days
--   DELETE FROM analytics.page_visits 
--   WHERE created_at < NOW() - INTERVAL '90 days';
  
--   -- Delete web vitals older than 90 days
--   DELETE FROM analytics.web_vitals 
--   WHERE created_at < NOW() - INTERVAL '90 days';
  
--   -- Delete visitors with no recent activity (over 90 days)
--   DELETE FROM analytics.visitors 
--   WHERE last_visit < NOW() - INTERVAL '90 days';
-- END;
-- $$ LANGUAGE plpgsql;

-- Optional: Schedule automatic cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-analytics', '0 2 * * 0', 'SELECT analytics.cleanup_old_data();');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA analytics TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA analytics TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA analytics TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA analytics TO anon, authenticated;

-- Set default permissions for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA analytics GRANT ALL ON FUNCTIONS TO anon, authenticated;

-- Insert a test row to verify setup
INSERT INTO analytics.visitors (user_id, first_visit, last_visit, visit_count) 
VALUES ('test_user_setup', NOW(), NOW(), 1);

-- Clean up test data
DELETE FROM analytics.visitors WHERE user_id = 'test_user_setup';

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ Analytics schema created successfully!';
    RAISE NOTICE '📊 Tables: visitors, page_visits, web_vitals';
    RAISE NOTICE '🔍 Functions: increment_visitor_count, get_*_time_series, keep_alive';
    RAISE NOTICE '🔒 RLS enabled with public read/write policies';
    RAISE NOTICE '🚀 Ready for production use!';
END $$;