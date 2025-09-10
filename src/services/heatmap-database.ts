import { supabase } from '@/lib/supabase';

export interface HeatmapClick {
  x: number;
  y: number;
  pageX?: number;
  pageY?: number;
  elementTag?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  pageUrl: string;
  userId?: string;
  sessionId?: string;
}

export interface AggregatedClick {
  x: number;
  y: number;
  click_count: number;
}

export interface PaginatedHeatmapData {
  data: AggregatedClick[];
  hasMore: boolean;
  nextOffset: number;
}

class HeatmapDatabaseService {
  private batchedClicks: HeatmapClick[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_DELAY = 2000; // 2 seconds
  private dataCache = new Map<string, { data: AggregatedClick[], timestamp: number }>();
  private readonly CACHE_TTL = 60000; // 1 minute cache

  /**
   * Record a click in the database (batched for performance)
   */
  async recordClick(click: HeatmapClick): Promise<void> {
    this.batchedClicks.push(click);

    // If we've reached the batch size, send immediately
    if (this.batchedClicks.length >= this.BATCH_SIZE) {
      await this.flushBatch();
    } else {
      // Otherwise, schedule a batch send
      this.scheduleBatchSend();
    }
  }

  /**
   * Schedule a batch send after a delay
   */
  private scheduleBatchSend(): void {
    if (this.batchTimer) return;

    this.batchTimer = setTimeout(async () => {
      await this.flushBatch();
    }, this.BATCH_DELAY);
  }

  /**
   * Flush the current batch of clicks to the database
   */
  private async flushBatch(): Promise<void> {
    if (this.batchedClicks.length === 0) return;

    const clicksToSend = [...this.batchedClicks];
    this.batchedClicks = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      const { error } = await supabase
        .from('heatmap_clicks')
        .insert(
          clicksToSend.map(click => ({
            x: click.x,
            y: click.y,
            page_x: click.pageX || click.x,
            page_y: click.pageY || click.y,
            element_tag: click.elementTag,
            viewport_width: click.viewportWidth,
            viewport_height: click.viewportHeight,
            page_url: click.pageUrl,
            user_id: click.userId,
            session_id: click.sessionId
          }))
        );

      if (error) {
        console.error('Failed to record heatmap clicks:', error);
        // Optionally, store failed clicks in localStorage as backup
        this.storeFailedClicksLocally(clicksToSend);
      } else {
        console.log(`Successfully recorded ${clicksToSend.length} heatmap clicks`);
      }
    } catch (error) {
      console.error('Error recording heatmap clicks:', error);
      this.storeFailedClicksLocally(clicksToSend);
    }
  }

  /**
   * Store failed clicks in localStorage as a backup
   */
  private storeFailedClicksLocally(clicks: HeatmapClick[]): void {
    try {
      const existingFailed = localStorage.getItem('heatmap-failed-clicks');
      const failed = existingFailed ? JSON.parse(existingFailed) : [];
      failed.push(...clicks);
      
      // Keep only the last 1000 failed clicks
      const trimmed = failed.slice(-1000);
      localStorage.setItem('heatmap-failed-clicks', JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to store clicks locally:', e);
    }
  }

  /**
   * Retry sending failed clicks from localStorage
   */
  async retryFailedClicks(): Promise<void> {
    try {
      const failedClicks = localStorage.getItem('heatmap-failed-clicks');
      if (!failedClicks) return;

      const clicks = JSON.parse(failedClicks);
      if (clicks.length === 0) return;

      // Clear the failed clicks first
      localStorage.removeItem('heatmap-failed-clicks');

      // Try to send them again
      for (const click of clicks) {
        await this.recordClick(click);
      }
    } catch (error) {
      console.error('Error retrying failed clicks:', error);
    }
  }

  /**
   * Get aggregated heatmap data for all users with pagination support
   */
  async getAggregatedHeatmapDataPaginated(
    pageUrl?: string,
    timeRange: string = '7 days',
    limit: number = 100,
    offset: number = 0
  ): Promise<PaginatedHeatmapData> {
    const cacheKey = `${pageUrl || 'all'}-${timeRange}-${limit}-${offset}`;
    const cached = this.dataCache.get(cacheKey);
    
    // Return cached data if still fresh
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return {
        data: cached.data,
        hasMore: cached.data.length === limit,
        nextOffset: offset + limit
      };
    }

    const startTime = performance.now();
    console.log('🔍 Fetching paginated heatmap data...', { pageUrl, timeRange, limit, offset });
    
    try {
      const { data, error } = await supabase
        .rpc('get_heatmap_data_paginated', {
          p_page_url: pageUrl || window.location.pathname,
          p_time_range: timeRange,
          p_limit: limit,
          p_offset: offset
        });

      const queryTime = performance.now() - startTime;
      console.log(`⏱️ Paginated query completed in ${queryTime.toFixed(0)}ms`);

      if (error) {
        console.warn('⚠️ Falling back to non-paginated query:', error);
        // Fallback to regular query
        const allData = await this.getAggregatedHeatmapData(pageUrl, timeRange);
        const paginatedData = allData.slice(offset, offset + limit);
        return {
          data: paginatedData,
          hasMore: allData.length > offset + limit,
          nextOffset: offset + limit
        };
      }

      const aggregatedData = data || [];
      
      // Cache the results
      this.dataCache.set(cacheKey, {
        data: aggregatedData,
        timestamp: Date.now()
      });

      console.log(`✅ Retrieved ${aggregatedData.length} points (page ${Math.floor(offset / limit) + 1})`);
      
      return {
        data: aggregatedData,
        hasMore: aggregatedData.length === limit,
        nextOffset: offset + limit
      };
    } catch (error) {
      console.error('❌ Error fetching paginated data:', error);
      return {
        data: [],
        hasMore: false,
        nextOffset: offset
      };
    }
  }

  /**
   * Get aggregated heatmap data for all users (legacy method)
   */
  async getAggregatedHeatmapData(
    pageUrl?: string,
    timeRange: string = '7 days'
  ): Promise<AggregatedClick[]> {
    const startTime = performance.now();
    console.log('🔍 Fetching heatmap data from Supabase...', { pageUrl, timeRange });
    
    try {
      const { data, error } = await supabase
        .rpc('get_heatmap_data', {
          p_page_url: pageUrl || window.location.pathname,
          p_time_range: timeRange
        });

      const queryTime = performance.now() - startTime;
      console.log(`⏱️ Supabase query completed in ${queryTime.toFixed(0)}ms`);

      if (error) {
        console.warn('⚠️ Database function not found or error:', error);
        console.log('📦 Falling back to localStorage data');
        // Fallback to localStorage data if database is not ready
        return this.getLocalStorageHeatmapData();
      }

      console.log(`✅ Retrieved ${data?.length || 0} aggregated click points from database`);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching heatmap data:', error);
      console.log('📦 Falling back to localStorage data');
      // Fallback to localStorage data if database is not ready
      return this.getLocalStorageHeatmapData();
    }
  }

  /**
   * Get heatmap data for visible viewport area only
   */
  async getViewportHeatmapData(
    viewport: { top: number; bottom: number; left: number; right: number },
    pageUrl?: string,
    timeRange: string = '7 days'
  ): Promise<AggregatedClick[]> {
    const startTime = performance.now();
    console.log('🔍 Fetching viewport-specific heatmap data...', viewport);
    
    try {
      const { data, error } = await supabase
        .rpc('get_heatmap_data_viewport', {
          p_page_url: pageUrl || window.location.pathname,
          p_time_range: timeRange,
          p_top: viewport.top,
          p_bottom: viewport.bottom,
          p_left: viewport.left,
          p_right: viewport.right
        });

      const queryTime = performance.now() - startTime;
      console.log(`⏱️ Viewport query completed in ${queryTime.toFixed(0)}ms`);

      if (error) {
        console.warn('⚠️ Viewport query failed, using full data:', error);
        // Fallback to full data and filter client-side
        const allData = await this.getAggregatedHeatmapData(pageUrl, timeRange);
        return allData.filter(click => 
          click.x >= viewport.left && 
          click.x <= viewport.right && 
          click.y >= viewport.top && 
          click.y <= viewport.bottom
        );
      }

      console.log(`✅ Retrieved ${data?.length || 0} viewport clicks`);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching viewport data:', error);
      return [];
    }
  }

  /**
   * Clear the data cache
   */
  clearCache(): void {
    this.dataCache.clear();
  }

  /**
   * Get heatmap data from localStorage as fallback
   */
  private getLocalStorageHeatmapData(): AggregatedClick[] {
    try {
      const storedData = localStorage.getItem('portfolio-heatmap-data');
      if (!storedData) return [];
      
      const { clicks } = JSON.parse(storedData);
      if (!clicks || !Array.isArray(clicks)) return [];
      
      // Convert localStorage format to aggregated format
      return clicks.map((click: any) => ({
        x: click.x,
        y: click.y,
        click_count: click.count || 1
      }));
    } catch (error) {
      console.error('Error reading localStorage heatmap data:', error);
      return [];
    }
  }

  /**
   * Get raw click data (for debugging or detailed analysis)
   */
  async getRawClickData(
    pageUrl?: string,
    limit: number = 1000
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('heatmap_clicks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (pageUrl) {
        query = query.eq('page_url', pageUrl);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch raw click data:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching raw click data:', error);
      return [];
    }
  }

  /**
   * Ensure any pending clicks are sent before page unload
   */
  async flush(): Promise<void> {
    await this.flushBatch();
  }
}

// Export singleton instance
export const heatmapDatabase = new HeatmapDatabaseService();

// Ensure clicks are sent before page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    heatmapDatabase.flush();
  });

  // Retry failed clicks on page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      heatmapDatabase.retryFailedClicks();
    }, 5000); // Wait 5 seconds after page load
  });
}