# CLAUDE.md Template

This template should be used to create the CLAUDE.md file in the root of your website project on Day 6. Copy this content and customize it with your specific details.

---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a professional portfolio website for a software engineer, built with modern web technologies to showcase coding skills and impress potential employers.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + CSS Modules
- **State Management**: Zustand + React Query (TanStack Query)
- **Routing**: React Router v6
- **Charts/Visualization**: Chart.js + D3.js
- **Animations**: Framer Motion
- **Deployment**: Vercel

## Key Features
1. **Performance Dashboard**: Real-time Web Vitals monitoring with interactive charts
2. **GitHub Integration**: Live activity feed, contribution graph, and repository statistics
3. **Responsive Design**: Mobile-first approach with smooth animations
4. **Dark/Light Theme**: Toggle between themes with system preference detection

## Development Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests (if configured)
npm run test
```

## Project Structure
```
src/
├── components/
│   ├── dashboard/     # Performance dashboard components
│   ├── github/        # GitHub integration components
│   ├── layout/        # Layout components (Header, Footer)
│   ├── sections/      # Page sections (Hero, About, Projects)
│   └── ui/           # Reusable UI components
├── hooks/            # Custom React hooks
├── pages/            # Route pages
├── services/         # API services and utilities
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Environment Variables
Required environment variables (set in .env.local for development):
- `VITE_GITHUB_USERNAME`: Your GitHub username
- `VITE_GA_ID`: Google Analytics ID (optional)
- `VITE_SENTRY_DSN`: Sentry error tracking (optional)
- `VITE_GITHUB_TOKEN`: GitHub personal access token (optional, for higher rate limits)

## API Integration
- **GitHub API**: Used for fetching repository data, commit history, and contribution stats
- **Web Vitals**: Browser API for performance metrics
- Rate limiting is handled with caching and React Query

## Performance Considerations
- Images are lazy loaded with Intersection Observer
- Routes are code-split with React.lazy()
- API responses are cached for 5 minutes
- Charts render only when visible on screen

## Styling Guidelines
- Use Tailwind utility classes for styling
- Custom CSS modules for complex component styles
- Follow mobile-first responsive design
- Maintain consistent spacing using Tailwind's spacing scale

## Component Patterns
- Functional components with TypeScript
- Custom hooks for data fetching and state logic
- Error boundaries for graceful error handling
- Loading skeletons for better UX

## Testing Approach
- Unit tests for utility functions
- Component testing with React Testing Library
- E2E tests for critical user flows (if implemented)

## Deployment
- Automatic deployments via Vercel on push to main branch
- Preview deployments for pull requests
- Environment variables configured in Vercel dashboard

## Common Tasks

### Adding a New Section
1. Create component in `src/components/sections/`
2. Import and add to appropriate page
3. Ensure responsive design
4. Add smooth scroll anchor if needed

### Updating GitHub Stats
- Data automatically refreshes every 5 minutes
- Force refresh by clearing localStorage
- Check rate limits in browser console

### Modifying Charts
- Chart configurations in respective component files
- Use Chart.js for standard charts
- Use D3.js for custom visualizations

### Performance Optimization
1. Run Lighthouse audit
2. Check bundle size with `npm run build`
3. Optimize images and lazy load
4. Minimize JavaScript execution time

## Troubleshooting

### GitHub API Rate Limiting
- Public API allows 60 requests/hour
- Add personal token for 5000 requests/hour
- Check X-RateLimit headers in Network tab

### Build Errors
- Clear node_modules and reinstall
- Check for TypeScript errors
- Ensure all environment variables are set

### Performance Issues
- Check Web Vitals in Performance Dashboard
- Use React DevTools Profiler
- Minimize re-renders with React.memo

## Future Enhancements
See `plans/03-future-features.md` for roadmap of additional features including:
- Live code playground
- Algorithm visualizer
- 3D project gallery
- AI-powered features