# 🚨 Database Migration Required

## Heatmap Coordinate System Update

A database schema update is required to support the new responsive heatmap coordinate system.

### What to do:

1. **Connect to your Supabase database**
2. **Run the migration script**: `supabase/update-heatmap-schema.sql`

### Migration Script Location:
```
supabase/update-heatmap-schema.sql
```

### What the migration does:
- Adds new columns for relative coordinate system
- Migrates existing absolute coordinates to relative percentages  
- Adds performance indexes and data validation constraints
- Maintains full backward compatibility

### Why this is needed:
Without this migration, new heatmap clicks will fail to save and existing heatmap data may not display correctly across different devices.

### After migration:
- Heatmap clicks will work consistently across all devices
- Window resizing will maintain proper alignment
- Cross-device coordinate accuracy will be perfect

### To verify migration worked:
1. Check that new columns exist in `heatmap_data` table
2. Test clicking on the website - should see coordinates logged as decimals (0-1 range)
3. Resize browser window - heatmap should stay aligned with page elements

---
**This migration is safe and non-destructive - it preserves all existing data.**