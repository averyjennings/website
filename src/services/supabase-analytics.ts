import { Metric } from 'web-vitals';
import { track } from '@vercel/analytics';
import { supabase, testSupabaseConnection } from '@/lib/supabase';
import { 
  ChartDataPoint,
  VisitorStats,
  TimeRangeConfig,
  CombinedMetric,
  AnalyticsServiceConfig
} from '@/types/supabase-analytics';
import { WebVitalMetric, PerformanceData, WebVitalThresholds } from '@/types/performance';
import { METRIC_INFO } from '@/services/analytics';

// Web Vitals thresholds (unchanged from original)
export const WEB_VITAL_THRESHOLDS: WebVitalThresholds = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 },
};


class SupabaseAnalyticsService {
  private static instance: SupabaseAnalyticsService;
  private sessionId: string;
  private userId: string;
  private config: AnalyticsServiceConfig;
  private isSupabaseAvailable: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    console.log('🏗️ SupabaseAnalyticsService constructor called');
    this.sessionId = this.generateSessionId();
    this.userId = this.getOrCreateUserId();
    this.config = {
      enableRealTime: true,
      batchSize: 10,
      retryAttempts: 3,
      fallbackToLocalStorage: true
    };
    
    console.log('🆔 Service initialized with user_id:', this.userId, 'session_id:', this.sessionId);
    
    // Start initialization but don't await it in constructor
    this.initializationPromise = this.initializeService();
  }

  public static getInstance(): SupabaseAnalyticsService {
    if (!SupabaseAnalyticsService.instance) {
      console.log('🔄 Creating new SupabaseAnalyticsService singleton instance');
      SupabaseAnalyticsService.instance = new SupabaseAnalyticsService();
    } else {
      console.log('♻️ Returning existing SupabaseAnalyticsService singleton instance');
    }
    return SupabaseAnalyticsService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      this.isSupabaseAvailable = await testSupabaseConnection();
      if (this.isSupabaseAvailable) {
        console.log('🚀 Supabase Analytics Service initialized');
        // First ensure visitor record exists
        await this.recordVisitor();
        console.log('✅ Analytics initialization complete with valid user_id:', this.userId);
        // Note: Page visits will be recorded when they actually happen, not during initialization
      } else {
        console.warn('⚠️ Supabase unavailable, falling back to localStorage');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Supabase Analytics:', error);
      this.isSupabaseAvailable = false;
    } finally {
      // Clear the initialization promise to indicate completion
      this.initializationPromise = null;
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getOrCreateUserId(): string {
    const stored = localStorage.getItem('analytics-user-id');
    if (stored) {
      console.log('🆔 Using existing user ID:', stored);
      return stored;
    }
    
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('analytics-user-id', userId);
    console.log('🆔 Created new user ID:', userId);
    return userId;
  }

  // Public getters for heatmap integration
  public getUserId(): string {
    return this.userId;
  }

  public getSessionId(): string {
    return this.sessionId;
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
    // Wait for initialization to complete if it's still in progress
    if (this.initializationPromise) {
      await this.initializationPromise;
    }

    if (!this.isSupabaseAvailable) {
      return this.fallbackToLocalStorage('recordPageVisit');
    }

    // Ensure we have a valid user ID before recording
    if (!this.userId) {
      console.warn('⚠️ Cannot record page visit: user ID not available after initialization');
      return;
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

      // Log successful page visit recording for debugging
      console.log(`✅ Page visit recorded: user_id=${this.userId}, url=${window.location.pathname}`);

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
    try {
      // First, get the current visitor record
      const { data: visitor, error: fetchError } = await supabase
        .from('visitors')
        .select('visit_count')
        .eq('user_id', this.userId)
        .single();

      if (fetchError) {
        // If visitor record doesn't exist, create it
        if (fetchError.code === 'PGRST116') {
          await this.recordVisitor();
          return;
        }
        console.error('Failed to fetch visitor record:', fetchError);
        return;
      }

      // Update the visitor record with incremented visit count
      const { error: updateError } = await supabase
        .from('visitors')
        .update({
          last_visit: new Date().toISOString(),
          visit_count: (visitor?.visit_count || 0) + 1
        })
        .eq('user_id', this.userId);

      if (updateError) {
        console.error('Failed to update visitor record:', updateError);
      }
    } catch (error) {
      console.error('Error updating visitor last visit:', error);
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
    // Wait for initialization to complete with timeout
    if (this.initializationPromise) {
      try {
        await Promise.race([
          this.initializationPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Initialization timeout')), 5000))
        ]);
        console.log('📊 Service initialization completed for getVisitorStats');
      } catch (error) {
        console.warn('⚠️ Service initialization timed out or failed, continuing anyway:', error);
      }
    }
    
    // Always try Supabase first
    try {
      console.log(`📊 Starting Supabase query for visitor stats (${timeRange})`);
      const config = this.getTimeRangeConfig(timeRange);
      console.log(`📊 Time range config:`, config);
      
      // Get page visits in time range with distinct user_ids
      const { data: visitsData, error: visitsError } = await supabase
        .from('page_visits')
        .select('*')
        .gte('timestamp', config.startTime)
        .lte('timestamp', config.endTime);

      if (visitsError) throw visitsError;

      // Count unique visitors from page visits in the filtered time range
      const uniqueUserIds = new Set((visitsData || []).map(visit => visit.user_id).filter(Boolean));
      const uniqueVisitors = uniqueUserIds.size;
      const totalPageVisits = (visitsData || []).length;
      
      // Enhanced debug logging for production issues
      if (process.env.NODE_ENV === 'development' || timeRange === '1h') {
        console.log(`📊 Analytics Debug - ${timeRange}:`, {
          totalRecords: visitsData?.length || 0,
          uniqueUserIds: Array.from(uniqueUserIds),
          uniqueCount: uniqueVisitors,
          timeRange: `${config.startTime} to ${config.endTime}`,
          rawUserIds: (visitsData || []).map(v => v.user_id),
          nullUserIds: (visitsData || []).filter(v => !v.user_id).length,
          undefinedUserIds: (visitsData || []).filter(v => v.user_id === undefined).length,
          emptyStringUserIds: (visitsData || []).filter(v => v.user_id === '').length,
          currentServiceUserId: this.userId,
          isInitialized: !this.initializationPromise,
          sampleRecords: (visitsData || []).slice(0, 5).map(v => ({
            user_id: v.user_id,
            user_id_type: typeof v.user_id,
            timestamp: v.timestamp,
            url: v.url
          }))
        });
      }

      // Additional error logging for debugging
      if (timeRange === '1h' && uniqueVisitors === 0 && totalPageVisits > 0) {
        console.error(`🚨 RACE CONDITION BUG: ${totalPageVisits} page visits but 0 unique visitors for 1h range`, {
          config,
          currentServiceUserId: this.userId,
          serviceInitialized: !this.initializationPromise,
          problematicRecords: (visitsData || []).map(v => ({
            user_id: v.user_id,
            user_id_type: typeof v.user_id,
            user_id_length: v.user_id ? v.user_id.length : 0,
            timestamp: v.timestamp,
            url: v.url,
            session_id: v.session_id
          })),
          currentTime: new Date().toISOString(),
          userIdValidation: {
            hasUserId: !!this.userId,
            userIdType: typeof this.userId,
            userIdLength: this.userId ? this.userId.length : 0
          }
        });
      }

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
        uniqueVisitors: uniqueVisitors,
        totalPageVisits: totalPageVisits,
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
    try {
      const config = this.getTimeRangeConfig(timeRange);
      
      // Get page visits data
      const { data, error } = await supabase
        .from('page_visits')
        .select('timestamp')
        .gte('timestamp', config.startTime)
        .lte('timestamp', config.endTime)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Group by time intervals
      const intervals = new Map<number, number>();
      const intervalMs = config.intervalMs;
      
      (data || []).forEach((visit: any) => {
        const timestamp = new Date(visit.timestamp).getTime();
        const intervalStart = Math.floor(timestamp / intervalMs) * intervalMs;
        intervals.set(intervalStart, (intervals.get(intervalStart) || 0) + 1);
      });

      // Convert to chart data points
      return Array.from(intervals.entries())
        .map(([timestamp, count]) => ({
          timestamp,
          value: count,
          name: 'Page Visits' as const
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

    } catch (error) {
      console.error('Failed to get page visits over time:', error);
      return this.fallbackToLocalStorage('getPageVisitsOverTime', timeRange);
    }
  }

  public async getUniqueVisitorsOverTime(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<ChartDataPoint[]> {
    try {
      const config = this.getTimeRangeConfig(timeRange);
      
      // Get unique visitors grouped by time intervals
      const { data, error } = await supabase
        .from('page_visits')
        .select('user_id, timestamp')
        .gte('timestamp', config.startTime)
        .lte('timestamp', config.endTime)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Group by time intervals and count unique users
      const intervals = new Map<number, Set<string>>();
      const intervalMs = config.intervalMs;
      
      (data || []).forEach((visit: any) => {
        const timestamp = new Date(visit.timestamp).getTime();
        const intervalStart = Math.floor(timestamp / intervalMs) * intervalMs;
        
        if (!intervals.has(intervalStart)) {
          intervals.set(intervalStart, new Set());
        }
        intervals.get(intervalStart)!.add(visit.user_id);
      });

      // Convert to chart data points
      return Array.from(intervals.entries())
        .map(([timestamp, userSet]) => ({
          timestamp,
          value: userSet.size,
          name: 'Unique Visitors' as const
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

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

  private get storageKey(): string {
    return 'web-vitals-metrics';
  }

  // Get stored data from localStorage
  public getStoredData(): PerformanceData & { pageVisits?: any[]; visitors?: any[] } {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const pageVisits = JSON.parse(localStorage.getItem('analytics-page-visits') || '[]');
      const visitors = JSON.parse(localStorage.getItem('analytics-visitors') || '[]');
      
      if (stored) {
        const parsed = JSON.parse(stored) as PerformanceData;
        return {
          metrics: parsed.metrics || [],
          lastUpdated: parsed.lastUpdated || Date.now(),
          sessionId: parsed.sessionId || this.sessionId,
          pageVisits,
          visitors,
        };
      }
    } catch (error) {
      console.error('Failed to parse stored data:', error);
    }

    return {
      metrics: [],
      lastUpdated: Date.now(),
      sessionId: this.sessionId,
      pageVisits: [],
      visitors: [],
    };
  }

  // Clear stored data
  public clearStoredData(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem('analytics-page-visits');
    localStorage.removeItem('analytics-visitors');
  }

  // Get metrics by type
  public getMetricsByType(metricName: WebVitalMetric['name']): WebVitalMetric[] {
    const data = this.getStoredData();
    return data.metrics.filter(metric => metric.name === metricName);
  }

  // Get performance scores and grades
  public getPerformanceGrade(): {
    overall: 'A' | 'B' | 'C' | 'D' | 'F';
    scores: Record<WebVitalMetric['name'], number>;
    recommendations: string[];
  } {
    const data = this.getStoredData();
    const recent = data.metrics.filter(m => m.timestamp > Date.now() - (24 * 60 * 60 * 1000));
    
    const scores: Record<WebVitalMetric['name'], number> = {
      CLS: 0,
      FCP: 0, 
      LCP: 0,
      TTFB: 0,
      INP: 0,
    };

    const recommendations: string[] = [];

    // Calculate scores for each metric (0-100 scale)
    Object.keys(scores).forEach(metricName => {
      const name = metricName as WebVitalMetric['name'];
      const metricData = recent.filter(m => m.name === name);
      
      if (metricData.length === 0) {
        scores[name] = 0;
        return;
      }

      const goodCount = metricData.filter(m => m.rating === 'good').length;
      const needsImprovementCount = metricData.filter(m => m.rating === 'needs-improvement').length;
      
      // Score based on rating distribution
      scores[name] = Math.round(
        (goodCount / metricData.length) * 100 + 
        (needsImprovementCount / metricData.length) * 50
      );

      // Add recommendations for poor performing metrics
      if (scores[name] < 70) {
        const info = METRIC_INFO[name];
        recommendations.push(`Improve ${info.name}: ${info.context}`);
      }
    });

    // Calculate overall grade
    const averageScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / 5;
    let overall: 'A' | 'B' | 'C' | 'D' | 'F';
    
    if (averageScore >= 90) overall = 'A';
    else if (averageScore >= 80) overall = 'B';
    else if (averageScore >= 70) overall = 'C';
    else if (averageScore >= 60) overall = 'D';
    else overall = 'F';

    return { overall, scores, recommendations };
  }

  // Get metric stats
  public getMetricStats(metricName: WebVitalMetric['name'], timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): {
    latest: number;
    average: number;
    percentile95: number;
    count: number;
    trend: 'improving' | 'degrading' | 'stable';
  } {
    const data = this.getStoredData();
    const config = this.getTimeRangeConfig(timeRange);
    const startTime = new Date(config.startTime).getTime();
    const endTime = new Date(config.endTime).getTime();
    const metricData = data.metrics
      .filter(m => m.name === metricName && m.timestamp >= startTime && m.timestamp <= endTime)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    if (metricData.length === 0) {
      return { latest: 0, average: 0, percentile95: 0, count: 0, trend: 'stable' };
    }

    const values = metricData.map(m => m.value);
    const latest = metricData[metricData.length - 1].value;
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Calculate 95th percentile
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.95) - 1;
    const percentile95 = sorted[index] || sorted[sorted.length - 1];
    
    // Determine trend
    let trend: 'improving' | 'degrading' | 'stable' = 'stable';
    if (metricData.length >= 3) {
      const recentAvg = metricData.slice(-3).reduce((sum, m) => sum + m.value, 0) / 3;
      const olderAvg = metricData.slice(0, 3).reduce((sum, m) => sum + m.value, 0) / 3;
      
      if (metricName === 'CLS') {
        // Lower is better for CLS
        if (recentAvg < olderAvg * 0.9) trend = 'improving';
        else if (recentAvg > olderAvg * 1.1) trend = 'degrading';
      } else {
        // Lower is better for all time-based metrics
        if (recentAvg < olderAvg * 0.9) trend = 'improving';
        else if (recentAvg > olderAvg * 1.1) trend = 'degrading';
      }
    }

    return { 
      latest: Math.round(latest), 
      average: Math.round(average), 
      percentile95: Math.round(percentile95), 
      count: metricData.length, 
      trend 
    };
  }

  // Make synchronous versions of async methods for backward compatibility
  public getPageVisitsOverTimeSync(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): ChartDataPoint[] {
    // Use local storage data for synchronous access
    const data = this.getStoredData();
    const config = this.getTimeRangeConfig(timeRange);
    
    const pageVisits = data.pageVisits?.filter(pv => 
      pv.timestamp >= config.startTime && pv.timestamp <= config.endTime
    ) || [];

    return pageVisits.map(pv => ({
      timestamp: pv.timestamp,
      value: 1,
      name: 'Page Visits' as const
    }));
  }

  public getUniqueVisitorsOverTimeSync(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): ChartDataPoint[] {
    // Use local storage data for synchronous access
    const data = this.getStoredData();
    const config = this.getTimeRangeConfig(timeRange);
    
    const visitors = data.visitors?.filter(v => 
      v.timestamp >= config.startTime && v.timestamp <= config.endTime
    ) || [];

    const uniqueVisitorsByInterval = new Map<string, Set<string>>();
    visitors.forEach(v => {
      const interval = Math.floor(v.timestamp / config.intervalMs) * config.intervalMs;
      if (!uniqueVisitorsByInterval.has(interval.toString())) {
        uniqueVisitorsByInterval.set(interval.toString(), new Set());
      }
      uniqueVisitorsByInterval.get(interval.toString())!.add(v.userId);
    });

    return Array.from(uniqueVisitorsByInterval.entries()).map(([interval, userIds]) => ({
      timestamp: parseInt(interval),
      value: userIds.size,
      name: 'Unique Visitors' as const
    }));
  }

  public getAllMetricsWithVisitorDataSync(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): CombinedMetric[] {
    const data = this.getStoredData();
    const config = this.getTimeRangeConfig(timeRange);
    const startTime = new Date(config.startTime).getTime();
    const endTime = new Date(config.endTime).getTime();
    
    const metrics = data.metrics
      .filter(m => m.timestamp >= startTime && m.timestamp <= endTime)
      .map(m => ({ ...m, type: 'metric' as const }));
    
    const pageVisitData = this.getPageVisitsOverTimeSync(timeRange);
    const pageVisits = pageVisitData.map(pv => ({
      id: `pv-${pv.timestamp}`,
      name: 'Page Visits' as any,
      value: pv.value,
      rating: 'good' as const,
      delta: 0,
      timestamp: pv.timestamp,
      url: window.location.href,
      navigationType: 'navigate' as const,
      type: 'visitor' as const
    }));

    const visitorData = this.getUniqueVisitorsOverTimeSync(timeRange);
    const uniqueVisitors = visitorData.map(uv => ({
      id: `uv-${uv.timestamp}`,
      name: 'Unique Visitors' as any,
      value: uv.value,
      rating: 'good' as const,
      delta: 0,
      timestamp: uv.timestamp,
      url: window.location.href,
      navigationType: 'navigate' as const,
      type: 'visitor' as const
    }));

    return [...metrics, ...pageVisits, ...uniqueVisitors].sort((a, b) => a.timestamp - b.timestamp);
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
    
    switch (method) {
      case 'recordVisitor':
        return this.recordVisitorLocalStorage();
      case 'recordPageVisit':
        return this.recordPageVisitLocalStorage();
      case 'getVisitorStats':
        return this.getVisitorStatsLocalStorage(args[0] || '24h');
      case 'recordMetric':
        return this.recordMetricLocalStorage(args[0]);
      default:
        return this.getEmptyResponse(method);
    }
  }

  private recordVisitorLocalStorage(): void {
    try {
      const visitors = JSON.parse(localStorage.getItem('analytics-visitors') || '{}');
      const now = new Date().toISOString();
      
      if (!visitors[this.userId]) {
        visitors[this.userId] = {
          user_id: this.userId,
          first_visit: now,
          last_visit: now,
          visit_count: 1,
          user_agent: navigator.userAgent
        };
      } else {
        visitors[this.userId].last_visit = now;
        visitors[this.userId].visit_count += 1;
      }
      
      localStorage.setItem('analytics-visitors', JSON.stringify(visitors));
      console.log('📦 Visitor recorded in localStorage');
    } catch (error) {
      console.error('Failed to record visitor in localStorage:', error);
    }
  }

  private recordPageVisitLocalStorage(): void {
    try {
      const visits = JSON.parse(localStorage.getItem('analytics-page-visits') || '[]');
      const visit = {
        user_id: this.userId,
        session_id: this.sessionId,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight
      };
      
      visits.push(visit);
      
      // Keep only last 1000 visits to prevent localStorage bloat
      if (visits.length > 1000) {
        visits.splice(0, visits.length - 1000);
      }
      
      localStorage.setItem('analytics-page-visits', JSON.stringify(visits));
      console.log('📦 Page visit recorded in localStorage');
    } catch (error) {
      console.error('Failed to record page visit in localStorage:', error);
    }
  }

  private getVisitorStatsLocalStorage(timeRange: '1h' | '24h' | '7d' | '30d'): VisitorStats {
    try {
      const visits = JSON.parse(localStorage.getItem('analytics-page-visits') || '[]');
      const config = this.getTimeRangeConfig(timeRange);
      
      // Filter visits by time range
      const filteredVisits = visits.filter((visit: any) => {
        const visitTime = new Date(visit.timestamp).getTime();
        const startTime = new Date(config.startTime).getTime();
        const endTime = new Date(config.endTime).getTime();
        return visitTime >= startTime && visitTime <= endTime;
      });
      
      // Count unique visitors
      const uniqueUserIds = new Set(filteredVisits.map((visit: any) => visit.user_id).filter(Boolean));
      
      return {
        uniqueVisitors: uniqueUserIds.size,
        totalPageVisits: filteredVisits.length,
        last24Hours: 0, // Simplified for localStorage fallback
        lastWeek: 0,    // Simplified for localStorage fallback
        sessionId: this.sessionId,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Failed to get visitor stats from localStorage:', error);
      return this.getEmptyResponse('getVisitorStats');
    }
  }

  private recordMetricLocalStorage(metric: any): void {
    try {
      const metrics = JSON.parse(localStorage.getItem('analytics-web-vitals') || '[]');
      metrics.push({
        ...metric,
        user_id: this.userId,
        session_id: this.sessionId,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 500 metrics
      if (metrics.length > 500) {
        metrics.splice(0, metrics.length - 500);
      }
      
      localStorage.setItem('analytics-web-vitals', JSON.stringify(metrics));
      console.log('📦 Metric recorded in localStorage');
    } catch (error) {
      console.error('Failed to record metric in localStorage:', error);
    }
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
    // Return cached stats synchronously, then update async in background
    const cachedStats = this.getCachedStats(timeRange);
    
    // Update stats in background
    this.getVisitorStats(timeRange).then(stats => {
      this.cachedStats.set(timeRange, stats);
    });
    
    return cachedStats;
  }
  
  private cachedStats = new Map<string, VisitorStats>();
  
  private getCachedStats(timeRange: '1h' | '24h' | '7d' | '30d'): VisitorStats {
    // Return cached stats if available
    if (this.cachedStats.has(timeRange)) {
      return this.cachedStats.get(timeRange)!;
    }
    
    // Return default stats while loading
    return {
      uniqueVisitors: 0,
      totalPageVisits: 0,
      last24Hours: 0,
      lastWeek: 0,
      sessionId: this.sessionId,
      lastUpdated: Date.now()
    };
  }

  public async recordManualPageVisit(): Promise<void> {
    try {
      await this.recordPageVisit();
    } catch (error) {
      console.error('Failed to record manual page visit:', error);
    }
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

// Export for direct access when needed
export const { getVisitorStats } = supabaseAnalyticsService;

// Global declarations
declare global {
  function gtag(...args: any[]): void;
  interface Window {
    supabaseAnalyticsService: SupabaseAnalyticsService;
  }
}