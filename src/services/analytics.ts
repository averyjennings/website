import { Metric } from 'web-vitals';
import { track } from '@vercel/analytics';
import { WebVitalMetric, PerformanceData, WebVitalThresholds } from '@/types/performance';

// Web Vitals thresholds based on Google's recommendations
export const WEB_VITAL_THRESHOLDS: WebVitalThresholds = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 },
};

// Metric descriptions and context for better UX
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

class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionId: string;
  private userId: string;
  private storageKey = 'web-vitals-metrics';
  private visitorStorageKey = 'analytics-visitors';
  private maxStorageEntries = 1000;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = this.getOrCreateUserId();
    this.recordPageVisit();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
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

  private recordPageVisit(): void {
    try {
      const visitData = {
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      // Record page visit for total count
      const pageVisits = JSON.parse(localStorage.getItem('analytics-page-visits') || '[]');
      pageVisits.push(visitData);
      localStorage.setItem('analytics-page-visits', JSON.stringify(pageVisits));

      // Record unique visitor
      const visitors = JSON.parse(localStorage.getItem(this.visitorStorageKey) || '[]');
      const existingVisitor = visitors.find((v: any) => v.userId === this.userId);
      
      if (!existingVisitor) {
        visitors.push({
          userId: this.userId,
          firstVisit: Date.now(),
          lastVisit: Date.now(),
          visitCount: 1,
        });
      } else {
        existingVisitor.lastVisit = Date.now();
        existingVisitor.visitCount += 1;
      }
      
      localStorage.setItem(this.visitorStorageKey, JSON.stringify(visitors));

      // Send to Vercel Analytics
      track('page-visit', {
        userId: this.userId,
        sessionId: this.sessionId,
        url: window.location.pathname,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Failed to record page visit:', error);
    }
  }

  public recordManualPageVisit(): void {
    this.recordPageVisit();
  }

  public getVisitorStats() {
    try {
      const visitors = JSON.parse(localStorage.getItem(this.visitorStorageKey) || '[]');
      const pageVisits = JSON.parse(localStorage.getItem('analytics-page-visits') || '[]');
      
      return {
        uniqueVisitors: visitors.length,
        totalPageVisits: pageVisits.length,
        currentUserId: this.userId,
        currentSessionId: this.sessionId,
      };
    } catch (error) {
      console.warn('Failed to get visitor stats:', error);
      return {
        uniqueVisitors: 0,
        totalPageVisits: 0,
        currentUserId: this.userId,
        currentSessionId: this.sessionId,
      };
    }
  }

  private getRating(name: WebVitalMetric['name'], value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = WEB_VITAL_THRESHOLDS[name];
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  public recordMetric(metric: Metric): void {
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

    this.storeMetric(webVitalMetric);
    this.sendToAnalytics(webVitalMetric);
  }

  private storeMetric(metric: WebVitalMetric): void {
    try {
      const existingData = this.getStoredData();
      existingData.metrics.push(metric);
      existingData.lastUpdated = Date.now();

      // Limit storage size by removing oldest entries
      if (existingData.metrics.length > this.maxStorageEntries) {
        existingData.metrics = existingData.metrics
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, this.maxStorageEntries);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(existingData));
    } catch (error) {
      console.warn('Failed to store Web Vitals metric:', error);
    }
  }

  public getStoredData(): PerformanceData {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as PerformanceData;
        return {
          metrics: parsed.metrics || [],
          lastUpdated: parsed.lastUpdated || Date.now(),
          sessionId: parsed.sessionId || this.sessionId,
        };
      }
    } catch (error) {
      console.warn('Failed to parse stored Web Vitals data:', error);
    }

    return {
      metrics: [],
      lastUpdated: Date.now(),
      sessionId: this.sessionId,
    };
  }

  public getMetricsByType(metricName: WebVitalMetric['name']): WebVitalMetric[] {
    return this.getStoredData().metrics.filter(metric => metric.name === metricName);
  }

  public getMetricsByDateRange(startDate: Date, endDate: Date): WebVitalMetric[] {
    return this.getStoredData().metrics.filter(
      metric => metric.timestamp >= startDate.getTime() && metric.timestamp <= endDate.getTime()
    );
  }

  public clearStoredData(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear stored Web Vitals data:', error);
    }
  }

  private sendToAnalytics(metric: WebVitalMetric): void {
    // Send to Google Analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        custom_parameter_1: metric.rating,
        non_interaction: true,
      });
    }

    // Send to Vercel Analytics for long-term storage
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

    // Send to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Web Vital - ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        url: metric.url,
        vercelTracked: true,
      });
    }
  }

  public exportData(format: 'json' | 'csv' = 'json'): string {
    const data = this.getStoredData();
    
    if (format === 'csv') {
      const headers = ['timestamp', 'name', 'value', 'rating', 'delta', 'url', 'navigationType'];
      const csvRows = [
        headers.join(','),
        ...data.metrics.map(metric => [
          new Date(metric.timestamp).toISOString(),
          metric.name,
          metric.value,
          metric.rating,
          metric.delta,
          `"${metric.url}"`,
          metric.navigationType,
        ].join(','))
      ];
      return csvRows.join('\n');
    }

    return JSON.stringify(data, null, 2);
  }

  public getPerformanceStats() {
    const data = this.getStoredData();
    const visitorStats = this.getVisitorStats();
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const lastWeek = now - (7 * 24 * 60 * 60 * 1000);

    return {
      uniqueVisitors: visitorStats.uniqueVisitors,
      totalPageVisits: visitorStats.totalPageVisits,
      last24Hours: data.metrics.filter(m => m.timestamp >= last24Hours).length,
      lastWeek: data.metrics.filter(m => m.timestamp >= lastWeek).length,
      sessionId: data.sessionId,
      lastUpdated: data.lastUpdated,
    };
  }

  // Get aggregated statistics for each metric type
  public getMetricStats(metricName: WebVitalMetric['name'], timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
    const data = this.getStoredData();
    const now = Date.now();
    const ranges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    
    const cutoff = now - ranges[timeRange];
    const metrics = data.metrics
      .filter(m => m.name === metricName && m.timestamp >= cutoff)
      .map(m => m.value)
      .sort((a, b) => a - b);

    if (metrics.length === 0) {
      return {
        count: 0,
        average: 0,
        median: 0,
        p75: 0,
        p90: 0,
        min: 0,
        max: 0,
        latest: 0,
        trend: 'stable' as const,
      };
    }

    const count = metrics.length;
    const average = metrics.reduce((sum, val) => sum + val, 0) / count;
    const median = metrics[Math.floor(count / 2)];
    const p75 = metrics[Math.floor(count * 0.75)];
    const p90 = metrics[Math.floor(count * 0.90)];
    const min = metrics[0];
    const max = metrics[count - 1];
    
    // Get latest value for trend calculation
    const recentMetrics = data.metrics
      .filter(m => m.name === metricName)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
    
    const latest = recentMetrics[0]?.value || 0;
    const trend = this.calculateTrend(recentMetrics.map(m => m.value));

    return {
      count,
      average: Math.round(average * 100) / 100,
      median: Math.round(median * 100) / 100,
      p75: Math.round(p75 * 100) / 100,
      p90: Math.round(p90 * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      latest: Math.round(latest * 100) / 100,
      trend,
    };
  }

  private calculateTrend(values: number[]): 'improving' | 'stable' | 'degrading' {
    if (values.length < 3) return 'stable';
    
    const recent = values.slice(0, Math.floor(values.length / 2));
    const older = values.slice(Math.floor(values.length / 2));
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (changePercent < -5) return 'improving'; // Lower is better for most metrics
    if (changePercent > 5) return 'degrading';
    return 'stable';
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
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();

// Global gtag type declaration
declare global {
  function gtag(...args: any[]): void;
}