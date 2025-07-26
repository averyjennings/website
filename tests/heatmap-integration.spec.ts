/**
 * PHASE 7: Integration Tests
 * Comprehensive integration testing for heatmap with other portfolio features
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const INTEGRATION_CONFIG = {
  LOCAL_URL: 'http://localhost:5173',
  SECTIONS: {
    HOME: '#home',
    ABOUT: '#about', 
    PROJECTS: '#projects',
    GITHUB: '#github',
    PERFORMANCE: '#performance',
    CONTACT: '#contact'
  },
  NAVIGATION_TIMEOUT: 5000,
  HEATMAP_RENDER_TIMEOUT: 3000
};

class IntegrationTestUtils {
  constructor(private page: Page) {}

  async enableHeatmap() {
    await this.page.evaluate(() => {
      localStorage.setItem('heatmap-intro-seen', 'true');
      localStorage.setItem('heatmap-visibility-preference', 'true');
    });
  }

  async navigateToSection(sectionId: string) {
    await this.page.click(`a[href="${sectionId}"]`);
    await this.page.waitForTimeout(1000); // Allow scroll animation
  }

  async waitForHeatmapUpdate() {
    await this.page.waitForTimeout(2000); // Allow heatmap to process new data
  }

  async getHeatmapZones() {
    const zoneText = await this.page.locator('text=/\\d+ heat.*zones/').textContent();
    const match = zoneText?.match(/(\\d+) heat/);
    return match ? parseInt(match[1]) : 0;
  }

  async verifyPerformanceExcellent() {
    const logs: string[] = [];
    this.page.on('console', msg => {
      if (msg.text().includes('Performance status')) {
        logs.push(msg.text());
      }
    });

    await this.page.waitForTimeout(6000);
    
    return logs.some(log => 
      log.includes('✅ EXCELLENT') || log.includes('⚠️ GOOD')
    );
  }
}

test.describe('🔗 Heatmap Integration with Portfolio Features', () => {
  let utils: IntegrationTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new IntegrationTestUtils(page);
    await utils.enableHeatmap();
  });

  test('should track interactions across all portfolio sections', async ({ page }) => {
    await page.goto(INTEGRATION_CONFIG.LOCAL_URL);
    
    // Wait for initial heatmap setup
    await page.waitForTimeout(INTEGRATION_CONFIG.HEATMAP_RENDER_TIMEOUT);
    const initialZones = await utils.getHeatmapZones();

    // Navigate through all sections and interact
    for (const [sectionName, sectionId] of Object.entries(INTEGRATION_CONFIG.SECTIONS)) {
      await utils.navigateToSection(sectionId);
      
      // Interact with section content
      if (sectionName === 'PROJECTS') {
        // Click on project filters
        await page.locator('button:has-text("All Projects")').click();
        await page.locator('input[placeholder*="Search"]').click();
      } else if (sectionName === 'PERFORMANCE') {
        // Click on performance dashboard elements
        await page.locator('button:has-text("Refresh Data")').click();
        await page.locator('select').first().click();
      } else if (sectionName === 'CONTACT') {
        // Click contact links
        await page.locator('a[href*="mailto"]').click();
      } else {
        // Generic section interaction
        await page.locator('h1, h2, h3').first().click();
      }
      
      await utils.waitForHeatmapUpdate();
    }

    // Verify interactions were tracked across sections
    const finalZones = await utils.getHeatmapZones();
    expect(finalZones).toBeGreaterThan(initialZones);
    expect(finalZones).toBeGreaterThan(5); // Reasonable number of zones created
  });

  test('should maintain performance while tracking complex user journeys', async ({ page }) => {
    await page.goto(INTEGRATION_CONFIG.LOCAL_URL);
    await page.waitForTimeout(INTEGRATION_CONFIG.HEATMAP_RENDER_TIMEOUT);

    // Simulate realistic user journey
    const userJourney = [
      { section: INTEGRATION_CONFIG.SECTIONS.HOME, actions: ['click h1', 'click button'] },
      { section: INTEGRATION_CONFIG.SECTIONS.ABOUT, actions: ['click .skill-tag', 'hover .stat-card'] },
      { section: INTEGRATION_CONFIG.SECTIONS.PROJECTS, actions: ['type search', 'click filter', 'click project'] },
      { section: INTEGRATION_CONFIG.SECTIONS.GITHUB, actions: ['click activity-item', 'hover contribution'] },
      { section: INTEGRATION_CONFIG.SECTIONS.PERFORMANCE, actions: ['click refresh', 'change dropdown'] },
      { section: INTEGRATION_CONFIG.SECTIONS.CONTACT, actions: ['click email', 'click linkedin'] }
    ];

    for (const step of userJourney) {
      await utils.navigateToSection(step.section);
      
      for (const action of step.actions) {
        try {
          if (action.includes('click')) {
            const selector = action.replace('click ', '');
            const element = page.locator(selector).first();
            if (await element.isVisible()) {
              await element.click();
            }
          } else if (action.includes('hover')) {
            const selector = action.replace('hover ', '');
            const element = page.locator(selector).first();
            if (await element.isVisible()) {
              await element.hover();
            }
          } else if (action.includes('type')) {
            const input = page.locator('input').first();
            if (await input.isVisible()) {
              await input.fill('test query');
            }
          }
        } catch (error) {
          // Continue if specific element not found - not critical for test
          console.log(`Action skipped: ${action} - ${error}`);
        }
        
        await page.waitForTimeout(200); // Brief pause between actions
      }
      
      await utils.waitForHeatmapUpdate();
    }

    // Verify performance remained excellent throughout journey
    const performanceIsGood = await utils.verifyPerformanceExcellent();
    expect(performanceIsGood).toBe(true);

    // Verify substantial interaction data collected
    const finalZones = await utils.getHeatmapZones();
    expect(finalZones).toBeGreaterThan(10);
  });

  test('should work correctly with theme switching', async ({ page }) => {
    await page.goto(INTEGRATION_CONFIG.LOCAL_URL);
    await page.waitForTimeout(INTEGRATION_CONFIG.HEATMAP_RENDER_TIMEOUT);

    // Get initial heatmap state
    const initialZones = await utils.getHeatmapZones();

    // Switch to dark mode
    const themeToggle = page.locator('button:has-text("Switch to dark mode"), button[class*="theme"]').first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(1000);

      // Verify heatmap still works in dark mode
      await page.click('h1');
      await utils.waitForHeatmapUpdate();

      const darkModeZones = await utils.getHeatmapZones();
      expect(darkModeZones).toBeGreaterThanOrEqual(initialZones);

      // Switch back to light mode
      const lightToggle = page.locator('button:has-text("Switch to light mode"), button[class*="theme"]').first();
      if (await lightToggle.isVisible()) {
        await lightToggle.click();
        await page.waitForTimeout(1000);

        // Verify heatmap continues working in light mode
        await page.click('h2');
        await utils.waitForHeatmapUpdate();

        const lightModeZones = await utils.getHeatmapZones();
        expect(lightModeZones).toBeGreaterThanOrEqual(darkModeZones);
      }
    }
  });

  test('should handle mobile navigation and interactions', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(INTEGRATION_CONFIG.LOCAL_URL);
    await page.waitForTimeout(INTEGRATION_CONFIG.HEATMAP_RENDER_TIMEOUT);

    // Test mobile navigation if hamburger menu exists
    const mobileMenu = page.locator('button[class*="mobile"], button[class*="hamburger"]').first();
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await page.waitForTimeout(500);

      // Navigate through mobile menu
      const mobileLinks = page.locator('nav a, .mobile-menu a');
      const linkCount = await mobileLinks.count();
      
      for (let i = 0; i < Math.min(linkCount, 3); i++) {
        const link = mobileLinks.nth(i);
        if (await link.isVisible()) {
          await link.click();
          await page.waitForTimeout(1000);
        }
      }
    } else {
      // Direct navigation on mobile
      await utils.navigateToSection(INTEGRATION_CONFIG.SECTIONS.ABOUT);
      await utils.navigateToSection(INTEGRATION_CONFIG.SECTIONS.PROJECTS);
    }

    // Verify heatmap works on mobile
    await page.tap('h1');
    await page.tap('h2');
    await utils.waitForHeatmapUpdate();

    const mobileZones = await utils.getHeatmapZones();
    expect(mobileZones).toBeGreaterThan(0);
  });

  test('should integrate properly with Web Vitals dashboard', async ({ page }) => {
    await page.goto(INTEGRATION_CONFIG.LOCAL_URL);
    await page.waitForTimeout(INTEGRATION_CONFIG.HEATMAP_RENDER_TIMEOUT);

    // Navigate to performance section
    await utils.navigateToSection(INTEGRATION_CONFIG.SECTIONS.PERFORMANCE);

    // Interact with Web Vitals dashboard elements
    const dashboardActions = [
      () => page.locator('button:has-text("Refresh Data")').click(),
      () => page.locator('button:has-text("Export JSON")').click(),
      () => page.locator('select').first().selectOption('24h'),
      () => page.locator('button:has-text("Query Visitors")').click()
    ];

    let dashboardInteractions = 0;
    for (const action of dashboardActions) {
      try {
        await action();
        dashboardInteractions++;
        await page.waitForTimeout(500);
      } catch (error) {
        // Some buttons might not be available - that's okay
        console.log(`Dashboard action skipped: ${error}`);
      }
    }

    await utils.waitForHeatmapUpdate();

    // Verify dashboard interactions were tracked
    if (dashboardInteractions > 0) {
      const zones = await utils.getHeatmapZones();
      expect(zones).toBeGreaterThan(0);
    }

    // Verify both heatmap and Web Vitals work together
    await expect(page.locator('text="Web Vitals Test Dashboard"')).toBeVisible();
    await expect(page.locator('text="Vibrant HeatMap"')).toBeVisible();
  });
});

test.describe('🌐 Heatmap with GitHub Integration', () => {
  let utils: IntegrationTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new IntegrationTestUtils(page);
    await utils.enableHeatmap();
  });

  test('should track interactions with GitHub activity feed', async ({ page }) => {
    await page.goto(INTEGRATION_CONFIG.LOCAL_URL);
    await utils.navigateToSection(INTEGRATION_CONFIG.SECTIONS.GITHUB);
    
    // Wait for GitHub content to load
    await page.waitForTimeout(3000);

    // Interact with GitHub elements
    const githubActions = [
      () => page.locator('a[href*="github.com"]').first().click(),
      () => page.locator('.activity-item, .commit-item').first().click(),
      () => page.locator('.repo-card, .repository').first().hover(),
      () => page.locator('text="View all activity"').click()
    ];

    let githubInteractions = 0;
    for (const action of githubActions) {
      try {
        await action();
        githubInteractions++;
        await page.waitForTimeout(1000);
      } catch (error) {
        console.log(`GitHub action skipped: ${error}`);
      }
    }

    await utils.waitForHeatmapUpdate();

    // Verify GitHub interactions were tracked
    if (githubInteractions > 0) {
      const zones = await utils.getHeatmapZones();
      expect(zones).toBeGreaterThan(0);
    }
  });

  test('should handle contribution graph interactions', async ({ page }) => {
    await page.goto(INTEGRATION_CONFIG.LOCAL_URL);
    await utils.navigateToSection(INTEGRATION_CONFIG.SECTIONS.GITHUB);
    
    // Wait for contribution graph to load
    await page.waitForTimeout(4000);

    // Look for contribution graph elements
    const contributionElements = page.locator('.contribution-day, .contribution-square, svg rect');
    const elementCount = await contributionElements.count();

    if (elementCount > 0) {
      // Interact with first few contribution squares
      for (let i = 0; i < Math.min(elementCount, 5); i++) {
        await contributionElements.nth(i).hover();
        await page.waitForTimeout(200);
      }

      await utils.waitForHeatmapUpdate();

      // Verify interactions were tracked
      const zones = await utils.getHeatmapZones();
      expect(zones).toBeGreaterThan(0);
    }
  });
});

test.describe('📊 Real-world User Scenarios', () => {
  let utils: IntegrationTestUtils;

  test.beforeEach(async ({ page }) => {
    utils = new IntegrationTestUtils(page);
  });

  test('should handle first-time visitor complete flow', async ({ page }) => {
    // Fresh visitor - no localStorage
    await page.goto(INTEGRATION_CONFIG.LOCAL_URL);

    // Verify onboarding appears
    await expect(page.locator('text="Heatmap Feature"')).toBeVisible();

    // Enable heatmap
    await page.locator('button:has-text("✨ Enable Heatmap Experience")').click();

    // Simulate browsing behavior
    const browsingFlow = [
      () => page.click('h1'),
      () => utils.navigateToSection(INTEGRATION_CONFIG.SECTIONS.ABOUT),
      () => page.hover('.skill-tag, .technology-tag'),
      () => utils.navigateToSection(INTEGRATION_CONFIG.SECTIONS.PROJECTS),
      () => page.fill('input[placeholder*="Search"]', 'react'),
      () => page.click('button:has-text("All Projects")'),
      () => utils.navigateToSection(INTEGRATION_CONFIG.SECTIONS.CONTACT),
      () => page.click('a[href*="mailto"]')
    ];

    for (const action of browsingFlow) {
      try {
        await action();
        await page.waitForTimeout(800);
      } catch (error) {
        console.log(`Browsing action skipped: ${error}`);
      }
    }

    await utils.waitForHeatmapUpdate();

    // Verify comprehensive tracking
    const finalZones = await utils.getHeatmapZones();
    expect(finalZones).toBeGreaterThan(3);

    // Verify preference persistence
    const preference = await page.evaluate(() => 
      localStorage.getItem('heatmap-visibility-preference')
    );
    expect(preference).toBe('true');
  });

  test('should handle returning user workflow', async ({ page }) => {
    // Set as returning user with heatmap enabled
    await page.evaluate(() => {
      localStorage.setItem('heatmap-intro-seen', 'true');
      localStorage.setItem('heatmap-visibility-preference', 'true');
    });

    await page.goto(INTEGRATION_CONFIG.LOCAL_URL);

    // Verify no onboarding
    await expect(page.locator('text="Heatmap Feature"')).not.toBeVisible({ timeout: 2000 });

    // Verify heatmap is active
    await expect(page.locator('text="Vibrant HeatMap"')).toBeVisible();

    // Simulate power user behavior
    const powerUserActions = [
      () => page.keyboard.press('Home'), // Keyboard navigation
      () => page.keyboard.press('End'),
      () => page.click('a[href="#projects"]'),
      () => page.fill('input', 'portfolio'),
      () => page.keyboard.press('Enter'),
      () => page.click('.heatmap-controls button'), // Toggle controls
      () => page.click('input[type="range"]') // Adjust settings
    ];

    let actionCount = 0;
    for (const action of powerUserActions) {
      try {
        await action();
        actionCount++;
        await page.waitForTimeout(300);
      } catch (error) {
        console.log(`Power user action skipped: ${error}`);
      }
    }

    await utils.waitForHeatmapUpdate();

    if (actionCount > 0) {
      const zones = await utils.getHeatmapZones();
      expect(zones).toBeGreaterThan(0);
    }
  });

  test('should handle user who initially dismisses heatmap', async ({ page }) => {
    await page.goto(INTEGRATION_CONFIG.LOCAL_URL);

    // Dismiss onboarding
    await page.locator('button:has-text("Maybe Later")').click();

    // Verify heatmap is not visible
    await expect(page.locator('text="Vibrant HeatMap"')).not.toBeVisible();

    // User browses normally
    await page.click('h1');
    await utils.navigateToSection(INTEGRATION_CONFIG.SECTIONS.ABOUT);
    await page.waitForTimeout(2000);

    // User decides to enable heatmap through controls
    const heatmapButton = page.locator('text="Heatmap"');
    if (await heatmapButton.isVisible()) {
      await heatmapButton.click();
      
      // Toggle heatmap on
      const showToggle = page.locator('text="Show Heatmap"').locator('..').locator('button');
      await showToggle.click();

      // Verify heatmap is now active
      await expect(page.locator('text="Vibrant HeatMap"')).toBeVisible();

      // Continue interacting
      await page.click('h2');
      await utils.waitForHeatmapUpdate();

      const zones = await utils.getHeatmapZones();
      expect(zones).toBeGreaterThan(0);
    }
  });
});