# Quick Start Guide - Get Your Portfolio Live ASAP

## Day 1: Setup (2-3 hours)

### 1. Initialize the Project
```bash
# Create Vite + React + TypeScript project
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install essential packages
npm install framer-motion clsx zustand @tanstack/react-query
npm install -D @types/node

# Install priority features dependencies
npm install chart.js react-chartjs-2 d3 web-vitals date-fns
npm install -D @types/d3
```

### 2. Configure Tailwind
```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3. Create Basic Structure
```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── About.tsx
│   │   ├── Projects.tsx
│   │   └── Contact.tsx
│   ├── dashboard/      # Priority Feature 1
│   │   └── (components will be added Days 7-10)
│   └── github/         # Priority Feature 2
│       └── (components will be added Days 11-14)
├── hooks/
│   ├── useWebVitals.ts
│   └── useGitHubData.ts
├── services/
│   ├── analytics.ts
│   └── github-api.ts
├── types/
│   └── index.ts
├── App.tsx
└── main.tsx
```

### 4. Setup Code Quality Tools
```bash
# Install ESLint and Prettier
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-react-hooks

# Create .eslintrc.json
echo '{"extends": ["react-app", "prettier"], "rules": {}}' > .eslintrc.json

# Create .prettierrc
echo '{"semi": true, "singleQuote": true, "tabWidth": 2}' > .prettierrc
```

### 5. Environment Variables Setup
```bash
# Create .env.local for development
echo "VITE_GITHUB_USERNAME=yourusername" > .env.local
echo "VITE_GA_ID=your-ga-id" >> .env.local

# Create .env.example for version control
echo "VITE_GITHUB_USERNAME=" > .env.example
echo "VITE_GA_ID=" >> .env.example
```

### 6. Deploy to Vercel (Get it live immediately!)
```bash
# Push to GitHub first
git add .
git commit -m "Initial portfolio setup"
git push origin master

# Then go to vercel.com
# 1. Sign up with GitHub
# 2. Import your repository
# 3. Deploy (it's that simple!)
```

## Day 2-3: Build Core Components

### Hero Section Template
```typescript
// src/components/sections/Hero.tsx
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-6xl font-bold mb-4">
          Hi, I'm [Your Name]
        </h1>
        <p className="text-2xl text-gray-600 mb-8">
          Software Engineer
        </p>
        <div className="flex gap-4 justify-center">
          <a href="#projects" className="px-6 py-3 bg-blue-600 text-white rounded-lg">
            View Projects
          </a>
          <a href="#contact" className="px-6 py-3 border-2 border-gray-300 rounded-lg">
            Contact Me
          </a>
        </div>
      </motion.div>
    </section>
  );
}
```

## Essential Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npx tsc --noEmit

# Linting (after setting up ESLint)
npm run lint
```

## MVP Feature Checklist (Days 1-6)

- [ ] Hero section with animation
- [ ] About section with skills
- [ ] Projects grid (link to GitHub)
- [ ] Contact section with links
- [ ] Smooth scrolling navigation
- [ ] Mobile responsive design
- [ ] Dark mode toggle
- [ ] Basic SEO meta tags
- [ ] Deploy to Vercel
- [ ] Create CLAUDE.md file

## Priority Features (Days 7-14)

### Performance Dashboard (Days 7-10)
- [ ] Web Vitals integration
- [ ] Real-time metrics collection
- [ ] Interactive charts with Chart.js
- [ ] Performance analytics export

### GitHub Integration Suite (Days 11-14)
- [ ] GitHub API integration
- [ ] Contribution graph with D3.js
- [ ] Repository statistics
- [ ] Developer insights dashboard

## Next Steps After Priority Features

1. **Polish & Optimize** (Days 15-16)
   - Performance testing
   - Mobile optimization
   - User feedback integration

2. **Future Features** (After Day 16)
   - Live Code Playground
   - Algorithm Visualizer
   - See `03-future-features.md` for full list

## Resources

- **Inspiration**: awwwards.com, dribbble.com
- **Icons**: heroicons.com, lucide.dev
- **Animations**: framer.com/motion/examples
- **Colors**: tailwindcss.com/docs/customizing-colors
- **Fonts**: fonts.google.com

## Get Help

- **React**: react.dev
- **TypeScript**: typescriptlang.org
- **Tailwind**: tailwindcss.com
- **Vercel**: vercel.com/docs

Remember: **Ship fast, iterate later!** Get your basic portfolio live first, then enhance it over time.