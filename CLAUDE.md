# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a professional software engineer portfolio website built with React, TypeScript, Vite, and Tailwind CSS. The project features two priority components: a Performance Dashboard and GitHub Integration Suite.

## Git Management

Claude Code is responsible for managing all git interactions for this project, including:
- Creating commits with descriptive messages
- Managing branches when needed
- Pushing changes to the remote repository
- Handling merge conflicts if they arise

**Important Git Workflow**:
- Always commit work in logical chunks as features are completed
- Separate different features into different commits (e.g. performance dashboard vs GitHub integration)
- Every commit must be a working build - always run lint and build before committing
- Don't wait until the end of a large task - commit frequently with meaningful messages
- Run `npm run lint` and `npm run build` before every commit to ensure code quality
- Test functionality before committing to ensure nothing is broken
- Only push commits that are validated through thorough testing and code review

## Visual Feedback & Screenshots

When the user mentions "check the screenshots" or asks you to look at uploaded screenshots, check the `website/screenshots/` directory. This directory contains visual feedback of the UI for validation purposes. Use the Read tool to view PNG/JPG files in this directory to understand the current visual state of the website and identify any UI issues that need fixing.

## Browser Testing with Playwright MCP

Playwright MCP is configured and available for browser automation testing. Use it extensively during development to test and iterate on the website.

### Key Capabilities
- **Live Website Testing**: Navigate to `http://localhost:5173` during development
- **Element Interaction**: Click buttons, fill forms, test navigation
- **Visual Validation**: Take screenshots to verify UI changes
- **Accessibility Testing**: Use `browser_snapshot` for structured page analysis
- **Performance Monitoring**: Test page loads and user interactions
- **Responsive Testing**: Resize browser to test different viewports

### Common Usage Patterns

```javascript
// Start development server first
npm run dev

// Then use Playwright MCP tools:
// 1. Navigate to local development site
mcp__playwright__browser_navigate("http://localhost:5173")

// 2. Take accessibility snapshot for element analysis
mcp__playwright__browser_snapshot()

// 3. Interact with components
mcp__playwright__browser_click(element, ref)
mcp__playwright__browser_type(element, ref, text)

// 4. Capture visual state
mcp__playwright__browser_take_screenshot()

// 5. Test responsiveness
mcp__playwright__browser_resize(width, height)
```

### Testing Workflow
1. **Before Implementation**: Take baseline screenshots of existing UI
2. **During Development**: Continuously test component changes
3. **After Changes**: Verify functionality and visual appearance
4. **Cross-Device Testing**: Test different viewport sizes for responsiveness
5. **Component Testing**: Test individual component interactions
6. **User Journey Testing**: Test complete user workflows

### Best Practices
- Always use `browser_snapshot()` before taking actions for better element targeting
- Take screenshots at key development milestones for visual comparison
- Test both desktop and mobile viewports using `browser_resize()`
- Verify form submissions, button clicks, and navigation work correctly
- Test error states and loading states
- Validate accessibility features and keyboard navigation

### Integration with Development Process
- Use after making component changes to verify they work correctly
- Test before committing code changes
- Validate responsive behavior across different screen sizes
- Ensure interactive elements (buttons, forms, links) function properly
- Test the Performance Dashboard charts and GitHub Integration features thoroughly

## Vercel Deployment with Playwright

Playwright MCP can be used to manage Vercel deployments through the web interface. This is particularly useful for monitoring deployment status, accessing deployment logs, and managing project settings.

### Key Deployment URLs
- **Project Dashboard**: `https://vercel.com/projects/portfolio`
- **Live Website**: `https://portfolio-eosin.vercel.app/`
- **GitHub Repository**: `https://github.com/softwareengineer/website`

### Deployment Workflow with Playwright

1. **Navigate to Vercel Project**:
   ```javascript
   mcp__playwright__browser_navigate("https://vercel.com/projects/portfolio")
   ```

2. **Monitor Deployment Status**:
   - Check deployment status in the Production Deployment section
   - View build logs and runtime logs
   - Monitor performance metrics and analytics

3. **Visit Deployed Site**:
   - Click "Visit" button to open the live website
   - Test functionality on the production environment
   - Verify all features work correctly

### Automatic Deployment Process
- **Trigger**: Push commits to the `master` branch
- **Source**: GitHub repository auto-sync
- **Build**: Automatic Vite build process
- **Deploy**: Instant deployment to Vercel edge network
- **Monitoring**: Real-time deployment status and logs

### Using Playwright for Deployment Management
- **Check deployment status**: Navigate to project dashboard
- **View build logs**: Click "Build Logs" link
- **Monitor analytics**: Access Analytics and Speed Insights
- **Manage domains**: Configure custom domains via Settings
- **Instant rollback**: Use rollback feature if issues occur

### Best Practices
- Verify deployment success through Playwright after each push
- Test critical user flows on the live site
- Monitor performance metrics regularly
- Use Vercel's preview deployments for testing branches

## Development Commands

```bash
# Development server (runs on http://localhost:5173 or next available port)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting (ESLint with TypeScript support)
npm run lint

# Testing with Playwright
npm run test                      # Run all Playwright tests
npm run test:heatmap              # Standard heatmap test suite
npm run test:heatmap:quick        # Quick heatmap validation
npm run test:heatmap:full         # Comprehensive heatmap testing
npm run test:heatmap:load         # Performance load testing
npm run test:headed               # Run tests with browser visible
npm run test:debug                # Debug tests interactively
```

## Architecture & Key Features

### Tech Stack
- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7 with ESLint/Prettier
- **Styling**: Tailwind CSS 4 with PostCSS
- **State Management**: Zustand for global state, TanStack Query for server state
- **Animation**: Framer Motion, Lottie React
- **3D Graphics**: Three.js with React Three Fiber + Drei
- **Data Visualization**: Chart.js + react-chartjs-2 (with zoom/annotation plugins), D3.js
- **Analytics**: Web Vitals, Vercel Analytics, Custom Supabase Analytics
- **Database**: Supabase (PostgreSQL) for analytics & heatmap data
- **Testing**: Playwright with comprehensive test suite

### Path Aliases
The project uses TypeScript path aliases configured in both `tsconfig.json` and `vite.config.ts`:
- `@/*` → `./src/*`
- `@components/*` → `./src/components/*`
- `@hooks/*` → `./src/hooks/*`
- `@services/*` → `./src/services/*`
- `@types/*` → `./src/types/*`

### Component Organization
```
src/components/
├── layout/          # Header, Footer, Navigation
├── sections/        # Hero, About, Projects, Contact
├── ui/              # Reusable UI components (Button, Card, Loading spinners)
├── dashboard/       # Performance Dashboard components (MetricsChart, MetricsTestComponent)
├── github/          # GitHub Integration (ActivityFeed, ContributionGraph, RepoStats, LanguageChart)
├── heatmap/         # Heatmap analytics (PortfolioHeatmap, HeatmapErrorBoundary)
├── animations/      # Lottie & Framer Motion animations
├── three/           # 3D components (ParticleField)
├── seo/             # SEO components (StructuredData, DynamicStructuredData)
└── providers/       # Context providers (ThemeProvider)
```

### Key Systems
```
src/
├── heatmap/         # Microsoft Clarity-style heatmap implementation
│   ├── ClarityHeatmapManager.ts    # Main heatmap orchestrator
│   ├── ClarityHeatmapRenderer.ts   # Canvas rendering engine
│   └── HeatmapDataProcessor.ts     # Data processing & optimization
├── services/
│   ├── supabase-analytics.ts       # Analytics service with Supabase integration
│   ├── github-api.ts               # GitHub API integration with caching
│   ├── heatmap-database.ts         # Heatmap data persistence
│   └── analytics.ts                # Web Vitals & performance metrics
└── lib/
    └── supabase.ts                  # Supabase client configuration
```

### Priority Features Implementation Status

1. **Performance Dashboard** (Days 7-10)
   - Real-time Web Vitals tracking
   - Interactive charts with Chart.js
   - Metrics export functionality
   - Components: `MetricsChart`, `PerformanceCard`, `DashboardLayout`

2. **GitHub Integration Suite** (Days 11-14)
   - GitHub API integration with caching
   - Contribution graph with D3.js
   - Repository statistics
   - Components: `ActivityFeed`, `ContributionGraph`, `RepoStats`, `LanguageChart`

### Updated Feature Priority (Visual-First Approach)

After completing the above priority features, the implementation order has been updated to prioritize visual and interactive showcases:

1. **Enhanced Performance Dashboard** (2 days) - Chart.js plugins for zoom, pan, annotations
2. **Lottie Animations Integration** (2-3 days) - Professional After Effects animations
3. **3D Project Gallery** (4-5 days) - Three.js/React Three Fiber immersive experience
4. **Algorithm Visualizer** (4-5 days) - D3.js interactive CS fundamentals
5. **Live Code Playground** (3-4 days) - Monaco Editor (VS Code in browser)
6. **Terminal Interface** (3-4 days) - Xterm.js CLI portfolio navigation

### Environment Variables
Required environment variables (set in `.env.local`):
```
VITE_GITHUB_USERNAME=yourusername
VITE_GA_ID=your-ga-id
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Development Timeline Context
The project follows a 16-day implementation plan:
- Days 1-3: Foundation and core components
- Days 4-5: Content and polish
- Day 6: Initial deployment
- Days 7-10: Performance Dashboard implementation
- Days 11-14: GitHub Integration implementation
- Days 15-16: Final polish and launch

**Timeline Tracking**: Always update `plans/06-consolidated-timeline.md` as tasks are completed. Mark completed tasks with `[x]` and add completion notes where relevant.

### Key Services to Implement
- `services/analytics.ts` - Performance metrics collection
- `services/github-api.ts` - GitHub data fetching with caching
- `hooks/useWebVitals.ts` - Web Vitals monitoring hook
- `hooks/useGitHubData.ts` - GitHub data fetching hook

### Deployment Target
The project is designed to be deployed on Vercel with:
- Automatic deployments from GitHub
- Environment variables configured in Vercel dashboard
- Edge Functions support for serverless functionality

### Current Implementation Status
- ✅ Project setup with Vite + React + TypeScript
- ✅ Tailwind CSS configured with dark mode support
- ✅ All dependencies installed (including Three.js, Chart.js, D3.js, Lottie)
- ✅ Complete folder structure with all components
- ✅ Environment variables configured for GitHub & Supabase
- ✅ SEO components with structured data
- ✅ GitHub Integration Suite fully implemented
- ✅ Performance Dashboard with Web Vitals tracking
- ✅ Microsoft Clarity-style heatmap with database integration
- ✅ 3D particle effects with Three.js
- ✅ Comprehensive Playwright test suite
- ✅ Vercel deployment configured with security headers
- ✅ Supabase analytics service with real-time data
- 🚧 Enhanced chart visualizations in progress
- 🚧 Additional Lottie animations planned

## Website Development Communication

### Patch Notes and Feature Tracking
- Always maintain website banners explaining features in development or recently launched
- Maintain a comprehensive patch notes section detailing all historical and new commits
- Each commit in the patch notes should be labeled with its commit hash
- Update patch notes after every significant change or commit to the website project

## Testing Configuration

### Playwright Test Suite
The project includes a comprehensive Playwright testing framework configured in `playwright.config.ts`:
- **Test Profiles**: Desktop (Chrome, Firefox, Safari), Tablet (iPad, Android), Mobile (iPhone, Android)
- **Special Tests**: Performance testing, High DPI testing, Accessibility testing
- **Heatmap Tests**: Located in `tests/` directory with multiple test scenarios
- **Test Runner**: Uses `scripts/run-heatmap-tests.js` for different test modes (quick, standard, full)
- **Web Server**: Automatically starts dev server on port 5173 for testing

### Running Tests
```bash
# Before running tests for the first time
npm run test:install    # Install Playwright browsers

# Run specific test suites
npm run test:heatmap:quick   # Quick validation
npm run test:heatmap         # Standard suite
npm run test:heatmap:full    # Comprehensive testing
npm run test:report          # View test results
```