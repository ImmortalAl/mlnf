# 🚀 MLNF Deployment Instructions

## Quick Deploy (5 minutes)

### Step 1: Deploy Backend to Render.com

1. **Go to**: https://dashboard.render.com/
2. **Click**: "New +" → "Web Service"
3. **Connect**: Your GitHub account
4. **Select**: Repository `ImmortalAl/mlnf`
5. **Configure**:
   - **Name**: `mlnf-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

6. **Environment Variables** (click "Advanced" → "Add Environment Variable"):
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://cooldude1343:pZIy3o3aJqRyMRti@mlnf.5zppehf.mongodb.net/mlnf?retryWrites=true&w=majority&appName=mlnf
   JWT_SECRET=6c4f7ea491aae77cfadf555fa6b99d26adfbaf79547723756b62c4c3b29b65b5
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=100
   MAX_FILE_SIZE=104857600
   ```

7. **Click**: "Create Web Service"

8. **Wait**: 3-5 minutes for deployment

9. **Copy**: Your backend URL (e.g., `https://mlnf-backend.onrender.com`)

### Step 2: Deploy Frontend to Netlify

1. **Go to**: https://app.netlify.com/
2. **Click**: "Add new site" → "Import an existing project"
3. **Connect**: GitHub account
4. **Select**: Repository `ImmortalAl/mlnf`
5. **Configure**:
   - **Branch**: `main`
   - **Base directory**: Leave empty
   - **Build command**: Leave empty
   - **Publish directory**: `frontend`

6. **Click**: "Deploy site"

7. **Wait**: 1-2 minutes for deployment

8. **Copy**: Your frontend URL (e.g., `https://mlnf-123abc.netlify.app`)

9. **Optional**: Click "Site settings" → "Change site name" to customize URL

### Step 3: Test Your Deployment

1. **Visit**: Your Netlify frontend URL
2. **Register**: Create a new account
3. **Login**: With your credentials
4. **Test**: Go to video page and try voting/commenting

---

## Current URLs

### Development (Sandbox):
- **Frontend**: https://3000-iiqunb8m2poqvbpfw88gi-82b888ba.sandbox.novita.ai/
- **Backend**: http://localhost:5000/api

### Production (After Deployment):
- **Frontend**: https://mlnf-YOURSITE.netlify.app (or custom domain)
- **Backend**: https://mlnf-backend.onrender.com/api

---

## Troubleshooting

### Backend Issues:

**Problem**: Backend won't start
- **Check**: MongoDB connection string in environment variables
- **Check**: All environment variables are set correctly
- **Check**: Render logs for error messages

**Problem**: CORS errors
- **Solution**: Already configured to accept Netlify domains
- **Check**: Backend logs show "CORS blocked origin" messages

**Problem**: 502 Bad Gateway
- **Wait**: Backend cold starts take 30-60 seconds on free tier
- **Check**: Health endpoint: `https://mlnf-backend.onrender.com/api/health`

### Frontend Issues:

**Problem**: API calls failing
- **Check**: Browser console for error messages
- **Check**: API_BASE_URL in `frontend/api-client.js` points to correct backend
- **Solution**: If using custom domain, update API_BASE_URL logic

**Problem**: 404 on page refresh
- **Check**: netlify.toml is in root directory
- **Solution**: Already configured with SPA redirects

---

## Environment Variables Reference

### Backend Required:
```bash
MONGODB_URI=mongodb+srv://...         # MongoDB Atlas connection string
JWT_SECRET=your-secret-key            # Secret for JWT tokens (64 chars recommended)
NODE_ENV=production                   # Sets environment mode
PORT=5000                             # Server port (Render sets automatically)
```

### Backend Optional:
```bash
RATE_LIMIT_WINDOW_MS=60000           # Rate limit window (60 seconds)
RATE_LIMIT_MAX_REQUESTS=100          # Max requests per window
MAX_FILE_SIZE=104857600              # Max video upload size (100MB)
CLIENT_URL=https://mlnf.netlify.app  # Frontend URL for CORS
```

---

## Post-Deployment Checklist

- [ ] Backend health check returns 200 OK
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] Video page loads
- [ ] Voting buttons work
- [ ] Comments can be posted
- [ ] Data persists after page refresh

---

## Custom Domain Setup (Optional)

### Netlify Custom Domain:
1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Follow DNS configuration instructions
4. Update API_BASE_URL logic if needed

### Render Custom Domain:
1. Go to Settings → Custom Domain
2. Add your domain
3. Configure DNS records as shown
4. Update frontend API_BASE_URL

---

## Free Tier Limitations

### Render.com (Backend):
- ✅ Free forever
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ Cold start takes 30-60 seconds
- ⚠️ 750 hours/month free (enough for testing)

### Netlify (Frontend):
- ✅ Free forever for personal projects
- ✅ 100GB bandwidth/month
- ✅ Automatic SSL
- ✅ Global CDN
- ✅ Instant cache invalidation

---

## Next Steps After Deployment

1. **Test all features** on production URLs
2. **Share URLs** with DKspiracy for testing
3. **Monitor** Render logs for errors
4. **Continue building** new features
5. **Push to GitHub** after each feature completion
6. **Auto-deploy** happens automatically on git push!

---

## Need Help?

- **Render Logs**: https://dashboard.render.com/web/YOUR-SERVICE-ID/logs
- **Netlify Logs**: https://app.netlify.com/sites/YOUR-SITE-NAME/deploys
- **MongoDB Atlas**: https://cloud.mongodb.com/
