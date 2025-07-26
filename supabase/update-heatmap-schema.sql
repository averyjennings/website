-- Update heatmap_data table to support relative coordinates
-- This migration adds new columns for the responsive coordinate system

-- Add new columns for relative coordinate system
ALTER TABLE heatmap_data 
ADD COLUMN IF NOT EXISTS absolute_x INTEGER,
ADD COLUMN IF NOT EXISTS absolute_y INTEGER,
ADD COLUMN IF NOT EXISTS document_width INTEGER,
ADD COLUMN IF NOT EXISTS document_height INTEGER;

-- Add comments to clarify the new coordinate system
COMMENT ON COLUMN heatmap_data.x IS 'Relative X coordinate (0-1 as percentage of document width)';
COMMENT ON COLUMN heatmap_data.y IS 'Relative Y coordinate (0-1 as percentage of document height)';
COMMENT ON COLUMN heatmap_data.absolute_x IS 'Original absolute X coordinate (for debugging/migration)';
COMMENT ON COLUMN heatmap_data.absolute_y IS 'Original absolute Y coordinate (for debugging/migration)';
COMMENT ON COLUMN heatmap_data.document_width IS 'Document width at time of click';
COMMENT ON COLUMN heatmap_data.document_height IS 'Document height at time of click';

-- Migrate existing data: convert absolute coordinates to relative
-- This assumes existing x,y are absolute coordinates and we need to convert them
-- We'll use the viewport dimensions as a fallback for document dimensions
UPDATE heatmap_data 
SET 
  absolute_x = CASE WHEN x > 1 THEN x::INTEGER ELSE NULL END,
  absolute_y = CASE WHEN y > 1 THEN y::INTEGER ELSE NULL END,
  document_width = COALESCE(viewport_width, 1920),
  document_height = COALESCE(viewport_height, 1080),
  x = CASE 
    WHEN x > 1 THEN LEAST(1.0, x / COALESCE(viewport_width, 1920))
    ELSE x 
  END,
  y = CASE 
    WHEN y > 1 THEN LEAST(1.0, y / COALESCE(viewport_height, 1080))
    ELSE y 
  END
WHERE absolute_x IS NULL;

-- Add index for better query performance on the new relative coordinates
CREATE INDEX IF NOT EXISTS idx_heatmap_relative_coords ON heatmap_data(x, y, page_url, event_type);

-- Add check constraints to ensure relative coordinates are in valid range
ALTER TABLE heatmap_data 
ADD CONSTRAINT check_relative_x_range CHECK (x >= 0 AND x <= 1),
ADD CONSTRAINT check_relative_y_range CHECK (y >= 0 AND y <= 1);