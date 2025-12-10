# CLAUDE.md - Much Love No Fear (MLNF)

**Domain**: mlnf.net
**Last Updated**: 2025-12-10
**Repo**: https://github.com/ImmortalAl/mlnf.git

---

## Project Overview

Much Love No Fear is a censorship-resistant video platform offering independent creators a sanctuary for content that might be banned on mainstream platforms. Built with Viking spirit and powered by the Runegold economy.

---

## Architecture

### Frontend (Netlify)
- **URL**: mlnf.netlify.app → mlnf.net (via Cloudflare CNAME)
- **Publish Directory**: `frontend/`
- **Build Command**: None (static files)
- **Stack**: Pure HTML/CSS/JavaScript, Socket.io client

### Backend (Render)
- **URL**: https://much-love-no-fear.onrender.com
- **Root Directory**: `backend/`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Stack**: Node.js 20, Express, MongoDB Atlas, Socket.io, GridFS

---

## Git Workflow

**After making ANY code changes:**

1. `git add .`
2. `git commit -m "type: description"`
3. `git push origin main`

**Commit types**: feat, fix, update, style, refactor, docs

---

## Key Features

### Video System
- Drag-drop upload (100MB limit)
- GridFS storage
- HLS streaming
- Speed controls, subtitles, comment timestamps

### Runegold Economy
- Virtual currency for platform engagement
- Purchase tiers: 1000/$10, 5000/$45, 10000/$85
- Spend on: boosts, badges, tips, exclusive content

### Payments
- Stripe, PayPal, Bitcoin (Blockonomics), Ethereum (MetaMask)
- Graceful degradation if keys missing

### Authentication
- Username/password with bcrypt
- JWT tokens (7-day expiry)
- Secret question recovery

---

## Project Structure

```
mlnf/
├── backend/
│   ├── server.js           # Main server
│   ├── models/             # User.js, Video.js
│   └── routes/             # auth, videos, runegold, donations
└── frontend/
    ├── index.html          # Homepage
    ├── dashboard.html      # User dashboard
    ├── scripts.js          # Main JavaScript
    ├── styles.css          # Viking theme
    └── pages/              # archive, auth, blog, messaging, etc.
```

---

## Environment Variables

Key variables in `backend/.env`:
- `MONGODB_URI` - MongoDB connection
- `JWT_SECRET` - Token signing
- `CLIENT_URL` - Frontend URL
- `STRIPE_*`, `PAYPAL_*`, `BLOCKONOMICS_*` - Payment keys

---

## Design System

- **Typography**: Playfair Display (headers), Inter (body)
- **Colors**: Peach primary, Indigo secondary, Cream background
- **Theme**: Viking aesthetic, "Much Love, No Fear" motto

---

## Security

- CORS: mlnf.net, mlnf.netlify.app, localhost:8080
- Rate limiting: 100 req/min per IP
- Helmet.js security headers
- 100MB max upload

---

## Communication Preferences

- Challenge ideas and propose alternatives
- Debate before implementing
- Ask if anything is unclear
- Never be a "yes man"
