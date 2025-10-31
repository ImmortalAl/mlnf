# 🚀 MLNF Deployment Plan

## Current Architecture

### Backend (Node.js + Express + MongoDB)
- **Location**: `/backend/`
- **Port**: 5000
- **Dependencies**: Express, Mongoose, JWT, GridFS, Socket.io
- **Database**: MongoDB Atlas (already configured)
- **Environment**: Requires `.env` file with MongoDB URI and JWT secret

### Frontend (Static HTML/CSS/JS)
- **Location**: `/frontend/`
- **Port**: 3000 (development)
- **Dependencies**: None (pure vanilla JS)
- **API Base URL**: Currently `http://localhost:5000/api`

## 🎯 Deployment Strategy

### Option 1: Deploy Backend + Frontend Separately (RECOMMENDED)

**Backend Options:**
1. **Render.com** (Free tier, auto-deploy from GitHub)
2. **Railway.app** (Free tier, excellent for Node.js)
3. **Fly.io** (Free tier, global edge deployment)

**Frontend Options:**
1. **Netlify** (Free tier, auto-deploy from GitHub, perfect for static sites)
2. **Vercel** (Free tier, excellent DX)
3. **GitHub Pages** (Free, but requires static site only)
4. **Cloudflare Pages** (Free tier, global CDN)

### Option 2: Deploy as Monolith
- **Render.com** can host both with static site serving from Express
- Single deployment, but less flexible

## 📝 Recommended Approach

### Step 1: Deploy Backend to Render.com
- Auto-deploy from GitHub
- Free tier sufficient for testing
- Set environment variables (MONGODB_URI, JWT_SECRET)
- Get backend URL (e.g., `https://mlnf-backend.onrender.com`)

### Step 2: Update Frontend API Base URL
- Change `API_BASE_URL` in `frontend/api-client.js`
- Point to deployed backend URL

### Step 3: Deploy Frontend to Netlify
- Auto-deploy from GitHub `/frontend` directory
- Free tier with custom domain support
- Global CDN for fast loading

## 🔧 Required Changes Before Deployment

### Backend (`/backend/`):
1. ✅ Already has `.env` file (not committed)
2. ✅ Already has `package.json` with start script
3. ✅ MongoDB Atlas connection configured
4. ⚠️ Need to add CORS for deployed frontend URL
5. ⚠️ Need to ensure PORT reads from `process.env.PORT`

### Frontend (`/frontend/`):
1. ⚠️ Need to update `API_BASE_URL` in `api-client.js`
2. ⚠️ Consider environment-based config (dev vs prod)
3. ✅ All static files ready

## 🚀 Deployment Steps

### Phase 1: Backend Deployment

```bash
# 1. Update backend server.js to use process.env.PORT
# 2. Add deployed frontend URL to CORS whitelist
# 3. Push to GitHub
# 4. Connect Render.com to GitHub repo
# 5. Set environment variables in Render dashboard
# 6. Deploy!
```

### Phase 2: Frontend Deployment

```bash
# 1. Update api-client.js with production backend URL
# 2. Push to GitHub
# 3. Connect Netlify to GitHub repo
# 4. Set build directory to /frontend
# 5. Deploy!
```

## 🎯 Let's Start with Render.com for Backend

This will give us a live backend API that we can test immediately.
