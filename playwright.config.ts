/**
 * PHASE 7: Comprehensive Testing Configuration
 * Playwright configuration for heatmap excellence testing framework
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './tests',
  
  // Timeout configurations
  timeout: 60000, // 1 minute per test
  expect: {
    timeout: 10000 // 10 seconds for assertions
  },
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 3,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],
  
  // Global test settings
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:5173',
    
    // Browser settings
    headless: process.env.HEADLESS !== 'false',
    
    // Trace and debugging
    trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
    screenshot: process.env.CI ? 'only-on-failure' : 'on',
    video: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
    
    // Action settings
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
  },

  // Test projects for different browsers and scenarios
  projects: [
    // Desktop browsers
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    // Tablet devices
    {
      name: 'tablet-ipad',
      use: { ...devices['iPad Pro'] },
    },
    {
      name: 'tablet-android',
      use: { 
        ...devices['Galaxy Tab S4'],
        viewport: { width: 1024, height: 768 }
      },
    },

    // Mobile devices
    {
      name: 'mobile-iphone',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'mobile-android',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-small',
      use: { 
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
      },
    },

    // Performance testing (Chrome only for now)
    {
      name: 'performance-testing',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
      testMatch: /.*load\.spec\.ts/,
    },

    // High DPI testing
    {
      name: 'high-dpi',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 2,
      },
    },

    // Accessibility testing
    {
      name: 'accessibility',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*a11y\.spec\.ts/,
    }
  ],

  // Test patterns
  testMatch: [
    'tests/heatmap.spec.ts',
    'tests/heatmap-integration.spec.ts', 
    'tests/heatmap-load.spec.ts'
  ],

  // Web server for local testing
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: 'test'
    }
  },

  // Output directories
  outputDir: 'test-results/artifacts',
  
  // Global setup and teardown
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
});