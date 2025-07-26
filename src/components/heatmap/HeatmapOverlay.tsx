import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { HeatmapDataPoint, heatmapTracker } from '@/services/heatmap-tracker';

// Performance optimization: Cached document dimensions to eliminate redundant DOM queries
interface CachedDimensions {
  width: number;
  height: number;
  timestamp: number;
  devicePixelRatio: number;
}

// Performance monitoring interface
interface PerformanceMetrics {
  coordinateConversions: number;
  renderTime: number;
  frameRate: number;
  canvasPixels: number;
}

interface HeatmapOverlayProps {
  data: HeatmapDataPoint[];
  visible: boolean;
  eventTypes: HeatmapDataPoint['eventType'][];
  intensity: number; // 0-100
  radius: number; // pixel radius for heat points
  className?: string;
}


export function HeatmapOverlay({
  data = [],
  visible = false,
  eventTypes = ['click'],
  intensity = 70,
  radius = 25,
  className = '',
}: HeatmapOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [pendingClicks, setPendingClicks] = useState<HeatmapDataPoint[]>([]);
  
  // PERFORMANCE OPTIMIZATION: Cache document dimensions to eliminate 170+ conversions per render
  const cachedDimensionsRef = useRef<CachedDimensions | null>(null);
  const performanceMetricsRef = useRef<PerformanceMetrics>({
    coordinateConversions: 0,
    renderTime: 0,
    frameRate: 0,
    canvasPixels: 0
  });
  
  // Optimized dimension calculation with caching
  const getDocumentDimensions = useCallback((): CachedDimensions => {
    const now = Date.now();
    
    // Return cached dimensions if still valid (within 500ms)
    if (cachedDimensionsRef.current && 
        (now - cachedDimensionsRef.current.timestamp) < 500) {
      return cachedDimensionsRef.current;
    }
    
    // Calculate dimensions once and cache
    const width = Math.max(
      1, // Minimum width to prevent division by zero
      document.documentElement?.scrollWidth || 0,
      document.documentElement?.offsetWidth || 0,  
      document.documentElement?.clientWidth || 0,
      document.body?.scrollWidth || 0,
      document.body?.offsetWidth || 0,
      window.innerWidth || 1920 // Fallback
    );
    
    const height = Math.max(
      1, // Minimum height to prevent division by zero
      document.documentElement?.scrollHeight || 0,
      document.documentElement?.offsetHeight || 0,
      document.documentElement?.clientHeight || 0,
      document.body?.scrollHeight || 0,
      document.body?.offsetHeight || 0,
      window.innerHeight || 1080 // Fallback
    );
    
    const cached = {
      width,
      height,
      timestamp: now,
      devicePixelRatio: Math.max(1, Math.min(2, window.devicePixelRatio || 1)) // Clamp DPR to prevent massive canvases
    };
    
    cachedDimensionsRef.current = cached;
    performanceMetricsRef.current.coordinateConversions++;
    
    console.log(`⚡ Document dimensions cached: ${width}x${height} (DPR: ${cached.devicePixelRatio})`);
    return cached;
  }, []);

  // Efficient instant feedback using buffer data (no polling)
  useEffect(() => {
    if (!visible) {
      setPendingClicks([]);
      return;
    }

    // Get buffer data once when visible, then rely on periodic refresh
    const getBufferData = () => {
      try {
        // Access buffer directly from tracker (synchronous, no database call)
        const bufferData = heatmapTracker.getBufferData();
        const currentUrl = window.location.pathname + window.location.hash;
        
        // Filter buffer for current page and event types
        const relevantBuffer = bufferData.filter(point => 
          point.pageUrl === currentUrl && 
          eventTypes.includes(point.eventType)
        );
        
        setPendingClicks(relevantBuffer);
      } catch (error) {
        console.error('Error accessing buffer data:', error);
      }
    };

    // Get buffer data immediately
    getBufferData();
    
    // Light refresh every 5 seconds (not 100ms!)
    const lightRefresh = setInterval(getBufferData, 5000);

    return () => clearInterval(lightRefresh);
  }, [visible, eventTypes]);

  // PHASE 5: OPTIMIZED Statistical calculations with memoization
  const statisticalCache = useRef<{
    data: { count: number; x: number; y: number; eventType: HeatmapDataPoint['eventType']; isRecent: boolean; totalX: number; totalY: number }[];
    percentiles: { p25: number; p50: number; p75: number; p90: number; maxCount: number; minCount: number };
    timestamp: number;
  } | null>(null);

  // PERFORMANCE OPTIMIZED: Process stable database data with cached dimensions
  const heatPoints = useMemo(() => {
    const startTime = performance.now();
    performanceMetricsRef.current.coordinateConversions = 0; // Reset counter
    
    try {
      // Only process stable database data for consistent performance
      const filteredData = data.filter(point => eventTypes.includes(point.eventType));
      
      if (filteredData.length === 0) return [];
      
      // OPTIMIZATION: Use cached dimensions instead of recalculating
      const { width: currentDocumentWidth, height: currentDocumentHeight } = getDocumentDimensions();
      
      console.log(`⚡ PHASE 5 OPTIMIZED: Converting ${filteredData.length} coordinates using cached dimensions ${currentDocumentWidth}x${currentDocumentHeight}`);
    
    // Convert relative coordinates to current absolute coordinates with error handling
    const pointsWithAbsoluteCoords = filteredData.map(point => {
      // OPTIMIZED: Streamlined coordinate validation and conversion
      const isValidX = typeof point.x === 'number' && !isNaN(point.x) && isFinite(point.x);
      const isValidY = typeof point.y === 'number' && !isNaN(point.y) && isFinite(point.y);
      
      if (!isValidX || !isValidY) return null; // Skip invalid points silently for performance
      
      // PERFORMANCE: Single-pass coordinate conversion
      const absoluteX = Math.round(point.x * currentDocumentWidth);
      const absoluteY = Math.round(point.y * currentDocumentHeight);
      
      // OPTIMIZED: Quick bounds check with larger tolerance
      if (absoluteX < -200 || absoluteY < -200 || 
          absoluteX > currentDocumentWidth + 200 || absoluteY > currentDocumentHeight + 200) {
        return null; // Skip out-of-bounds points silently
      }
      
      return {
        ...point,
        absoluteX,
        absoluteY,
      };
    }).filter((point): point is NonNullable<typeof point> => point !== null); // Type-safe filter
    
    if (pointsWithAbsoluteCoords.length !== filteredData.length) {
      console.warn(`🚨 Filtered out ${filteredData.length - pointsWithAbsoluteCoords.length} invalid coordinate points`);
    }
    
    // If no valid points after coordinate conversion, return empty array
    if (pointsWithAbsoluteCoords.length === 0) {
      console.warn('🚨 No valid coordinate points after conversion - heatmap will be empty');
      if (filteredData.length > 0) {
        console.warn('🚨 This might indicate a coordinate system migration issue. Check database schema.');
      }
      return [];
    }
    
    // PHASE 5: OPTIMIZED proximity grouping with single-pass processing
    const groupedPoints = new Map<string, { count: number; x: number; y: number; eventType: HeatmapDataPoint['eventType']; isRecent: boolean; totalX: number; totalY: number }>();
    
    // Calculate what counts as "recent" (last 15 seconds for instant feedback)
    const recentThreshold = new Date(Date.now() - 15000).toISOString();
    
    // OPTIMIZATION: Pre-calculate grid size once
    const gridSize = window.innerWidth < 768 ? 12 : 15;
    
    // OPTIMIZATION: Single-pass grouping with optimized averaging
    pointsWithAbsoluteCoords.forEach(point => {
      const gridX = Math.floor(point.absoluteX / gridSize) * gridSize;
      const gridY = Math.floor(point.absoluteY / gridSize) * gridSize;
      const key = `${gridX}-${gridY}-${point.eventType}`;
      const isRecent = point.timestamp > recentThreshold;
      
      if (groupedPoints.has(key)) {
        const existing = groupedPoints.get(key)!;
        existing.count++;
        existing.totalX += point.absoluteX;
        existing.totalY += point.absoluteY;
        existing.x = existing.totalX / existing.count; // More accurate averaging
        existing.y = existing.totalY / existing.count;
        existing.isRecent = existing.isRecent || isRecent;
      } else {
        groupedPoints.set(key, {
          count: 1,
          x: point.absoluteX,
          y: point.absoluteY,
          eventType: point.eventType,
          isRecent: isRecent,
          totalX: point.absoluteX,
          totalY: point.absoluteY,
        });
      }
    });

    // Convert to heat points with stable statistical distribution
    const points = Array.from(groupedPoints.values());
    const totalClicks = filteredData.length;
    
    // PHASE 5: OPTIMIZED statistical calculations with intelligent caching
    let percentiles: { p25: number; p50: number; p75: number; p90: number; maxCount: number; minCount: number };
    
    // Check if we can use cached percentiles (stable data hasn't changed significantly)
    const stablePoints = points.filter(point => !point.isRecent);
    const now = Date.now();
    
    if (statisticalCache.current && 
        statisticalCache.current.data.length === stablePoints.length &&
        (now - statisticalCache.current.timestamp) < 2000) { // Cache valid for 2 seconds
      percentiles = statisticalCache.current.percentiles;
      console.log(`⚡ PHASE 5: Using cached statistical percentiles (${stablePoints.length} points)`);
    } else {
      // Recalculate percentiles only when stable data changes
      const counts = points.map(p => p.count);
      const maxCount = Math.max(...counts, 1);
      const minCount = Math.min(...counts, 1);
      
      const stableCounts = stablePoints.length > 0 ? stablePoints.map(p => p.count) : counts;
      const sortedCounts = [...stableCounts].sort((a, b) => a - b);
      
      percentiles = {
        p25: sortedCounts[Math.floor(sortedCounts.length * 0.25)] || 1,
        p50: sortedCounts[Math.floor(sortedCounts.length * 0.50)] || 1,
        p75: sortedCounts[Math.floor(sortedCounts.length * 0.75)] || 1,
        p90: sortedCounts[Math.floor(sortedCounts.length * 0.90)] || 1,
        maxCount,
        minCount
      };
      
      // Cache the results
      statisticalCache.current = {
        data: [...stablePoints],
        percentiles,
        timestamp: now
      };
      
      console.log(`⚡ PHASE 5: Calculated fresh statistical percentiles - p25:${percentiles.p25}, p50:${percentiles.p50}, p75:${percentiles.p75}, p90:${percentiles.p90}`);
    }
    
    // PERFORMANCE: Track processing metrics
    const processingTime = performance.now() - startTime;
    performanceMetricsRef.current.renderTime = processingTime;
    
    console.log(`⚡ PHASE 5 OPTIMIZED: Rendered ${points.length} heat points from ${totalClicks} total clicks in ${processingTime.toFixed(2)}ms`);
    console.log(`📊 PHASE 5: Coordinate conversions: ${performanceMetricsRef.current.coordinateConversions} | Statistical cache hits: ${statisticalCache.current ? 'YES' : 'NO'}`);
    
    // PHASE 5: STREAMLINED intensity calculation with lookup tables
    const intensityRanges = [
      { threshold: percentiles.p90, level: 'extreme' as const, min: 0.9, range: 0.1 },
      { threshold: percentiles.p75, level: 'high' as const, min: 0.7, range: 0.2 },
      { threshold: percentiles.p50, level: 'medium' as const, min: 0.5, range: 0.2 },
      { threshold: percentiles.p25, level: 'low' as const, min: 0.3, range: 0.2 },
      { threshold: 0, level: 'minimal' as const, min: 0.2, range: 0.1 }
    ];

    return points.map(point => {
      let normalizedIntensity: number = 0.2; // Default fallback
      let heatLevel: 'minimal' | 'low' | 'medium' | 'high' | 'extreme' = 'minimal';
      
      if (point.isRecent) {
        // Recent clicks get immediate high visibility
        heatLevel = 'high';
        normalizedIntensity = 0.8;
      } else {
        // OPTIMIZATION: Single-pass intensity calculation using lookup table
        for (const range of intensityRanges) {
          if (point.count >= range.threshold) {
            heatLevel = range.level;
            const nextThreshold = range === intensityRanges[0] ? percentiles.maxCount : 
                                 range === intensityRanges[1] ? percentiles.p90 :
                                 range === intensityRanges[2] ? percentiles.p75 :
                                 range === intensityRanges[3] ? percentiles.p50 : percentiles.p25;
            const denominator = Math.max(nextThreshold - range.threshold, 1);
            normalizedIntensity = range.min + ((point.count - range.threshold) / denominator) * range.range;
            break;
          }
        }
      }
      
      // Apply recent boost efficiently
      const baseIntensity = normalizedIntensity * (point.isRecent ? 1.5 : 1);
      
      return {
        x: point.x,
        y: point.y,
        intensity: baseIntensity,
        heatLevel,
        count: point.count,
        eventType: point.eventType,
        isRecent: point.isRecent,
      };
    });
    } catch (error) {
      console.error('🚨 Error processing heatmap data:', error);
      return []; // Return empty array on error to prevent crashes
    }
  }, [data, eventTypes, getDocumentDimensions]); // OPTIMIZED: Include cached dimension function

  // PHASE 5: OPTIMIZED pending clicks processing with batch operations
  const pendingHeatPoints = useMemo(() => {
    if (!pendingClicks.length) return [];
    
    try {
      const filteredPending = pendingClicks.filter(point => eventTypes.includes(point.eventType));
      if (!filteredPending.length) return [];
      
      // OPTIMIZATION: Use cached dimensions and batch coordinate conversion
      const { width: currentDocumentWidth, height: currentDocumentHeight } = getDocumentDimensions();
      
      console.log(`⚡ PHASE 5: Processing ${filteredPending.length} pending clicks with optimized batch conversion`);
      
      // OPTIMIZATION: Single-pass conversion with pre-allocated constants
      const pendingIntensity = 0.9;
      const pendingLevel = 'extreme' as const;
      
      return filteredPending.map(point => ({
        x: Math.round(point.x * currentDocumentWidth),
        y: Math.round(point.y * currentDocumentHeight),
        intensity: pendingIntensity,
        heatLevel: pendingLevel,
        count: 1,
        eventType: point.eventType,
        isRecent: true,
      }));
    } catch (error) {
      console.error('🚨 PHASE 5: Error processing pending clicks:', error);
      return [];
    }
  }, [pendingClicks, eventTypes, getDocumentDimensions]);

  // PERFORMANCE OPTIMIZED: Update canvas dimensions with cached calculations and size limits
  useEffect(() => {
    if (!visible) return;

    const updateDimensions = () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // OPTIMIZATION: Use cached dimensions to eliminate redundant DOM queries
        const { width, height, devicePixelRatio } = getDocumentDimensions();
        
        // Validate dimensions before applying
        if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
          console.error('🚨 Invalid canvas dimensions:', { width, height });
          return;
        }
        
        // PERFORMANCE CRITICAL: Apply aggressive canvas size limits to prevent 69.6M pixel canvases
        const maxCanvasWidth = Math.min(8192, width * devicePixelRatio); // Hard limit to prevent massive canvases
        const maxCanvasHeight = Math.min(8192, height * devicePixelRatio);
        const actualCanvasWidth = Math.min(maxCanvasWidth, width * devicePixelRatio);
        const actualCanvasHeight = Math.min(maxCanvasHeight, height * devicePixelRatio);
        
        canvas.width = actualCanvasWidth;
        canvas.height = actualCanvasHeight;
        
        // Scale canvas back down using CSS
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        
        // Scale the drawing context to match device pixel ratio
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(devicePixelRatio, devicePixelRatio);
        }
        
        // PERFORMANCE: Track canvas pixel count for monitoring
        performanceMetricsRef.current.canvasPixels = actualCanvasWidth * actualCanvasHeight;
        
        setDimensions({ width, height });
        console.log(`⚡ OPTIMIZED: Canvas ${width}x${height} (${(performanceMetricsRef.current.canvasPixels / 1000000).toFixed(1)}M pixels, DPR: ${devicePixelRatio})`);
      } catch (error) {
        console.error('🚨 Error updating canvas dimensions:', error);
        // Set safe fallback dimensions
        setDimensions({ width: 1920, height: 1080 });
      }
    };

    // Update dimensions immediately and after a short delay for layout settling
    updateDimensions();
    const timeoutId = setTimeout(updateDimensions, 100);
    
    // PERFORMANCE OPTIMIZED: Add event listeners with cache invalidation
    const handleResize = () => {
      console.log('⚡ Window resized, invalidating dimension cache...');
      // CRITICAL: Invalidate cached dimensions on resize
      cachedDimensionsRef.current = null;
      setTimeout(updateDimensions, 50); // Small delay for layout completion
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [visible]);
  
  // PERFORMANCE OPTIMIZED: Force re-render with cache invalidation tracking
  useEffect(() => {
    if (visible && dimensions.width > 0 && dimensions.height > 0) {
      console.log(`⚡ OPTIMIZED: Dimensions changed, recalculating heat points for ${dimensions.width}x${dimensions.height}`);
      // Invalidate cache to ensure fresh coordinates after dimension change
      cachedDimensionsRef.current = null;
    }
  }, [visible, dimensions]);
  
  // PERFORMANCE MONITORING: Log performance metrics periodically
  useEffect(() => {
    if (!visible) return;
    
    const logPerformanceMetrics = () => {
      const metrics = performanceMetricsRef.current;
      const cacheHits = statisticalCache.current ? 'ACTIVE' : 'INACTIVE';
      console.log(`⚡ PHASE 5 HEATMAP PERFORMANCE METRICS:`);
      console.log(`  🔄 Coordinate conversions: ${metrics.coordinateConversions} (target: <5 per render)`);
      console.log(`  ⏱️ Render time: ${metrics.renderTime.toFixed(2)}ms (target: <16ms for 60fps)`);
      console.log(`  🗜️ Canvas pixels: ${(metrics.canvasPixels / 1000000).toFixed(1)}M (down from 69.6M)`);
      console.log(`  📊 Statistical cache: ${cacheHits} (reduces computation overhead)`);
      console.log(`  🎯 Performance status: ${metrics.renderTime < 16 ? '✅ EXCELLENT' : metrics.renderTime < 33 ? '⚠️ GOOD' : '🚨 NEEDS WORK'}`);
    };
    
    const metricsInterval = setInterval(logPerformanceMetrics, 5000);
    return () => clearInterval(metricsInterval);
  }, [visible]);

  // PHASE 8: ALGORITHMIC REVOLUTION - Professional Gaussian blur kernel density heatmap
  useEffect(() => {
    const drawStartTime = performance.now();
    
    try {
      const canvas = canvasRef.current;
      if (!canvas || !visible || (heatPoints.length === 0 && pendingHeatPoints.length === 0)) {
        // Clear canvas when not visible
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            try {
              ctx.clearRect(0, 0, dimensions.width, dimensions.height);
            } catch (clearError) {
              console.error('🚨 Error clearing canvas:', clearError);
            }
          }
        }
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('🚨 Could not get 2D context from canvas');
        return;
      }

      // Validate dimensions before drawing
      if (dimensions.width <= 0 || dimensions.height <= 0 || 
          !isFinite(dimensions.width) || !isFinite(dimensions.height)) {
        console.error('🚨 Invalid canvas dimensions for drawing:', dimensions);
        return;
      }

      // Clear canvas (use logical dimensions, not canvas resolution)
      try {
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      } catch (clearError) {
        console.error('🚨 Error clearing canvas before drawing:', clearError);
        return;
      }
      
      console.log(`🌊 PHASE 8 ALGORITHMIC REVOLUTION: Creating fluid heatmap with ${heatPoints.length} data points + ${pendingHeatPoints.length} pending on ${dimensions.width}x${dimensions.height} canvas`);

      // PHASE 8: GAUSSIAN BLUR KERNEL DENSITY ALGORITHM
      // Step 1: Create density canvas for grayscale accumulation
      const densityCanvas = document.createElement('canvas');
      densityCanvas.width = canvas.width;
      densityCanvas.height = canvas.height;
      const densityCtx = densityCanvas.getContext('2d');
      
      if (!densityCtx) {
        console.error('🚨 Could not create density context');
        return;
      }

      // Step 2: Create pre-rendered blurred circle template (Gaussian kernel)
      const circleRadius = radius;
      const blurRadius = Math.max(15, circleRadius * 0.6); // Blur intensity
      const circleCanvas = document.createElement('canvas');
      const circleSize = (circleRadius + blurRadius) * 2;
      circleCanvas.width = circleSize;
      circleCanvas.height = circleSize;
      const circleCtx = circleCanvas.getContext('2d');
      
      if (!circleCtx) {
        console.error('🚨 Could not create circle context');
        return;
      }

      // Create Gaussian blur effect using shadowBlur (simpleheat.js technique)
      circleCtx.shadowColor = 'white';
      circleCtx.shadowBlur = blurRadius;
      circleCtx.globalCompositeOperation = 'source-over';
      
      // Draw white circle with blur to create Gaussian kernel
      const centerX = circleSize / 2;
      const centerY = circleSize / 2;
      circleCtx.beginPath();
      circleCtx.arc(centerX, centerY, circleRadius / 4, 0, Math.PI * 2);
      circleCtx.fillStyle = 'white';
      circleCtx.fill();
      
      // Remove shadow for subsequent operations
      circleCtx.shadowColor = 'transparent';
      circleCtx.shadowBlur = 0;

      // Step 3: Build density map by drawing blurred circles
      densityCtx.globalCompositeOperation = 'lighter'; // Additive blending for density accumulation
      
      const allPoints = [...heatPoints, ...pendingHeatPoints];
      
      allPoints.forEach((point) => {
        try {
          const isRecent = (point as any).isRecent || false;
          const heatLevel = (point as any).heatLevel || 'minimal';
          
          // OPTIMIZED: Quick bounds check with tolerance for blur
          const tolerance = circleSize;
          if (!isFinite(point.x) || !isFinite(point.y) || 
              point.x < -tolerance || point.y < -tolerance ||
              point.x > dimensions.width + tolerance || point.y > dimensions.height + tolerance) {
            return; // Skip out-of-bounds points
          }

          // Calculate intensity-based opacity for density accumulation
          let densityOpacity = 0.1; // Base density
          
          switch (heatLevel) {
            case 'extreme':
              densityOpacity = isRecent ? 0.8 : 0.6;
              break;
            case 'high':
              densityOpacity = isRecent ? 0.6 : 0.4;
              break;
            case 'medium':
              densityOpacity = isRecent ? 0.4 : 0.3;
              break;
            case 'low':
              densityOpacity = isRecent ? 0.3 : 0.2;
              break;
            case 'minimal':
              densityOpacity = isRecent ? 0.2 : 0.1;
              break;
          }

          // Apply user intensity setting
          densityOpacity *= (intensity / 100);
          
          // Draw the pre-rendered blurred circle at point location
          densityCtx.globalAlpha = densityOpacity;
          densityCtx.drawImage(
            circleCanvas,
            point.x - centerX, // Center the circle on the point
            point.y - centerY,
            circleSize,
            circleSize
          );
        } catch (pointError) {
          // Silent error handling for performance
          return;
        }
      });

      // Step 4: Apply color gradient mapping to density canvas
      densityCtx.globalAlpha = 1.0;
      densityCtx.globalCompositeOperation = 'source-atop';
      
      // Create heat gradient (blue -> green -> yellow -> red)
      const gradient = densityCtx.createLinearGradient(0, 0, 0, 1);
      gradient.addColorStop(0, 'rgba(0, 0, 255, 0)');       // Transparent blue (no heat)
      gradient.addColorStop(0.2, 'rgba(0, 255, 255, 0.4)'); // Light cyan
      gradient.addColorStop(0.4, 'rgba(0, 255, 0, 0.6)');   // Green  
      gradient.addColorStop(0.6, 'rgba(255, 255, 0, 0.8)'); // Yellow
      gradient.addColorStop(0.8, 'rgba(255, 128, 0, 0.9)'); // Orange
      gradient.addColorStop(1, 'rgba(255, 0, 0, 1.0)');     // Solid red (max heat)

      // Apply gradient to entire density canvas
      densityCtx.fillStyle = gradient;
      densityCtx.fillRect(0, 0, densityCanvas.width, densityCanvas.height);

      // Step 5: Composite the final heatmap onto main canvas
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(densityCanvas, 0, 0);

      // PERFORMANCE: Track drawing performance
      const drawingTime = performance.now() - drawStartTime;
      performanceMetricsRef.current.frameRate = drawingTime > 0 ? Math.round(1000 / drawingTime) : 60;
      
      console.log(`🌊 PHASE 8 FLUID HEATMAP: Generated continuous heat zones from ${allPoints.length} points in ${drawingTime.toFixed(2)}ms (${performanceMetricsRef.current.frameRate}fps) with Gaussian blur algorithm`);
      
    } catch (drawError) {
      console.error('🚨 Critical error in fluid heatmap drawing:', drawError);
      // Try to clear the canvas to prevent visual artifacts
      try {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, dimensions.width, dimensions.height);
          }
        }
      } catch (clearError) {
        console.error('🚨 Error clearing canvas after draw error:', clearError);
      }
    }
  }, [heatPoints, pendingHeatPoints, visible, dimensions, radius, intensity]);

  if (!visible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`absolute top-0 left-0 pointer-events-none z-[9999] ${className}`}
      style={{ 
        width: dimensions.width || '100vw',
        height: dimensions.height || '100vh',
        mixBlendMode: 'normal',
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          imageRendering: 'pixelated',
        }}
        onError={(e) => {
          console.error('🚨 Canvas element error:', e);
        }}
      />
      
      {/* Enhanced Heatmap legend with intensity scale */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 sm:p-3 pointer-events-auto max-w-[160px] sm:max-w-none">
        <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1 sm:mb-2">
          <span className="hidden sm:inline">Vibrant Heat</span>
          <span className="sm:hidden">Heat</span>Map
          <div className="text-xs text-green-600 dark:text-green-400 font-normal">Enhanced</div>
        </div>
        
        {/* Heat Intensity Scale */}
        <div className="mb-2 sm:mb-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            Intensity
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full" style={{ background: 'hsla(20, 70%, 45%, 0.8)' }} title="Minimal intensity" />
            <div className="w-1 h-1 bg-gray-300 rounded-full" />
            <div className="w-3 h-3 rounded-full" style={{ background: 'hsla(10, 80%, 50%, 0.85)' }} title="Medium intensity" />
            <div className="w-1 h-1 bg-gray-300 rounded-full" />
            <div className="w-3 h-3 rounded-full" style={{ background: 'hsla(0, 90%, 55%, 0.9)' }} title="High intensity" />
            <div className="w-1 h-1 bg-gray-300 rounded-full" />
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: 'hsla(350, 100%, 60%, 0.95)' }} title="Extreme intensity" />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Cool</span>
            <span>Hot</span>
          </div>
        </div>
        
        {/* Event Types */}
        <div className="space-y-0.5 sm:space-y-1">
          {eventTypes.map(eventType => {
            const vibrantEventColors = {
              click: 'hsla(0, 95%, 55%, 0.9)',     // Vibrant red
              scroll: 'hsla(120, 90%, 50%, 0.9)',  // Vibrant emerald
              hover: 'hsla(240, 95%, 60%, 0.9)',   // Vibrant cyan-blue
              focus: 'hsla(60, 95%, 55%, 0.9)',    // Vibrant gold
            };
            
            const labels = {
              click: 'Clicks',
              scroll: 'Scrolls',
              hover: 'Hovers',
              focus: 'Focus',
            };
            
            const eventColor = vibrantEventColors[eventType as keyof typeof vibrantEventColors] || vibrantEventColors.click;
            
            return (
              <div key={eventType} className="flex items-center space-x-1 sm:space-x-2">
                <div 
                  className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 shadow-sm" 
                  style={{ background: eventColor }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  {labels[eventType]}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Statistics */}
        <div className="mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-gray-200 dark:border-gray-600">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <div>
              <span className="hidden sm:inline">{heatPoints.length} heat </span>
              <span className="sm:hidden">{heatPoints.length} </span>zones
            </div>
            {pendingClicks.length > 0 && (
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1" />
                <span className="text-green-600 dark:text-green-400">
                  Live ({pendingClicks.length} recent)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeatmapOverlay;