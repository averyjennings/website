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

interface HeatPoint {
  x: number;
  y: number;
  intensity: number;
  eventType: HeatmapDataPoint['eventType'];
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
      // Create grid-based grouping (every 20px)
      const gridSize = 20;
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

      const rect = container.getBoundingClientRect();
      const { width, height } = rect;
      
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
    };

    updateDimensions();
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
      className={`fixed inset-0 pointer-events-none z-50 ${className}`}
      style={{ 
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
      
      {/* Heatmap legend */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 pointer-events-auto">
        <div className="text-xs font-medium text-gray-900 dark:text-white mb-2">
          Heatmap Legend
        </div>
        <div className="space-y-1">
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
              <div key={eventType} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${colors[eventType]}`} />
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {labels[eventType]}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {heatPoints.length} data points
        </div>
      </div>
    </div>
  );
}

export default HeatmapOverlay;