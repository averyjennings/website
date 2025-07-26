import { useEffect, useRef, useState, useMemo } from 'react';
import { HeatmapDataPoint } from '@/services/heatmap-tracker';

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

  // Filter and normalize data points with advanced proportional scaling
  const heatPoints = useMemo(() => {
    const filteredData = data.filter(point => eventTypes.includes(point.eventType));
    
    if (filteredData.length === 0) return [];
    
    // Group points by proximity to reduce noise
    const groupedPoints = new Map<string, { count: number; x: number; y: number; eventType: HeatmapDataPoint['eventType']; isRecent: boolean }>();
    
    // Calculate what counts as "recent" (last 30 seconds for immediate feedback)
    const recentThreshold = new Date(Date.now() - 30000).toISOString();
    
    filteredData.forEach(point => {
      // Create responsive grid-based grouping - smaller grid for better precision
      const isMobile = window.innerWidth < 768;
      const gridSize = isMobile ? 12 : 15; // Smaller grid for more detailed clustering
      const gridX = Math.floor(point.x / gridSize) * gridSize;
      const gridY = Math.floor(point.y / gridSize) * gridSize;
      const key = `${gridX}-${gridY}-${point.eventType}`;
      
      const isRecent = point.timestamp > recentThreshold;
      
      if (groupedPoints.has(key)) {
        const existing = groupedPoints.get(key)!;
        existing.count++;
        existing.x = (existing.x + point.x) / 2; // Average position
        existing.y = (existing.y + point.y) / 2;
        existing.isRecent = existing.isRecent || isRecent; // Mark as recent if any point is recent
      } else {
        groupedPoints.set(key, {
          count: 1,
          x: point.x,
          y: point.y,
          eventType: point.eventType,
          isRecent: isRecent,
        });
      }
    });

    // Convert to heat points with sophisticated global proportional scaling
    const points = Array.from(groupedPoints.values());
    const totalClicks = filteredData.length;
    const counts = points.map(p => p.count);
    const maxCount = Math.max(...counts, 1);
    const minCount = Math.min(...counts, 1);
    
    // Calculate statistical distribution for better color mapping
    const sortedCounts = [...counts].sort((a, b) => a - b);
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
      
      // Map counts to heat levels using percentiles for balanced distribution
      if (point.count >= p90) {
        heatLevel = 'extreme';
        normalizedIntensity = 0.9 + ((point.count - p90) / (maxCount - p90)) * 0.1; // 0.9-1.0
      } else if (point.count >= p75) {
        heatLevel = 'high';
        normalizedIntensity = 0.7 + ((point.count - p75) / (p90 - p75)) * 0.2; // 0.7-0.9
      } else if (point.count >= p50) {
        heatLevel = 'medium';
        normalizedIntensity = 0.5 + ((point.count - p50) / (p75 - p50)) * 0.2; // 0.5-0.7
      } else if (point.count >= p25) {
        heatLevel = 'low';
        normalizedIntensity = 0.3 + ((point.count - p25) / (p50 - p25)) * 0.2; // 0.3-0.5
      } else {
        heatLevel = 'minimal';
        normalizedIntensity = 0.2 + ((point.count - minCount) / Math.max(p25 - minCount, 1)) * 0.1; // 0.2-0.3
      }
      
      // Apply user intensity setting while maintaining relative relationships
      const finalIntensity = Math.max(
        0.15, // Absolute minimum visibility - nothing disappears completely
        normalizedIntensity * (intensity / 100) * (point.isRecent ? 1.3 : 1)
      );
      
      return {
        x: point.x,
        y: point.y,
        intensity: finalIntensity,
        heatLevel,
        count: point.count,
        eventType: point.eventType,
        isRecent: point.isRecent,
      };
    });
  }, [data, eventTypes, intensity]);

  // Update canvas dimensions when visibility changes
  useEffect(() => {
    if (!visible) return;

    const updateDimensions = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Use simple viewport and document dimensions
      const width = Math.max(window.innerWidth, document.documentElement.scrollWidth);
      const height = Math.max(window.innerHeight, document.documentElement.scrollHeight);
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      setDimensions({ width, height });
      console.log('🗺️ Canvas dimensions set:', { width, height });
    };

    // Update dimensions immediately and after a short delay
    updateDimensions();
    const timeoutId = setTimeout(updateDimensions, 100);
    
    // Add event listener for window resize
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateDimensions);
    };
  }, [visible]);

  // Draw heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visible || heatPoints.length === 0) {
      // Clear canvas when not visible
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, dimensions.width, dimensions.height);
        }
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
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
    heatPoints.forEach((point) => {
      const isRecent = (point as any).isRecent;
      const heatLevel = (point as any).heatLevel || 'minimal';
      
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
      
      const alpha = Math.max(0.15, point.intensity); // Ensure minimum visibility
      
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
    });

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeatmapOverlay;