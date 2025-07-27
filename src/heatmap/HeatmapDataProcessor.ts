/**
 * Heatmap Data Processor based on Microsoft Clarity's approach
 * Handles click aggregation, normalization, and element tracking
 */

interface RawClickData {
  x: number;
  y: number;
  timestamp: number;
  element?: string;
  viewport?: { width: number; height: number };
}

interface AggregatedClick {
  x: number;
  y: number;
  count: number;
  element?: string;
}

interface ElementBounds {
  top: number;
  left: number;
  width: number;
  height: number;
}

export class HeatmapDataProcessor {
  private clickData: Map<string, AggregatedClick> = new Map();
  private gridSize: number = 10; // Pixel grid for aggregation
  private maxScale: number = 32767; // 2^15 - 1 for normalization
  
  /**
   * Add raw click data and aggregate by position
   */
  public addClick(click: RawClickData): void {
    // Normalize coordinates to grid
    const gridX = Math.floor(click.x / this.gridSize) * this.gridSize;
    const gridY = Math.floor(click.y / this.gridSize) * this.gridSize;
    
    // Create unique key for position
    const key = `${gridX},${gridY}`;
    
    const existing = this.clickData.get(key);
    if (existing) {
      existing.count++;
    } else {
      this.clickData.set(key, {
        x: gridX,
        y: gridY,
        count: 1,
        element: click.element
      });
    }
  }
  
  /**
   * Add multiple clicks at once
   */
  public addClicks(clicks: RawClickData[]): void {
    clicks.forEach(click => this.addClick(click));
  }
  
  /**
   * Get aggregated clicks for rendering
   */
  public getAggregatedClicks(): AggregatedClick[] {
    return Array.from(this.clickData.values());
  }
  
  /**
   * Get clicks filtered by element selector
   */
  public getClicksByElement(selector: string): AggregatedClick[] {
    return Array.from(this.clickData.values())
      .filter(click => click.element === selector);
  }
  
  /**
   * Transform clicks relative to element bounds
   */
  public transformClicksToElement(
    clicks: AggregatedClick[],
    elementBounds: ElementBounds
  ): { x: number; y: number; value: number }[] {
    return clicks
      .filter(click => {
        // Check if click is within element bounds
        return click.x >= elementBounds.left &&
               click.x <= elementBounds.left + elementBounds.width &&
               click.y >= elementBounds.top &&
               click.y <= elementBounds.top + elementBounds.height;
      })
      .map(click => ({
        x: click.x - elementBounds.left,
        y: click.y - elementBounds.top,
        value: click.count
      }));
  }
  
  /**
   * Normalize click coordinates to scale (like Clarity does)
   */
  public normalizeCoordinates(
    x: number,
    y: number,
    viewport: { width: number; height: number }
  ): { x: number; y: number } {
    return {
      x: Math.round((x / viewport.width) * this.maxScale),
      y: Math.round((y / viewport.height) * this.maxScale)
    };
  }
  
  /**
   * Denormalize coordinates back to pixel values
   */
  public denormalizeCoordinates(
    x: number,
    y: number,
    viewport: { width: number; height: number }
  ): { x: number; y: number } {
    return {
      x: Math.round((x / this.maxScale) * viewport.width),
      y: Math.round((y / this.maxScale) * viewport.height)
    };
  }
  
  /**
   * Get click density statistics
   */
  public getStatistics() {
    const clicks = this.getAggregatedClicks();
    const totalClicks = clicks.reduce((sum, click) => sum + click.count, 0);
    const maxClicks = Math.max(...clicks.map(c => c.count), 0);
    
    return {
      totalClicks,
      uniquePositions: clicks.length,
      maxClicksPerPosition: maxClicks,
      averageClicksPerPosition: totalClicks / clicks.length || 0
    };
  }
  
  /**
   * Clear all click data
   */
  public clear(): void {
    this.clickData.clear();
  }
  
  /**
   * Export click data for persistence
   */
  public export(): AggregatedClick[] {
    return this.getAggregatedClicks();
  }
  
  /**
   * Import click data
   */
  public import(data: AggregatedClick[]): void {
    this.clear();
    data.forEach(click => {
      const key = `${click.x},${click.y}`;
      this.clickData.set(key, click);
    });
  }
}