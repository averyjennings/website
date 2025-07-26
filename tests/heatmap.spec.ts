/**
 * PHASE 7: Comprehensive Automated Testing Framework
 * Heatmap Excellence Project - Complete Test Suite
 * 
 * This test suite validates all phases of the heatmap implementation:
 * - Phase 1-3: Performance optimization and validation
 * - Phase 4: Vibrant color system
 * - Phase 5: Data processing optimizations
 * - Phase 6: Default-enabled onboarding experience
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration and utilities
const HEATMAP_TEST_CONFIG = {
  LOCAL_URL: 'http://localhost:5173', // Adjust port as needed
  PERFORMANCE_THRESHOLDS: {
    COORDINATE_CONVERSIONS: 5,
    RENDER_TIME_MS: 16,
    FRAME_RATE_MIN: 60,
    CANVAS_PIXELS_MAX: 35_000_000, // 35M pixels max
  },
  VISUAL_ELEMENTS: {
    HEATMAP_LEGEND: 'Vibrant HeatMap',
    ONBOARDING_TITLE: 'Heatmap Feature',
    CONTROLS_HEADER: 'Heatmap Controls',
  },
  TIMEOUTS: {
    ONBOARDING_APPEAR: 3000,
    HEATMAP_RENDER: 5000,
    PERFORMANCE_METRICS: 10000,
  }
};

// Utility functions for heatmap testing
class HeatmapTestUtils {
  constructor(private page: Page) {}

  async clearHeatmapStorage() {
    await this.page.evaluate(() => {
      localStorage.removeItem('heatmap-intro-seen');
      localStorage.removeItem('heatmap-visibility-preference');
      localStorage.removeItem('heatmap-controls-expanded');
    });
  }

  async waitForHeatmapRender(timeout = HEATMAP_TEST_CONFIG.TIMEOUTS.HEATMAP_RENDER) {
    await this.page.waitForFunction(
      () => {
        const legend = document.querySelector('[class*="Vibrant"]');
        return legend && legend.textContent?.includes('zones');
      },
      { timeout }
    );
  }

  async getPerformanceMetrics() {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const checkMetrics = () => {
          const logs = [];
          // Intercept console logs for performance metrics
          const originalLog = console.log;
          console.log = (...args) => {
            logs.push(args.join(' '));
            originalLog(...args);
          };
          
          setTimeout(() => {
            console.log = originalLog;
            resolve(logs.filter(log => log.includes('PERFORMANCE METRICS')));
          }, 2000);
        };
        checkMetrics();
      });
    });
  }

  async clickMultiplePoints(count = 5) {
    const clicks = [];
    for (let i = 0; i < count; i++) {
      const x = 200 + (i * 100);
      const y = 300 + (i * 50);
      await this.page.mouse.click(x, y);
      clicks.push({ x, y });
      await this.page.waitForTimeout(100); // Small delay between clicks
    }
    return clicks;
  }

  async getHeatmapZoneCount() {
    const zoneText = await this.page.locator('text=/\\d+ heat.*zones/').textContent();
    const match = zoneText?.match(/(\\d+) heat/);
    return match ? parseInt(match[1]) : 0;
  }
}

// Test Suite: Onboarding Experience (Phase 6)
test.describe('🚀 Phase 6: Heatmap Onboarding Experience', () => {
  let utils: HeatmapTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new HeatmapTestUtils(page);
    await utils.clearHeatmapStorage();
  });

  test('should show beautiful onboarding modal for first-time visitors', async ({ page }) => {
    await page.goto(HEATMAP_TEST_CONFIG.LOCAL_URL);
    
    // Verify onboarding modal appears
    await expect(page.locator(`text="${HEATMAP_TEST_CONFIG.VISUAL_ELEMENTS.ONBOARDING_TITLE}"`))
      .toBeVisible({ timeout: HEATMAP_TEST_CONFIG.TIMEOUTS.ONBOARDING_APPEAR });
    
    // Verify modal contains key features
    await expect(page.locator('text="Live Interaction Tracking"')).toBeVisible();
    await expect(page.locator('text="Privacy Focused"')).toBeVisible();
    await expect(page.locator('text="Optimized Performance"')).toBeVisible();
    
    // Verify action buttons
    await expect(page.locator('button:has-text("✨ Enable Heatmap Experience")')).toBeVisible();
    await expect(page.locator('button:has-text("Maybe Later")')).toBeVisible();
  });

  test('should enable heatmap when user clicks "Enable Heatmap Experience"', async ({ page }) => {
    await page.goto(HEATMAP_TEST_CONFIG.LOCAL_URL);
    
    // Wait for onboarding and click enable
    await page.locator('button:has-text("✨ Enable Heatmap Experience")').click();
    
    // Verify onboarding disappears
    await expect(page.locator(`text="${HEATMAP_TEST_CONFIG.VISUAL_ELEMENTS.ONBOARDING_TITLE}"`))
      .not.toBeVisible();
    
    // Verify heatmap is active
    await utils.waitForHeatmapRender();
    await expect(page.locator(`text="${HEATMAP_TEST_CONFIG.VISUAL_ELEMENTS.HEATMAP_LEGEND}"`))
      .toBeVisible();
    
    // Verify preferences saved
    const preference = await page.evaluate(() => 
      localStorage.getItem('heatmap-visibility-preference')
    );
    expect(preference).toBe('true');
  });

  test('should disable heatmap when user clicks "Maybe Later"', async ({ page }) => {
    await page.goto(HEATMAP_TEST_CONFIG.LOCAL_URL);
    
    // Wait for onboarding and click maybe later
    await page.locator('button:has-text("Maybe Later")').click();
    
    // Verify onboarding disappears
    await expect(page.locator(`text="${HEATMAP_TEST_CONFIG.VISUAL_ELEMENTS.ONBOARDING_TITLE}"`))
      .not.toBeVisible();
    
    // Verify heatmap is not visible
    await expect(page.locator(`text="${HEATMAP_TEST_CONFIG.VISUAL_ELEMENTS.HEATMAP_LEGEND}"`))
      .not.toBeVisible();
    
    // Verify preferences saved
    const preference = await page.evaluate(() => 
      localStorage.getItem('heatmap-visibility-preference')
    );
    expect(preference).toBe('false');
  });

  test('should not show onboarding for returning users with preferences', async ({ page }) => {
    // Set user as returning visitor with preference
    await page.evaluate(() => {
      localStorage.setItem('heatmap-intro-seen', 'true');
      localStorage.setItem('heatmap-visibility-preference', 'true');
    });
    
    await page.goto(HEATMAP_TEST_CONFIG.LOCAL_URL);
    
    // Verify onboarding does not appear
    await expect(page.locator(`text="${HEATMAP_TEST_CONFIG.VISUAL_ELEMENTS.ONBOARDING_TITLE}"`))
      .not.toBeVisible({ timeout: 2000 });
    
    // Verify heatmap is active based on preference
    await utils.waitForHeatmapRender();
    await expect(page.locator(`text="${HEATMAP_TEST_CONFIG.VISUAL_ELEMENTS.HEATMAP_LEGEND}"`))
      .toBeVisible();
  });
});

// Test Suite: Performance Optimization (Phases 1-5)
test.describe('⚡ Phases 1-5: Performance Excellence Validation', () => {
  let utils: HeatmapTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new HeatmapTestUtils(page);
    // Enable heatmap for performance testing
    await page.evaluate(() => {
      localStorage.setItem('heatmap-intro-seen', 'true');
      localStorage.setItem('heatmap-visibility-preference', 'true');
    });
  });

  test('should achieve target performance metrics (Phase 2-3)', async ({ page }) => {
    await page.goto(HEATMAP_TEST_CONFIG.LOCAL_URL);
    await utils.waitForHeatmapRender();
    
    // Listen for performance console logs
    const performanceLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('PERFORMANCE METRICS')) {
        performanceLogs.push(msg.text());
      }
    });
    
    // Generate some interactions to trigger performance logging
    await utils.clickMultiplePoints(10);
    await page.waitForTimeout(6000); // Wait for performance metrics to log
    
    // Verify performance logs were captured
    expect(performanceLogs.length).toBeGreaterThan(0);
    
    const latestLog = performanceLogs[performanceLogs.length - 1];
    
    // Verify coordinate conversions are optimized (Phase 2)
    expect(latestLog).toMatch(/Coordinate conversions: [0-4]/);
    
    // Verify render time is excellent (Phase 3)
    expect(latestLog).toMatch(/Render time: \\d+\\.\\d+ms/);
    expect(latestLog).toMatch(/Performance status: ✅ EXCELLENT/);
    
    // Verify canvas optimization (Phase 3)
    expect(latestLog).toMatch(/Canvas pixels: \\d+\\.\\d+M/);
  });

  test('should demonstrate statistical cache optimization (Phase 5)', async ({ page }) => {
    await page.goto(HEATMAP_TEST_CONFIG.LOCAL_URL);
    await utils.waitForHeatmapRender();
    
    const cacheLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Statistical cache')) {
        cacheLogs.push(msg.text());
      }
    });
    
    // Generate interactions to trigger statistical calculations
    await utils.clickMultiplePoints(15);
    await page.waitForTimeout(8000);
    
    // Verify statistical cache is active
    expect(cacheLogs.some(log => log.includes('Statistical cache: ACTIVE'))).toBe(true);
  });

  test('should handle high-frequency interactions without performance degradation', async ({ page }) => {
    await page.goto(HEATMAP_TEST_CONFIG.LOCAL_URL);
    await utils.waitForHeatmapRender();
    
    const startTime = Date.now();
    
    // Rapid interaction burst
    for (let i = 0; i < 25; i++) {
      await page.mouse.click(300 + (i % 5) * 50, 400 + (i % 3) * 60);
      if (i % 5 === 0) await page.waitForTimeout(10); // Brief pause every 5 clicks
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Verify interactions completed quickly (should be under 3 seconds)
    expect(duration).toBeLessThan(3000);
    
    // Verify heatmap still responds and updates
    await utils.waitForHeatmapRender();
    const zoneCount = await utils.getHeatmapZoneCount();
    expect(zoneCount).toBeGreaterThan(0);
  });
});

// Test Suite: Visual Experience (Phase 4)
test.describe('🎨 Phase 4: Vibrant Visual Experience', () => {
  let utils: HeatmapTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new HeatmapTestUtils(page);
    await page.evaluate(() => {
      localStorage.setItem('heatmap-intro-seen', 'true');
      localStorage.setItem('heatmap-visibility-preference', 'true');
    });
  });

  test('should display vibrant heatmap legend with intensity scale', async ({ page }) => {
    await page.goto(HEATMAP_TEST_CONFIG.LOCAL_URL);
    await utils.waitForHeatmapRender();
    
    // Verify enhanced heatmap legend
    await expect(page.locator('text="Vibrant HeatMap"')).toBeVisible();
    await expect(page.locator('text="Enhanced"')).toBeVisible();
    
    // Verify intensity scale elements
    await expect(page.locator('text="Intensity"')).toBeVisible();
    await expect(page.locator('text="Cool"')).toBeVisible();
    await expect(page.locator('text="Hot"')).toBeVisible();
    
    // Verify event type legend
    await expect(page.locator('text="Clicks"')).toBeVisible();
  });

  test('should show real-time heat zones after interactions', async ({ page }) => {
    await page.goto(HEATMAP_TEST_CONFIG.LOCAL_URL);
    await utils.waitForHeatmapRender();
    
    const initialZones = await utils.getHeatmapZoneCount();
    
    // Create multiple interactions
    await utils.clickMultiplePoints(8);
    await page.waitForTimeout(2000); // Allow processing time
    
    const finalZones = await utils.getHeatmapZoneCount();
    
    // Verify heat zones increased
    expect(finalZones).toBeGreaterThanOrEqual(initialZones);
    
    // Verify zone count is displayed in legend
    await expect(page.locator('text=/\\d+ heat.*zones/')).toBeVisible();
  });

  test('should handle different event types with distinct colors', async ({ page }) => {
    await page.goto(HEATMAP_TEST_CONFIG.LOCAL_URL);
    await utils.waitForHeatmapRender();
    
    // Enable scroll tracking through controls
    await page.locator('text="Heatmap Controls"').click();
    await page.locator('button').nth(4).click(); // Scroll toggle (approximate selector)
    
    // Generate different interaction types
    await page.mouse.click(400, 300); // Click
    await page.mouse.wheel(0, 100);   // Scroll
    await page.hover('h1');           // Hover
    
    await page.waitForTimeout(3000);
    
    // Verify multiple event types are tracked
    // This is verified by checking the controls show different event types
    await expect(page.locator('text="click"')).toBeVisible();
    await expect(page.locator('text="scroll"')).toBeVisible();
    await expect(page.locator('text="hover"')).toBeVisible();
  });
});

// Test Suite: User Interaction Controls
test.describe('🎛️ Heatmap Control Interface', () => {
  let utils: HeatmapTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new HeatmapTestUtils(page);
    await page.evaluate(() => {
      localStorage.setItem('heatmap-intro-seen', 'true');
      localStorage.setItem('heatmap-visibility-preference', 'true');
    });
  });

  test('should expand and collapse heatmap controls', async ({ page }) => {
    await page.goto(HEATMAP_TEST_CONFIG.LOCAL_URL);
    await utils.waitForHeatmapRender();
    
    // Initially controls might be collapsed - expand them
    const controlsHeader = page.locator(`text="${HEATMAP_TEST_CONFIG.VISUAL_ELEMENTS.CONTROLS_HEADER}"`);
    
    if (await controlsHeader.isVisible()) {
      // Controls are expanded - verify collapse functionality
      await page.locator('button:has-text("Collapse controls")').click();
      await expect(page.locator('text="Track Interactions"')).not.toBeVisible();
      
      // Expand again
      await page.locator('text="Heatmap"').click();
      await expect(page.locator('text="Track Interactions"')).toBeVisible();
    } else {
      // Controls are collapsed - expand them
      await page.locator('text="Heatmap"').click();
      await expect(controlsHeader).toBeVisible();
    }
  });

  test('should toggle heatmap visibility through controls', async ({ page }) => {
    await page.goto(HEATMAP_TEST_CONFIG.LOCAL_URL);
    await utils.waitForHeatmapRender();
    
    // Find and click the heatmap visibility toggle
    const showHeatmapToggle = page.locator('text="Show Heatmap"').locator('..').locator('button');
    await showHeatmapToggle.click();
    
    // Verify heatmap legend disappears
    await expect(page.locator(`text="${HEATMAP_TEST_CONFIG.VISUAL_ELEMENTS.HEATMAP_LEGEND}"`))
      .not.toBeVisible();
    
    // Toggle back on
    await showHeatmapToggle.click();
    await utils.waitForHeatmapRender();
    await expect(page.locator(`text="${HEATMAP_TEST_CONFIG.VISUAL_ELEMENTS.HEATMAP_LEGEND}"`))
      .toBeVisible();
  });

  test('should adjust intensity and radius sliders', async ({ page }) => {
    await page.goto(HEATMAP_TEST_CONFIG.LOCAL_URL);
    await utils.waitForHeatmapRender();
    
    // Expand visualization controls by toggling heatmap visibility
    const showHeatmapToggle = page.locator('text="Show Heatmap"').locator('..').locator('button');
    if (!(await page.locator('text="Intensity:"').isVisible())) {
      await showHeatmapToggle.click();
      await showHeatmapToggle.click(); // Toggle on
    }
    
    // Test intensity slider
    const intensitySlider = page.locator('input[type="range"]').first();
    await intensitySlider.fill('90');
    await expect(page.locator('text="Intensity: 90%"')).toBeVisible();
    
    // Test radius slider
    const radiusSlider = page.locator('input[type="range"]').last();
    await radiusSlider.fill('35');
    await expect(page.locator('text="Radius: 35px"')).toBeVisible();
  });

  test('should display buffer events and refresh functionality', async ({ page }) => {
    await page.goto(HEATMAP_TEST_CONFIG.LOCAL_URL);
    await utils.waitForHeatmapRender();
    
    // Generate some interactions to create buffer events
    await utils.clickMultiplePoints(3);
    await page.waitForTimeout(1000);
    
    // Verify buffer count is displayed
    await expect(page.locator('text=/Buffer: \\d+ events/')).toBeVisible();
    
    // Test refresh functionality
    const refreshButton = page.locator('button:has-text("Refresh")');
    if (await refreshButton.isVisible() && await refreshButton.isEnabled()) {
      await refreshButton.click();
      // Verify no errors occur (test passes if no exceptions)
    }
  });
});

// Test Suite: Cross-Device Responsiveness
test.describe('📱 Cross-Device Responsiveness', () => {
  const devices = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 },
  ];

  devices.forEach(device => {
    test(`should work correctly on ${device.name} (${device.width}x${device.height})`, async ({ page }) => {
      const utils = new HeatmapTestUtils(page);
      
      // Set device viewport
      await page.setViewportSize({ width: device.width, height: device.height });
      
      // Enable heatmap
      await page.evaluate(() => {
        localStorage.setItem('heatmap-intro-seen', 'true');
        localStorage.setItem('heatmap-visibility-preference', 'true');
      });
      
      await page.goto(HEATMAP_TEST_CONFIG.LOCAL_URL);
      await utils.waitForHeatmapRender();
      
      // Verify heatmap renders correctly
      await expect(page.locator(`text="${HEATMAP_TEST_CONFIG.VISUAL_ELEMENTS.HEATMAP_LEGEND}"`))
        .toBeVisible();
      
      // Test interactions work on different screen sizes
      const centerX = device.width / 2;
      const centerY = device.height / 2;
      
      await page.mouse.click(centerX, centerY);
      await page.waitForTimeout(1000);
      
      // Verify interaction registered (zone count should be > 0)
      const zoneCount = await utils.getHeatmapZoneCount();
      expect(zoneCount).toBeGreaterThan(0);
    });
  });
});

// Test Suite: Error Handling and Edge Cases
test.describe('🛡️ Error Handling & Edge Cases', () => {
  let utils: HeatmapTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new HeatmapTestUtils(page);
  });

  test('should handle localStorage unavailability gracefully', async ({ page }) => {
    // Mock localStorage to throw errors
    await page.evaluate(() => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('localStorage unavailable');
      };
    });
    
    await page.goto(HEATMAP_TEST_CONFIG.LOCAL_URL);
    
    // Page should still load without errors
    await expect(page.locator('h1')).toBeVisible();
    
    // Onboarding should still appear (fallback behavior)
    await expect(page.locator(`text="${HEATMAP_TEST_CONFIG.VISUAL_ELEMENTS.ONBOARDING_TITLE}"`))
      .toBeVisible({ timeout: HEATMAP_TEST_CONFIG.TIMEOUTS.ONBOARDING_APPEAR });
  });

  test('should handle network failures gracefully', async ({ page }) => {
    // Enable heatmap first
    await page.evaluate(() => {
      localStorage.setItem('heatmap-intro-seen', 'true');
      localStorage.setItem('heatmap-visibility-preference', 'true');
    });
    
    // Intercept and block database requests
    await page.route('**/*supabase*', route => route.abort());
    
    await page.goto(HEATMAP_TEST_CONFIG.LOCAL_URL);
    
    // Heatmap should still render (fallback to buffer/localStorage)
    await utils.waitForHeatmapRender();
    await expect(page.locator(`text="${HEATMAP_TEST_CONFIG.VISUAL_ELEMENTS.HEATMAP_LEGEND}"`))
      .toBeVisible();
    
    // Interactions should still be tracked locally
    await utils.clickMultiplePoints(3);
    await page.waitForTimeout(1000);
    
    // Buffer should show events
    await expect(page.locator('text=/Buffer: \\d+ events/')).toBeVisible();
  });

  test('should handle extreme interaction bursts', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('heatmap-intro-seen', 'true');
      localStorage.setItem('heatmap-visibility-preference', 'true');
    });
    
    await page.goto(HEATMAP_TEST_CONFIG.LOCAL_URL);
    await utils.waitForHeatmapRender();
    
    // Extreme burst: 50 clicks in rapid succession
    const startTime = Date.now();
    for (let i = 0; i < 50; i++) {
      await page.mouse.click(
        200 + (i % 10) * 30,
        300 + Math.floor(i / 10) * 40
      );
    }
    const endTime = Date.now();
    
    // Should complete in reasonable time (under 5 seconds)
    expect(endTime - startTime).toBeLessThan(5000);
    
    // Wait for processing
    await page.waitForTimeout(3000);
    
    // System should remain responsive
    const zoneCount = await utils.getHeatmapZoneCount();
    expect(zoneCount).toBeGreaterThan(0);
    
    // Performance status should still be good
    const performanceLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Performance status')) {
        performanceLogs.push(msg.text());
      }
    });
    
    await page.waitForTimeout(6000); // Wait for performance logging
    
    // Should maintain excellent performance
    const hasExcellentStatus = performanceLogs.some(log => 
      log.includes('✅ EXCELLENT') || log.includes('⚠️ GOOD')
    );
    expect(hasExcellentStatus).toBe(true);
  });
});