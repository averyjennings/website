// Supabase database types for analytics schema

export interface SupabaseVisitor {
  id: string;
  user_id: string;
  first_visit: string; // ISO timestamp
  last_visit: string; // ISO timestamp
  visit_count: number;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabasePageVisit {
  id: string;
  user_id: string;
  session_id: string;
  url: string;
  timestamp: string; // ISO timestamp
  user_agent?: string;
  viewport_width?: number;
  viewport_height?: number;
  created_at: string;
}

export interface SupabaseWebVital {
  id: string;
  metric_id: string;
  name: 'CLS' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  url: string;
  navigation_type?: string;
  user_id: string;
  session_id: string;
  timestamp: string; // ISO timestamp
  created_at: string;
}

// Chart data interfaces
export interface ChartDataPoint {
  timestamp: number; // Unix timestamp for easier chart processing
  value: number;
  name: 'Page Visits' | 'Unique Visitors';
}

export interface VisitorStats {
  uniqueVisitors: number;
  totalPageVisits: number;
  last24Hours: number;
  lastWeek: number;
  sessionId: string;
  lastUpdated: number;
}

export interface TimeRangeConfig {
  timeRange: '1h' | '24h' | '7d' | '30d';
  startTime: string; // ISO timestamp
  endTime: string; // ISO timestamp
  intervalMs: number; // Milliseconds for time grouping
}

// Database query result types
export interface VisitorStatsQuery {
  time_bucket: string;
  visitor_count: number;
  page_visit_count: number;
}

export interface TimeSeriesData {
  time_bucket: string;
  count: number;
}

// Combined metrics for "All Metrics" chart
export interface CombinedMetric {
  id: string;
  name: 'CLS' | 'FCP' | 'LCP' | 'TTFB' | 'INP' | 'Page Visits' | 'Unique Visitors';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  timestamp: number;
  url: string;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache' | 'prerender' | 'restore';
}

// Error handling types
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

export interface AnalyticsServiceConfig {
  enableRealTime: boolean;
  batchSize: number;
  retryAttempts: number;
  fallbackToLocalStorage: boolean;
}

// Keep-alive workflow types
export interface KeepAliveResponse {
  success: boolean;
  timestamp: string;
  tableCount: number;
}

// Migration types for localStorage to Supabase transition
export interface MigrationData {
  visitors: SupabaseVisitor[];
  pageVisits: SupabasePageVisit[];
  webVitals: SupabaseWebVital[];
}

export interface MigrationStatus {
  completed: boolean;
  visitorssMigrated: number;
  pageVisitsMigrated: number;
  webVitalsMigrated: number;
  errors: string[];
}