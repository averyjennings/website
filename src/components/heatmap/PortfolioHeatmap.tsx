import { useEffect, useRef } from 'react';
import { ClarityHeatmapManager, ClickEvent } from '@/heatmap/ClarityHeatmapManager';
import { heatmapDatabase } from '@/services/heatmap-database';
import { supabaseAnalyticsService } from '@/services/supabase-analytics';

export const PortfolioHeatmap = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heatmapRef = useRef<ClarityHeatmapManager | null>(null);
  const isInitialized = useRef(false);
  
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
      try {
        // Fetch aggregated click data from database
        const aggregatedData = await heatmapDatabase.getAggregatedHeatmapData(
          window.location.pathname,
          '7 days' // Show last 7 days of data
        );
        
        if (aggregatedData && aggregatedData.length > 0) {
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
            heatmapRef.current?.importData({
              type: 'click',
              clicks,
              timestamp: Date.now()
            });
          }
        }
        
        // Also load any failed clicks from localStorage and retry
        await heatmapDatabase.retryFailedClicks();
      } catch (error) {
        console.error('Failed to load aggregated heatmap data:', error);
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
      isInitialized.current = false;
    };
  }, []);
  
  // This component doesn't render anything visible itself
  return <div ref={containerRef} style={{ display: 'none' }} />;
};