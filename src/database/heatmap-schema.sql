-- Supabase SQL Schema for Heatmap Data Storage
-- Run this in your Supabase SQL editor to create the heatmap_data table

CREATE TABLE IF NOT EXISTS heatmap_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    element_type VARCHAR(50) NOT NULL,
    element_class TEXT,
    element_id VARCHAR(255),
    element_text TEXT,
    page_url VARCHAR(500) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    viewport_width INTEGER NOT NULL,
    viewport_height INTEGER NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('click', 'scroll', 'hover', 'focus')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_heatmap_data_page_url ON heatmap_data(page_url);
CREATE INDEX IF NOT EXISTS idx_heatmap_data_timestamp ON heatmap_data(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_heatmap_data_user_id ON heatmap_data(user_id);
CREATE INDEX IF NOT EXISTS idx_heatmap_data_event_type ON heatmap_data(event_type);
CREATE INDEX IF NOT EXISTS idx_heatmap_data_page_event ON heatmap_data(page_url, event_type);

-- Create a composite index for common queries
CREATE INDEX IF NOT EXISTS idx_heatmap_data_page_time_event 
ON heatmap_data(page_url, timestamp DESC, event_type);

-- Add Row Level Security (RLS) if needed
-- ALTER TABLE heatmap_data ENABLE ROW LEVEL SECURITY;

-- Optional: Create a policy for public read access
-- CREATE POLICY "Public read access" ON heatmap_data FOR SELECT USING (true);

-- Optional: Create a policy for authenticated insert
-- CREATE POLICY "Authenticated insert" ON heatmap_data FOR INSERT USING (auth.role() = 'authenticated');

COMMENT ON TABLE heatmap_data IS 'Stores user interaction data for heatmap visualization including clicks, scrolls, and hover events';
COMMENT ON COLUMN heatmap_data.x IS 'Horizontal pixel position of the interaction';
COMMENT ON COLUMN heatmap_data.y IS 'Vertical pixel position of the interaction';
COMMENT ON COLUMN heatmap_data.element_type IS 'HTML tag name of the interacted element';
COMMENT ON COLUMN heatmap_data.element_class IS 'CSS class names of the interacted element';
COMMENT ON COLUMN heatmap_data.element_id IS 'ID attribute of the interacted element';
COMMENT ON COLUMN heatmap_data.element_text IS 'Text content of the interacted element (truncated to 100 chars)';
COMMENT ON COLUMN heatmap_data.page_url IS 'URL path and hash of the page where interaction occurred';
COMMENT ON COLUMN heatmap_data.viewport_width IS 'Browser viewport width at time of interaction';
COMMENT ON COLUMN heatmap_data.viewport_height IS 'Browser viewport height at time of interaction';
COMMENT ON COLUMN heatmap_data.user_id IS 'Unique user identifier from analytics service';
COMMENT ON COLUMN heatmap_data.session_id IS 'Session identifier for grouping related interactions';
COMMENT ON COLUMN heatmap_data.event_type IS 'Type of user interaction: click, scroll, hover, or focus';