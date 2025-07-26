#!/usr/bin/env node

/**
 * PHASE 7: Comprehensive Test Runner
 * Advanced test orchestration for heatmap excellence validation
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Test configuration
const TEST_CONFIG = {
  // Test suites in order of execution
  SUITES: [
    {
      name: 'Core Heatmap Functionality',
      pattern: 'tests/heatmap.spec.ts',
      critical: true,
      timeout: 180000, // 3 minutes
      description: 'Validates core heatmap features, onboarding, and performance optimizations'
    },
    {
      name: 'Integration Testing',
      pattern: 'tests/heatmap-integration.spec.ts', 
      critical: true,
      timeout: 240000, // 4 minutes
      description: 'Tests heatmap integration with portfolio features and user journeys'
    },
    {
      name: 'Load & Stress Testing',
      pattern: 'tests/heatmap-load.spec.ts',
      critical: false,
      timeout: 300000, // 5 minutes
      description: 'Validates performance under various load conditions'
    }
  ],
  
  // Browser configurations
  BROWSERS: {
    essential: ['chromium-desktop'],
    standard: ['chromium-desktop', 'firefox-desktop', 'webkit-desktop'],
    comprehensive: ['chromium-desktop', 'firefox-desktop', 'webkit-desktop', 'mobile-iphone', 'tablet-ipad'],
    all: ['chromium-desktop', 'firefox-desktop', 'webkit-desktop', 'mobile-iphone', 'mobile-android', 'tablet-ipad', 'tablet-android', 'high-dpi']
  },

  // Test modes
  MODES: {
    quick: { browsers: 'essential', suites: ['Core Heatmap Functionality'] },
    standard: { browsers: 'standard', suites: ['Core Heatmap Functionality', 'Integration Testing'] },
    comprehensive: { browsers: 'comprehensive', suites: ['Core Heatmap Functionality', 'Integration Testing'] },
    full: { browsers: 'all', suites: ['Core Heatmap Functionality', 'Integration Testing', 'Load & Stress Testing'] }
  }
};

class HeatmapTestRunner {
  constructor() {
    this.results = {
      startTime: new Date(),
      suites: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      }
    };
  }

  async run() {
    console.log('🚀 HEATMAP EXCELLENCE TESTING FRAMEWORK - PHASE 7');
    console.log('═══════════════════════════════════════════════════');
    console.log(`🎯 Starting comprehensive heatmap validation...`);
    console.log(`📅 Started at: ${this.results.startTime.toISOString()}`);
    console.log('');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const mode = this.parseMode(args);
    const options = this.parseOptions(args);

    console.log(`🔧 Test Mode: ${mode.toUpperCase()}`);
    console.log(`🌐 Browsers: ${TEST_CONFIG.MODES[mode].browsers}`);
    console.log(`📦 Test Suites: ${TEST_CONFIG.MODES[mode].suites.length}`);
    console.log('');

    try {
      // Verify prerequisites
      await this.verifyPrerequisites();

      // Run test suites
      const config = TEST_CONFIG.MODES[mode];
      const browsers = TEST_CONFIG.BROWSERS[config.browsers];
      
      for (const suiteName of config.suites) {
        const suite = TEST_CONFIG.SUITES.find(s => s.name === suiteName);
        if (suite) {
          await this.runTestSuite(suite, browsers, options);
        }
      }

      // Generate final report
      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Test runner failed:', error.message);
      process.exit(1);
    }
  }

  parseMode(args) {
    const modeArg = args.find(arg => arg.startsWith('--mode='));
    if (modeArg) {
      const mode = modeArg.split('=')[1];
      if (TEST_CONFIG.MODES[mode]) {
        return mode;
      }
    }
    
    // Interactive mode selection if not specified
    if (!modeArg) {
      console.log('🤔 No test mode specified. Available modes:');
      Object.keys(TEST_CONFIG.MODES).forEach(mode => {
        const config = TEST_CONFIG.MODES[mode];
        console.log(`  • ${mode}: ${config.browsers} browsers, ${config.suites.length} suites`);
      });
      console.log('\nDefaulting to "standard" mode. Use --mode=<mode> to specify.');
      console.log('');
    }
    
    return 'standard';
  }

  parseOptions(args) {
    return {
      headless: args.includes('--headless'),
      debug: args.includes('--debug'),
      retries: args.find(arg => arg.startsWith('--retries='))?.split('=')[1] || '1',
      timeout: args.find(arg => arg.startsWith('--timeout='))?.split('=')[1] || undefined,
      grep: args.find(arg => arg.startsWith('--grep='))?.split('=')[1] || undefined
    };
  }

  async verifyPrerequisites() {
    console.log('🔍 Verifying prerequisites...');
    
    // Check if Playwright is installed
    try {
      await import('@playwright/test');
      console.log('  ✅ Playwright is installed');
    } catch (error) {
      throw new Error('Playwright is not installed. Run: npm install @playwright/test');
    }

    // Check if dev server can be started
    const devServerCheck = await this.checkDevServer();
    if (!devServerCheck) {
      throw new Error('Development server is not accessible at http://localhost:5173');
    }
    console.log('  ✅ Development server is accessible');

    // Check test files exist
    for (const suite of TEST_CONFIG.SUITES) {
      const testFile = path.join(process.cwd(), suite.pattern);
      if (!fs.existsSync(testFile)) {
        throw new Error(`Test file not found: ${suite.pattern}`);
      }
    }
    console.log('  ✅ All test files are present');
    console.log('');
  }

  async checkDevServer() {
    try {
      const response = await fetch('http://localhost:5173');
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async runTestSuite(suite, browsers, options) {
    console.log(`📦 Running: ${suite.name}`);
    console.log(`   ${suite.description}`);
    console.log(`   Browsers: ${browsers.join(', ')}`);
    console.log('');

    const suiteResult = {
      name: suite.name,
      startTime: new Date(),
      browsers: [],
      success: true
    };

    for (const browser of browsers) {
      console.log(`  🌐 Testing on ${browser}...`);
      
      const browserResult = await this.runBrowserTests(suite, browser, options);
      suiteResult.browsers.push(browserResult);
      
      if (!browserResult.success) {
        suiteResult.success = false;
        if (suite.critical) {
          console.log(`  ❌ Critical suite failed on ${browser}, stopping execution`);
          throw new Error(`Critical test suite "${suite.name}" failed on ${browser}`);
        }
      }
    }

    suiteResult.endTime = new Date();
    suiteResult.duration = suiteResult.endTime - suiteResult.startTime;
    this.results.suites.push(suiteResult);

    const status = suiteResult.success ? '✅ PASSED' : '⚠️ PARTIAL';
    console.log(`  ${status} ${suite.name} (${suiteResult.duration}ms)`);
    console.log('');
  }

  async runBrowserTests(suite, browser, options) {
    const args = [
      'test',
      suite.pattern,
      '--project', browser,
      '--timeout', suite.timeout.toString()
    ];

    if (options.headless) args.push('--headed=false');
    if (options.debug) args.push('--debug');
    if (options.retries) args.push('--retries', options.retries);
    if (options.grep) args.push('--grep', options.grep);

    return new Promise((resolve) => {
      const process = spawn('npx', ['playwright', ...args], {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        const success = code === 0;
        
        // Parse test results from output
        const testResults = this.parseTestOutput(output);
        
        resolve({
          browser,
          success,
          exitCode: code,
          output,
          errorOutput,
          testResults,
          duration: Date.now() // This would be calculated properly in real implementation
        });
      });
    });
  }

  parseTestOutput(output) {
    // Simple parsing - in real implementation, this would parse JSON reports
    const lines = output.split('\n');
    let passed = 0, failed = 0, skipped = 0;

    lines.forEach(line => {
      if (line.includes('✓') || line.includes('passed')) passed++;
      if (line.includes('✗') || line.includes('failed')) failed++;
      if (line.includes('skipped')) skipped++;
    });

    return { passed, failed, skipped, total: passed + failed + skipped };
  }

  async generateFinalReport() {
    const endTime = new Date();
    const totalDuration = endTime - this.results.startTime;

    console.log('📊 FINAL TEST REPORT');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📅 Completed at: ${endTime.toISOString()}`);
    console.log(`⏱️ Total Duration: ${Math.round(totalDuration / 1000)}s`);
    console.log('');

    // Suite summary
    console.log('📦 SUITE RESULTS:');
    this.results.suites.forEach(suite => {
      const status = suite.success ? '✅' : '⚠️';
      const duration = Math.round(suite.duration / 1000);
      console.log(`  ${status} ${suite.name} (${duration}s)`);
      
      suite.browsers.forEach(browser => {
        const browserStatus = browser.success ? '✅' : '❌';  
        console.log(`    ${browserStatus} ${browser.browser}`);
      });
    });
    console.log('');

    // Overall summary
    const totalSuites = this.results.suites.length;
    const passedSuites = this.results.suites.filter(s => s.success).length;
    const overallSuccess = passedSuites === totalSuites;

    console.log('🎯 OVERALL SUMMARY:');
    console.log(`  • Total Suites: ${totalSuites}`);
    console.log(`  • Passed: ${passedSuites}`);
    console.log(`  • Failed: ${totalSuites - passedSuites}`);
    console.log(`  • Success Rate: ${Math.round((passedSuites / totalSuites) * 100)}%`);
    console.log('');

    if (overallSuccess) {
      console.log('🎉 ALL TESTS PASSED - HEATMAP EXCELLENCE ACHIEVED!');
      console.log('🚀 Phase 7 Testing Framework Complete');
    } else {
      console.log('⚠️ Some tests failed - Review results above');
      console.log('📝 Check detailed reports in test-results/ directory');
    }

    console.log('═══════════════════════════════════════════════════');

    // Write detailed report
    const reportPath = path.join(process.cwd(), 'test-results', 'execution-report.json');
    try {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify({
        ...this.results,
        endTime,
        totalDuration,
        overallSuccess
      }, null, 2));
      console.log(`📄 Detailed report: ${reportPath}`);
    } catch (error) {
      console.warn('⚠️ Could not write detailed report:', error.message);
    }

    if (!overallSuccess) {
      process.exit(1);
    }
  }
}

// Help message
function showHelp() {
  console.log('🚀 HEATMAP EXCELLENCE TESTING FRAMEWORK - PHASE 7');
  console.log('');
  console.log('Usage: node scripts/run-heatmap-tests.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --mode=<mode>     Test mode: quick, standard, comprehensive, full');
  console.log('  --headless        Run in headless mode');  
  console.log('  --debug           Enable debug mode');
  console.log('  --retries=<n>     Number of retries for failed tests');
  console.log('  --timeout=<ms>    Custom timeout for tests');
  console.log('  --grep=<pattern>  Run only tests matching pattern');
  console.log('  --help            Show this help message');
  console.log('');
  console.log('Test Modes:');
  Object.entries(TEST_CONFIG.MODES).forEach(([mode, config]) => {
    console.log(`  ${mode.padEnd(12)} ${config.browsers} browsers, ${config.suites.length} suites`);
  });
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/run-heatmap-tests.js --mode=quick');
  console.log('  node scripts/run-heatmap-tests.js --mode=full --headless');
  console.log('  node scripts/run-heatmap-tests.js --grep="onboarding"');
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
  } else {
    const runner = new HeatmapTestRunner();
    runner.run().catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
  }
}

export default HeatmapTestRunner;