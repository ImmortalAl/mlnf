# Much Love, No Fear (MLNF) - Video Sanctuary

A Viking-themed video sanctuary platform with Runegold economy, real-time messaging, and community features.

## Project Structure

```
mlnf/
├── backend/          # Node.js/Express backend
│   ├── models/       # MongoDB models
│   ├── routes/       # API routes
│   ├── middleware/   # Express middleware
│   ├── utils/        # Utility functions
│   └── server.js     # Main server file
├── frontend/         # Static frontend
│   ├── index.html    # Homepage
│   ├── archive.html  # Video vault
│   ├── styles.css    # Main styles
│   ├── scripts.js    # Main scripts
│   └── assets/       # Images and static files
└── .env.example      # Environment variables template
```

## Tech Stack

- **Frontend**: HTML5, CSS3 (SCSS compiled), Vanilla JavaScript
- **Backend**: Node.js 20, Express, Socket.io
- **Database**: MongoDB Atlas
- **Payments**: Stripe, PayPal, Blockonomics (Bitcoin), MetaMask (Ethereum)
- **Hosting**:
  - Frontend: Netlify → mlnf.net
  - Backend: Render → https://much-love-no-fear.onrender.com
- **CDN/DNS**: Cloudflare

## Features

### Runegold Economy
- Virtual currency system
- Purchase packs (1000/$10, 5000/$45, 10000/$85)
- Spend on boosts, highlights, badges, tips, subscriptions
- Reserve pool for promotions

### Core Features
- User authentication (JWT)
- Video vault with HLS streaming
- Real-time messaging (Socket.io)
- Comment system with highlights
- Profile pages with badges
- Message board discussions
- Blog with Quill.js editor
- News carousel
- Admin dashboard

## Setup

### Prerequisites
- Node.js 20+
- MongoDB Atlas account
- Payment provider accounts (optional)

### Installation

1. Clone the repository
```bash
git clone https://github.com/ImmortalAl/mlnf.git
cd mlnf
```

2. Install dependencies
```bash
npm install
cd backend && npm install
```

3. Configure environment
```bash
cp .env.example backend/.env
# Edit backend/.env with your values
```

4. Start development servers
```bash
# From root directory
npm run dev
```

### Deployment

#### Backend (Render)
1. Connect GitHub repository
2. Set root directory: `/backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables

#### Frontend (Netlify)
1. Connect GitHub repository
2. Set publish directory: `frontend`
3. Deploy

#### DNS (Cloudflare)
1. Add CNAME records:
   - `@` → `mlnf.netlify.app`
   - `www` → `mlnf.netlify.app`
2. Enable proxy (orange cloud)

## API Health Check

```bash
curl https://much-love-no-fear.onrender.com/api/health
# Expected: {"status":"ok"}
```

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please open a GitHub issue.

---

**Much Love, No Fear** - A sanctuary for authentic connection