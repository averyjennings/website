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
npm install framer-motion clsx zustand
npm install -D @types/node
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
│   ├── Layout.tsx
│   ├── Hero.tsx
│   ├── About.tsx
│   ├── Projects.tsx
│   └── Contact.tsx
├── App.tsx
└── main.tsx
```

### 4. Deploy to Vercel (Get it live immediately!)
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
// src/components/Hero.tsx
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

## MVP Feature Checklist (Week 1)

- [ ] Hero section with animation
- [ ] About section with skills
- [ ] Projects grid (link to GitHub)
- [ ] Contact section with links
- [ ] Smooth scrolling navigation
- [ ] Mobile responsive design
- [ ] Dark mode toggle
- [ ] Basic SEO meta tags
- [ ] Deploy to Vercel

## Next Steps After MVP

1. **Add Interactive Demo** (Week 2)
   - Start with a simple code syntax highlighter
   - Or a CSS animation playground

2. **Optimize Performance** (Week 2)
   - Add lazy loading for images
   - Implement code splitting
   - Optimize bundle size

3. **Add Analytics** (Week 2)
   - Google Analytics 4
   - Or Vercel Analytics

4. **Enhance with Features** (Week 3+)
   - See `03-future-features.md` for ideas
   - Start with the highest impact features

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