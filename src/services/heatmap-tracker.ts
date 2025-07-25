import { supabase } from '@/lib/supabase';

export interface HeatmapDataPoint {
  id?: string;
  x: number;
  y: number;
  elementType: string;
  elementClass?: string;
  elementId?: string;
  elementText?: string;
  pageUrl: string;
  timestamp: string;
  viewportWidth: number;
  viewportHeight: number;
  userId: string;
  sessionId: string;
  eventType: 'click' | 'scroll' | 'hover' | 'focus';
}

export interface HeatmapConfig {
  enabled: boolean;
  trackClicks: boolean;
  trackScrolls: boolean;
  trackHovers: boolean;
  throttleMs: number;
  maxDataPoints: number;
}

class HeatmapTracker {
  private static instance: HeatmapTracker;
  private config: HeatmapConfig;
  private isTracking: boolean = false;
  private dataBuffer: HeatmapDataPoint[] = [];
  private throttleTimers: Map<string, number> = new Map();
  private userId: string = '';
  private sessionId: string = '';

  private constructor() {
    this.config = {
      enabled: false,
      trackClicks: true,
      trackScrolls: true,
      trackHovers: false, // Disabled by default to avoid noise
      throttleMs: 100,
      maxDataPoints: 1000,
    };
    
    // Get user/session info from analytics service
    this.initializeIdentifiers();
  }

  public static getInstance(): HeatmapTracker {
    if (!HeatmapTracker.instance) {
      HeatmapTracker.instance = new HeatmapTracker();
    }
    return HeatmapTracker.instance;
  }

  private async initializeIdentifiers(): Promise<void> {
    // Get userId from localStorage (same as analytics service)
    this.userId = localStorage.getItem('analytics-user-id') || this.generateUserId();
    this.sessionId = this.generateSessionId();
    
    if (!localStorage.getItem('analytics-user-id')) {
      localStorage.setItem('analytics-user-id', this.userId);
    }
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public updateConfig(newConfig: Partial<HeatmapConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enabled && !this.isTracking) {
      this.startTracking();
    } else if (!this.config.enabled && this.isTracking) {
      this.stopTracking();
    }
  }

  public getConfig(): HeatmapConfig {
    return { ...this.config };
  }

  public startTracking(): void {
    if (this.isTracking || !this.config.enabled) return;

    console.log('🎯 Starting heatmap tracking');
    this.isTracking = true;

    // Set up event listeners
    if (this.config.trackClicks) {
      document.addEventListener('click', this.handleClick, { capture: true });
    }

    if (this.config.trackScrolls) {
      document.addEventListener('scroll', this.handleScroll, { passive: true });
    }

    if (this.config.trackHovers) {
      document.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    }

    // Set up periodic data flush
    this.startDataFlush();
  }

  public stopTracking(): void {
    if (!this.isTracking) return;

    console.log('🛑 Stopping heatmap tracking');
    this.isTracking = false;

    // Remove event listeners
    document.removeEventListener('click', this.handleClick, { capture: true });
    document.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('mousemove', this.handleMouseMove);

    // Clear throttle timers
    this.throttleTimers.forEach(timer => clearTimeout(timer));
    this.throttleTimers.clear();

    // Flush remaining data
    this.flushDataBuffer();
  }

  private handleClick = (event: MouseEvent): void => {
    if (!this.isTracking || !this.config.trackClicks) return;

    const target = event.target as Element;
    if (!target) return;

    // Use page coordinates (relative to document) instead of viewport coordinates
    const pageX = event.clientX + window.pageXOffset;
    const pageY = event.clientY + window.pageYOffset;
    
    const dataPoint = this.createDataPoint(pageX, pageY, target, 'click');
    this.addDataPoint(dataPoint);
  };

  private handleScroll = (): void => {
    if (!this.isTracking || !this.config.trackScrolls) return;

    this.throttle('scroll', () => {
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      
      const dataPoint = this.createDataPoint(
        scrollX + window.innerWidth / 2, 
        scrollY + window.innerHeight / 2, 
        document.body, 
        'scroll'
      );
      this.addDataPoint(dataPoint);
    });
  };

  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.isTracking || !this.config.trackHovers) return;

    this.throttle('hover', () => {
      const target = event.target as Element;
      if (!target) return;

      // Use page coordinates (relative to document) instead of viewport coordinates
      const pageX = event.clientX + window.pageXOffset;
      const pageY = event.clientY + window.pageYOffset;

      const dataPoint = this.createDataPoint(pageX, pageY, target, 'hover');
      this.addDataPoint(dataPoint);
    });
  };

  private throttle(key: string, callback: () => void): void {
    const existingTimer = this.throttleTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = window.setTimeout(() => {
      callback();
      this.throttleTimers.delete(key);
    }, this.config.throttleMs);

    this.throttleTimers.set(key, timer);
  }

  private createDataPoint(x: number, y: number, element: Element, eventType: HeatmapDataPoint['eventType']): HeatmapDataPoint {
    return {
      x: Math.round(x),
      y: Math.round(y),
      elementType: element.tagName.toLowerCase(),
      elementClass: element.className || undefined,
      elementId: element.id || undefined,
      elementText: this.getElementText(element),
      pageUrl: window.location.pathname + window.location.hash,
      timestamp: new Date().toISOString(),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      userId: this.userId,
      sessionId: this.sessionId,
      eventType,
    };
  }

  private getElementText(element: Element): string | undefined {
    if (element.textContent) {
      const text = element.textContent.trim().substring(0, 100);
      return text || undefined;
    }
    
    // For input elements, get placeholder or value
    if (element instanceof HTMLInputElement) {
      return element.placeholder || element.value || undefined;
    }
    
    // For images, get alt text
    if (element instanceof HTMLImageElement) {
      return element.alt || undefined;
    }
    
    return undefined;
  }

  private addDataPoint(dataPoint: HeatmapDataPoint): void {
    this.dataBuffer.push(dataPoint);

    // Flush buffer if it's getting too large
    if (this.dataBuffer.length >= this.config.maxDataPoints) {
      this.flushDataBuffer();
    }
  }

  private startDataFlush(): void {
    // Flush data every 10 seconds
    setInterval(() => {
      if (this.dataBuffer.length > 0) {
        this.flushDataBuffer();
      }
    }, 10000);
  }

  private async flushDataBuffer(): Promise<void> {
    if (this.dataBuffer.length === 0) return;

    const dataToFlush = [...this.dataBuffer];
    this.dataBuffer = [];

    try {
      // Store in Supabase
      const { error } = await supabase
        .from('heatmap_data')
        .insert(dataToFlush.map(point => ({
          x: point.x,
          y: point.y,
          element_type: point.elementType,
          element_class: point.elementClass,
          element_id: point.elementId,
          element_text: point.elementText,
          page_url: point.pageUrl,
          timestamp: point.timestamp,
          viewport_width: point.viewportWidth,
          viewport_height: point.viewportHeight,
          user_id: point.userId,
          session_id: point.sessionId,
          event_type: point.eventType,
        })));

      if (error) {
        console.error('Failed to store heatmap data:', error);
        // Add data back to buffer for retry
        this.dataBuffer.unshift(...dataToFlush);
      } else {
        console.log(`📊 Flushed ${dataToFlush.length} heatmap data points to Supabase`);
      }
    } catch (error) {
      console.error('Error flushing heatmap data:', error);
      // Store in localStorage as fallback
      this.storeInLocalStorage(dataToFlush);
    }
  }

  private storeInLocalStorage(data: HeatmapDataPoint[]): void {
    try {
      const existing = localStorage.getItem('heatmap-data-fallback');
      const existingData = existing ? JSON.parse(existing) : [];
      const combined = [...existingData, ...data].slice(-500); // Keep only latest 500 points
      
      localStorage.setItem('heatmap-data-fallback', JSON.stringify(combined));
      console.log(`💾 Stored ${data.length} heatmap points in localStorage fallback`);
    } catch (error) {
      console.error('Failed to store heatmap data in localStorage:', error);
    }
  }

  public async getHeatmapData(pageUrl?: string, eventTypes?: HeatmapDataPoint['eventType'][]): Promise<HeatmapDataPoint[]> {
    try {
      let query = supabase
        .from('heatmap_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10000);

      if (pageUrl) {
        query = query.eq('page_url', pageUrl);
      }

      if (eventTypes && eventTypes.length > 0) {
        query = query.in('event_type', eventTypes);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch heatmap data:', error);
        return this.getFallbackData();
      }

      return (data || []).map(item => ({
        id: item.id,
        x: item.x,
        y: item.y,
        elementType: item.element_type,
        elementClass: item.element_class,
        elementId: item.element_id,
        elementText: item.element_text,
        pageUrl: item.page_url,
        timestamp: item.timestamp,
        viewportWidth: item.viewport_width,
        viewportHeight: item.viewport_height,
        userId: item.user_id,
        sessionId: item.session_id,
        eventType: item.event_type,
      }));
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      return this.getFallbackData();
    }
  }

  private getFallbackData(): HeatmapDataPoint[] {
    try {
      const stored = localStorage.getItem('heatmap-data-fallback');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get fallback heatmap data:', error);
      return [];
    }
  }

  public clearHeatmapData(): void {
    this.dataBuffer = [];
    localStorage.removeItem('heatmap-data-fallback');
  }

  public getBufferSize(): number {
    return this.dataBuffer.length;
  }

  public isCurrentlyTracking(): boolean {
    return this.isTracking;
  }
}

// Export singleton instance
export const heatmapTracker = HeatmapTracker.getInstance();

// Export for easy access
export const {
  startTracking,
  stopTracking,
  updateConfig,
  getConfig,
  getHeatmapData,
  clearHeatmapData,
  getBufferSize,
  isCurrentlyTracking,
} = heatmapTracker;