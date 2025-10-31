# 🚀 MLNF Deployment Guide

## Deployment to mlnf.net

This guide covers deploying the Much Love, No Fear platform to production at **mlnf.net**.

---

## 📋 Prerequisites

### Required Services
1. **GitHub Account** - Repository hosting
2. **Netlify Account** - Frontend hosting (or similar static host)
3. **MongoDB Atlas** - Database (or your own MongoDB instance)
4. **Domain**: mlnf.net configured

### Optional Services
- Render.com - Backend hosting alternative
- Cloudflare - DNS and CDN
- Stripe/PayPal - Payment processing
- Blockonomics - Bitcoin payments

---

## 🎯 Deployment Options

### Option 1: Static Frontend Only (Current State)

Deploy just the frontend HTML pages to see the design and layout.

#### Using Netlify

1. **Push to GitHub** ✅ (Already done!)
   ```bash
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub and select `ImmortalAl/mlnf` repository
   - Configure build settings:
     - **Base directory**: `frontend`
     - **Build command**: (leave empty)
     - **Publish directory**: `frontend` or `.` (if base is frontend)
   - Click "Deploy site"

3. **Configure Custom Domain**
   - In Netlify site settings → Domain management
   - Click "Add custom domain"
   - Enter `mlnf.net`
   - Add DNS records to your domain registrar:
     ```
     Type: CNAME
     Name: www
     Value: [your-site].netlify.app
     
     Type: A (or ALIAS/ANAME)
     Name: @
     Value: 75.2.60.5 (Netlify's load balancer)
     ```
   - Enable HTTPS (automatic with Netlify)

4. **Test Your Site**
   - Visit https://mlnf.net
   - All pages should be accessible
   - Navigation should work

#### Using GitHub Pages (Alternative)

1. **Configure Repository**
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` → `/frontend` folder
   - Save

2. **Custom Domain**
   - Add `mlnf.net` in the custom domain field
   - Add CNAME record pointing to `immortalal.github.io`

3. **Access Site**
   - Visit https://mlnf.net

---

### Option 2: Full Stack Deployment

Deploy both frontend and backend for full functionality.

#### Backend Deployment (Render.com)

1. **Create Web Service**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect to GitHub repository
   - Configure:
     - **Name**: mlnf-backend
     - **Root Directory**: `backend`
     - **Environment**: Node
     - **Build Command**: `npm install --legacy-peer-deps`
     - **Start Command**: `node server.js`
     - **Instance Type**: Free or Starter ($7/mo)

2. **Environment Variables**
   Add these in Render dashboard:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key_here
   CLIENT_URL=https://mlnf.net
   
   # Optional Payment Services
   STRIPE_SECRET_KEY=your_stripe_key
   PAYPAL_CLIENT_ID=your_paypal_id
   BLOCKONOMICS_API_KEY=your_bitcoin_key
   ```

3. **Database Setup (MongoDB Atlas)**
   - Create free cluster at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Add to `MONGODB_URI` in Render
   - Whitelist Render's IP addresses in Atlas Network Access

4. **Deploy**
   - Render will auto-deploy on git push
   - Backend URL: `https://mlnf-backend.onrender.com`

#### Frontend Configuration

Update `frontend/scripts.js` to point to your backend:

```javascript
// Change this line:
const API_URL = 'http://localhost:5000/api';

// To your production backend:
const API_URL = 'https://mlnf-backend.onrender.com/api';
```

Then commit and push:
```bash
cd /home/user/mlnf
git add frontend/scripts.js
git commit -m "Update API URL for production"
git push origin main
```

Netlify will automatically redeploy.

---

## 🔧 Configuration Files

### Backend Environment Variables

Create `backend/.env` (never commit this file!):

```env
# Server
NODE_ENV=production
PORT=5000
CLIENT_URL=https://mlnf.net

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mlnf?retryWrites=true&w=majority

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password

# Optional: Payment Gateways
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Optional: Bitcoin
BLOCKONOMICS_API_KEY=...
BLOCKONOMICS_CALLBACK_SECRET=...

# Optional: Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend Configuration

Update `frontend/scripts.js`:

```javascript
// API Configuration
const config = {
  apiUrl: 'https://mlnf-backend.onrender.com/api',
  socketUrl: 'https://mlnf-backend.onrender.com',
  environment: 'production'
};
```

---

## 🔍 Post-Deployment Checklist

### Frontend Tests
- [ ] Homepage loads correctly
- [ ] All navigation links work
- [ ] Images and styles load
- [ ] Mobile responsive design works
- [ ] Theme toggle works
- [ ] Custom domain resolves correctly
- [ ] HTTPS certificate is active

### Backend Tests (if deployed)
- [ ] Health endpoint responds: `curl https://mlnf-backend.onrender.com/api/health`
- [ ] Database connection established
- [ ] User registration works
- [ ] User login works
- [ ] JWT tokens generated
- [ ] Socket.io connection established
- [ ] CORS configured for mlnf.net
- [ ] Rate limiting active

### Security Tests
- [ ] Environment variables not exposed
- [ ] HTTPS enforced
- [ ] API authentication required
- [ ] SQL injection protection
- [ ] XSS protection enabled
- [ ] Helmet.js headers active

---

## 📊 Monitoring

### Netlify
- View deploy logs in dashboard
- Monitor bandwidth usage
- Check analytics

### Render (Backend)
- Monitor logs: Render dashboard → Logs
- Check metrics: CPU, Memory, Response time
- Set up alerts for downtime

### MongoDB Atlas
- Monitor database metrics
- Set up alerts for storage limits
- Review slow queries

---

## 🔄 Continuous Deployment

### Automatic Deployment Workflow

1. **Make Changes Locally**
   ```bash
   cd /home/user/mlnf
   # Edit files...
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

2. **Automatic Deployment**
   - Netlify detects push and rebuilds frontend
   - Render detects push and rebuilds backend
   - Changes live in 1-3 minutes

3. **Verify Deployment**
   - Check Netlify deploy log
   - Check Render deploy log
   - Test live site: https://mlnf.net

---

## 🐛 Troubleshooting

### Frontend Issues

**Pages not loading:**
- Check Netlify deploy log for errors
- Verify publish directory is correct
- Check for broken file paths

**Styles not loading:**
- Clear browser cache
- Check CSS file paths are relative
- Verify CDN links are accessible

**Custom domain not working:**
- Wait 24-48 hours for DNS propagation
- Verify DNS records at domain registrar
- Check Netlify DNS configuration

### Backend Issues

**Server not starting:**
- Check Render logs for errors
- Verify all environment variables set
- Check Node.js version compatibility

**Database connection failed:**
- Verify MongoDB URI is correct
- Check Atlas IP whitelist (add 0.0.0.0/0 for all IPs)
- Test connection string locally

**API requests failing:**
- Check CORS configuration includes mlnf.net
- Verify backend URL in frontend scripts
- Test API endpoints directly with curl

---

## 📞 Support

For deployment issues:
1. Check Netlify/Render documentation
2. Review error logs carefully
3. Test locally first before deploying
4. Open GitHub issue with detailed error info

---

## 🎉 Current Status

### ✅ Completed
- All HTML pages created
- CSS styling complete
- JavaScript functionality ready
- Git repository initialized
- Code pushed to GitHub: https://github.com/ImmortalAl/mlnf

### 📝 Next Steps
1. Deploy frontend to Netlify
2. Configure mlnf.net domain
3. Test all pages live
4. (Optional) Deploy backend when ready
5. (Optional) Configure payment gateways
6. (Optional) Set up email service

---

**Ready to deploy!** Follow the steps above to get your site live at mlnf.net! 🚀
