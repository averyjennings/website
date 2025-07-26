# Heatmap Responsive Coordinate System

## Overview

The heatmap system has been upgraded to use a responsive coordinate system that ensures click data appears in the correct location across different devices and window sizes.

## Problem Solved

**Before**: Click coordinates were stored as absolute pixel positions, causing issues:
- Clicks appeared in wrong locations on different screen sizes
- Heatmap moved when window was resized
- Inconsistent positioning across devices

**After**: Click coordinates are stored as relative percentages (0-1 range), ensuring:
- Consistent positioning across all devices and screen sizes
- Heatmap stays aligned with page elements during window resize
- Cross-device compatibility

## Technical Implementation

### Coordinate Storage

```typescript
interface HeatmapDataPoint {
  x: number; // Relative X (0-1 as percentage of document width)
  y: number; // Relative Y (0-1 as percentage of document height)
  absoluteX?: number; // Original absolute X (for debugging)
  absoluteY?: number; // Original absolute Y (for debugging)
  documentWidth: number; // Document width at time of click
  documentHeight: number; // Document height at time of click
  // ... other fields
}
```

### Coordinate Conversion

**On Click (Storage)**:
```javascript
// Convert absolute to relative
const relativeX = clickX / documentWidth;  // 0-1 range
const relativeY = clickY / documentHeight; // 0-1 range
```

**On Render (Display)**:
```javascript
// Convert relative back to absolute for current layout
const absoluteX = relativeX * currentDocumentWidth;
const absoluteY = relativeY * currentDocumentHeight;
```

### Database Schema

New fields added to `heatmap_data` table:
- `absolute_x` - Original absolute X coordinate (for debugging)
- `absolute_y` - Original absolute Y coordinate (for debugging)  
- `document_width` - Document width at time of click
- `document_height` - Document height at time of click

### Canvas Improvements

- **High-DPI support**: Canvas resolution matches device pixel ratio
- **Responsive resizing**: Canvas updates on window resize and orientation change
- **Proper scaling**: Drawing context scaled to match device pixel ratio
- **Dimension tracking**: Real-time canvas dimension updates

## Migration

Run the database migration:
```sql
-- See: supabase/update-heatmap-schema.sql
-- Adds new columns and migrates existing data
```

## Benefits

1. **Cross-device consistency**: Clicks appear in same relative position on all devices
2. **Responsive behavior**: Heatmap stays aligned during window resize
3. **High-DPI support**: Sharp rendering on retina displays
4. **Future-proof**: Works with any screen size or resolution
5. **Backward compatibility**: Existing data is migrated automatically

## Testing

Test the system by:
1. Click on various page elements
2. Resize the browser window
3. View on different devices/screen sizes
4. Verify heat spots stay aligned with page elements

The heatmap should now maintain perfect alignment with page content across all scenarios.