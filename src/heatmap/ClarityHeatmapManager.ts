/**
 * Complete Heatmap Manager based on Microsoft Clarity's architecture
 * Integrates rendering, data processing, and interaction handling
 */

import { ClarityHeatmapRenderer } from './ClarityHeatmapRenderer';
import { HeatmapDataProcessor } from './HeatmapDataProcessor';

export interface HeatmapOptions {
  container: HTMLElement;
  radius?: number;
  opacity?: number;
  gradient?: string[];
  gridSize?: number;
  minClicks?: number;
  maxClicks?: number;
}

export interface ClickEvent {
  x: number;
  y: number;
  timestamp: number;
  element?: string;
  viewport?: { width: number; height: number };
}

export type HeatmapType = 'click' | 'scroll' | 'move';

export class ClarityHeatmapManager {
  public renderer: ClarityHeatmapRenderer;
  private dataProcessor: HeatmapDataProcessor;
  private isVisible: boolean = false;
  private currentType: HeatmapType = 'click';
  private animationFrame: number | null = null;
  
  constructor(options: HeatmapOptions) {
    
    // Initialize renderer
    this.renderer = new ClarityHeatmapRenderer({
      radius: options.radius,
      opacity: options.opacity,
      gradient: options.gradient
    });
    
    // Initialize data processor
    this.dataProcessor = new HeatmapDataProcessor();
    
    // Setup window resize listener for full viewport coverage
    window.addEventListener('resize', this.handleWindowResize.bind(this));
    
    // Setup scroll listener for viewport changes
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
  }
  
  /**
   * Add click data to heatmap
   */
  public addClick(event: ClickEvent): void {
    this.dataProcessor.addClick({
      x: event.x,
      y: event.y,
      timestamp: event.timestamp,
      element: event.element,
      viewport: event.viewport
    });
    
    // Render immediately for responsiveness
    this.render();
  }
  
  /**
   * Add multiple clicks at once
   */
  public addClicks(events: ClickEvent[]): void {
    events.forEach(event => {
      this.dataProcessor.addClick({
        x: event.x,
        y: event.y,
        timestamp: event.timestamp,
        element: event.element,
        viewport: event.viewport
      });
    });
    
    this.scheduleRender();
  }
  
  /**
   * Show or hide heatmap
   */
  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    
    if (visible) {
      this.render();
    } else {
      this.renderer.clear();
    }
  }
  
  /**
   * Change heatmap type
   */
  public setType(type: HeatmapType): void {
    this.currentType = type;
    this.render();
  }
  
  /**
   * Update heatmap configuration
   */
  public updateConfig(config: {
    radius?: number;
    opacity?: number;
    gradient?: string[];
  }): void {
    this.renderer.updateConfig(config);
    this.render();
  }
  
  /**
   * Get click statistics
   */
  public getStatistics() {
    return this.dataProcessor.getStatistics();
  }
  
  /**
   * Clear all heatmap data
   */
  public clear(): void {
    this.dataProcessor.clear();
    this.renderer.clear();
  }
  
  /**
   * Export heatmap data
   */
  public exportData() {
    return {
      type: this.currentType,
      clicks: this.dataProcessor.export(),
      timestamp: Date.now()
    };
  }
  
  /**
   * Import heatmap data
   */
  public importData(data: {
    type: HeatmapType;
    clicks: any[];
    timestamp: number;
  }): void {
    this.currentType = data.type;
    this.dataProcessor.import(data.clicks);
    this.render();
  }
  
  /**
   * Render heatmap with current data
   */
  public render(): void {
    if (!this.isVisible) return;
    
    // Get aggregated click data
    const clicks = this.dataProcessor.getAggregatedClicks();
    
    // Transform to render format
    const renderData = clicks.map(click => ({
      x: click.x,
      y: click.y,
      value: click.count
    }));
    
    // Render heatmap (will show debug boundaries if #debug in URL)
    this.renderer.render(renderData);
  }
  
  /**
   * Schedule render on next animation frame
   */
  private scheduleRender(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    this.animationFrame = requestAnimationFrame(() => {
      this.render();
      this.animationFrame = null;
    });
  }
  
  /**
   * Handle window resize
   */
  private handleWindowResize(): void {
    this.renderer.updateCanvasSize();
    this.render();
  }
  
  /**
   * Handle scroll events
   */
  private handleScroll(): void {
    // Re-render on scroll if visible
    if (this.isVisible) {
      this.scheduleRender();
    }
  }
  
  /**
   * Generate sample data for testing
   */
  public generateSampleData(count: number = 100): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const clicks: ClickEvent[] = [];
    
    // Generate clustered clicks
    const clusters = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < count; i++) {
      // Pick a cluster
      const cluster = Math.floor(Math.random() * clusters);
      
      // Generate cluster center
      const centerX = width * (0.2 + (cluster / clusters) * 0.6);
      const centerY = height * (0.2 + Math.random() * 0.6);
      
      // Add some spread
      const spread = 50 + Math.random() * 100;
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * spread;
      
      clicks.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        timestamp: Date.now() - Math.random() * 3600000 // Last hour
      });
    }
    
    this.addClicks(clicks);
  }
  
  /**
   * Destroy heatmap and cleanup
   */
  public destroy(): void {
    // Cancel pending renders
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    // Remove listeners
    window.removeEventListener('resize', this.handleWindowResize.bind(this));
    window.removeEventListener('scroll', this.handleScroll.bind(this));
    
    // Cleanup renderer
    this.renderer.destroy();
    
    // Clear data
    this.dataProcessor.clear();
  }
}