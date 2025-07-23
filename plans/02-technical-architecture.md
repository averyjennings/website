# Technical Architecture Plan

## Technology Stack

### Frontend
**Core Framework: React 18 + TypeScript + Vite**
- **React 18**: Industry standard, excellent ecosystem, showcases React skills
- **TypeScript**: Type safety, better IDE support, demonstrates TypeScript proficiency
- **Vite**: Lightning-fast HMR, optimized builds, modern tooling

**Styling: Tailwind CSS + CSS Modules**
- **Tailwind CSS**: Rapid development, consistent design system, highly customizable
- **CSS Modules**: For complex component-specific styles
- **PostCSS**: For advanced CSS processing
- **clsx/cn**: For conditional class management

**State Management**
- **Zustand**: Lightweight, TypeScript-friendly for global state (theme, user preferences)
- **React Query (TanStack Query)**: For server state and API calls (GitHub API, analytics)
- **Local State**: useState/useReducer for component state

**Priority Features Libraries**
- **Chart.js + react-chartjs-2**: Performance dashboard visualization
- **D3.js**: Custom GitHub contribution graphs and advanced charts  
- **web-vitals**: Core Web Vitals monitoring for performance dashboard
- **date-fns**: Date manipulation for analytics and GitHub data

**Animation & Interaction**
- **Framer Motion**: Smooth, performant animations
- **React Spring**: For physics-based animations
- **Lottie React**: For complex animated illustrations

### Backend (Minimal for MVP)
**API Routes: Vercel Edge Functions**
- Serverless functions for contact form, analytics, etc.
- TypeScript support out of the box
- Zero cold starts with Edge Runtime
- Free tier generous for low traffic

**Future Backend Options**
- **Hono**: Lightweight, fast, works on edge runtime
- **tRPC**: End-to-end typesafe APIs
- **Prisma + PlanetScale**: If database needed later

### Dependencies for Priority Features
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "framer-motion": "^10.16.0",
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^5.0.0",
    "clsx": "^2.0.0",
    
    // Priority Features
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "d3": "^7.8.5",
    "@types/d3": "^7.4.3",
    "web-vitals": "^3.5.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "postcss": "^8.4.0",
    "prettier": "^3.0.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

### Code Quality & Testing
- **ESLint**: Enforce code standards
- **Prettier**: Consistent formatting
- **Husky + lint-staged**: Pre-commit hooks
- **Vitest**: Unit testing (faster than Jest)
- **Playwright**: E2E testing for critical paths

## Architecture Patterns

### Component Architecture
```
components/
├── ui/               # Reusable UI components
│   ├── Button/
│   ├── Card/
│   ├── Chart/        # Chart wrapper components
│   └── Modal/
├── layout/           # Layout components
│   ├── Header/
│   ├── Footer/
│   └── PageLayout/
├── sections/         # Page sections
│   ├── Hero/
│   ├── About/
│   └── Projects/
├── dashboard/        # 🎯 Priority: Performance Dashboard
│   ├── MetricsChart/
│   ├── PerformanceCard/
│   ├── DashboardLayout/
│   └── WebVitalsTracker/
├── github/           # 🎯 Priority: GitHub Integration
│   ├── ActivityFeed/
│   ├── ContributionGraph/
│   ├── RepoStats/
│   ├── LanguageChart/
│   └── DeveloperInsights/
└── interactive/      # Future: Interactive showcases
    ├── CodePlayground/
    ├── AlgoVisualizer/
    └── AnimationDemo/
```

### Data Flow
```
User Interaction
       ↓
React Component
       ↓
Local State / Zustand (UI State)
       ↓
TanStack Query (Server State)
       ↓
Vercel Edge Functions
       ↓
External APIs (GitHub, Analytics)
```

### 🎯 Priority Features Architecture

#### Performance Dashboard Data Flow
```
Web Vitals API → useWebVitals Hook → Dashboard Components
       ↓                ↓                    ↓
Performance Observer → Chart.js → Real-time Visualization
       ↓                ↓                    ↓
localStorage Cache → Analytics Service → Export Functionality
```

#### GitHub Integration Data Flow
```
GitHub API → TanStack Query → useGitHubData Hook
     ↓              ↓                ↓
Data Processing → Cache Strategy → Component State
     ↓              ↓                ↓
D3.js Rendering → Chart Updates → UI Components
```

#### Priority Features Data Models
```typescript
// Performance Dashboard
interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: Date;
}

// GitHub Integration
interface GitHubRepository {
  id: number;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  updated_at: string;
}

interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}
```

### Performance Optimizations

**Build Time**
- Code splitting by route
- Tree shaking unused code
- Minification and compression
- Image optimization with next-gen formats

**Runtime**
- React.lazy() for code splitting
- useMemo/useCallback for expensive operations
- Virtual scrolling for long lists
- Intersection Observer for lazy loading

**Caching Strategy**
- Static assets: 1 year cache
- API responses: SWR pattern
- Service Worker for offline support
- Edge caching for API routes

### SEO & Meta Tags
```typescript
interface SEOConfig {
  title: string;
  description: string;
  image: string;
  url: string;
  twitterHandle: string;
  keywords: string[];
}
```

**Implementation**
- React Helmet Async for meta tags
- Structured data (JSON-LD)
- Sitemap generation
- Robots.txt configuration
- Open Graph tags

### Security Considerations
- Content Security Policy headers
- HTTPS only (enforced by Vercel)
- Environment variables for secrets
- Input sanitization for forms
- Rate limiting on API routes

### Monitoring & Analytics

**Performance Monitoring**
- Vercel Analytics (Core Web Vitals)
- Error tracking with Sentry (free tier)
- Custom performance marks

**User Analytics**
- Google Analytics 4 (free)
- Custom event tracking
- Conversion goals (contact form submissions)

### CI/CD Pipeline
```yaml
# GitHub Actions
- Lint and Type Check
- Run Tests
- Build Project
- Deploy Preview (PRs)
- Deploy Production (main)
```

### Routing Configuration
```typescript
// Using React Router v6
const routes = [
  { path: '/', element: <HomePage /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/github', element: <GitHubShowcasePage /> },
  { path: '/projects', element: <ProjectsPage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/contact', element: <ContactPage /> },
];
```

### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@services/*": ["./src/services/*"],
      "@types/*": ["./src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Environment Variables
```env
# .env.local
VITE_GITHUB_USERNAME=your-github-username
VITE_GA_ID=your-ga-id
VITE_SENTRY_DSN=your-sentry-dsn
VITE_API_URL=your-api-url
VITE_GITHUB_TOKEN=your-github-token # Optional for higher rate limits
```

## Technology Decisions Rationale

1. **Why Vite over Next.js?**
   - Simpler setup for SPA
   - Faster development experience
   - Smaller bundle size for static site
   - Better for showcasing vanilla React skills

2. **Why Tailwind CSS?**
   - Rapid prototyping
   - Consistent design system
   - Smaller CSS bundle with PurgeCSS
   - Great developer experience

3. **Why Vercel for hosting?**
   - Generous free tier
   - Automatic deploys from GitHub
   - Edge Functions support
   - Built-in analytics
   - Global CDN

4. **Why TypeScript everywhere?**
   - Demonstrates TypeScript proficiency
   - Catches errors early
   - Better IDE support
   - Self-documenting code