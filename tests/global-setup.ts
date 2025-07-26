/**
 * PHASE 7: Global Test Setup
 * Sets up the testing environment and performs pre-test validations
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 PHASE 7: Starting Heatmap Excellence Testing Framework');
  console.log('⚡ Setting up global test environment...');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Verify development server is running
    console.log('🔍 Verifying development server...');
    await page.goto('http://localhost:5173', { timeout: 30000 });
    
    // Verify essential page elements
    await page.waitForSelector('h1', { timeout: 10000 });
    console.log('✅ Development server is accessible');

    // Verify heatmap components load
    console.log('🔍 Verifying heatmap components...');
    
    // Check for heatmap initialization (either onboarding or direct heatmap)
    try {
      await page.waitForSelector('text="Heatmap Feature", text="Vibrant HeatMap"', { timeout: 5000 });
      console.log('✅ Heatmap components are loading correctly');
    } catch (error) {
      console.warn('⚠️ Heatmap components may need more time to initialize');
    }

    // Clear any existing test data
    console.log('🧹 Clearing test data...');
    await page.evaluate(() => {
      // Clear heatmap localStorage
      localStorage.removeItem('heatmap-intro-seen');
      localStorage.removeItem('heatmap-visibility-preference'); 
      localStorage.removeItem('heatmap-controls-expanded');
      localStorage.removeItem('heatmap-data-fallback');
      
      // Clear analytics data
      localStorage.removeItem('analytics-user-id');
      localStorage.removeItem('web-vitals-metrics');
    });

    // Pre-warm the heatmap system
    console.log('🔥 Pre-warming heatmap system...');
    await page.evaluate(() => {
      localStorage.setItem('heatmap-intro-seen', 'true');
      localStorage.setItem('heatmap-visibility-preference', 'true');
    });
    
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Generate a few test interactions to ensure system is ready
    await page.click('h1');
    await page.click('h2');
    await page.waitForTimeout(2000);

    console.log('✅ Global setup completed successfully');
    console.log('🎯 Test environment is ready for heatmap excellence validation');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;