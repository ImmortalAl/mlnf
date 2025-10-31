# MLNF Deployment Guide

## Quick Start (5 Minutes)

### 1. Backend Setup
```bash
cd /home/user/mlnf/backend
npm install
cp .env.example .env
# Edit .env if needed
npm start
```

### 2. Frontend Setup  
```bash
cd /home/user/mlnf/frontend
npx http-server -p 8080
```

### 3. Access
- Frontend: http://localhost:8080
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/api/health

## Production Deployment

### Backend (Render.com)
1. Push code to GitHub
2. Connect Render to repository
3. Set root directory: `backend/`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variables from `.env.example`

### Frontend (Netlify)
1. Push code to GitHub
2. Connect Netlify to repository
3. Set publish directory: `frontend/`
4. No build command needed (static files)
5. Add redirects for SPA routing

### Domain Setup (Cloudflare)
1. Add CNAME records:
   - `@` → `mlnf.netlify.app`
   - `www` → `mlnf.netlify.app`
2. Enable proxy (orange cloud)
3. SSL/TLS: Full

## Environment Variables Required

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_here
SESSION_SECRET=your_secret_here
CLIENT_URL=https://mlnf.net
STRIPE_SECRET_KEY=sk_...
PAYPAL_CLIENT_ID=...
BLOCKONOMICS_API_KEY=...
ETH_WALLET_ADDRESS=0x...
```

## Post-Deployment Checklist
- [ ] Test user registration
- [ ] Test video upload
- [ ] Test Runegold purchases
- [ ] Verify Socket.io connects
- [ ] Test real-time features
- [ ] Check CORS settings
- [ ] Verify payment integrations
- [ ] Test on mobile devices

## Monitoring
- Backend logs: `npm run logs` (if using PM2)
- Frontend: Netlify dashboard
- Database: MongoDB Atlas dashboard
- Analytics: Plausible.io dashboard

## Backup Strategy
- MongoDB: Automated daily backups (Atlas)
- Code: Git repository
- Media: GridFS (included in MongoDB backup)

## Support
- Issues: GitHub Issues
- Email: support@mlnf.net
- Discord: [Community Link]
