# MLNF Technical Architecture

## Table of Contents

1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [CSS Architecture & Dependency Mapping](#css-architecture--dependency-mapping)
4. [Avatar System Architecture](#avatar-system-architecture)
5. [Online Status System Architecture](#online-status-system-architecture)
6. [Component System & Integration Points](#component-system--integration-points)
7. [Backend Architecture](#backend-architecture)
8. [Database Architecture](#database-architecture)
9. [Real-Time Features](#real-time-features)
10. [Deployment Architecture](#deployment-architecture)
11. [Security Architecture](#security-architecture)
12. [Performance Architecture](#performance-architecture)
13. [Development Environment](#development-environment)
14. [Scalability Considerations](#scalability-considerations)

---

## 🏗️ System Overview

MLNF is a full-stack web application built with a **vanilla JavaScript frontend** and **Express.js/MongoDB backend**, designed for scalability and maintainability.

### **Architecture Diagram**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   Database      │
│   (Netlify)     │◄──►│   (Render)       │◄──►│  (MongoDB       │
│                 │    │                  │    │   Atlas)        │
│ - Vanilla JS    │    │ - Express.js     │    │ - User Data     │
│ - Static Files  │    │ - JWT Auth       │    │ - Sessions      │
│ - CSS Modules   │    │ - RESTful API    │    │ - Profiles      │
│ - Responsive    │    │ - Nodemailer     │    │ - Messages      │
│ - Avatar System │    │ - Online Status  │    │ - Status Data   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Technology Stack**

#### **Frontend**
- **Core**: Vanilla JavaScript (ES6+)
- **Styling**: Modular CSS with CSS Variables
- **Icons**: Font Awesome
- **Avatar System**: Custom MLNF avatar generation
- **Deployment**: Netlify with custom domain
- **CDN**: Netlify Edge Network

#### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer (optional SMTP configuration)
- **Real-time**: WebSocket integration (planned)
- **Deployment**: Render with auto-deploy

#### **Database**
- **Primary**: MongoDB Atlas (Cloud)
- **ODM**: Native MongoDB driver
- **Schema**: Flexible document structure
- **Backup**: MongoDB Atlas automated backups

---

## 🌐 Frontend Architecture

### **File Structure**
```
front/
├── components/
│   └── shared/              # Reusable UI components
│       ├── config.js        # API configuration
│       ├── navigation.js    # Top navigation
│       ├── userMenu.js      # User dropdown
│       ├── authModal.js     # Login/register modal
│       ├── activeUsers.js   # Online users sidebar
│       ├── messageModal.js  # Messaging modal
│       ├── comments.js      # Comments system
│       ├── styles.css       # Component styles
│       └── mlnf-core.js     # Component initialization
├── css/
│   ├── base-theme.css       # CSS variables (theme)
│   ├── styles.css           # Global layout styles
│   ├── active-users.css     # Active users specific styles
│   └── [page].css           # Page-specific styles
├── js/
│   ├── mlnf-avatar-system.js # Avatar system (site-wide)
│   ├── shared/
│   │   └── apiClient.js     # Centralized API client
│   └── [page].js            # Page-specific JavaScript
├── pages/                   # Static pages
├── souls/                   # Dynamic profile system
├── admin/                   # Admin panel
├── assets/                  # Static assets
│   └── images/
│       ├── default.jpg      # Default avatar fallback
│       └── owl-sprite.svg   # Owl messaging sprite
├── favicon.svg              # Immortal-themed favicon
├── favicon.ico              # Legacy favicon support
├── _redirects               # Netlify routing rules
└── docs/                    # Documentation
```

### **Component Loading Strategy**
```html
<!-- Critical loading order -->
<script src="../components/shared/config.js"></script>
<script src="../components/shared/mlnf-core.js"></script>
<script src="../js/mlnf-avatar-system.js"></script>
<script src="../components/shared/navigation.js"></script>
<script src="../components/shared/userMenu.js"></script>
<script src="../components/shared/authModal.js"></script>
<script src="../components/shared/activeUsers.js"></script>
<script src="../components/shared/messageModal.js"></script>
<script src="../components/shared/comments.js"></script>
```

---

## 🎨 CSS Architecture & Dependency Mapping

*Critical for understanding which styles are available where*

### **CSS Loading Hierarchy**

#### **Global CSS Files (ALL Pages)**
```css
/* 1. Theme Foundation - MUST LOAD FIRST */
base-theme.css              /* CSS variables, immortal color palette */

/* 2. Global Layout - MUST LOAD SECOND */
styles.css                  /* Core layout, typography, avatar system, online dots */
```

#### **Shared Component CSS (MOST Pages)**
```css
/* 3. Shared Components */
components/shared/styles.css /* Modal, navigation, user menu styles */
```

#### **Feature-Specific CSS (LIMITED Pages)**
```css
/* 4. Component-Specific Styles */
active-users.css            /* Active users sidebar - Only on pages with sidebar */
blog.css                    /* Blog/Soul Scrolls pages only */
admin.css                   /* Admin panel only */
souls-listing.css           /* Souls directory only */
```

#### **Page-Specific CSS (SINGLE Page)**
```css
/* 5. Individual Page Styles */
[page-name].css             /* Unique to single pages */
```

### **CSS Dependency Critical Issues**

#### **Online Status Dependencies**
```css
/* CRITICAL: Online status dots MUST be in styles.css for site-wide availability */
.online-dot {
    /* Core online status styling */
    position: absolute;
    bottom: 0;
    right: 0;
    /* ... additional styling ... */
}

.online-dot.online {
    /* Green pulsing dot for online users */
    background: radial-gradient(circle at center, #5cb85c, #3d8b3d);
    animation: immortalPulse 2s ease-in-out infinite;
    /* ... additional effects ... */
}
```

#### **Avatar System Dependencies**
```css
/* CRITICAL: Avatar classes MUST be in styles.css for cross-site functionality */
.mlnf-avatar {
    /* Base avatar styling */
}

.mlnf-avatar--online, .mlnf-avatar--offline {
    /* Status-specific avatar modifications */
}

.mlnf-user-display {
    /* User display container styling */
}
```

### **CSS Loading Order Per Page Type**

#### **Homepage (`index.html`)**
```html
<link rel="stylesheet" href="css/base-theme.css">
<link rel="stylesheet" href="css/styles.css">
<link rel="stylesheet" href="components/shared/styles.css">
```

#### **Sub-pages (`pages/*.html`)**
```html
<link rel="stylesheet" href="../css/base-theme.css">
<link rel="stylesheet" href="../css/styles.css">
<link rel="stylesheet" href="../components/shared/styles.css">
<link rel="stylesheet" href="../css/[page-specific].css">
```

#### **Profile Pages (`souls/*.html`)**
```html
<link rel="stylesheet" href="../css/base-theme.css">
<link rel="stylesheet" href="../css/styles.css">
<link rel="stylesheet" href="../components/shared/styles.css">
<link rel="stylesheet" href="../css/blog.css">
<link rel="stylesheet" href="../css/active-users.css">
<link rel="stylesheet" href="../css/souls-listing.css">
```

---

## 🖼️ Avatar System Architecture

*Comprehensive avatar and user display system*

### **System Components**

#### **1. Core Avatar Generation**
```javascript
// Located: /js/mlnf-avatar-system.js
class MLNFAvatarSystem {
    generateAvatarUrl(username, size, customUrl) {
        // Unique color generation based on username hash
        // UI-Avatars.com integration with fallbacks
        // Custom avatar support
    }
    
    createAvatar(options) {
        // Create individual avatar img elements
        // Apply size, mystical effects, online status
    }
    
    createUserDisplay(options) {
        // Complete user display with avatar + info
        // Unified navigation integration
        // Online status indicator support
    }
}
```

#### **2. Unique Color Generation**
```javascript
generateUserColors(username) {
    // Simple hash function for consistent colors
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // 10 immortal-themed colors
    const immortalColors = [
        { bg: 'ff5e78', text: 'fff' }, // Pink/white
        { bg: 'ffca28', text: '0d0d1a' }, // Gold/dark
        // ... 8 more colors
    ];
    
    return immortalColors[Math.abs(hash) % immortalColors.length];
}
```

#### **3. Integration Points**
- **Active Users Sidebar**: Real-time user status display
- **Comments System**: Author displays with online status  
- **Soul Scrolls (Blog)**: Author bylines with avatars
- **Souls Directory**: User listings with status indicators
- **Profile Pages**: Enhanced profile displays
- **Admin Panel**: User management interfaces

---

## 🟢 Online Status System Architecture

*🚧 In Progress: System architecture is complete but CSS dependencies are being resolved*

### **System Flow**

#### **1. Data Source**
```javascript
// Primary API Endpoint (Preferred)
GET /api/users/online
Response: [
    {
        username: 'user1',
        online: true,
        avatar: 'avatar_url',
        title: 'Eternal Soul',
        isVIP: false,
        role: 'user'
    }
]

// Fallback API Endpoint
GET /api/users
Response: [/* All users, filtered client-side for online: true */]
```

#### **2. Frontend Processing**
```javascript
// Active Users Component (activeUsers.js)
async fetchOnlineUsers() {
    try {
        // Try primary endpoint first
        const response = await fetch(`${API_BASE}/users/online`);
        if (!response.ok) {
            // Fallback to general users endpoint
            const allUsers = await fetch(`${API_BASE}/users`);
            return allUsers.filter(user => user.online === true);
        }
        return await response.json();
    } catch (error) {
        // Graceful degradation
        console.error('Failed to fetch online users:', error);
        return [];
    }
}
```

#### **3. Avatar System Integration**
```javascript
// Avatar creation with online status
const userDisplay = window.MLNFAvatars.createUserDisplay({
    username: user.username,
    title: user.title || 'Eternal Soul',
    online: user.online,  // Boolean: true/false/null
    mystical: user.isVIP || user.role === 'admin'
});

// Creates DOM structure:
// <div style="position: relative;">
//   <img class="mlnf-avatar mlnf-avatar--md" src="...">
//   <div class="online-dot online"></div>  <!-- If online: true -->
// </div>
```

#### **4. CSS Rendering**
```css
/* Global styles (styles.css) - Available site-wide */
.online-dot {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid var(--secondary);
}

.online-dot.online {
    background: radial-gradient(circle at center, #5cb85c, #3d8b3d);
    box-shadow: 0 0 10px rgba(92, 184, 92, 0.8);
    animation: immortalPulse 2s ease-in-out infinite;
}

@keyframes immortalPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
}
```

### **Current Status & Issues**

#### **🚧 In Progress**
- **Issue**: CSS dependencies were isolated to `active-users.css` instead of global `styles.css`
- **Solution**: Moved online dot styles to global stylesheet for site-wide availability
- **Testing**: Cross-page functionality verification in progress

#### **✅ Working Components**
- API data flow (online status data reaches frontend correctly)
- JavaScript integration (avatar system receives `online: true/false`)
- DOM structure creation (`.online-dot` elements are created)
- CSS styling (pulsing green dots with immortal theme)

---

## 🔧 Component System & Integration Points

*Site-wide component architecture and integration*

### **Shared Component Pattern**
```javascript
// Standard component structure
const ComponentName = {
    init() {
        this.createHTML();
        this.attachEventListeners();
        this.updateUI();
    },
    
    createHTML() {
        // Generate component HTML using avatar system
        const userDisplay = window.MLNFAvatars.createUserDisplay({
            username: this.username,
            online: this.isOnline,
            enableUnifiedNavigation: true
        });
    },
    
    attachEventListeners() {
        // Handle user interactions
    },
    
    updateUI() {
        // Update based on application state
    }
};

// Global MLNF object
window.MLNF = {
    // Component instances and global methods
};
```

### **Integration Points Map**

#### **1. Active Users Sidebar**
- **File**: `components/shared/activeUsers.js`
- **Integration**: Full avatar system with online status
- **Usage**: Real-time user list with pulsing green dots
- **Dependencies**: `styles.css`, `active-users.css`

#### **2. Comments System (Eternal Echoes)**
- **File**: `components/shared/comments.js`
- **Integration**: Author displays with clickable profiles
- **Usage**: Comment author avatars with online status
- **Dependencies**: `styles.css` for avatar and online dot styling

#### **3. Soul Scrolls (Blog System)**
- **File**: `js/blog.js`
- **Integration**: Author bylines and modal displays
- **Usage**: Blog post authors with avatar and status
- **Dependencies**: `styles.css`, `blog.css`

#### **4. Souls Directory**
- **File**: `souls/index.html` + JavaScript
- **Integration**: User listings with comprehensive displays
- **Usage**: Profile previews with online indicators
- **Dependencies**: `styles.css`, `souls-listing.css`

#### **5. Profile Pages**
- **File**: `souls/[username].html`
- **Integration**: Enhanced profile headers and comment systems
- **Usage**: Profile display with real-time status
- **Dependencies**: `styles.css`, `blog.css`, `souls-listing.css`

### **Cross-Site Feature Requirements**

#### **Avatar System Integration Checklist**
- [ ] **CSS Dependencies**: Ensure `styles.css` is loaded
- [ ] **JavaScript Dependencies**: Ensure `mlnf-avatar-system.js` is loaded before usage
- [ ] **API Integration**: Pass correct `online` boolean values
- [ ] **DOM Structure**: Create proper container for status dots
- [ ] **Event Handlers**: Preserve click handlers for profile navigation

#### **Testing Matrix**
```
Feature Testing Across Pages:
├── Homepage (index.html)           # Basic avatar display
├── Soul Scrolls (pages/blog.html)  # Author displays + comments
├── Souls Directory (souls/)        # User listings
├── Profile Pages (souls/[user])    # Profile + comments
├── Admin Panel (admin/)            # User management
└── Message Board (pages/)          # User interactions
```

---

## 🔧 Backend Architecture

### **Express.js Application Structure**
```
back/
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── users.js             # User management + online status
│   ├── blogs.js             # Blog/Soul Scrolls system
│   ├── comments.js          # Comments/Eternal Echoes
│   └── owls.js              # Messaging system
├── models/
│   ├── User.js              # User data model + online status
│   ├── Blog.js              # Blog post model
│   └── Comment.js           # Comment model
├── middleware/
│   ├── auth.js              # JWT verification
│   └── validation.js        # Input validation
├── config/
│   └── database.js          # MongoDB connection
├── scripts/                 # Utility scripts
├── package.json             # Dependencies
└── server.js                # Application entry point
```

### **API Architecture**

#### **RESTful Endpoints**
```javascript
// Authentication
POST   /api/auth/signup      // User registration
POST   /api/auth/login       // User login + set online status
POST   /api/auth/logout      // User logout + set offline status

// User Management & Online Status
GET    /api/users/me         // Current user profile
GET    /api/users/:username  // Public profile by username
PATCH  /api/users/me         // Update current user
GET    /api/users            // List users (paginated) - Fallback
GET    /api/users/online     // Online users - Primary endpoint

// Content Systems
GET    /api/blogs           // Blog posts (Soul Scrolls)
GET    /api/blogs/user/:user // User-specific blog posts
POST   /api/blogs           // Create blog post
GET    /api/comments/:type/:id // Comments (Eternal Echoes)
POST   /api/comments        // Create comment

// Messaging
POST   /api/owls/whisper     // Send email message
```

#### **Online Status API Implementation**
```javascript
// Primary endpoint - optimized for online users
router.get('/users/online', async (req, res) => {
    try {
        const onlineUsers = await User.find(
            { online: true },
            { password: 0, email: 0 } // Exclude sensitive fields
        ).sort({ username: 1 });
        
        res.json(onlineUsers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch online users' });
    }
});

// Fallback endpoint - all users (client filters)
router.get('/users', async (req, res) => {
    try {
        const users = await User.find(
            {},
            { password: 0, email: 0 }
        ).sort({ username: 1 });
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
```

---

## 🗄️ Database Architecture

### **MongoDB Schema Design**

#### **User Collection**
```javascript
{
    _id: ObjectId,
    username: String (unique, required),
    email: String (unique, required),
    password: String (hashed),
    displayName: String,
    avatar: String (URL),
    status: String (custom status message),
    bio: String,
    online: Boolean (default: false),        // Real-time status
    lastSeen: Date,                          // Last activity timestamp
    createdAt: Date,
    updatedAt: Date,
    isAdmin: Boolean (default: false),
    isVIP: Boolean (default: false),         // Mystical effects
    role: String (default: 'user')           // user, admin, moderator
}
```

#### **Indexes for Performance**
```javascript
// Performance optimization for online status queries
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "online": 1 });                    // Critical for online users
db.users.createIndex({ "lastSeen": -1 });                 // For activity tracking
db.users.createIndex({ "createdAt": -1 });
```

---

## ⚡ Real-Time Features

*Current and planned real-time functionality*

### **Current Implementation**

#### **Online Status Updates**
- **Method**: Periodic API polling every 30 seconds
- **Endpoint**: `GET /api/users/online`
- **Update Frequency**: Active users sidebar refreshes automatically
- **Performance**: Optimized with cached responses

#### **User Activity Tracking**
```javascript
// Backend: Update online status on login
app.post('/api/auth/login', async (req, res) => {
    // ... authentication logic ...
    
    // Set user as online
    await User.findByIdAndUpdate(userId, {
        online: true,
        lastSeen: new Date()
    });
});

// Backend: Set offline on logout
app.post('/api/auth/logout', async (req, res) => {
    await User.findByIdAndUpdate(userId, {
        online: false,
        lastSeen: new Date()
    });
});
```

### **Planned Real-Time Enhancements**

#### **WebSocket Integration**
```javascript
// Planned: Real-time status updates via WebSocket
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

// Broadcast online status changes immediately
function broadcastUserStatus(userId, isOnline) {
    const message = {
        type: 'user_status_change',
        userId: userId,
        online: isOnline,
        timestamp: new Date()
    };
    
    // Broadcast to all connected clients
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}
```

#### **Frontend WebSocket Client**
```javascript
// Planned: Frontend WebSocket integration
class RealTimeStatusUpdater {
    constructor() {
        this.ws = new WebSocket('wss://mlnf-auth.onrender.com/ws');
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'user_status_change') {
                this.updateUserStatus(data.userId, data.online);
            }
        };
    }
    
    updateUserStatus(userId, isOnline) {
        // Update avatar displays across the site
        const avatars = document.querySelectorAll(`[data-user-id="${userId}"]`);
        avatars.forEach(avatar => {
            const statusDot = avatar.querySelector('.online-dot');
            if (statusDot) {
                statusDot.classList.toggle('online', isOnline);
            }
        });
    }
}
```

---

## 🚀 Deployment Architecture

### **Frontend Deployment (Netlify)**

#### **Build Process**
- No build step required (static files)
- Direct file serving from GitHub repository
- Automatic deployments on git push

#### **Configuration**
```toml
# netlify.toml
[build]
  publish = "."
  
[[redirects]]
  from = "/souls/:username"
  to = "/souls/[username].html"
  status = 200
```

#### **Domain & SSL**
- Custom domain: mlnf.net
- Automatic SSL certificate renewal
- CDN edge caching globally

### **Backend Deployment (Render)**

#### **Environment Variables**
```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=secure_random_string
PORT=3001
EMAIL_HOST=smtp.provider.com (optional)
EMAIL_PORT=465 (optional)
EMAIL_USER=email@domain.com (optional)
EMAIL_PASS=app_password (optional)
```

### **Database Deployment (MongoDB Atlas)**

#### **Configuration**
- Cloud-hosted MongoDB cluster
- Automatic backups and monitoring
- Connection via connection string
- IP whitelist for security

---

## 🔒 Security Architecture

### **Frontend Security**
- Input validation and sanitization
- XSS prevention through proper HTML escaping
- CSRF protection via JWT tokens
- Secure token storage considerations
- Avatar URL validation and sanitization

### **Backend Security**
- JWT token authentication
- Password hashing with bcrypt
- Input validation middleware
- CORS configuration
- Rate limiting (can be implemented)
- Online status manipulation prevention

### **Database Security**
- MongoDB Atlas security controls
- Database user permissions
- Network access control
- Encrypted connections

---

## 📊 Performance Architecture

### **Frontend Optimization**
- Minified CSS and JavaScript (production)
- Image optimization for avatars (UI-Avatars.com external service)
- Lazy loading for user lists
- Browser caching strategies
- Avatar color generation client-side (reduces server load)

### **Backend Optimization**
- Database connection pooling
- Query optimization with indexes (especially for online status)
- Response caching opportunities
- API rate limiting
- Optimized online users endpoint

### **Monitoring & Analytics**
- Frontend: Can integrate analytics service
- Backend: Render provides basic monitoring
- Database: MongoDB Atlas monitoring dashboard
- Error tracking: Console logging (can enhance)

---

## 🔧 Development Environment

### **Local Development Setup**
```bash
# Frontend
cd front
# Use live server or similar for development

# Backend  
cd back
npm install
npm run dev  # Development mode with nodemon
```

### **Environment Configuration**
- Development vs production API endpoints
- Local MongoDB vs Atlas for development
- Environment-specific feature flags

---

## 🚀 Scalability Considerations

### **Current Limitations**
- Frontend state management is basic
- No caching layer implemented
- Online status polling every 30 seconds (not real-time)

### **Future Enhancements**
- **Redis caching layer** for online status
- **WebSocket real-time updates** for instant status changes
- **CDN for static assets** including avatar generation
- **Database sharding** for large user base
- **Microservices architecture** for feature modules
- **Enhanced avatar system** with profile preview caching

---

*Complete technical architecture documentation for MLNF platform with comprehensive CSS dependency mapping and online status system architecture*