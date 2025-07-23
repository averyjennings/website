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

## Visual Feedback & Screenshots

When the user mentions "check the screenshots" or asks you to look at uploaded screenshots, check the `website/screenshots/` directory. This directory contains visual feedback of the UI for validation purposes. Use the Read tool to view PNG/JPG files in this directory to understand the current visual state of the website and identify any UI issues that need fixing.

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

# Linting
npm run lint
```

## Architecture & Key Features

### Tech Stack
- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4 with PostCSS
- **State Management**: Zustand for global state, TanStack Query for server state
- **Animation**: Framer Motion
- **Data Visualization**: Chart.js + react-chartjs-2, D3.js
- **Performance Monitoring**: Web Vitals

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
├── ui/              # Reusable UI components (Button, Card, etc.)
├── dashboard/       # Performance Dashboard components
└── github/          # GitHub Integration components
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

### Environment Variables
Required environment variables (set in `.env.local`):
```
VITE_GITHUB_USERNAME=yourusername
VITE_GA_ID=your-ga-id
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
- ✅ Tailwind CSS configured
- ✅ All dependencies installed
- ✅ Folder structure created
- ✅ Environment variables configured
- ⏳ Core components need implementation
- ⏳ Priority features pending