export interface WebVitalMetric {
  id: string;
  name: 'CLS' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  timestamp: number;
  url: string;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache' | 'prerender' | 'restore';
}

export interface PerformanceData {
  metrics: WebVitalMetric[];
  lastUpdated: number;
  sessionId: string;
}

export interface MetricThresholds {
  good: number;
  needsImprovement: number;
}

export interface WebVitalThresholds {
  CLS: MetricThresholds;
  FCP: MetricThresholds;
  LCP: MetricThresholds;
  TTFB: MetricThresholds;
  INP: MetricThresholds;
}

export interface PerformanceStats {
  average: number;
  median: number;
  p75: number;
  p90: number;
  min: number;
  max: number;
  count: number;
}

export interface MetricHistory {
  date: string;
  metrics: {
    [K in WebVitalMetric['name']]: PerformanceStats;
  };
}

export interface DashboardFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  metricTypes: WebVitalMetric['name'][];
  url?: string;
}

export interface ExportOptions {
  format: 'json' | 'csv';
  includeRawData: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}