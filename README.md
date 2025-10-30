# Much Love, No Fear (MLNF) - Full Video Sanctuary

A video-first community platform with Viking-inspired design, featuring user-generated content, Runegold economy, and real-time interactions.

## 🚀 Features

- **Video Vault**: Upload, stream, and share videos with HLS support
- **Authentication**: Secure login with JWT tokens and secret question recovery
- **Runegold Economy**: Earn and spend virtual currency
- **Real-time Messaging**: P2P chat with Socket.io
- **Community Features**: Profiles, followers, message boards, blogs
- **Donations**: Multiple payment methods (Stripe, PayPal, Bitcoin, Ethereum)
- **Admin Tools**: Moderation dashboard and analytics

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (SCSS), Vanilla JavaScript
- **Backend**: Node.js 20, Express.js, MongoDB Atlas
- **Real-time**: Socket.io
- **Payments**: Stripe, PayPal, Blockonomics, Web3
- **Deployment**: Netlify (Frontend), Render (Backend)

## 📁 Project Structure

```
mlnf/
├── frontend/          # Static frontend files
│   ├── index.html     # Homepage
│   ├── dashboard.html # User dashboard
│   ├── scripts.js     # Main JavaScript
│   ├── styles.css     # Compiled CSS
│   ├── assets/        # Images and uploads
│   └── pages/         # Feature pages
└── backend/           # Node.js server
    ├── server.js      # Express server
    ├── models/        # MongoDB schemas
    └── routes/        # API endpoints
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- MongoDB Atlas account
- Stripe, PayPal, and Blockonomics accounts for payments

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

### Frontend Setup

```bash
cd frontend
# Serve with any static server
# For development: npx http-server -p 8080
```

## 🌐 Deployment

### Backend (Render)

1. Connect GitHub repository
2. Set root directory: `/backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables from `.env.example`

### Frontend (Netlify)

1. Connect GitHub repository
2. Set publish directory: `frontend`
3. No build command needed (static files)

### Domain (Cloudflare)

1. Add CNAME records:
   - `@` → `mlnf.netlify.app` (proxied)
   - `www` → `mlnf.netlify.app` (proxied)

## 💰 Runegold Economy

- **Earn**: Daily login (10), uploads (50), comments (5), referrals (100)
- **Spend**: Boost videos (50), highlight comments (20), badges (100)
- **Exchange Rate**: $1 = 100 Runegold

## 🔒 Security

- JWT authentication with 7-day expiry
- Bcrypt password hashing
- CSRF protection
- Rate limiting (100 req/min)
- Helmet.js security headers
- 100MB upload limit

## 📊 Analytics

Integrated with Plausible.io for privacy-focused analytics.

## 🤝 Contributing

This is a private repository for the MLNF community platform.

## 📄 License

© 2025 Much Love, No Fear. All rights reserved.

## 🧪 API Health Check

```
https://much-love-no-fear.onrender.com/api/health
```

Expected response: `{"status":"ok"}`
