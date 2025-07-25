# GitHub Token Configuration Guide

## Overview
The portfolio website requires a GitHub Personal Access Token to unlock enhanced features and increase API rate limits from 60/hour to 5,000/hour.

## ✅ Safety Confirmation
**This is completely safe for public portfolios because:**
- Only accesses publicly available repository data
- Same data visible on GitHub.com publicly
- No write permissions or sensitive data access
- Industry standard practice for developer portfolios

## 🔧 Token Generation

### Step 1: Create GitHub Personal Access Token
1. Visit: https://github.com/settings/tokens/new
2. Token name: `Portfolio Website Integration`
3. Expiration: `90 days` (recommended) or `1 year`
4. Select the following scopes:
   - ✅ `public_repo` - Access public repositories
   - ✅ `read:user` - Read public user profile data
   - ✅ `user:email` - Access public email addresses

### Step 2: Generate and Copy Token
1. Click "Generate token"
2. **IMPORTANT**: Copy the token immediately - it won't be shown again
3. Store it securely (password manager recommended)

## 🏠 Local Development Setup

### Update .env.local file:
```bash
# Replace 'your-github-token-here' with your actual token
VITE_GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Verify local setup:
1. Start dev server: `npm run dev`
2. Check GitHub section - should show enhanced data
3. Check browser console - no more rate limit warnings

## 🚀 Production Deployment (Vercel)

### Option 1: Vercel Dashboard
1. Visit: https://vercel.com/avery-jennings-projects/avery-portfolio
2. Go to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `VITE_GITHUB_TOKEN`
   - **Value**: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Environments**: Production, Preview, Development (all selected)
4. Click **Save**

### Option 2: Vercel CLI
```bash
# Add environment variable via CLI
vercel env add VITE_GITHUB_TOKEN production
# Paste your token when prompted
```

### Trigger Deployment
After adding the environment variable:
1. Push any change to trigger re-deployment, or
2. Go to **Deployments** → **Redeploy** latest deployment

## 🎯 Enhanced Features Unlocked

With authentication, the GitHub section will show:
- ✅ **5,000/hour rate limit** (vs 60/hour without token)
- ✅ **Real repository statistics** with accurate data
- ✅ **Recent activity feed** with latest commits
- ✅ **Language distribution analytics** 
- ✅ **Contribution graph data** with proper metrics
- ✅ **Repository search and filtering**

## 🔒 Security Best Practices

### Token Security:
- ✅ Never commit tokens to git repositories
- ✅ Use environment variables only
- ✅ Rotate tokens every 90 days
- ✅ Monitor token usage in GitHub settings

### Access Control:
- ✅ Minimal required scopes only
- ✅ Public data access only
- ✅ No write permissions granted
- ✅ Easy to revoke if needed

## 🐛 Troubleshooting

### Common Issues:

**1. "403 Forbidden" errors:**
- Check token is correctly set in environment variables
- Verify token hasn't expired
- Ensure required scopes are selected

**2. "GitHub Token Configuration Required" message:**
- Token not properly set in environment
- Redeploy after adding environment variable
- Check token format (should start with `ghp_`)

**3. Old rate limit warnings:**
- Clear browser cache
- Restart development server
- Verify token in .env.local file

### Verification Commands:
```bash
# Check environment variables are loaded
echo $VITE_GITHUB_TOKEN

# Test API access with token
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

## 📊 Monitoring

### GitHub Token Usage:
1. Visit: https://github.com/settings/tokens
2. Click on your token
3. View usage statistics and rate limits

### Expected API Usage:
- **Development**: ~50-100 requests/hour
- **Production**: ~200-500 requests/hour (depending on traffic)
- **Well within**: 5,000/hour limit

## 🔄 Token Rotation

### Every 90 days:
1. Generate new token (same scopes)
2. Update .env.local file
3. Update Vercel environment variable
4. Redeploy application
5. Revoke old token

This ensures maximum security while maintaining functionality.

## ✅ Success Indicators

**Local Development:**
- No rate limit warnings in console
- GitHub section loads with real data
- Contribution graph shows accurate information

**Production Deployment:**
- GitHub integration works on live site
- No authentication errors in browser console
- Enhanced features visible to all users

---

**Need Help?** Check the browser console for detailed error messages or verify token permissions at https://github.com/settings/tokens