# Deployment Guide

## Deploying to Vercel

### Prerequisites
- GitHub account with the repository
- Vercel account (free tier is sufficient)

### Step-by-Step Deployment

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign up/login with your GitHub account

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Select the `website` directory as the root directory

3. **Configure Project**
   - Framework Preset: Vite
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)

4. **Environment Variables**
   Set these in Vercel's Environment Variables section:
   ```
   VITE_GITHUB_USERNAME=yourgithubusername
   VITE_GA_ID=your-google-analytics-id (optional)
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (usually 1-2 minutes)
   - Your site will be live at `https://your-project.vercel.app`

### Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Follow the DNS configuration instructions
4. SSL certificate will be automatically provisioned

### Continuous Deployment

- Every push to the `master` branch will trigger a new deployment
- Pull requests will create preview deployments
- You can view deployment history in the Vercel dashboard

### Performance Monitoring

After deployment:
1. Enable Vercel Analytics (free tier available)
2. Monitor Web Vitals in the dashboard
3. Set up alerts for performance regressions

### Troubleshooting

**Build Fails:**
- Check the build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify environment variables are set correctly

**404 Errors:**
- The `vercel.json` file handles SPA routing
- Ensure the file is committed to the repository

**Slow Performance:**
- Check bundle size in build output
- Enable caching headers in vercel.json
- Use Vercel's Edge Network for global distribution