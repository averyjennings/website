import { Metric } from 'web-vitals';
import { track } from '@vercel/analytics';
import { supabase, testSupabaseConnection } from '@/lib/supabase';
import { 
  SupabaseVisitor, 
  SupabasePageVisit, 
  SupabaseWebVital,
  ChartDataPoint,
  VisitorStats,
  TimeRangeConfig,
  CombinedMetric,
  AnalyticsServiceConfig,
  SupabaseError
} from '@/types/supabase-analytics';
import { WebVitalMetric, PerformanceData, WebVitalThresholds } from '@/types/performance';

// Web Vitals thresholds (unchanged from original)
export const WEB_VITAL_THRESHOLDS: WebVitalThresholds = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 },
};

// Metric info (unchanged from original)
export const METRIC_INFO = {
  CLS: {
    name: 'Cumulative Layout Shift',
    description: 'Measures visual stability - how much content shifts during loading',
    unit: 'score',
    goodRange: '< 0.1',
    impact: 'User Experience',
    context: 'Lower is better. Indicates how stable the page layout is.'
  },
  FCP: {
    name: 'First Contentful Paint', 
    description: 'Time until first text/image appears on screen',
    unit: 'milliseconds',
    goodRange: '< 1.8s',
    impact: 'Perceived Loading Speed',
    context: 'How quickly users see something meaningful on the page.'
  },
  LCP: {
    name: 'Largest Contentful Paint',
    description: 'Time until main content finishes loading',
    unit: 'milliseconds', 
    goodRange: '< 2.5s',
    impact: 'Loading Performance',
    context: 'When the main content area becomes fully visible.'
  },
  TTFB: {
    name: 'Time to First Byte',
    description: 'Server response time for initial request',
    unit: 'milliseconds',
    goodRange: '< 800ms', 
    impact: 'Server Performance',
    context: 'How quickly the server starts sending data.'
  },
  INP: {
    name: 'Interaction to Next Paint',
    description: 'Responsiveness to user interactions',
    unit: 'milliseconds',
    goodRange: '< 200ms',
    impact: 'Interactivity',
    context: 'How quickly the page responds to clicks/taps.'
  }
} as const;

class SupabaseAnalyticsService {
  private static instance: SupabaseAnalyticsService;
  private sessionId: string;
  private userId: string;
  private config: AnalyticsServiceConfig;
  private isSupabaseAvailable: boolean = false;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = this.getOrCreateUserId();
    this.config = {
      enableRealTime: true,
      batchSize: 10,
      retryAttempts: 3,
      fallbackToLocalStorage: true
    };
    
    this.initializeService();
  }

  public static getInstance(): SupabaseAnalyticsService {
    if (!SupabaseAnalyticsService.instance) {
      SupabaseAnalyticsService.instance = new SupabaseAnalyticsService();
    }
    return SupabaseAnalyticsService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      this.isSupabaseAvailable = await testSupabaseConnection();
      if (this.isSupabaseAvailable) {
        console.log('🚀 Supabase Analytics Service initialized');
        await this.recordPageVisit();
      } else {
        console.warn('⚠️ Supabase unavailable, falling back to localStorage');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Supabase Analytics:', error);
      this.isSupabaseAvailable = false;
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getOrCreateUserId(): string {
    const stored = localStorage.getItem('analytics-user-id');
    if (stored) {
      return stored;
    }
    
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('analytics-user-id', userId);
    return userId;
  }

  private getTimeRangeConfig(timeRange: '1h' | '24h' | '7d' | '30d'): TimeRangeConfig {
    const now = new Date();
    const ranges = {
      '1h': { hours: 1, intervalMs: 2 * 60 * 1000 }, // 2-minute intervals
      '24h': { hours: 24, intervalMs: 30 * 60 * 1000 }, // 30-minute intervals
      '7d': { hours: 168, intervalMs: 2 * 60 * 60 * 1000 }, // 2-hour intervals
      '30d': { hours: 720, intervalMs: 6 * 60 * 60 * 1000 }, // 6-hour intervals
    };

    const config = ranges[timeRange];
    const startTime = new Date(now.getTime() - (config.hours * 60 * 60 * 1000));

    return {
      timeRange,
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      intervalMs: config.intervalMs
    };
  }

  // Visitor Management
  public async recordVisitor(): Promise<void> {
    if (!this.isSupabaseAvailable) {
      return this.fallbackToLocalStorage('recordVisitor');
    }

    try {
      const { error } = await supabase
        .from('visitors')
        .upsert({
          user_id: this.userId,
          first_visit: new Date().toISOString(),
          last_visit: new Date().toISOString(),
          visit_count: 1,
          user_agent: navigator.userAgent
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to record visitor:', error);
      this.fallbackToLocalStorage('recordVisitor');
    }
  }

  public async recordPageVisit(): Promise<void> {
    if (!this.isSupabaseAvailable) {
      return this.fallbackToLocalStorage('recordPageVisit');
    }

    try {
      // Record page visit
      const { error: visitError } = await supabase
        .from('page_visits')
        .insert({
          user_id: this.userId,
          session_id: this.sessionId,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight
        });

      if (visitError) throw visitError;

      // Update visitor record
      await this.updateVisitorLastVisit();

      // Send to Vercel Analytics (keep existing integration)
      track('page-visit', {
        userId: this.userId,
        sessionId: this.sessionId,
        url: window.location.pathname,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Failed to record page visit:', error);
      this.fallbackToLocalStorage('recordPageVisit');
    }
  }

  private async updateVisitorLastVisit(): Promise<void> {
    const { error } = await supabase
      .rpc('increment_visitor_count', {
        p_user_id: this.userId,
        p_last_visit: new Date().toISOString()
      });

    if (error) {
      // Fallback to manual update if RPC function doesn't exist yet
      await supabase
        .from('visitors')
        .update({
          last_visit: new Date().toISOString(),
          visit_count: supabase.rpc('visitors.visit_count + 1')
        })
        .eq('user_id', this.userId);
    }
  }

  // Web Vitals Integration
  public async recordMetric(metric: Metric): Promise<void> {
    const webVitalMetric: WebVitalMetric = {
      id: metric.id,
      name: metric.name as WebVitalMetric['name'],
      value: metric.value,
      rating: this.getRating(metric.name as WebVitalMetric['name'], metric.value),
      delta: metric.delta,
      timestamp: Date.now(),
      url: window.location.href,
      navigationType: (metric.navigationType as WebVitalMetric['navigationType']) || 'navigate',
    };

    if (!this.isSupabaseAvailable) {
      return this.fallbackToLocalStorage('recordMetric', webVitalMetric);
    }

    try {
      const { error } = await supabase
        .from('web_vitals')
        .insert({
          metric_id: webVitalMetric.id,
          name: webVitalMetric.name,
          value: webVitalMetric.value,
          rating: webVitalMetric.rating,
          delta: webVitalMetric.delta || 0,
          url: webVitalMetric.url,
          navigation_type: webVitalMetric.navigationType,
          user_id: this.userId,
          session_id: this.sessionId,
          timestamp: new Date(webVitalMetric.timestamp).toISOString()
        });

      if (error) throw error;

      // Keep existing Vercel Analytics integration
      this.sendToAnalytics(webVitalMetric);

    } catch (error) {
      console.error('Failed to record Web Vital:', error);
      this.fallbackToLocalStorage('recordMetric', webVitalMetric);
    }
  }

  private getRating(name: WebVitalMetric['name'], value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = WEB_VITAL_THRESHOLDS[name];
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  private sendToAnalytics(metric: WebVitalMetric): void {
    // Keep existing analytics integrations
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        custom_parameter_1: metric.rating,
        non_interaction: true,
      });
    }

    try {
      track(`web-vital-${metric.name.toLowerCase()}`, {
        value: metric.value.toString(),
        rating: metric.rating,
        delta: metric.delta?.toString() || '0',
        url: metric.url,
        navigationType: metric.navigationType,
        timestamp: new Date(metric.timestamp).toISOString(),
      });
    } catch (error) {
      console.warn('Failed to send metric to Vercel Analytics:', error);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`Web Vital - ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        url: metric.url,
        supabaseTracked: this.isSupabaseAvailable,
      });
    }
  }

  // Data Retrieval Methods
  public async getVisitorStats(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<VisitorStats> {
    if (!this.isSupabaseAvailable) {
      return this.fallbackToLocalStorage('getVisitorStats', timeRange);
    }

    try {
      const config = this.getTimeRangeConfig(timeRange);
      
      // Get unique visitors in time range
      const { data: visitorsData, error: visitorsError } = await supabase
        .from('visitors')
        .select('*')
        .gte('first_visit', config.startTime)
        .lte('first_visit', config.endTime);

      if (visitorsError) throw visitorsError;

      // Get page visits in time range
      const { data: visitsData, error: visitsError } = await supabase
        .from('page_visits')
        .select('*')
        .gte('timestamp', config.startTime)
        .lte('timestamp', config.endTime);

      if (visitsError) throw visitsError;

      // Calculate 24h and 7d metrics for backward compatibility
      const last24h = this.getTimeRangeConfig('24h');
      const lastWeek = this.getTimeRangeConfig('7d');

      const { count: count24h } = await supabase
        .from('web_vitals')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', last24h.startTime);

      const { count: countWeek } = await supabase
        .from('web_vitals')  
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', lastWeek.startTime);

      return {
        uniqueVisitors: visitorsData?.length || 0,
        totalPageVisits: visitsData?.length || 0,
        last24Hours: count24h || 0,
        lastWeek: countWeek || 0,
        sessionId: this.sessionId,
        lastUpdated: Date.now()
      };

    } catch (error) {
      console.error('Failed to get visitor stats:', error);
      return this.fallbackToLocalStorage('getVisitorStats', timeRange);
    }
  }

  public async getPageVisitsOverTime(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<ChartDataPoint[]> {
    if (!this.isSupabaseAvailable) {
      return this.fallbackToLocalStorage('getPageVisitsOverTime', timeRange);
    }

    try {
      const config = this.getTimeRangeConfig(timeRange);
      
      const { data, error } = await supabase
        .rpc('get_page_visits_time_series', {
          start_time: config.startTime,
          end_time: config.endTime,
          interval_minutes: Math.floor(config.intervalMs / (60 * 1000))
        });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        timestamp: new Date(item.time_bucket).getTime(),
        value: parseInt(item.count),
        name: 'Page Visits' as const
      }));

    } catch (error) {
      console.error('Failed to get page visits over time:', error);
      return this.fallbackToLocalStorage('getPageVisitsOverTime', timeRange);
    }
  }

  public async getUniqueVisitorsOverTime(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<ChartDataPoint[]> {
    if (!this.isSupabaseAvailable) {
      return this.fallbackToLocalStorage('getUniqueVisitorsOverTime', timeRange);
    }

    try {
      const config = this.getTimeRangeConfig(timeRange);
      
      const { data, error } = await supabase
        .rpc('get_unique_visitors_time_series', {
          start_time: config.startTime,
          end_time: config.endTime,
          interval_minutes: Math.floor(config.intervalMs / (60 * 1000))
        });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        timestamp: new Date(item.time_bucket).getTime(),
        value: parseInt(item.count),
        name: 'Unique Visitors' as const
      }));

    } catch (error) {
      console.error('Failed to get unique visitors over time:', error);
      return this.fallbackToLocalStorage('getUniqueVisitorsOverTime', timeRange);
    }
  }

  public async getAllMetricsWithVisitorData(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<CombinedMetric[]> {
    if (!this.isSupabaseAvailable) {
      return this.fallbackToLocalStorage('getAllMetricsWithVisitorData', timeRange);
    }

    try {
      const [webVitals, pageVisits, uniqueVisitors] = await Promise.all([
        this.getWebVitalsMetrics(timeRange),
        this.getPageVisitsOverTime(timeRange),
        this.getUniqueVisitorsOverTime(timeRange)
      ]);

      // Convert to combined format
      const combined: CombinedMetric[] = [
        // Web Vitals metrics
        ...webVitals.map(metric => ({
          id: metric.id,
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta || 0,
          timestamp: metric.timestamp,
          url: metric.url,
          navigationType: metric.navigationType
        })),
        // Page visits
        ...pageVisits.map(pv => ({
          id: `pv-${pv.timestamp}`,
          name: 'Page Visits' as const,
          value: pv.value,
          rating: 'good' as const,
          delta: 0,
          timestamp: pv.timestamp,
          url: window.location.href,
          navigationType: 'navigate' as const
        })),
        // Unique visitors
        ...uniqueVisitors.map(uv => ({
          id: `uv-${uv.timestamp}`,
          name: 'Unique Visitors' as const,
          value: uv.value,
          rating: 'good' as const,
          delta: 0,
          timestamp: uv.timestamp,
          url: window.location.href,
          navigationType: 'navigate' as const
        }))
      ];

      return combined.sort((a, b) => a.timestamp - b.timestamp);

    } catch (error) {
      console.error('Failed to get combined metrics:', error);
      return this.fallbackToLocalStorage('getAllMetricsWithVisitorData', timeRange);
    }
  }

  private async getWebVitalsMetrics(timeRange: '1h' | '24h' | '7d' | '30d'): Promise<WebVitalMetric[]> {
    const config = this.getTimeRangeConfig(timeRange);
    
    const { data, error } = await supabase
      .from('web_vitals')
      .select('*')
      .gte('timestamp', config.startTime)
      .lte('timestamp', config.endTime)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.metric_id,
      name: item.name,
      value: item.value,
      rating: item.rating,
      delta: item.delta,
      timestamp: new Date(item.timestamp).getTime(),
      url: item.url,
      navigationType: item.navigation_type
    }));
  }

  // Fallback methods for localStorage compatibility
  private fallbackToLocalStorage(method: string, ...args: any[]): any {
    if (!this.config.fallbackToLocalStorage) {
      console.warn(`Supabase unavailable and fallback disabled for ${method}`);
      return this.getEmptyResponse(method);
    }

    console.warn(`Falling back to localStorage for ${method}`);
    
    // Import and use the original analytics service for fallback
    // This will be implemented to maintain compatibility during migration
    return this.getEmptyResponse(method);
  }

  private getEmptyResponse(method: string): any {
    switch (method) {
      case 'getVisitorStats':
        return {
          uniqueVisitors: 0,
          totalPageVisits: 0,
          last24Hours: 0,
          lastWeek: 0,
          sessionId: this.sessionId,
          lastUpdated: Date.now()
        };
      case 'getPageVisitsOverTime':
      case 'getUniqueVisitorsOverTime':
        return [];
      case 'getAllMetricsWithVisitorData':
        return [];
      default:
        return null;
    }
  }

  // Public methods for backward compatibility
  public getPerformanceStats(timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
    return this.getVisitorStats(timeRange);
  }

  public recordManualPageVisit(): void {
    this.recordPageVisit();
  }

  // Export functionality (maintained from original)
  public exportData(format: 'json' | 'csv' = 'json'): string {
    // Implementation will depend on whether we're using Supabase or localStorage
    // For now, return empty data structure
    const emptyData = {
      metrics: [],
      lastUpdated: Date.now(),
      sessionId: this.sessionId,
    };

    if (format === 'csv') {
      const headers = ['timestamp', 'name', 'value', 'rating', 'delta', 'url', 'navigationType'];
      const csvRows = [headers.join(',')];
      return csvRows.join('\n');
    }

    return JSON.stringify(emptyData, null, 2);
  }
}

// Export singleton instance
export const supabaseAnalyticsService = SupabaseAnalyticsService.getInstance();

// Global gtag type declaration
declare global {
  function gtag(...args: any[]): void;
}