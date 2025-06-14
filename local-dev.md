# 🚀 Local Development Guide

## Quick Start (Running Backend Locally)

### 1. **Start Backend**
```bash
cd backend
npm run dev
```
Backend will run on: `http://localhost:3000`

### 2. **Test Backend**
Open browser: `http://localhost:3000/health`
Should show: `{"status":"ok"}`

### 3. **Make Backend Public (Temporary)**
If you want to test with frontend deployed on hosting platform:

**Option A: Use ngrok (Recommended)**
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000
```
Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

**Option B: Use localtunnel**
```bash
npx localtunnel --port 3000 --subdomain yumi-api
```
URL will be: `https://yumi-api.loca.lt`

### 4. **Update Frontend Environment**
When deploying frontend, use your ngrok/localtunnel URL:
```
VITE_API_URL=https://abc123.ngrok.io
```

## 🎯 **Next Steps:**

1. **Deploy Frontend First**: Use Cloudflare Pages with your GitHub repo
2. **Test Everything**: Make sure frontend can talk to local backend via ngrok
3. **Deploy Backend**: When ready, use DigitalOcean or any hosting service
4. **Update DNS**: Point api.yumi77965.online to your backend server

## 🔧 **Environment Setup**

Make sure you have these files:

**backend/.env**
```
JWT_SECRET=your-secret-key-here
QWEN_API_KEY=your-qwen-key
OPENROUTER_API_KEY=your-openrouter-key
FRONTEND_URL=http://localhost:5173
```

**frontend/.env** (if testing locally)
```
VITE_API_URL=http://localhost:3000
VITE_FRONTEND_URL=http://localhost:5173
```

## 🧪 **Test Endpoints**

- `GET /health` - Health check
- `GET /api/user/info` - User info (requires auth)
- `GET /api/models` - Available AI models
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user 