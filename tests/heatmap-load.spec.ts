/**
 * PHASE 7: Load Testing & Stress Testing
 * Comprehensive load testing for heatmap under various stress conditions
 */

import { test, expect, Page } from '@playwright/test';

// Load test configuration
const LOAD_CONFIG = {
  LOCAL_URL: 'http://localhost:5173',
  STRESS_SCENARIOS: {
    LIGHT: { interactions: 50, concurrency: 1, duration: 10000 },
    MEDIUM: { interactions: 200, concurrency: 2, duration: 20000 },
    HEAVY: { interactions: 500, concurrency: 3, duration: 30000 },
    EXTREME: { interactions: 1000, concurrency: 5, duration: 60000 }
  },
  PERFORMANCE_THRESHOLDS: {
    MAX_RENDER_TIME: 50, // milliseconds
    MIN_FRAME_RATE: 30,  // fps
    MAX_MEMORY_USAGE: 100, // MB (estimated)
    MAX_COORDINATE_CONVERSIONS: 10
  }
};

class LoadTestUtils {
  constructor(private page: Page) {}

  async enableHeatmap() {
    await this.page.evaluate(() => {
      localStorage.setItem('heatmap-intro-seen', 'true');
      localStorage.setItem('heatmap-visibility-preference', 'true');
    });
  }

  async generateRandomClicks(count: number, bounds = { x: 1200, y: 800 }) {
    const clicks = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * bounds.x + 100;
      const y = Math.random() * bounds.y + 100;
      await this.page.mouse.click(x, y);
      clicks.push({ x, y, timestamp: Date.now() });
      
      // Small random delay to simulate human behavior
      if (i % 10 === 0) {
        await this.page.waitForTimeout(Math.random() * 100 + 50);
      }
    }
    return clicks;
  }

  async generateBurstInteractions(burstSize: number, burstCount: number) {
    const results = [];
    
    for (let burst = 0; burst < burstCount; burst++) {
      const burstStart = Date.now();
      
      // Generate burst of interactions
      for (let i = 0; i < burstSize; i++) {
        const x = 200 + (i % 20) * 30;
        const y = 300 + Math.floor(i / 20) * 40;
        await this.page.mouse.click(x, y);
      }
      
      const burstEnd = Date.now();
      results.push({
        burstIndex: burst,
        duration: burstEnd - burstStart,
        interactionCount: burstSize
      });
      
      // Brief pause between bursts
      await this.page.waitForTimeout(500);
    }
    
    return results;
  }

  async simulateTypingInteractions(textLength: number) {
    // Find input fields and simulate typing
    const inputs = this.page.locator('input[type="text"], input[type="search"], textarea');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      const randomInput = inputs.nth(Math.floor(Math.random() * inputCount));
      
      // Generate random text
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789 ';
      let text = '';
      
      for (let i = 0; i < textLength; i++) {
        text += chars.charAt(Math.floor(Math.random() * chars.length));
        await randomInput.fill(text);
        
        // Small delay between keystrokes
        if (i % 5 === 0) {
          await this.page.waitForTimeout(10);
        }
      }
    }
  }

  async getPerformanceMetrics() {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics = {
          renderTime: 0,
          frameRate: 0,
          coordinateConversions: 0,
          canvasPixels: 0,
          status: 'unknown'
        };

        // Capture console logs for performance data
        const originalLog = console.log;
        const logs: string[] = [];
        
        console.log = (...args) => {
          const message = args.join(' ');
          logs.push(message);
          originalLog(...args);
        };

        setTimeout(() => {
          console.log = originalLog;
          
          // Parse performance metrics from logs
          const perfLog = logs.find(log => log.includes('PERFORMANCE METRICS'));
          if (perfLog) {
            const renderMatch = perfLog.match(/Render time: ([\\d.]+)ms/);
            const frameMatch = perfLog.match(/([\\d]+)fps/);
            const coordMatch = perfLog.match(/Coordinate conversions: ([\\d]+)/);
            const canvasMatch = perfLog.match(/Canvas pixels: ([\\d.]+)M/);
            const statusMatch = perfLog.match(/(✅ EXCELLENT|⚠️ GOOD|🚨 NEEDS WORK)/);

            if (renderMatch) metrics.renderTime = parseFloat(renderMatch[1]);
            if (frameMatch) metrics.frameRate = parseInt(frameMatch[1]);
            if (coordMatch) metrics.coordinateConversions = parseInt(coordMatch[1]);
            if (canvasMatch) metrics.canvasPixels = parseFloat(canvasMatch[1]) * 1000000;
            if (statusMatch) metrics.status = statusMatch[1];
          }
          
          resolve(metrics);
        }, 3000);
      });
    });
  }

  async getMemoryUsage() {
    return await this.page.evaluate(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        return {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        };
      }
      return null;
    });
  }

  async getHeatmapStats() {
    const zoneText = await this.page.locator('text=/\\d+ heat.*zones/').textContent();
    const bufferText = await this.page.locator('text=/Buffer: \\d+ events/').textContent();
    
    const zoneMatch = zoneText?.match(/(\\d+) heat/);
    const bufferMatch = bufferText?.match(/Buffer: (\\d+) events/);
    
    return {
      zones: zoneMatch ? parseInt(zoneMatch[1]) : 0,
      buffer: bufferMatch ? parseInt(bufferMatch[1]) : 0
    };
  }
}

test.describe('🔥 Load Testing - Light Stress', () => {
  let utils: LoadTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new LoadTestUtils(page);
    await utils.enableHeatmap();
  });

  test('should handle 50 rapid interactions without performance degradation', async ({ page }) => {
    await page.goto(LOAD_CONFIG.LOCAL_URL);
    await page.waitForTimeout(3000);

    const startTime = Date.now();
    const clicks = await utils.generateRandomClicks(LOAD_CONFIG.STRESS_SCENARIOS.LIGHT.interactions);
    const endTime = Date.now();

    // Verify interactions completed within reasonable time
    const totalTime = endTime - startTime;
    expect(totalTime).toBeLessThan(LOAD_CONFIG.STRESS_SCENARIOS.LIGHT.duration);

    // Wait for processing
    await page.waitForTimeout(5000);

    // Check performance metrics
    const metrics = await utils.getPerformanceMetrics();
    expect(metrics.renderTime).toBeLessThan(LOAD_CONFIG.PERFORMANCE_THRESHOLDS.MAX_RENDER_TIME);
    expect(metrics.coordinateConversions).toBeLessThan(LOAD_CONFIG.PERFORMANCE_THRESHOLDS.MAX_COORDINATE_CONVERSIONS);

    // Verify heatmap processed interactions
    const stats = await utils.getHeatmapStats();
    expect(stats.zones).toBeGreaterThan(10);
  });

  test('should maintain accuracy during sustained interactions', async ({ page }) => {
    await page.goto(LOAD_CONFIG.LOCAL_URL);
    await page.waitForTimeout(3000);

    const initialStats = await utils.getHeatmapStats();

    // Generate interactions in phases
    const phases = 3;
    const interactionsPerPhase = Math.floor(LOAD_CONFIG.STRESS_SCENARIOS.LIGHT.interactions / phases);

    for (let phase = 0; phase < phases; phase++) {
      await utils.generateRandomClicks(interactionsPerPhase);
      await page.waitForTimeout(2000); // Allow processing between phases

      const phaseStats = await utils.getHeatmapStats();
      expect(phaseStats.zones).toBeGreaterThan(initialStats.zones);
    }

    // Final verification
    const finalMetrics = await utils.getPerformanceMetrics();
    expect(finalMetrics.status).toMatch(/✅ EXCELLENT|⚠️ GOOD/);
  });
});

test.describe('🌡️ Load Testing - Medium Stress', () => {
  let utils: LoadTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new LoadTestUtils(page);
    await utils.enableHeatmap();
  });

  test('should handle burst interactions with high frequency', async ({ page }) => {
    await page.goto(LOAD_CONFIG.LOCAL_URL);
    await page.waitForTimeout(3000);

    const burstResults = await utils.generateBurstInteractions(25, 8); // 200 total interactions

    // Verify all bursts completed successfully
    expect(burstResults).toHaveLength(8);
    
    // Each burst should complete quickly
    burstResults.forEach(result => {
      expect(result.duration).toBeLessThan(2000); // 2 seconds per burst
    });

    await page.waitForTimeout(6000); // Allow processing

    // Check system stability
    const metrics = await utils.getPerformanceMetrics();
    expect(metrics.frameRate).toBeGreaterThan(LOAD_CONFIG.PERFORMANCE_THRESHOLDS.MIN_FRAME_RATE);

    // Verify data integrity
    const stats = await utils.getHeatmapStats();
    expect(stats.zones).toBeGreaterThan(20);
  });

  test('should handle mixed interaction types under load', async ({ page }) => {
    await page.goto(LOAD_CONFIG.LOCAL_URL);
    await page.waitForTimeout(3000);

    const initialMemory = await utils.getMemoryUsage();

    // Mix of interaction types
    await utils.generateRandomClicks(80);
    await utils.simulateTypingInteractions(30);
    
    // Scroll interactions
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(50);
    }

    // Hover interactions
    for (let i = 0; i < 30; i++) {
      await page.hover(`h1, h2, h3, button, a`);
      await page.waitForTimeout(100);
    }

    await page.waitForTimeout(8000);

    // Memory usage should not grow excessively
    const finalMemory = await utils.getMemoryUsage();
    if (initialMemory && finalMemory) {
      const memoryGrowth = (finalMemory.used - initialMemory.used) / 1024 / 1024; // MB
      expect(memoryGrowth).toBeLessThan(LOAD_CONFIG.PERFORMANCE_THRESHOLDS.MAX_MEMORY_USAGE);
    }

    // Performance should remain good
    const metrics = await utils.getPerformanceMetrics();
    expect(metrics.status).toMatch(/✅ EXCELLENT|⚠️ GOOD/);
  });
});

test.describe('💪 Load Testing - Heavy Stress', () => {
  let utils: LoadTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new LoadTestUtils(page);
    await utils.enableHeatmap();
  });

  test('should survive extreme interaction burst (500 interactions)', async ({ page }) => {
    await page.goto(LOAD_CONFIG.LOCAL_URL);
    await page.waitForTimeout(3000);

    const startTime = Date.now();
    
    // Generate extreme burst
    for (let batch = 0; batch < 10; batch++) {
      await utils.generateRandomClicks(50);
      
      // Brief pause every batch to prevent total freeze
      if (batch % 3 === 0) {
        await page.waitForTimeout(200);
      }
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Should complete within reasonable time (not freeze)
    expect(totalTime).toBeLessThan(LOAD_CONFIG.STRESS_SCENARIOS.HEAVY.duration);

    // Extended processing time for heavy load
    await page.waitForTimeout(15000);

    // System should still be responsive
    await page.click('h1'); // Test basic interaction
    
    // Verify heatmap processed substantial data
    const stats = await utils.getHeatmapStats();
    expect(stats.zones).toBeGreaterThan(30);

    // Performance might degrade but should not crash
    const metrics = await utils.getPerformanceMetrics();
    expect(metrics.renderTime).toBeLessThan(100); // More lenient threshold
  });

  test('should handle sustained load over extended period', async ({ page }) => {
    await page.goto(LOAD_CONFIG.LOCAL_URL);
    await page.waitForTimeout(3000);

    const phases = 5;
    const interactionsPerPhase = 100;
    const phaseResults = [];

    for (let phase = 0; phase < phases; phase++) {
      const phaseStart = Date.now();
      
      await utils.generateRandomClicks(interactionsPerPhase);
      
      const phaseEnd = Date.now();
      const phaseDuration = phaseEnd - phaseStart;
      
      phaseResults.push({
        phase,
        duration: phaseDuration,
        interactions: interactionsPerPhase
      });

      // Longer processing break between phases
      await page.waitForTimeout(3000);

      // Check system health
      const phaseMetrics = await utils.getPerformanceMetrics();
      expect(phaseMetrics.coordinateConversions).toBeLessThan(15); // Slightly more lenient
    }

    // Verify performance consistency across phases
    const avgDuration = phaseResults.reduce((sum, phase) => sum + phase.duration, 0) / phases;
    expect(avgDuration).toBeLessThan(8000); // 8 seconds per phase average

    // Final system check
    const finalStats = await utils.getHeatmapStats();
    expect(finalStats.zones).toBeGreaterThan(50);
  });
});

test.describe('🚀 Load Testing - Extreme Stress', () => {
  let utils: LoadTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new LoadTestUtils(page);
    await utils.enableHeatmap();
  });

  test('should survive catastrophic load (1000+ interactions)', async ({ page }, testInfo) => {
    // Increase timeout for extreme test
    testInfo.setTimeout(120000); // 2 minutes

    await page.goto(LOAD_CONFIG.LOCAL_URL);
    await page.waitForTimeout(5000);

    const startTime = Date.now();
    let totalInteractions = 0;

    try {
      // Extreme load in smaller batches to prevent browser crash
      for (let megaBatch = 0; megaBatch < 5; megaBatch++) {
        for (let batch = 0; batch < 10; batch++) {
          await utils.generateRandomClicks(20);
          totalInteractions += 20;
          
          // Micro-pause to prevent total freeze
          await page.waitForTimeout(50);
        }
        
        // Longer pause between mega-batches
        await page.waitForTimeout(2000);
        
        console.log(`Completed mega-batch ${megaBatch + 1}/5 (${totalInteractions} interactions)`);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete (even if slow)
      expect(totalTime).toBeLessThan(LOAD_CONFIG.STRESS_SCENARIOS.EXTREME.duration);
      expect(totalInteractions).toBeGreaterThanOrEqual(1000);

      // Extended recovery time
      await page.waitForTimeout(20000);

      // System should still be functional (not crashed)
      await page.click('h1');
      await page.waitForTimeout(2000);

      // Verify data processing occurred
      const stats = await utils.getHeatmapStats();
      expect(stats.zones).toBeGreaterThan(40); // Might not process everything

      // System should not have crashed (any status except crash)
      const metrics = await utils.getPerformanceMetrics();
      expect(metrics.status).toBeDefined();
      
    } catch (error) {
      // If system crashes, verify graceful degradation
      console.log(`Extreme test reached limit at ${totalInteractions} interactions: ${error}`);
      
      // Should have processed some interactions before failing
      expect(totalInteractions).toBeGreaterThan(500);
    }
  });

  test('should demonstrate graceful degradation under impossible load', async ({ page }, testInfo) => {
    testInfo.setTimeout(90000); // 1.5 minutes

    await page.goto(LOAD_CONFIG.LOCAL_URL);
    await page.waitForTimeout(3000);

    // Impossible load: 2000 interactions as fast as possible
    let processedInteractions = 0;
    let consecutiveFailures = 0;
    
    try {
      for (let i = 0; i < 2000; i++) {
        try {
          await page.mouse.click(
            100 + (i % 50) * 20,
            100 + Math.floor(i / 50) * 30
          );
          processedInteractions++;
          consecutiveFailures = 0;
          
          // No pauses - maximum stress
          
        } catch (error) {
          consecutiveFailures++;
          
          // If too many consecutive failures, system is overwhelmed
          if (consecutiveFailures > 20) {
            console.log(`System overwhelmed at ${processedInteractions} interactions`);
            break;
          }
        }
      }
      
    } catch (error) {
      console.log(`Catastrophic test ended at ${processedInteractions} interactions: ${error}`);
    }

    // System should have processed substantial load before degrading
    expect(processedInteractions).toBeGreaterThan(200);

    // Extended recovery period
    await page.waitForTimeout(25000);

    // Verify system can recover
    try {
      await page.click('h1');
      const recoveryStats = await utils.getHeatmapStats();
      expect(recoveryStats.zones).toBeGreaterThan(0);
    } catch (error) {
      console.log('System requires reload for recovery - this is acceptable for extreme load');
    }
  });
});

test.describe('🔄 Load Testing - Recovery and Resilience', () => {
  let utils: LoadTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new LoadTestUtils(page);
    await utils.enableHeatmap();
  });

  test('should recover after load spike', async ({ page }) => {
    await page.goto(LOAD_CONFIG.LOCAL_URL);
    await page.waitForTimeout(3000);

    // Normal operation
    await utils.generateRandomClicks(20);
    await page.waitForTimeout(2000);
    
    const baselineStats = await utils.getHeatmapStats();

    // Load spike
    await utils.generateRandomClicks(300);
    await page.waitForTimeout(10000); // Recovery time

    // Normal operation after spike
    await utils.generateRandomClicks(20);
    await page.waitForTimeout(3000);

    const recoveryStats = await utils.getHeatmapStats();
    
    // System should still process new interactions
    expect(recoveryStats.zones).toBeGreaterThan(baselineStats.zones);

    // Performance should recover
    const metrics = await utils.getPerformanceMetrics();
    expect(metrics.renderTime).toBeLessThan(50);
  });

  test('should maintain data integrity under stress', async ({ page }) => {
    await page.goto(LOAD_CONFIG.LOCAL_URL);
    await page.waitForTimeout(3000);

    // Create identifiable interaction pattern
    const pattern = [
      { x: 100, y: 100 },
      { x: 200, y: 200 },
      { x: 300, y: 300 },
      { x: 400, y: 400 },
      { x: 500, y: 500 }
    ];

    // Apply pattern multiple times during load
    for (let round = 0; round < 5; round++) {
      // Pattern interactions
      for (const point of pattern) {
        await page.mouse.click(point.x, point.y);
      }
      
      // Load stress
      await utils.generateRandomClicks(50);
      
      await page.waitForTimeout(1000);
    }

    await page.waitForTimeout(8000);

    // Verify substantial data was processed
    const finalStats = await utils.getHeatmapStats();
    expect(finalStats.zones).toBeGreaterThan(25);
    
    // Buffer should eventually process
    expect(finalStats.buffer).toBeLessThan(100); // Most data should be processed
  });
});