# 🚀 Deployment Guide - Website Builder by Yumi

This guide will help you deploy your Website Builder to make it publicly accessible on **yumi77965.online**.

## 📋 Deployment Overview

1. **Backend**: Deploy to Railway (Free tier available)
2. **Frontend**: Deploy to Vercel (Free for personal projects)
3. **Domain**: Configure yumi77965.online to point to Vercel

## 🗄️ Step 1: Backend Deployment (Railway)

### 1.1 Create Railway Account
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub account
3. Connect your GitHub repository

### 1.2 Deploy Backend
1. Click "New Project" → "Deploy from GitHub repo"
2. Select your `rrrichardzengyumi` repository
3. Choose the `backend` folder as root directory
4. Railway will automatically detect Node.js and deploy

### 1.3 Set Environment Variables
In Railway dashboard, go to your project → Variables tab:

```bash
# Required Environment Variables
JWT_SECRET=your-super-secret-jwt-key-here
QWEN_API_KEY=your-qwen-api-key
OPENROUTER_API_KEY=your-openrouter-api-key

# Stripe (if you have keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database (Railway provides automatically)
DATABASE_URL=./database.sqlite

# Optional: Proxy for China users
PROXY_HOST=127.0.0.1
PROXY_PORT=7890

# CORS Origin
FRONTEND_URL=https://yumi77965.online
```

### 1.4 Get Backend URL
After deployment, Railway will provide a URL like:
`https://your-app-name.railway.app`

## 🌐 Step 2: Frontend Deployment (Vercel)

### 2.1 Create Vercel Account
1. Go to [Vercel.com](https://vercel.com)
2. Sign up with GitHub account

### 2.2 Deploy Frontend
1. Click "New Project"
2. Import your `rrrichardzengyumi` repository
3. Set **Root Directory** to `frontend`
4. Vercel will auto-detect React/Vite

### 2.3 Set Environment Variables
In Vercel dashboard → Settings → Environment Variables:

```bash
VITE_API_URL=https://your-backend-url.railway.app
VITE_FRONTEND_URL=https://yumi77965.online
```

## 🌍 Step 3: Domain Configuration

### 3.1 Configure Domain in Vercel
1. Go to Vercel dashboard → Your project → Settings → Domains
2. Add custom domain: `yumi77965.online`
3. Add `www.yumi77965.online` (optional)

### 3.2 Update DNS Records
In your domain registrar (where you bought yumi77965.online):

**For Apex Domain (yumi77965.online):**
```
Type: A
Name: @
Value: 76.76.19.61
```

**For WWW Subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Alternative (if A record doesn't work):**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

## 🔧 Step 4: Update Code for Production

### 4.1 Update Frontend API Configuration
The frontend should automatically use the production API URL from environment variables.

### 4.2 Update Backend CORS
The backend is already configured to accept requests from yumi77965.online.

## ✅ Step 5: Testing Deployment

### 5.1 Test Backend
Visit: `https://your-backend-url.railway.app/health`
Should return: `{"status":"ok"}`

### 5.2 Test Frontend
Visit: `https://yumi77965.online`
Should load the Website Builder interface

### 5.3 Test Full Functionality
1. Try switching between Agent/Assistant modes
2. Test AI model selection
3. Send a test message
4. Verify archive functionality works

## 🚨 Troubleshooting

### Common Issues:

**1. CORS Errors:**
- Ensure FRONTEND_URL is set correctly in Railway
- Check that yumi77965.online is in the CORS whitelist

**2. API Connection Failed:**
- Verify VITE_API_URL in Vercel environment variables
- Ensure Railway backend is running (check logs)

**3. AI Models Not Working:**
- Check API keys are set correctly in Railway
- Verify proxy settings if in China

**4. Domain Not Working:**
- DNS changes can take up to 48 hours
- Use DNS checker tools to verify propagation
- Try accessing via www.yumi77965.online

## 📊 Monitoring & Maintenance

### Railway Backend Monitoring:
- Check logs in Railway dashboard
- Monitor resource usage
- Set up alerts for downtime

### Vercel Frontend Monitoring:
- Check deployment logs
- Monitor Core Web Vitals
- Set up custom analytics

## 💰 Cost Estimates

**Railway (Backend):**
- Free tier: $0/month (500 hours)
- Pro tier: $5/month (unlimited)

**Vercel (Frontend):**
- Hobby tier: Free (perfect for personal projects)
- Pro tier: $20/month (for commercial use)

**Total Monthly Cost: $0-25** depending on usage

## 🔐 Security Checklist

- [ ] JWT_SECRET is secure and random
- [ ] API keys are kept secret
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] Database is secure
- [ ] Environment variables are not exposed

## 🚀 Go Live Checklist

- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Domain configured (yumi77965.online)
- [ ] Environment variables set
- [ ] CORS configured
- [ ] Full functionality tested
- [ ] SSL certificate active
- [ ] Analytics setup (optional)

---

🎉 **Congratulations!** Your Website Builder is now live at https://yumi77965.online

For support or questions, check the logs in Railway/Vercel dashboards or reach out for assistance. 