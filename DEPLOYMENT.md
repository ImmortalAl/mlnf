# MLNF Deployment Guide

This guide will help you get the MLNF platform fully deployed with real data.

## Current Status

✅ **Frontend:** Deployed on Netlify at https://mlnf.net  
⏳ **Backend:** Needs to be deployed to Render  
⏳ **Database:** MongoDB Atlas needs to be set up and seeded

## Why You're Seeing Placeholder Data

The frontend is trying to connect to the backend API at `https://much-love-no-fear.onrender.com/api`, but:

1. The backend service hasn't been deployed to Render yet
2. The MongoDB database hasn't been created/seeded with content
3. Without a working backend, the frontend shows error messages instead of placeholder data

## Quick Deployment Steps

### Step 1: Create MongoDB Atlas Database (5 minutes)

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Sign Up" or "Try Free"
3. Create a free M0 cluster:
   - Choose **AWS** as provider
   - Select region closest to you (e.g., us-east-1)
   - Cluster Name: `mlnf-cluster`
4. Create a database user:
   - Username: `mlnf_admin`
   - Password: Generate a secure password (save it!)
   - Database User Privileges: **Read and write to any database**
5. Configure network access:
   - Click "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access From Anywhere" (0.0.0.0/0)
   - Confirm
6. Get connection string:
   - Click "Database" in left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Example: `mongodb+srv://mlnf_admin:YourPassword@mlnf-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority`

### Step 2: Deploy Backend to Render (10 minutes)

1. Go to https://dashboard.render.com
2. Sign up or log in (can use GitHub account)
3. Click "New +" → "Web Service"
4. Connect GitHub repository:
   - Click "Connect GitHub"
   - Select your `mlnf` repository
   - Click "Connect"
5. Configure service:
   - **Name:** `much-love-no-fear`
   - **Environment:** `Node`
   - **Region:** US East (or closest to you)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (should be sufficient to start)
6. Add Environment Variables (click "Advanced" → "Add Environment Variable"):
   ```
   MONGODB_URI = mongodb+srv://mlnf_admin:YourPassword@mlnf-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   JWT_SECRET = your-super-secret-random-string-here-make-it-long
   NODE_ENV = production
   PORT = 5000
   BOOST_COST = 10
   EXCLUSIVE_CONTENT_PRICE = 50
   ```
7. Click "Create Web Service"
8. Wait for deployment (5-10 minutes)

### Step 3: Seed the Database (2 minutes)

Once the backend is deployed:

1. Go to your Render service dashboard
2. Click the "Shell" tab (or "Console")
3. Wait for shell to connect
4. Run this command:
   ```bash
   npm run seed
   ```
5. You should see output like:
   ```
   ✅ Connected to MongoDB
   🗑️  Clearing existing data...
   📝 Seeding blog posts...
   ✅ Created 3 blog posts
   📰 Seeding news articles...
   ✅ Created 3 news articles
   💬 Seeding forum topics...
   ✅ Created 3 forum topics
   🎉 Database seeding completed successfully!
   ```

### Step 4: Verify Everything Works

1. Check backend health:
   - Visit: `https://much-love-no-fear.onrender.com/api/health`
   - Should see: `{"status":"ok","timestamp":"..."}`

2. Check blog API:
   - Visit: `https://much-love-no-fear.onrender.com/api/blog`
   - Should see JSON array of 3 blog posts

3. Check news API:
   - Visit: `https://much-love-no-fear.onrender.com/api/news`
   - Should see JSON array of 3 news articles

4. Check forum API:
   - Visit: `https://much-love-no-fear.onrender.com/api/forum`
   - Should see JSON array of 3 forum topics

5. Visit your frontend:
   - Go to: https://mlnf.net
   - Navigate to Blog, News, and Message Board pages
   - You should now see real content instead of error messages!

## What the Seed Script Creates

### Blog Posts (3)
1. "The Great Awakening: Understanding the Shift in Global Consciousness"
2. "Natural Immunity: What Science Really Says"
3. "Decentralization: The Path to True Freedom"

### News Articles (3)
1. "Leaked Documents Reveal Mass Censorship Coordination" (Breaking)
2. "Natural Treatment Shows 95% Success Rate in Clinical Trial" (Trending)
3. "Central Bank Digital Currencies: The End of Financial Privacy?" (Trending)

### Forum Topics (3)
1. "WHO Treaty Leaked: Shocking Details on Sovereignty Transfer" (Pinned)
2. "Alternative Energy Breakthrough Suppressed by Big Oil"
3. "Banking System on Verge of Collapse? - Evidence Thread"

### Admin User
- Username: `mlnf_admin`
- Password: `admin123`
- Can be used to create more content via API

## Troubleshooting

### "Backend Not Connected" Still Showing

1. **Check Render Deployment:**
   - Go to Render dashboard
   - Make sure deployment shows "Live" status
   - Check logs for any errors

2. **Verify MongoDB Connection:**
   - In Render dashboard, check environment variables
   - Make sure `MONGODB_URI` is correct
   - Verify IP whitelist in MongoDB Atlas

3. **Test API Directly:**
   - Open: `https://much-love-no-fear.onrender.com/api/health`
   - Should return JSON, not an error

4. **Clear Browser Cache:**
   - Hard refresh your site (Ctrl+Shift+R or Cmd+Shift+R)
   - Or open in incognito/private window

### Render Service Won't Start

1. Check build logs in Render dashboard
2. Common issues:
   - Wrong root directory (should be `backend`)
   - Missing dependencies (make sure package.json is correct)
   - Port configuration (Render sets PORT automatically)

### MongoDB Connection Fails

1. Verify connection string format
2. Check password doesn't contain special characters (or URL encode them)
3. Ensure IP whitelist includes 0.0.0.0/0
4. Confirm database user has read/write permissions

## Adding More Content

### Via API

Use tools like Postman or curl:

```bash
# Create new blog post (requires auth token)
curl -X POST https://much-love-no-fear.onrender.com/api/blog \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "My New Blog Post",
    "content": "Content here...",
    "category": "Freedom",
    "tags": ["truth", "awakening"]
  }'
```

### Via Database Directly

1. Go to MongoDB Atlas
2. Click "Browse Collections"
3. Select your database
4. Add documents manually to collections

### Run Seed Script Again

You can re-run the seed script anytime to reset to sample data:

```bash
# In Render Shell or locally
npm run seed
```

**Warning:** This will delete all existing data!

## Costs

- **Frontend (Netlify):** Free tier (plenty for most sites)
- **Backend (Render):** Free tier includes 750 hours/month
- **Database (MongoDB Atlas):** Free M0 cluster (512 MB storage)

**Total Cost:** $0/month to start!

## Next Steps After Deployment

1. **Customize Content:**
   - Update seed data in `backend/seed-data.js`
   - Run seed script again
   - Or add content via API

2. **Configure Email:**
   - Add email service for notifications
   - Update environment variables

3. **Add Payment Processing:**
   - Set up Stripe account
   - Add `STRIPE_SECRET_KEY` to Render
   - Enable RuneGold purchases

4. **Monitor Performance:**
   - Check Render logs regularly
   - Monitor MongoDB Atlas metrics
   - Set up error tracking (e.g., Sentry)

5. **Scale as Needed:**
   - Upgrade Render plan for more resources
   - Upgrade MongoDB plan for more storage
   - Add CDN for video delivery

## Support

If you get stuck:

1. Check the logs:
   - Render: Dashboard → Your Service → Logs
   - MongoDB: Atlas → Monitoring
   - Browser: Developer Console (F12)

2. Review the documentation:
   - `/backend/README.md` - Backend API documentation
   - Render Docs: https://render.com/docs
   - MongoDB Docs: https://docs.mongodb.com

3. Common issues are usually:
   - Environment variables misconfigured
   - Network access not allowed in MongoDB
   - Incorrect connection string format
   - Service not fully deployed yet (wait 5-10 min)

## Quick Reference

### Important URLs
- **Frontend:** https://mlnf.net
- **Backend API:** https://much-love-no-fear.onrender.com/api
- **Render Dashboard:** https://dashboard.render.com
- **MongoDB Atlas:** https://cloud.mongodb.com
- **GitHub Repo:** https://github.com/ImmortalAl/mlnf

### Key Commands
```bash
# Seed database (in Render Shell or locally)
npm run seed

# Start backend locally
npm run dev

# Check backend logs on Render
# (Go to dashboard → your service → Logs tab)
```

### Environment Variables Needed
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=random-secret-string
NODE_ENV=production
PORT=5000
BOOST_COST=10
EXCLUSIVE_CONTENT_PRICE=50
```

Good luck with your deployment! 🚀
