import { useEffect, useRef } from 'react';
import { ClarityHeatmapManager, ClickEvent } from '@/heatmap/ClarityHeatmapManager';
import { heatmapDatabase } from '@/services/heatmap-database';
import { supabaseAnalyticsService } from '@/services/supabase-analytics';

export const PortfolioHeatmap = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heatmapRef = useRef<ClarityHeatmapManager | null>(null);
  const isInitialized = useRef(false);
  const loadingOverlayRef = useRef<HTMLDivElement | null>(null);
  
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
      height: ${fullHeight}px;
      pointer-events: none;
      z-index: 9999;
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
      display: flex;
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
    
    // Initialize heatmap manager
    heatmapRef.current = new ClarityHeatmapManager({
      container: heatmapContainer,
      radius: 35,
      opacity: 0.8,
      gradient: ["blue", "cyan", "lime", "yellow", "red"]
    });
    
    isInitialized.current = true;
    
    // Enable heatmap visibility
    heatmapRef.current.setVisible(true);
    
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
      
      // Add to local heatmap for immediate feedback
      heatmapRef.current.addClick(clickEvent);
      
      // Record in database for persistence and sharing
      const analytics = supabaseAnalyticsService;
      heatmapDatabase.recordClick({
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
    
    // Handle window resize and DOM changes
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
        heatmapRef.current.renderer.updateCanvasSize();
        heatmapRef.current.render();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Use MutationObserver to detect DOM changes
    const observer = new MutationObserver(() => {
      handleResize();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    // Load aggregated data from all users
    const loadAggregatedData = async () => {
      const startTime = performance.now();
      console.log('🔄 Starting to load heatmap data from database...');
      
      try {
        // Fetch aggregated click data from database
        const aggregatedData = await heatmapDatabase.getAggregatedHeatmapData(
          window.location.pathname,
          '7 days' // Show last 7 days of data
        );
        
        const loadTime = performance.now() - startTime;
        console.log(`✅ Heatmap data loaded in ${loadTime.toFixed(0)}ms`, aggregatedData);
        
        if (aggregatedData && aggregatedData.length > 0) {
          console.log(`📊 Processing ${aggregatedData.length} aggregated click points`);
          
          // Convert aggregated data to click events
          const clicks = aggregatedData.flatMap(item => {
            // Create multiple clicks based on count for proper heat intensity
            const clicksArray = [];
            const maxClicks = Math.min(item.click_count, 10); // Cap at 10 to prevent performance issues
            
            for (let i = 0; i < maxClicks; i++) {
              clicksArray.push({
                x: item.x,
                y: item.y,
                count: 1,
                element: 'AGGREGATED'
              });
            }
            
            return clicksArray;
          });
          
          if (clicks.length > 0) {
            console.log(`🎨 Rendering ${clicks.length} heatmap points`);
            heatmapRef.current?.importData({
              type: 'click',
              clicks,
              timestamp: Date.now()
            });
          }
        } else {
          console.log('ℹ️ No heatmap data found in database');
        }
        
        // Also load any failed clicks from localStorage and retry
        await heatmapDatabase.retryFailedClicks();
      } catch (error) {
        console.error('❌ Failed to load aggregated heatmap data:', error);
      } finally {
        // Hide loading overlay
        if (loadingOverlayRef.current) {
          loadingOverlayRef.current.style.display = 'none';
        }
      }
    };
    
    loadAggregatedData();
    
    // Refresh aggregated data periodically
    const refreshInterval = setInterval(() => {
      loadAggregatedData();
    }, 60000); // Refresh every minute
    
    // No need for localStorage saving anymore - data goes to database
    
    // Cleanup
    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      
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
  
  // This component doesn't render anything visible itself
  return <div ref={containerRef} style={{ display: 'none' }} />;
};