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

  // Filter and normalize data points
  const heatPoints = useMemo(() => {
    const filteredData = data.filter(point => eventTypes.includes(point.eventType));
    
    // Group points by proximity to reduce noise
    const groupedPoints = new Map<string, { count: number; x: number; y: number; eventType: HeatmapDataPoint['eventType'] }>();
    
    filteredData.forEach(point => {
      // Create responsive grid-based grouping
      const isMobile = window.innerWidth < 768;
      const gridSize = isMobile ? 15 : 20;
      const gridX = Math.floor(point.x / gridSize) * gridSize;
      const gridY = Math.floor(point.y / gridSize) * gridSize;
      const key = `${gridX}-${gridY}-${point.eventType}`;
      
      if (groupedPoints.has(key)) {
        const existing = groupedPoints.get(key)!;
        existing.count++;
        existing.x = (existing.x + point.x) / 2; // Average position
        existing.y = (existing.y + point.y) / 2;
      } else {
        groupedPoints.set(key, {
          count: 1,
          x: point.x,
          y: point.y,
          eventType: point.eventType,
        });
      }
    });

    // Convert to heat points with normalized intensity
    const points = Array.from(groupedPoints.values());
    const maxCount = Math.max(...points.map(p => p.count), 1);
    
    return points.map(point => ({
      x: point.x,
      y: point.y,
      intensity: (point.count / maxCount) * (intensity / 100),
      eventType: point.eventType,
    }));
  }, [data, eventTypes, intensity]);

  // Update canvas dimensions
  useEffect(() => {
    const updateDimensions = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      
      if (!container || !canvas) return;

      // Use document dimensions instead of viewport dimensions
      const width = Math.max(
        document.body.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.clientWidth,
        document.documentElement.scrollWidth,
        document.documentElement.offsetWidth
      );
      
      const height = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      
      // Set actual canvas size
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      
      // Scale canvas back down using CSS  
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      // Scale the drawing context
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
      
      setDimensions({ width, height });
      console.log('🗺️ Heatmap overlay dimensions updated:', { width, height });
    };

    // Add a small delay to ensure document is fully loaded
    const initDimensions = () => {
      updateDimensions();
      // Also update after a short delay to catch any dynamic content
      setTimeout(updateDimensions, 1000);
    };

    initDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

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

    // Set blend mode for heat effect
    ctx.globalCompositeOperation = 'screen';

    // Color mapping for different event types
    const eventColors = {
      click: { r: 255, g: 0, b: 0 },     // Red for clicks
      scroll: { r: 0, g: 255, b: 0 },   // Green for scrolls
      hover: { r: 0, g: 0, b: 255 },    // Blue for hovers
      focus: { r: 255, g: 255, b: 0 },  // Yellow for focus
    };

    // Draw each heat point
    heatPoints.forEach(point => {
      const color = eventColors[point.eventType] || eventColors.click;
      
      // Create radial gradient
      const gradient = ctx.createRadialGradient(
        point.x, point.y, 0,
        point.x, point.y, radius
      );
      
      const alpha = point.intensity;
      gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
      gradient.addColorStop(0.6, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.5})`);
      gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

      ctx.fillStyle = gradient;
      
      // Draw circle
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();
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
        width: dimensions.width || '100%',
        height: dimensions.height || '100vh',
        mixBlendMode: 'multiply',
        opacity: 0.7,
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          imageRendering: 'pixelated', // Prevents smoothing for crisp heat points
        }}
      />
      
      {/* Heatmap legend - Mobile responsive */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 sm:p-3 pointer-events-auto max-w-[140px] sm:max-w-none">
        <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1 sm:mb-2">
          <span className="hidden sm:inline">Heatmap </span>Legend
        </div>
        <div className="space-y-0.5 sm:space-y-1">
          {eventTypes.map(eventType => {
            const colors = {
              click: 'bg-red-500',
              scroll: 'bg-green-500',
              hover: 'bg-blue-500',
              focus: 'bg-yellow-500',
            };
            
            const labels = {
              click: 'Clicks',
              scroll: 'Scrolls',
              hover: 'Hovers',
              focus: 'Focus',
            };
            
            return (
              <div key={eventType} className="flex items-center space-x-1 sm:space-x-2">
                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${colors[eventType]} flex-shrink-0`} />
                <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  {labels[eventType]}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-1 sm:mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="hidden sm:inline">{heatPoints.length} data </span>
          <span className="sm:hidden">{heatPoints.length} </span>points
        </div>
      </div>
    </div>
  );
}

export default HeatmapOverlay;