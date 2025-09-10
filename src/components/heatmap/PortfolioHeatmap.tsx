import React, { useEffect, useRef, useState } from 'react';
import { ClarityHeatmapManager, ClickEvent } from '@/heatmap/ClarityHeatmapManager';
import { heatmapDatabase } from '@/services/heatmap-database';
import { supabaseAnalyticsService } from '@/services/supabase-analytics';
import { debounce, RequestBatcher, RAFScheduler } from '@/utils/performance';
import { useHeatmapStore } from '@/store/heatmap';

export const PortfolioHeatmap = React.memo(() => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heatmapRef = useRef<ClarityHeatmapManager | null>(null);
  const isInitialized = useRef(false);
  const loadingOverlayRef = useRef<HTMLDivElement | null>(null);
  const clickBatcherRef = useRef<RequestBatcher<any> | null>(null);
  const rafSchedulerRef = useRef<RAFScheduler | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const currentOffsetRef = useRef(0);
  const loadedDataRef = useRef(new Set<string>());
  
  // Get heatmap visibility state from store
  const isVisible = useHeatmapStore((state) => state.isVisible);
  
  useEffect(() => {
    if (!containerRef.current || isInitialized.current) return;
    
    // Create full document container
    const fullHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );
    
    const heatmapContainer = document.createElement('div');
    heatmapContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      max-width: 100vw;
      height: ${fullHeight}px;
      pointer-events: none;
      z-index: 9999;
      display: ${isVisible ? 'block' : 'none'};
      overflow: hidden;
    `;
    document.body.appendChild(heatmapContainer);
    
    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-family: system-ui, -apple-system, sans-serif;
      z-index: 10001;
      display: ${isVisible ? 'flex' : 'none'};
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    loadingOverlay.innerHTML = `
      <div style="
        width: 16px;
        height: 16px;
        border: 2px solid #fff;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      "></div>
      <span>Loading heatmap data...</span>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(loadingOverlay);
    loadingOverlayRef.current = loadingOverlay;
    
    // Initialize heatmap manager with logarithmic scaling for millions of clicks
    heatmapRef.current = new ClarityHeatmapManager({
      container: heatmapContainer,
      radius: 35,
      opacity: 0.8,
      gradient: ["blue", "cyan", "lime", "yellow", "red"],
      maxIntensity: 10000, // Support up to 10k clicks per point
      scaleMode: 'logarithmic', // Use logarithmic scaling for better distribution
      intensityRange: { min: 0.05, max: 0.95 } // Wider range for visibility
    });
    
    // Initialize request batcher for click events
    clickBatcherRef.current = new RequestBatcher(
      async (clicks) => {
        // Batch process click events to database
        await Promise.all(clicks.map(click => heatmapDatabase.recordClick(click)));
      },
      25, // Batch size
      50  // Max wait time in ms
    );
    
    // Initialize RAF scheduler for canvas updates
    rafSchedulerRef.current = new RAFScheduler();
    
    isInitialized.current = true;
    
    // Set initial heatmap visibility based on store state
    heatmapRef.current.setVisible(isVisible);
    
    // Handle clicks and touches
    const handleInteraction = (e: MouseEvent | TouchEvent) => {
      if (!heatmapRef.current) return;
      
      let x: number, y: number;
      
      if ('touches' in e && e.touches.length > 0) {
        // Touch event
        const touch = e.touches[0];
        x = touch.pageX;
        y = touch.pageY;
      } else if ('pageX' in e) {
        // Mouse event
        x = e.pageX;
        y = e.pageY;
      } else {
        return;
      }
      
      const clickEvent: ClickEvent = {
        x,
        y,
        timestamp: Date.now(),
        element: (e.target as HTMLElement).tagName,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
      
      // Add to local heatmap for immediate feedback with RAF scheduling
      rafSchedulerRef.current?.schedule('add-click', () => {
        heatmapRef.current?.addClick(clickEvent);
      });
      
      // Batch click events for database recording
      const analytics = supabaseAnalyticsService;
      clickBatcherRef.current?.add({
        x,
        y,
        pageX: x,
        pageY: y,
        elementTag: (e.target as HTMLElement).tagName,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        pageUrl: window.location.pathname,
        userId: analytics.getUserId(),
        sessionId: analytics.getSessionId()
      });
    };
    
    // Add global click and touch listeners
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction, { passive: true });
    
    // Handle window resize and DOM changes with debouncing
    const handleResize = () => {
      const newHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
      );
      
      heatmapContainer.style.height = `${newHeight}px`;
      
      if (heatmapRef.current) {
        // Use RAF for canvas updates
        rafSchedulerRef.current?.schedule('resize-update', () => {
          heatmapRef.current?.renderer.updateCanvasSize();
          heatmapRef.current?.render();
        });
      }
    };
    
    // Debounce resize handler (250ms delay)
    const debouncedResize = debounce(handleResize, 250);
    window.addEventListener('resize', debouncedResize);
    
    // Optimize MutationObserver with debouncing and specific target
    const debouncedMutationHandler = debounce(handleResize, 500);
    const observer = new MutationObserver(() => {
      debouncedMutationHandler();
    });
    
    // Only observe the main content area, not the entire body
    const mainContent = document.querySelector('main') || document.body;
    observer.observe(mainContent, {
      childList: true,
      subtree: true,
      attributes: false // Don't watch all attribute changes
    });
    
    // Load aggregated data with lazy loading
    const loadAggregatedData = async (append = false) => {
      if (isLoadingMore || (!hasMoreData && append)) return;
      
      setIsLoadingMore(true);
      const startTime = performance.now();
      console.log('🔄 Loading heatmap data...', { append, offset: currentOffsetRef.current });
      
      try {
        // Load viewport-specific data first for initial load
        if (!append && currentOffsetRef.current === 0) {
          const viewport = {
            top: window.scrollY,
            bottom: window.scrollY + window.innerHeight,
            left: 0,
            right: window.innerWidth
          };
          
          const viewportData = await heatmapDatabase.getViewportHeatmapData(
            viewport,
            window.location.pathname,
            '7 days'
          );
          
          if (viewportData.length > 0) {
            console.log(`📊 Processing ${viewportData.length} viewport clicks`);
            processHeatmapData(viewportData, false);
          }
        }
        
        // Load paginated data - increased batch size for millions of clicks
        const { data, hasMore, nextOffset } = await heatmapDatabase.getAggregatedHeatmapDataPaginated(
          window.location.pathname,
          '7 days',
          500, // Load 500 points at a time for better performance with large datasets
          currentOffsetRef.current
        );
        
        const loadTime = performance.now() - startTime;
        console.log(`✅ Data loaded in ${loadTime.toFixed(0)}ms`);
        
        if (data && data.length > 0) {
          processHeatmapData(data, append);
          currentOffsetRef.current = nextOffset;
          setHasMoreData(hasMore);
        } else {
          setHasMoreData(false);
        }
        
        // Load failed clicks on first load
        if (!append) {
          await heatmapDatabase.retryFailedClicks();
        }
      } catch (error) {
        console.error('❌ Failed to load heatmap data:', error);
      } finally {
        setIsLoadingMore(false);
        
        // Hide loading overlay on first load
        if (!append && loadingOverlayRef.current && isVisible) {
          loadingOverlayRef.current.style.display = 'none';
        }
      }
    };
    
    // Process heatmap data and render
    const processHeatmapData = (aggregatedData: any[], _append: boolean) => {
      // Filter out already loaded data points
      const newData = aggregatedData.filter(item => {
        const key = `${item.x}-${item.y}`;
        if (loadedDataRef.current.has(key)) return false;
        loadedDataRef.current.add(key);
        return true;
      });
      
      if (newData.length === 0) return;
      
      console.log(`📊 Processing ${newData.length} new click points`);
      
      // Convert aggregated data to click events with actual counts
      // No longer creating multiple points - pass the actual count value
      const clicks = newData.map(item => ({
        x: item.x,
        y: item.y,
        count: item.click_count, // Use actual click count for proper intensity scaling
        element: 'AGGREGATED'
      }));
      
      if (clicks.length > 0) {
        console.log(`🎨 Rendering ${clicks.length} heatmap points`);
        rafSchedulerRef.current?.schedule('import-data', () => {
          heatmapRef.current?.importData({
            type: 'click',
            clicks,
            timestamp: Date.now()
          });
        });
      }
    };
    
    // Initial load
    loadAggregatedData();
    
    // Load more data on scroll
    const handleScroll = debounce(() => {
      const scrollBottom = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Load more when user scrolls near bottom
      if (scrollBottom > documentHeight - 500 && hasMoreData && !isLoadingMore) {
        loadAggregatedData(true);
      }
    }, 300);
    
    window.addEventListener('scroll', handleScroll);
    
    // Disable auto-refresh to prevent constant re-rendering
    // const refreshInterval = setInterval(() => {
    //   // Clear cache and reset
    //   heatmapDatabase.clearCache();
    //   loadedDataRef.current.clear();
    //   currentOffsetRef.current = 0;
    //   setHasMoreData(true);
    //   
    //   // Reload data
    //   loadAggregatedData();
    // }, 120000); // Refresh every 2 minutes (increased from 1 minute)
    
    // No need for localStorage saving anymore - data goes to database
    
    // Cleanup
    return () => {
      // clearInterval(refreshInterval);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
      
      // Cleanup performance utilities
      clickBatcherRef.current?.flush();
      clickBatcherRef.current?.destroy();
      rafSchedulerRef.current?.destroy();
      
      // Ensure any pending clicks are sent
      heatmapDatabase.flush();
      
      if (heatmapRef.current) {
        heatmapRef.current.destroy();
        heatmapRef.current = null;
      }
      
      // Remove container
      heatmapContainer.remove();
      
      // Remove loading overlay
      if (loadingOverlayRef.current) {
        loadingOverlayRef.current.remove();
      }
      
      isInitialized.current = false;
    };
  }, []);
  
  // Handle visibility toggle changes
  useEffect(() => {
    if (!heatmapRef.current || !isInitialized.current) return;
    
    heatmapRef.current.setVisible(isVisible);
    
    // Also hide/show the heatmap container and loading overlay
    const heatmapContainer = document.querySelector('.heatmap-canvas') as HTMLCanvasElement;
    if (heatmapContainer) {
      heatmapContainer.style.display = isVisible ? 'block' : 'none';
    }
    
    if (loadingOverlayRef.current) {
      loadingOverlayRef.current.style.display = 'none';
    }
  }, [isVisible]);
  
  // This component doesn't render anything visible itself
  return <div ref={containerRef} style={{ display: 'none' }} />;
});

PortfolioHeatmap.displayName = 'PortfolioHeatmap';