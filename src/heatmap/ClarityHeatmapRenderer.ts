export interface HeatmapPoint {
  x: number;
  y: number;
  value: number;
}

export interface HeatmapConfig {
  radius?: number;
  opacity?: number;
  gradient?: string[];
  maxIntensity?: number;
  scaleMode?: 'linear' | 'logarithmic' | 'sqrt';
  intensityRange?: { min: number; max: number };
}

/**
 * Microsoft Clarity-style heatmap renderer
 * Optimized for high performance with GPU acceleration
 */
export class ClarityHeatmapRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenRing: HTMLCanvasElement;
  private gradientCanvas: HTMLCanvasElement;
  private gradientData!: Uint8ClampedArray;
  private container: HTMLElement;
  
  private radius: number = 25;
  private opacity: number = 0.8;
  private gradientColors: string[] = ["blue", "cyan", "lime", "yellow", "red"];
  private maxIntensity: number = 1000; // Default max intensity for normalization
  private scaleMode: 'linear' | 'logarithmic' | 'sqrt' = 'logarithmic';
  private intensityRange = { min: 0.1, max: 1.0 }; // Min/max opacity range
  
  constructor(container: HTMLElement, config: HeatmapConfig = {}) {
    this.container = container;
    this.radius = config.radius || this.radius;
    this.opacity = config.opacity || this.opacity;
    this.gradientColors = config.gradient || this.gradientColors;
    this.maxIntensity = config.maxIntensity || this.maxIntensity;
    this.scaleMode = config.scaleMode || this.scaleMode;
    this.intensityRange = config.intensityRange || this.intensityRange;
    
    // Create main canvas
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    
    // Setup canvas to cover entire document
    const fullHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );
    
    // Handle device pixel ratio for crisp rendering on mobile
    const dpr = window.devicePixelRatio || 1;
    
    // Use document.documentElement.clientWidth to avoid scrollbar width
    const viewportWidth = document.documentElement.clientWidth;
    
    this.canvas.width = viewportWidth * dpr;
    this.canvas.height = fullHeight * dpr;
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = viewportWidth + 'px';
    this.canvas.style.height = fullHeight + 'px';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '10000';
    
    // Scale context for device pixel ratio
    this.ctx.scale(dpr, dpr);
    
    // Append to container instead of body
    this.container.appendChild(this.canvas);
    
    // Add a class for debugging
    this.canvas.className = 'heatmap-canvas';
    
    // Log canvas creation
    console.log('Heatmap canvas created:', {
      width: this.canvas.width,
      height: this.canvas.height,
      styleWidth: this.canvas.style.width,
      styleHeight: this.canvas.style.height,
      position: this.canvas.style.position
    });
    
    // Create offscreen canvases
    this.offscreenRing = document.createElement('canvas');
    this.gradientCanvas = document.createElement('canvas');
    
    // Initialize offscreen components
    this.createOffscreenRing();
    this.createGradientLookup();
  }
  
  private createOffscreenRing(): void {
    const size = this.radius * 2;
    this.offscreenRing.width = size;
    this.offscreenRing.height = size;
    
    const ctx = this.offscreenRing.getContext('2d')!;
    const center = this.radius;
    
    // Create radial gradient
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, this.radius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    // Draw circle
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  
  private createGradientLookup(): void {
    this.gradientCanvas.width = 256;
    this.gradientCanvas.height = 1;
    
    const ctx = this.gradientCanvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    
    // Build gradient from color stops
    const colorStops = this.gradientColors.length;
    for (let i = 0; i < colorStops; i++) {
      gradient.addColorStop(i / (colorStops - 1), this.gradientColors[i]);
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 1);
    
    // Extract gradient data for fast lookup
    const imageData = ctx.getImageData(0, 0, 256, 1);
    this.gradientData = imageData.data;
  }
  
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
  
  public render(points: HeatmapPoint[]): void {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Debug: Draw canvas boundary
    if (window.location.hash === '#debug') {
      this.ctx.strokeStyle = 'red';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(0, 0, this.canvas.width - 1, this.canvas.height - 1);
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Create temporary canvas for grayscale rendering
    const tempCanvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    const viewportWidth = document.documentElement.clientWidth;
    tempCanvas.width = viewportWidth;
    tempCanvas.height = this.canvas.height / dpr;
    const tempCtx = tempCanvas.getContext('2d')!;
    
    // Find max value for normalization
    const maxValue = Math.max(...points.map(p => p.value), 1);
    const dynamicMax = Math.max(maxValue, this.maxIntensity);
    
    // Log scaling info for debugging
    if (points.length > 0) {
      const totalClicks = points.reduce((sum, p) => sum + p.value, 0);
      console.log(`🔥 Heatmap rendering: ${points.length} points, ${totalClicks} total clicks, max: ${maxValue}, scale: ${this.scaleMode}`);
    }
    
    // Draw all points in grayscale
    tempCtx.globalCompositeOperation = 'lighter';
    
    for (const point of points) {
      // Calculate intensity based on scale mode
      let intensity: number;
      
      switch (this.scaleMode) {
        case 'logarithmic':
          // Logarithmic scaling for better distribution across wide ranges
          // Add 1 to avoid log(0)
          intensity = Math.log(point.value + 1) / Math.log(dynamicMax + 1);
          break;
          
        case 'sqrt':
          // Square root scaling - less aggressive than log
          intensity = Math.sqrt(point.value) / Math.sqrt(dynamicMax);
          break;
          
        case 'linear':
        default:
          // Original linear scaling
          intensity = point.value / dynamicMax;
          break;
      }
      
      // Map intensity to opacity range
      const { min, max } = this.intensityRange;
      const alpha = (min + (intensity * (max - min))) * this.opacity;
      tempCtx.globalAlpha = Math.min(1, alpha);
      
      // Draw pre-rendered ring at point location
      tempCtx.drawImage(
        this.offscreenRing,
        point.x - this.radius,
        point.y - this.radius
      );
    }
    
    // Get grayscale image data
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const pixels = imageData.data;
    
    // Colorize based on gradient lookup
    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3];
      
      if (alpha > 0) {
        // Map alpha to gradient position
        const gradientIndex = Math.min(255, alpha) * 4;
        
        pixels[i] = this.gradientData[gradientIndex];     // R
        pixels[i + 1] = this.gradientData[gradientIndex + 1]; // G
        pixels[i + 2] = this.gradientData[gradientIndex + 2]; // B
      }
    }
    
    // Draw colorized result
    // Note: putImageData ignores the canvas transform, so we need to account for DPR
    tempCtx.putImageData(imageData, 0, 0);
    
    // Draw the temp canvas onto the main canvas
    // The main canvas has scale(dpr, dpr) applied, so we draw at 1:1
    this.ctx.drawImage(tempCanvas, 0, 0);
  }
  
  public clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
  }
  
  public updateCanvasSize(): void {
    const fullHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );
    
    const dpr = window.devicePixelRatio || 1;
    const viewportWidth = document.documentElement.clientWidth;
    
    this.canvas.width = viewportWidth * dpr;
    this.canvas.height = fullHeight * dpr;
    this.canvas.style.width = viewportWidth + 'px';
    this.canvas.style.height = fullHeight + 'px';
    
    // Reset and scale context for device pixel ratio
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }
  
  public updateConfig(config: HeatmapConfig): void {
    if (config.radius && config.radius !== this.radius) {
      this.radius = config.radius;
      this.createOffscreenRing();
    }
    
    if (config.opacity) {
      this.opacity = config.opacity;
    }
    
    if (config.gradient) {
      this.gradientColors = config.gradient;
      this.createGradientLookup();
    }
    
    if (config.maxIntensity !== undefined) {
      this.maxIntensity = config.maxIntensity;
    }
    
    if (config.scaleMode) {
      this.scaleMode = config.scaleMode;
    }
    
    if (config.intensityRange) {
      this.intensityRange = config.intensityRange;
    }
  }
  
  public destroy(): void {
    this.canvas.remove();
  }
}