# Manifest Liberation, Naturally Free (MLNF)

## 🚧 TODO
- Implement user feedback system (see proposals below)
- Consolidate and merge overlapping documentation (README, dev-log, style guides, etc.)

### Feedback System Proposals
- Simple feedback form: Button opens modal, submits to backend, stores in feedback collection
- Feedback with categories: Add dropdown for Bug Report, Feature Request, General Feedback, Other
- Anonymous or authenticated feedback: Auto-fill user info if logged in, allow anonymous otherwise
- Feedback with status tracking: Admin can mark feedback as Reviewed, In Progress, Resolved, etc.
- Public roadmap/upvote board: Display feedback/feature requests publicly, allow upvotes/comments

**Important Project Structure Note:**
- The front-end static site files are located in: `MLNF/front/`
- The back-end Express.js app is in: `MLNF/back/`

This is to avoid confusion when running git commands or editing files. Always `cd MLNF/front` for front-end git operations.

---

A timeless sanctuary for liberated spirits to manifest truth and freedom.

## 🚀 Current Status (May 28, 2025)

### ✅ Recently Completed
- **Authentication System**: Registration and login fully functional
- **Public Profiles**: Dynamic profile pages at `/souls/username` working
- **CSS Architecture**: Comprehensive documentation and modular structure
- **User Management**: Backend API endpoints for user operations
- **Responsive Design**: Mobile-friendly interface across all pages
- **Eternal Souls Refactor:** Simplified the Eternal Souls directory to use only the shared Active Users sidebar for online status and instant messaging. Removed duplicate user sidebar and unnecessary stats/levels.
- **Immortal's Sanctum Admin Panel:** Created a new admin panel for site management, user analytics, and future moderation tools. Accessible at /admin/ for the administrator.

### 🔧 Active Features
- User registration with automatic login
- Public profile sharing with clean URLs
- Real-time online status tracking
- Responsive navigation and mobile menu
- Theme switching (dark/light mode)
- Active users sidebar
- Profile customization (avatar, bio, status)
- Immortal's Sanctum admin dashboard (user management, analytics, role detection by username)
- Clean Eternal Souls directory with instant messaging and online status

## 🎯 Next Development Priorities

### 1. Administrative Control Center
- User management dashboard (`/admin`)
- Content moderation tools
- Site analytics and monitoring
- Role-based access control

### 2. Real Messaging System
- Replace mock responses with persistent messaging
- Conversation threading and history
- Real-time message delivery (WebSocket)
- File/image sharing capabilities

### 3. Enhanced Community Features
- User search and discovery
- Interest-based matching
- Achievement/badge system
- Community guidelines enforcement

## Project Structure

```
mlnf/
├── front/                    # Frontend static site
│   ├── assets/              # Static assets (images, fonts, etc.)
│   ├── css/                # CSS files
│   │   ├── base-theme.css  # CSS variables and theme
│   │   ├── styles.css      # Main global styles
│   │   └── [page].css      # Page-specific styles
│   ├── components/         # Shared components
│   │   └── shared/         # Reusable UI components
│   ├── js/                 # JavaScript files
│   ├── pages/             # Static pages
│   ├── souls/             # Profile system
│   │   ├── index.html     # Profile listing
│   │   └── [username].html # Dynamic profile template
│   ├── _redirects         # Netlify routing configuration
│   └── dev-log.md         # Development session log
└── back/                   # Backend Express.js API
    ├── routes/            # API endpoints
    ├── models/            # Database models
    ├── middleware/        # Auth and validation
    └── config/            # Configuration files
```

## Setup

### Frontend Development
```bash
cd front
# No build process needed - static files served directly
# Use live server or similar for development
```

### Backend Development
```bash
cd back
npm install
npm start  # Starts on port 3001
```

### Environment Variables (Backend)
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=3001
```

## Features

### Authentication & Users
- JWT-based authentication
- User registration with automatic login
- Profile management (avatar, bio, status)
- Online status tracking
- Public profile sharing

### UI/UX
- Modern CSS architecture with modular components
- Theme support (dark/light)
- Responsive design optimized for mobile
- Font Awesome icons
- Smooth animations and transitions

### Technical
- Vanilla JavaScript (no frameworks)
- Express.js backend with MongoDB
- Netlify deployment with custom redirects
- RESTful API architecture

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/me` - Get current user
- `GET /api/users/:username` - Get user profile
- `PATCH /api/users/me` - Update current user
- `GET /api/users` - List users (paginated)
- `GET /api/users/online` - Get online users

## Deployment

### Frontend (Netlify)
```bash
# Automatic deployment via GitHub integration
# Custom redirects handled by _redirects file
```

### Backend (Render)
- Deployed at: `https://mlnf-auth.onrender.com`
- Auto-deploys from GitHub main branch
- MongoDB Atlas for database

## Development Workflow

1. **Frontend Changes**: Edit files in `front/`, test locally, commit and push
2. **Backend Changes**: Edit files in `back/`, test locally, commit and push
3. **Database Changes**: Update models in `back/models/`, run migrations if needed
4. **Documentation**: Update `dev-log.md` after each session

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a new Pull Request

## License

ISC License
