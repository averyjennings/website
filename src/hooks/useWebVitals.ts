import { useEffect, useState, useCallback } from 'react';
import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';
import { supabaseAnalyticsService as analyticsService } from '@/services/supabase-analytics';
import { WebVitalMetric, PerformanceData, DashboardFilters } from '@/types/performance';

export interface UseWebVitalsReturn {
  metrics: WebVitalMetric[];
  loading: boolean;
  error: string | null;
  getStats: (timeRange?: '1h' | '24h' | '7d' | '30d') => {
    uniqueVisitors: number;
    totalPageVisits: number;
    last24Hours: number;
    lastWeek: number;
    sessionId: string;
    lastUpdated: number;
  };
  refreshData: () => void;
  clearData: () => void;
  exportData: (format: 'json' | 'csv') => string;
  getFilteredMetrics: (filters: DashboardFilters) => WebVitalMetric[];
}

export function useWebVitals(): UseWebVitalsReturn {
  const [data, setData] = useState<PerformanceData>({ 
    metrics: [], 
    lastUpdated: Date.now(), 
    sessionId: '' 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      const storedData = analyticsService.getStoredData();
      setData(storedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics data');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    try {
      analyticsService.clearStoredData();
      setData({ metrics: [], lastUpdated: Date.now(), sessionId: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear data');
    }
  }, []);

  const exportData = useCallback((format: 'json' | 'csv' = 'json') => {
    return analyticsService.exportData(format);
  }, []);

  const getFilteredMetrics = useCallback((filters: DashboardFilters): WebVitalMetric[] => {
    let filtered = data.metrics;

    // Filter by date range
    if (filters.dateRange) {
      const startTime = filters.dateRange.start.getTime();
      const endTime = filters.dateRange.end.getTime();
      filtered = filtered.filter(metric => 
        metric.timestamp >= startTime && metric.timestamp <= endTime
      );
    }

    // Filter by metric types
    if (filters.metricTypes.length > 0) {
      filtered = filtered.filter(metric => 
        filters.metricTypes.includes(metric.name)
      );
    }

    // Filter by URL if specified
    if (filters.url) {
      filtered = filtered.filter(metric => 
        metric.url.includes(filters.url!)
      );
    }

    return filtered;
  }, [data.metrics]);

  // Initialize Web Vitals collection
  useEffect(() => {
    let mounted = true;

    const initializeWebVitals = async () => {
      try {
        // Set up Web Vitals observers
        onCLS((metric: Metric) => {
          if (mounted) analyticsService.recordMetric(metric);
        });

        onFCP((metric: Metric) => {
          if (mounted) analyticsService.recordMetric(metric);
        });

        onLCP((metric: Metric) => {
          if (mounted) analyticsService.recordMetric(metric);
        });

        onTTFB((metric: Metric) => {
          if (mounted) analyticsService.recordMetric(metric);
        });

        onINP((metric: Metric) => {
          if (mounted) analyticsService.recordMetric(metric);
        });

        // Load existing data
        refreshData();
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize Web Vitals');
          setLoading(false);
        }
      }
    };

    initializeWebVitals();

    return () => {
      mounted = false;
    };
  }, [refreshData]);

  // Set up storage event listener for cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'web-vitals-metrics' && event.newValue) {
        refreshData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshData]);

  const [, setStats] = useState(() => analyticsService.getPerformanceStats('24h'));
  
  const getStats = useCallback((timeRange: '1h' | '24h' | '7d' | '30d' = '24h') => {
    const currentStats = analyticsService.getPerformanceStats(timeRange);
    
    // Also fetch async stats and update when ready
    analyticsService.getVisitorStats(timeRange).then(newStats => {
      setStats(newStats);
    });
    
    return currentStats;
  }, []);

  return {
    metrics: data.metrics,
    loading,
    error,
    getStats,
    refreshData,
    clearData,
    exportData,
    getFilteredMetrics,
  };
}

// Hook for getting specific metric types
export function useMetricsByType(metricName: WebVitalMetric['name']) {
  const [metrics, setMetrics] = useState<WebVitalMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const typeMetrics = analyticsService.getMetricsByType(metricName);
      setMetrics(typeMetrics);
    } catch (error) {
      console.error(`Failed to load ${metricName} metrics:`, error);
    } finally {
      setLoading(false);
    }
  }, [metricName]);

  return { metrics, loading };
}

// Hook for real-time metric updates
export function useRealtimeMetrics() {
  const [latestMetric, setLatestMetric] = useState<WebVitalMetric | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);

  useEffect(() => {
    setIsCollecting(true);
    
    // Override the recordMetric method to capture latest metrics
    const originalRecordMetric = analyticsService.recordMetric.bind(analyticsService);
    analyticsService.recordMetric = async (metric) => {
      await originalRecordMetric(metric);
      setLatestMetric({
        id: metric.id,
        name: metric.name as WebVitalMetric['name'],
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        timestamp: Date.now(),
        url: window.location.href,
        navigationType: metric.navigationType,
      });
    };

    return () => {
      setIsCollecting(false);
      // Note: In a real implementation, you'd want to restore the original method
    };
  }, []);

  return {
    latestMetric,
    isCollecting,
  };
}