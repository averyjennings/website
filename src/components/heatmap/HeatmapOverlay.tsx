import { useEffect, useRef, useState, useMemo } from 'react';
import { HeatmapDataPoint, heatmapTracker } from '@/services/heatmap-tracker';

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

  // Poll for pending clicks to provide instant feedback
  useEffect(() => {
    if (!visible) {
      setPendingClicks([]);
      return;
    }

    const pollPendingClicks = async () => {
      try {
        // Get buffer data directly from the tracker for instant feedback
        const currentUrl = window.location.pathname + window.location.hash;
        const allData = await heatmapTracker.getHeatmapData(currentUrl, eventTypes, 0.1); // Very recent (6 minutes)
        
        // Filter to get only very recent clicks (last 2 minutes) as "pending"
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
        const recentClicks = allData.filter(point => point.timestamp > twoMinutesAgo);
        
        setPendingClicks(recentClicks);
      } catch (error) {
        console.error('Error polling pending clicks:', error);
      }
    };

    // Poll immediately and then every 100ms for truly instant feedback
    pollPendingClicks();
    const pollInterval = setInterval(pollPendingClicks, 100);

    return () => clearInterval(pollInterval);
  }, [visible, eventTypes]);

  // Filter and normalize data points with advanced proportional scaling
  const heatPoints = useMemo(() => {
    try {
      // Combine stable database data with pending clicks for instant feedback
      const stableData = data.filter(point => eventTypes.includes(point.eventType));
      const pendingData = pendingClicks.filter(point => eventTypes.includes(point.eventType));
      
      // Deduplicate by timestamp and position to avoid double-rendering
      const combinedData = [...stableData];
      pendingData.forEach(pendingPoint => {
        const isDuplicate = stableData.some(stablePoint => 
          Math.abs(stablePoint.x - pendingPoint.x) < 0.01 && 
          Math.abs(stablePoint.y - pendingPoint.y) < 0.01 &&
          Math.abs(new Date(stablePoint.timestamp).getTime() - new Date(pendingPoint.timestamp).getTime()) < 5000
        );
        if (!isDuplicate) {
          combinedData.push(pendingPoint);
        }
      });
      
      const filteredData = combinedData;
      
      if (filteredData.length === 0) return [];
      
      // Get current document dimensions for coordinate conversion with error handling
      const currentDocumentWidth = Math.max(
        1, // Minimum width to prevent division by zero
        document.documentElement?.scrollWidth || 0,
        document.documentElement?.offsetWidth || 0,  
        document.documentElement?.clientWidth || 0,
        document.body?.scrollWidth || 0,
        document.body?.offsetWidth || 0,
        window.innerWidth || 1920 // Fallback
      );
      
      const currentDocumentHeight = Math.max(
        1, // Minimum height to prevent division by zero
        document.documentElement?.scrollHeight || 0,
        document.documentElement?.offsetHeight || 0,
        document.documentElement?.clientHeight || 0,
        document.body?.scrollHeight || 0,
        document.body?.offsetHeight || 0,
        window.innerHeight || 1080 // Fallback
      );
      
      console.log(`🌐 Converting coordinates for ${currentDocumentWidth}x${currentDocumentHeight} document`);
    
    // Convert relative coordinates to current absolute coordinates with error handling
    const pointsWithAbsoluteCoords = filteredData.map(point => {
      // Validate coordinates
      const isValidX = typeof point.x === 'number' && !isNaN(point.x) && isFinite(point.x);
      const isValidY = typeof point.y === 'number' && !isNaN(point.y) && isFinite(point.y);
      
      if (!isValidX || !isValidY) {
        console.warn('🚨 Invalid coordinates detected:', { x: point.x, y: point.y, point });
        return null; // Skip invalid points
      }
      
      // Convert relative (0-1) coordinates to current absolute coordinates
      const absoluteX = Math.round(point.x * currentDocumentWidth);
      const absoluteY = Math.round(point.y * currentDocumentHeight);
      
      // Validate converted coordinates (more lenient bounds)
      if (absoluteX < -100 || absoluteY < -100 || 
          absoluteX > currentDocumentWidth + 100 || absoluteY > currentDocumentHeight + 100) {
        console.warn('🚨 Converted coordinates severely out of bounds:', { 
          original: { x: point.x, y: point.y }, 
          converted: { absoluteX, absoluteY },
          document: { width: currentDocumentWidth, height: currentDocumentHeight }
        });
        return null; // Skip severely out-of-bounds points only
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
    
    // Group points by proximity to reduce noise
    const groupedPoints = new Map<string, { count: number; x: number; y: number; eventType: HeatmapDataPoint['eventType']; isRecent: boolean }>();
    
    // Calculate what counts as "recent" (last 15 seconds for instant feedback)
    const recentThreshold = new Date(Date.now() - 15000).toISOString();
    
    pointsWithAbsoluteCoords.forEach(point => {
      // Create responsive grid-based grouping - smaller grid for better precision
      const isMobile = window.innerWidth < 768;
      const gridSize = isMobile ? 12 : 15; // Smaller grid for more detailed clustering
      const gridX = Math.floor(point.absoluteX / gridSize) * gridSize;
      const gridY = Math.floor(point.absoluteY / gridSize) * gridSize;
      const key = `${gridX}-${gridY}-${point.eventType}`;
      
      const isRecent = point.timestamp > recentThreshold;
      
      if (groupedPoints.has(key)) {
        const existing = groupedPoints.get(key)!;
        existing.count++;
        existing.x = (existing.x + point.absoluteX) / 2; // Average position
        existing.y = (existing.y + point.absoluteY) / 2;
        existing.isRecent = existing.isRecent || isRecent; // Mark as recent if any point is recent
      } else {
        groupedPoints.set(key, {
          count: 1,
          x: point.absoluteX,
          y: point.absoluteY,
          eventType: point.eventType,
          isRecent: isRecent,
        });
      }
    });

    // Convert to heat points with stable statistical distribution
    const points = Array.from(groupedPoints.values());
    const totalClicks = filteredData.length;
    const counts = points.map(p => p.count);
    const maxCount = Math.max(...counts, 1);
    const minCount = Math.min(...counts, 1);
    
    // Calculate statistical distribution based ONLY on stable database data to prevent shifting
    const stablePoints = Array.from(groupedPoints.values()).filter(point => {
      // Only include points that are not very recent (to maintain stable distribution)
      return !point.isRecent;
    });
    
    const stableCounts = stablePoints.length > 0 ? stablePoints.map(p => p.count) : counts;
    const sortedCounts = [...stableCounts].sort((a, b) => a - b);
    const p25 = sortedCounts[Math.floor(sortedCounts.length * 0.25)] || 1;
    const p50 = sortedCounts[Math.floor(sortedCounts.length * 0.50)] || 1;
    const p75 = sortedCounts[Math.floor(sortedCounts.length * 0.75)] || 1;
    const p90 = sortedCounts[Math.floor(sortedCounts.length * 0.90)] || 1;
    
    console.log(`🎨 Rendering ${points.length} heat points from ${totalClicks} total clicks`);
    console.log(`📊 Distribution: min=${minCount}, p25=${p25}, p50=${p50}, p75=${p75}, p90=${p90}, max=${maxCount}`);
    
    return points.map(point => {
      // Sophisticated intensity calculation with guaranteed visibility
      let normalizedIntensity;
      let heatLevel: 'minimal' | 'low' | 'medium' | 'high' | 'extreme';
      
      // Give instant feedback for very recent clicks (pending/new clicks)
      if (point.isRecent) {
        // Recent clicks always get high visibility for instant feedback
        heatLevel = 'high';
        normalizedIntensity = 0.8; // High visibility for immediate feedback
      } else {
        // Use statistical distribution for older, stable points
        if (point.count >= p90) {
          heatLevel = 'extreme';
          normalizedIntensity = 0.9 + ((point.count - p90) / Math.max(maxCount - p90, 1)) * 0.1; // 0.9-1.0
        } else if (point.count >= p75) {
          heatLevel = 'high';
          normalizedIntensity = 0.7 + ((point.count - p75) / Math.max(p90 - p75, 1)) * 0.2; // 0.7-0.9
        } else if (point.count >= p50) {
          heatLevel = 'medium';
          normalizedIntensity = 0.5 + ((point.count - p50) / Math.max(p75 - p50, 1)) * 0.2; // 0.5-0.7
        } else if (point.count >= p25) {
          heatLevel = 'low';
          normalizedIntensity = 0.3 + ((point.count - p25) / Math.max(p50 - p25, 1)) * 0.2; // 0.3-0.5
        } else {
          heatLevel = 'minimal';
          normalizedIntensity = 0.2 + ((point.count - minCount) / Math.max(p25 - minCount, 1)) * 0.1; // 0.2-0.3
        }
      }
      
      // Store normalized intensity without applying user setting yet
      const baseIntensity = normalizedIntensity * (point.isRecent ? 1.5 : 1); // Extra boost for recent
      
      return {
        x: point.x,
        y: point.y,
        intensity: baseIntensity, // Base intensity without user scaling
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
  }, [data, eventTypes, pendingClicks]); // Include pendingClicks for instant feedback

  // Update canvas dimensions when visibility changes or window resizes
  useEffect(() => {
    if (!visible) return;

    const updateDimensions = () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Get comprehensive document dimensions with fallbacks
        const width = Math.max(
          1, // Minimum to prevent zero dimensions
          window.innerWidth || 1920,
          document.documentElement?.scrollWidth || 0,
          document.documentElement?.offsetWidth || 0,
          document.documentElement?.clientWidth || 0,
          document.body?.scrollWidth || 0,
          document.body?.offsetWidth || 0
        );
        
        const height = Math.max(
          1, // Minimum to prevent zero dimensions
          window.innerHeight || 1080,
          document.documentElement?.scrollHeight || 0,
          document.documentElement?.offsetHeight || 0,
          document.documentElement?.clientHeight || 0,
          document.body?.scrollHeight || 0,
          document.body?.offsetHeight || 0
        );
        
        // Validate dimensions before applying
        if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
          console.error('🚨 Invalid canvas dimensions:', { width, height });
          return;
        }
        
        // Set high-DPI canvas resolution with safety checks
        const devicePixelRatio = Math.max(1, Math.min(3, window.devicePixelRatio || 1)); // Clamp DPR
        const canvasWidth = Math.min(32767, width * devicePixelRatio); // Max canvas size limit
        const canvasHeight = Math.min(32767, height * devicePixelRatio);
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // Scale canvas back down using CSS
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        
        // Scale the drawing context to match device pixel ratio
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(devicePixelRatio, devicePixelRatio);
        }
        
        setDimensions({ width, height });
        console.log(`🗺️ Canvas dimensions updated: ${width}x${height} (DPR: ${devicePixelRatio})`);
      } catch (error) {
        console.error('🚨 Error updating canvas dimensions:', error);
        // Set safe fallback dimensions
        setDimensions({ width: 1920, height: 1080 });
      }
    };

    // Update dimensions immediately and after a short delay for layout settling
    updateDimensions();
    const timeoutId = setTimeout(updateDimensions, 100);
    
    // Add event listeners for window resize and orientation change
    const handleResize = () => {
      console.log('📐 Window resized, updating heatmap canvas...');
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
  
  // Force re-render when dimensions change to update coordinate calculations
  useEffect(() => {
    if (visible && dimensions.width > 0 && dimensions.height > 0) {
      console.log(`🔄 Dimensions changed, recalculating heat points for ${dimensions.width}x${dimensions.height}`);
    }
  }, [visible, dimensions]);

  // Draw heatmap with comprehensive error handling
  useEffect(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || !visible || heatPoints.length === 0) {
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
      
      console.log(`🎨 Drawing ${heatPoints.length} heat points on canvas ${dimensions.width}x${dimensions.height}`);

    // Set blend mode for heat effect
    ctx.globalCompositeOperation = 'source-over'; // Changed from screen for better visibility

    // Advanced color mapping function for heat intensity
    const getHeatColor = (heatLevel: string, eventType: string, intensity: number, isRecent: boolean) => {
      // Base color palette for different event types
      const eventBaseHues = {
        click: 0,     // Red spectrum (0°)
        scroll: 120,  // Green spectrum (120°)
        hover: 240,   // Blue spectrum (240°)
        focus: 60,    // Yellow spectrum (60°)
      };
      
      const baseHue = eventBaseHues[eventType as keyof typeof eventBaseHues] || 0;
      
      // Heat level color mapping with sophisticated gradients
      let hue, saturation, lightness;
      
      switch (heatLevel) {
        case 'extreme':
          hue = baseHue; // Pure base color for maximum intensity
          saturation = 100;
          lightness = 50 + (intensity * 20); // 50-70% lightness
          break;
        case 'high':
          hue = baseHue + 10; // Slight hue shift
          saturation = 90;
          lightness = 45 + (intensity * 25); // 45-70% lightness
          break;
        case 'medium':
          hue = baseHue + 20; // More hue shift toward cooler
          saturation = 80;
          lightness = 40 + (intensity * 30); // 40-70% lightness
          break;
        case 'low':
          hue = baseHue + 40; // Cooler colors
          saturation = 70;
          lightness = 35 + (intensity * 35); // 35-70% lightness
          break;
        case 'minimal':
          hue = baseHue + 60; // Much cooler colors (towards blue)
          saturation = 60;
          lightness = 30 + (intensity * 40); // 30-70% lightness
          break;
        default:
          hue = baseHue;
          saturation = 70;
          lightness = 50;
      }
      
      // Recent clicks get slightly warmer (lower hue) and brighter
      if (isRecent) {
        hue = Math.max(0, hue - 15);
        lightness = Math.min(85, lightness + 15);
        saturation = Math.min(100, saturation + 10);
      }
      
      // Normalize hue to 0-360 range
      hue = ((hue % 360) + 360) % 360;
      
      return { hue, saturation, lightness };
    };

    // Draw each heat point with sophisticated color gradient
    heatPoints.forEach((point, index) => {
      try {
        const isRecent = (point as any).isRecent;
        const heatLevel = (point as any).heatLevel || 'minimal';
        
        // Validate point coordinates (more lenient)
        if (!isFinite(point.x) || !isFinite(point.y) || 
            point.x < -200 || point.y < -200 ||
            point.x > dimensions.width + 200 || point.y > dimensions.height + 200) {
          console.warn(`🚨 Skipping severely invalid heat point at index ${index}:`, point);
          return;
        }
      
      // Dynamic radius based on heat level and recent status
      let currentRadius = radius;
      switch (heatLevel) {
        case 'extreme':
          currentRadius = radius * 1.4;
          break;
        case 'high':
          currentRadius = radius * 1.2;
          break;
        case 'medium':
          currentRadius = radius * 1.0;
          break;
        case 'low':
          currentRadius = radius * 0.9;
          break;
        case 'minimal':
          currentRadius = radius * 0.8;
          break;
      }
      
      if (isRecent) {
        currentRadius *= 1.1; // Recent clicks are slightly larger
      }
      
      const { hue, saturation, lightness } = getHeatColor(heatLevel, point.eventType, point.intensity, isRecent);
      
      // Create sophisticated radial gradient
      const gradient = ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, currentRadius
      );
      
      // Apply user intensity setting at render time to prevent recalculation flicker
      const alpha = Math.max(0.15, point.intensity * (intensity / 100)); // Apply user intensity here
      
      // Multi-stop gradient for realistic heat effect
      const centerColor = `hsla(${hue}, ${saturation}%, ${Math.min(85, lightness + 20)}%, ${alpha})`;
      const midColor = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha * 0.8})`;
      const edgeColor = `hsla(${hue}, ${Math.max(40, saturation - 20)}%, ${Math.max(30, lightness - 20)}%, ${alpha * 0.3})`;
      const outerColor = `hsla(${hue}, ${Math.max(20, saturation - 40)}%, ${Math.max(20, lightness - 30)}%, 0)`;
      
      gradient.addColorStop(0, centerColor);
      gradient.addColorStop(0.3, midColor);
      gradient.addColorStop(0.7, edgeColor);
      gradient.addColorStop(1, outerColor);

      ctx.fillStyle = gradient;
      
      // Draw main heat circle
      ctx.beginPath();
      ctx.arc(point.x, point.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Add intensity rings for high-activity areas
      if (heatLevel === 'extreme' || heatLevel === 'high') {
        const ringGradient = ctx.createRadialGradient(
          point.x, point.y, currentRadius * 0.6,
          point.x, point.y, currentRadius * 1.2
        );
        
        const ringAlpha = alpha * 0.3;
        ringGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${ringAlpha})`);
        ringGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`);
        
        ctx.fillStyle = ringGradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, currentRadius * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Add subtle pulse effect for very recent clicks
      if (isRecent && point.intensity > 0.4) {
        const pulseGradient = ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, currentRadius * 0.4
        );
        pulseGradient.addColorStop(0, `hsla(${hue}, 100%, 90%, 0.4)`);
        pulseGradient.addColorStop(1, `hsla(${hue}, 100%, 90%, 0)`);
        
        ctx.fillStyle = pulseGradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, currentRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      } catch (pointError) {
        console.error(`🚨 Error drawing heat point at index ${index}:`, pointError, point);
        // Continue to next point instead of crashing
      }
    });

    // Reset composite operation
    try {
      ctx.globalCompositeOperation = 'source-over';
    } catch (resetError) {
      console.error('🚨 Error resetting composite operation:', resetError);
    }
    
    } catch (drawError) {
      console.error('🚨 Critical error in heatmap drawing:', drawError);
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
  }, [heatPoints, visible, dimensions, radius]);

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
          <span className="hidden sm:inline">Heat </span>Map
        </div>
        
        {/* Heat Intensity Scale */}
        <div className="mb-2 sm:mb-3">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            Intensity
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(240, 60%, 50%)' }} title="Cool (few clicks)" />
            <div className="w-1 h-1 bg-gray-300 rounded-full" />
            <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(60, 80%, 50%)' }} title="Warm (medium clicks)" />
            <div className="w-1 h-1 bg-gray-300 rounded-full" />
            <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(0, 100%, 50%)' }} title="Hot (many clicks)" />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Cool</span>
            <span>Hot</span>
          </div>
        </div>
        
        {/* Event Types */}
        <div className="space-y-0.5 sm:space-y-1">
          {eventTypes.map(eventType => {
            const baseHues = {
              click: 0,     // Red spectrum
              scroll: 120,  // Green spectrum
              hover: 240,   // Blue spectrum
              focus: 60,    // Yellow spectrum
            };
            
            const labels = {
              click: 'Clicks',
              scroll: 'Scrolls',
              hover: 'Hovers',
              focus: 'Focus',
            };
            
            const hue = baseHues[eventType as keyof typeof baseHues] || 0;
            
            return (
              <div key={eventType} className="flex items-center space-x-1 sm:space-x-2">
                <div 
                  className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                  style={{ background: `hsl(${hue}, 80%, 50%)` }}
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