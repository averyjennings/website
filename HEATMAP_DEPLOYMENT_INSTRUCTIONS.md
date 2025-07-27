# Heatmap Database Deployment Instructions

To enable the database-backed heatmap that's shared across all users, you need to run the following SQL migration on your Supabase database:

## Step 1: Run the Migration

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Navigate to the SQL Editor (left sidebar)
4. Create a new query
5. Copy and paste the contents of `supabase/migrations/20250127_create_heatmap_clicks.sql`
6. Click "Run" to execute the migration

## Step 2: Verify the Migration

After running the migration, you should have:
- A `heatmap_clicks` table
- A `get_heatmap_data` function
- Row Level Security policies enabled

## Step 3: Test the Integration

1. Visit your website
2. Click around to generate some heatmap data
3. Check the Supabase dashboard Table Editor to see if clicks are being recorded in the `heatmap_clicks` table

## Features

Once the database is set up:
- All users will contribute to the same heatmap
- Heatmap data persists across sessions and devices
- You can view aggregated click patterns from all visitors
- Data is automatically cleaned up after 30 days (optional, via the cleanup function)

## Fallback Behavior

If the database is not set up or there's an error:
- The heatmap will fall back to using localStorage
- Each user will only see their own clicks
- Data will not be shared across users

## Monitoring

You can monitor heatmap data in Supabase:
- Table Editor: View raw click data
- SQL Editor: Run queries to analyze patterns
- Example query to see top clicked areas:
  ```sql
  SELECT x, y, COUNT(*) as clicks 
  FROM heatmap_clicks 
  WHERE created_at > NOW() - INTERVAL '7 days'
  GROUP BY x, y 
  ORDER BY clicks DESC 
  LIMIT 20;
  ```