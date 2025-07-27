-- Create heatmap_clicks table to store click data from all users
CREATE TABLE IF NOT EXISTS heatmap_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  page_x INTEGER NOT NULL,
  page_y INTEGER NOT NULL,
  element_tag VARCHAR(50),
  viewport_width INTEGER,
  viewport_height INTEGER,
  page_url TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_heatmap_clicks_created_at ON heatmap_clicks(created_at DESC);
CREATE INDEX idx_heatmap_clicks_page_url ON heatmap_clicks(page_url);
CREATE INDEX idx_heatmap_clicks_coordinates ON heatmap_clicks(x, y);

-- Enable RLS
ALTER TABLE heatmap_clicks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to insert their own clicks
CREATE POLICY "Allow all users to insert clicks" ON heatmap_clicks
  FOR INSERT TO public
  WITH CHECK (true);

-- Create policy to allow all users to read all clicks (shared heatmap)
CREATE POLICY "Allow all users to read all clicks" ON heatmap_clicks
  FOR SELECT TO public
  USING (true);

-- Create function to get aggregated heatmap data
CREATE OR REPLACE FUNCTION get_heatmap_data(
  p_page_url TEXT DEFAULT NULL,
  p_time_range INTERVAL DEFAULT INTERVAL '7 days'
)
RETURNS TABLE (
  x INTEGER,
  y INTEGER,
  click_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hc.x,
    hc.y,
    COUNT(*) as click_count
  FROM heatmap_clicks hc
  WHERE 
    (p_page_url IS NULL OR hc.page_url = p_page_url)
    AND hc.created_at > NOW() - p_time_range
  GROUP BY hc.x, hc.y
  ORDER BY click_count DESC;
END;
$$;

-- Create function to clean up old heatmap data (optional, for data management)
CREATE OR REPLACE FUNCTION cleanup_old_heatmap_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM heatmap_clicks
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;