# Deployment & Hosting Plan

## Overview
This plan outlines the most cost-effective approach to deploy and host the portfolio website, leveraging free tiers and optimizing for performance while minimizing costs.

## Recommended Hosting Stack (100% Free)

### Primary Host: Vercel (Recommended)
**Why Vercel?**
- **Free Tier**: 100GB bandwidth/month, unlimited sites
- **Features**: Automatic HTTPS, global CDN, serverless functions
- **DX**: Git integration, preview deployments, instant rollbacks
- **Analytics**: Basic analytics included free
- **Performance**: Edge network, automatic optimizations

**Setup Process:**
1. Connect GitHub repository
2. Auto-deploy on push to main
3. Preview deployments for PRs
4. Custom domain support (free)

### Alternative Hosts (Also Free)

**Netlify**
- 100GB bandwidth/month
- 300 build minutes/month
- Serverless functions (125k requests/month)
- Form handling built-in

**Cloudflare Pages**
- Unlimited bandwidth
- 500 builds/month
- Workers for serverless (100k requests/day)
- Best CDN performance

**GitHub Pages**
- 100GB bandwidth/month
- Limited to static sites
- No serverless functions
- Good for simple portfolios

## Domain Strategy

### Year 1: Subdomain Approach (Free)
- Use `yourname.vercel.app`
- Or get creative domains:
  - `yourname.netlify.app`
  - `yourname.pages.dev` (Cloudflare)
  - `yourname.github.io`

### Year 2+: Custom Domain (~$12/year)
**Recommended Registrars:**
1. **Cloudflare Registrar**: At-cost pricing (~$9/year for .com)
2. **Porkbun**: Cheap with free WHOIS privacy
3. **Namecheap**: Regular sales and promos

**Free Domain Options:**
- `.tk`, `.ml`, `.ga` domains (not recommended - looks unprofessional)
- GitHub Student Pack (free .me domain)
- Some web3 domains if into crypto

## Deployment Configuration

### Build & Deploy Settings
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

### Environment Variables
```bash
# Production (Set in Vercel Dashboard)
VITE_GITHUB_USERNAME=yourgithubusername
VITE_GA_ID=G-XXXXXXXXXX
VITE_PUBLIC_URL=https://yourdomain.com
VITE_SENTRY_DSN=your-sentry-dsn # Optional

# Development (.env.local)
VITE_GITHUB_USERNAME=yourgithubusername
VITE_GA_ID=test
VITE_PUBLIC_URL=http://localhost:5173
VITE_GITHUB_TOKEN=ghp_xxxx # Optional for higher rate limits
```

**Setting Environment Variables in Vercel:**
1. Go to Project Settings → Environment Variables
2. Add each variable for Production environment
3. Optional: Add different values for Preview/Development

### GitHub Actions CI/CD
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Type checking
        run: npm run type-check
      
      - name: Run tests
        run: npm run test --if-present
      
      - name: Build project
        run: npm run build
      
      - name: Check bundle size
        run: npx vite-bundle-visualizer --open false
      
      # Vercel automatically deploys on push to main
```

### Priority Features Deployment Considerations

**Performance Dashboard:**
- Web Vitals data stored in localStorage (no backend needed)
- Charts render client-side (no server processing)
- Export functionality uses browser APIs

**GitHub Integration:**
- API calls made directly from browser (CORS enabled)
- Consider caching responses to avoid rate limits
- No API keys needed for public data
- Optional: Use Vercel Edge Functions for proxy if rate limits hit

## Cost Optimization Strategies

### Asset Optimization
1. **Images**
   - Use WebP/AVIF formats
   - Lazy loading with Intersection Observer
   - Responsive images with srcset
   - Host on Cloudinary (free tier: 25GB/month)

2. **Fonts**
   - Self-host Google Fonts
   - Use variable fonts
   - Preload critical fonts
   - Subset fonts to used characters

3. **Code**
   - Tree shaking with Vite
   - Code splitting by route
   - Compress with Brotli
   - Minify all assets

### CDN Strategy
```javascript
// Use free CDNs for libraries
// jsDelivr for npm packages
<script src="https://cdn.jsdelivr.net/npm/three@0.150.0/build/three.min.js"></script>

// unpkg as backup
<script src="https://unpkg.com/three@0.150.0/build/three.min.js"></script>
```

### Database Options (If Needed)

**Free Tier Databases:**
1. **Supabase**: 500MB, 2GB transfer/month
2. **PlanetScale**: 5GB storage, 1 billion row reads/month
3. **Neon**: 3GB storage
4. **MongoDB Atlas**: 512MB storage
5. **Firebase**: 1GB storage, 10GB/month transfer

### External Services (Free Tiers)

**Analytics:**
- Vercel Analytics (included)
- Google Analytics 4 (unlimited)
- Plausible (trial, then self-host)
- Umami (self-hosted)

**Error Tracking:**
- Sentry: 5k errors/month
- LogRocket: 1k sessions/month
- Rollbar: 5k events/month

**Email/Contact Forms:**
- EmailJS: 200 emails/month
- Formspree: 50 submissions/month
- Netlify Forms: 100/month
- Web3Forms: 250/month

**Comments (for blog):**
- Giscus (GitHub discussions)
- Utterances (GitHub issues)
- Disqus (free with ads)

## Monitoring & Maintenance

### Uptime Monitoring (Free)
1. **UptimeRobot**: 50 monitors, 5-minute checks
2. **Pingdom**: 1 monitor (trial)
3. **Better Uptime**: 10 monitors
4. **GitHub Actions**: Custom monitor

### Performance Monitoring
```javascript
// Custom Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics endpoint
  const body = JSON.stringify(metric);
  
  // Use sendBeacon for reliability
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', body);
  }
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## Scaling Strategy

### Traffic Growth Handling
1. **0-10k visitors/month**: Current free tier
2. **10k-50k visitors/month**: Still within free tier
3. **50k-100k visitors/month**: Consider Cloudflare in front
4. **100k+ visitors/month**: May need paid plan ($20/month)

### Cost Triggers to Watch
- Bandwidth usage (100GB/month limit)
- Build minutes (usually plenty)
- Serverless function invocations
- Image transformations

### When to Upgrade
- Consistent >80% bandwidth usage
- Need more build concurrency
- Require team features
- Need SLA guarantees

## Security Measures

### Free Security Features
1. **HTTPS**: Automatic with all providers
2. **DDoS Protection**: Basic included
3. **CSP Headers**: Configure in vercel.json
4. **CORS**: Proper configuration

### Security Headers
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

## Backup Strategy

### Code Backup
- GitHub (primary)
- Local git clones
- Automated backups to another git provider

### Content Backup
- If using CMS: Regular exports
- Database backups if applicable
- Static content in git

## Migration Plan

### If Changing Providers
1. Export all data
2. Update DNS records
3. Set up redirects
4. Monitor for 404s
5. Update sitemap
6. Notify search engines

## Monthly Cost Breakdown

### Year 1 (No Domain)
- Hosting: $0 (Vercel free)
- Domain: $0 (subdomain)
- Analytics: $0 (GA4)
- CDN: $0 (included)
- **Total: $0/month**

### Year 2+ (With Domain)
- Hosting: $0 (Vercel free)
- Domain: ~$1/month ($12/year)
- Analytics: $0 (GA4)
- CDN: $0 (included)
- **Total: ~$1/month**

### Optional Upgrades
- Custom email: $6/month (Google Workspace)
- Advanced analytics: $9/month (Plausible)
- Error tracking: $26/month (Sentry Team)
- Performance monitoring: $15/month (Datadog)

## Launch Checklist

- [ ] Domain decided (or use subdomain)
- [ ] Vercel account created
- [ ] GitHub repo connected
- [ ] Environment variables set
- [ ] Build succeeds
- [ ] Preview deployment works
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Analytics connected
- [ ] Error tracking setup
- [ ] Performance baseline recorded
- [ ] Security headers configured
- [ ] Sitemap submitted to Google
- [ ] Social sharing tags tested
- [ ] Load testing completed