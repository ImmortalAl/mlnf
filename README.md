# Much Love, No Fear (MLNF) - Video Sanctuary

## 🛡️ Overview
Much Love, No Fear is a censorship-resistant video platform offering independent creators a sanctuary for content that might be banned on mainstream platforms. Built with Viking spirit and powered by the Runegold economy.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (backend uses `.nvmrc`)
- MongoDB Atlas (connection string included in .env.example)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/ImmortalAl/mlnf.git
cd mlnf

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start

# Frontend setup (in new terminal)
cd ../frontend
# Serve with any static server, e.g.:
npx http-server -p 8080
# Or deploy to Netlify
```

### GitHub Setup Commands
```bash
git init
git add .
git commit -m "Initial commit - MLNF monorepo"
git remote add origin https://github.com/ImmortalAl/mlnf.git
git push -u origin main --force
```

## 🏗️ Architecture

### Frontend (Netlify)
- **URL**: mlnf.netlify.app → mlnf.net (via Cloudflare CNAME)
- **Deploy**: Push to GitHub, connect Netlify to repo
- **Publish Directory**: `frontend/`
- **Build Command**: None (static files)

### Backend (Render)
- **URL**: https://much-love-no-fear.onrender.com
- **Deploy**: Push to GitHub, connect Render to repo
- **Root Directory**: `backend/`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

## 💰 Runegold Economy

### Purchase Tiers
- 1000 Runegold: $10
- 5000 Runegold: $45
- 10000 Runegold: $85

### Spending Options
- Boost Video (1 hour featured): 50 Runegold
- Highlight Comment: 20 Runegold
- Profile Badge: 100 Runegold
- Exclusive Content Access: 200 Runegold
- Tip Users: 10-100 Runegold

### Admin Management
- Manual injection via `/api/admin/inject-runegold`
- Reserve pool for rewards
- Monthly "Best Video" prize: 100 Runegold

## 🎯 Core Features

### Authentication
- Username/password with bcrypt
- JWT tokens (7-day expiry)
- Secret question recovery
- Optional email

### Video Vault
- Drag-drop upload (100MB limit)
- GridFS storage
- HLS streaming
- Speed controls (0.5-2x)
- Subtitle support
- Comment timestamps
- Upvote/downvote system
- Tag system (Truths/Rebels/General)

### Social Features
- Real-time messaging (Socket.io)
- Online user sidebar
- Emoji support
- Follow system
- Threaded message boards
- Profile customization

### Payments
- Stripe integration
- PayPal checkout
- Bitcoin (Blockonomics)
- Ethereum (MetaMask)
- Graceful degradation if keys missing

### Real-time Updates
- Vote counts
- Comments
- Notifications
- Runegold balance
- Online users

## 🛠️ Tech Stack

### Frontend
- Pure HTML/CSS/JavaScript
- Socket.io client
- Quill.js (blog editor)
- MetaMask integration
- Blockonomics integration

### Backend
- Node.js 20
- Express.js
- MongoDB Atlas
- Socket.io
- GridFS
- JWT
- Bcrypt
- Helmet (security)
- CORS
- Rate limiting

## 📁 Project Structure

```
mlnf/
├── backend/
│   ├── .nvmrc               # Node version
│   ├── package.json         # Dependencies
│   ├── server.js           # Main server
│   ├── .env.example        # Environment template
│   ├── models/
│   │   ├── User.js        # User schema
│   │   └── Video.js       # Video schema
│   └── routes/
│       ├── auth.js        # Authentication
│       ├── videos.js      # Video operations
│       ├── runegold.js    # Economy
│       ├── donations.js   # Payment processing
│       └── blockonomics.js # Bitcoin handling
└── frontend/
    ├── index.html          # Homepage
    ├── lander.html        # Marketing
    ├── dashboard.html     # User dashboard
    ├── scripts.js         # Main JavaScript
    ├── styles.css         # Viking theme
    ├── assets/
    │   └── images/
    │       └── uploads/   # User uploads
    └── pages/
        ├── archive.html   # Video vault
        ├── auth.html      # Login/Register
        ├── blog.html      # Blog editor
        ├── donations.html # Support page
        ├── merch.html     # Store
        ├── messageboard.html # Forums
        ├── messaging.html # P2P chat
        ├── news.html      # News carousel
        ├── profile-setup.html # Onboarding
        └── profiles.html  # User profiles
```

## 🔐 Security

### CORS Origins
- https://mlnf.net
- https://www.mlnf.net
- https://mlnf.netlify.app
- http://localhost:8080 (development)

### Rate Limiting
- 100 requests per minute per IP
- 100MB max file upload
- 7-day JWT expiry

### Headers
- Helmet.js security headers
- HTTPS enforced in production
- XSS protection
- CSRF tokens

## 🎨 Design System

### Typography
- Headers: Playfair Display
- Body: Inter

### Colors
- Primary: Peach (#FF6B6B)
- Secondary: Indigo (#4A90E2)
- Background: Cream (#F8F4E3)
- Dark mode: Navy/Gold

### Branding
- Viking theme
- "Much Love, No Fear" motto
- Love Vault / No Fear Boost labels

## 📊 Analytics
- Plausible.io integration
- Privacy-focused metrics
- Custom event tracking

## 🚦 Environment Variables

See `backend/.env.example` for full list. Key variables:
- `MONGODB_URI`: MongoDB connection
- `JWT_SECRET`: Token signing
- `CLIENT_URL`: Frontend URL
- `STRIPE_*`: Payment keys
- `PAYPAL_*`: PayPal credentials
- `BLOCKONOMICS_*`: Bitcoin setup
- `ADMIN_*`: Admin credentials

## 📝 Testing

See `TESTING.md` for comprehensive test procedures.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📄 License

MIT License - see LICENSE file

## 🆘 Support

For issues, questions, or suggestions:
- Open GitHub issue
- Email: support@mlnf.net
- Discord: [Coming Soon]

## 🏆 Credits

Built with ❤️ and Viking spirit by the MLNF team.

"Much Love, No Fear" - Embrace truth, resist censorship.