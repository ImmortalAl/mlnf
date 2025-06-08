# MLNF Technical Architecture

## 🏗️ **System Overview**

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
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Technology Stack**

#### **Frontend**
- **Core**: Vanilla JavaScript (ES6+)
- **Styling**: Modular CSS with CSS Variables
- **Icons**: Font Awesome
- **Deployment**: Netlify with custom domain
- **CDN**: Netlify Edge Network

#### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer (optional SMTP configuration)
- **Deployment**: Render with auto-deploy

#### **Database**
- **Primary**: MongoDB Atlas (Cloud)
- **ODM**: Native MongoDB driver
- **Schema**: Flexible document structure
- **Backup**: MongoDB Atlas automated backups

## 🌐 **Frontend Architecture**

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
│       ├── styles.css       # Component styles
│       └── mlnf-core.js     # Component initialization
├── css/
│   ├── base-theme.css       # CSS variables (theme)
│   ├── styles.css           # Global layout styles
│   └── [page].css           # Page-specific styles
├── js/
│   └── [page].js            # Page-specific JavaScript
├── pages/                   # Static pages
├── souls/                   # Dynamic profile system
├── admin/                   # Admin panel
├── assets/                  # Static assets
├── _redirects               # Netlify routing rules
└── docs/                    # Documentation
```

### **Component System**

#### **Shared Component Pattern**
```javascript
// Component Structure
const ComponentName = {
    init() {
        this.createHTML();
        this.attachEventListeners();
        this.updateUI();
    },
    
    createHTML() {
        // Generate component HTML
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

#### **Component Loading Strategy**
```html
<!-- Load order is critical -->
<script src="../components/shared/config.js"></script>
<script src="../components/shared/navigation.js"></script>
<script src="../components/shared/userMenu.js"></script>
<script src="../components/shared/authModal.js"></script>
<script src="../components/shared/activeUsers.js"></script>
<script src="../components/shared/messageModal.js"></script>
<script src="../components/shared/mlnf-core.js"></script> <!-- Last -->
```

### **CSS Architecture**

#### **Loading Hierarchy**
```css
/* 1. Theme Foundation */
@import 'base-theme.css';     /* CSS variables only */

/* 2. Global Layout */
@import 'styles.css';         /* Core layout, typography */

/* 3. Shared Components */
@import 'components/shared/styles.css';  /* Modal, nav, etc. */

/* 4. Page-Specific */
@import '[page-name].css';    /* Page-specific styles */
```

#### **CSS Variable System**
```css
:root {
    /* Color Palette */
    --primary: #1a0d33;
    --secondary: #2d1b4e;
    --accent: #4a3569;
    
    /* Typography */
    --font-primary: 'Segoe UI', sans-serif;
    --text-base: 1rem;
    --leading-normal: 1.5;
    
    /* Spacing */
    --space-4: 1rem;
    --space-6: 1.5rem;
    
    /* Layout */
    --border-radius: 0.375rem;
    --shadow: rgba(26, 13, 51, 0.5);
}
```

### **Routing System**

#### **Static Pages**
- Direct file serving via Netlify
- Traditional multi-page application structure

#### **Dynamic Profile Routes**
```
# Netlify _redirects configuration
/souls/:username    /souls/[username].html    200

# JavaScript URL extraction
const username = window.location.pathname.split('/').pop();
```

#### **Profile Resolution Flow**
```javascript
// 1. User visits /souls/johndoe
// 2. Netlify redirects to /souls/[username].html
// 3. JavaScript extracts 'johndoe' from URL
// 4. API call to GET /api/users/johndoe
// 5. Dynamic content rendering
```

## 🔧 **Backend Architecture**

### **Express.js Application Structure**
```
back/
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── users.js             # User management
│   └── owls.js              # Messaging system
├── models/
│   └── User.js              # User data model
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
POST   /api/auth/login       // User login
POST   /api/auth/logout      // User logout

// User Management
GET    /api/users/me         // Current user profile
GET    /api/users/:username  // Public profile by username
PATCH  /api/users/me         // Update current user
GET    /api/users            // List users (paginated)
GET    /api/users/online     // Online users

// Messaging
POST   /api/owls/whisper     // Send email message
```

#### **Request/Response Pattern**
```javascript
// Standard API Response Format
{
    "success": true,
    "data": { /* response data */ },
    "message": "Operation successful"
}

// Error Response Format
{
    "success": false,
    "error": "Error description", 
    "code": "ERROR_CODE"
}
```

### **Authentication System**

#### **JWT Implementation**
```javascript
// Token Generation
const token = jwt.sign(
    { userId: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
);

// Token Verification Middleware
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    // Verify and decode token
    // Attach user to request object
};
```

#### **Frontend Token Management**
```javascript
// Storage
localStorage.setItem('sessionToken', token);
localStorage.setItem('user', JSON.stringify(userData));

// API Request Headers
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
};
```

## 🗄️ **Database Architecture**

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
    online: Boolean (default: false),
    createdAt: Date,
    updatedAt: Date,
    isAdmin: Boolean (default: false)
}
```

#### **Indexes**
```javascript
// Performance optimization
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "online": 1 });
db.users.createIndex({ "createdAt": -1 });
```

### **Data Access Patterns**

#### **User Authentication**
```javascript
// Login flow
const user = await User.findOne({ username: username });
const isValid = await bcrypt.compare(password, user.password);
if (isValid) {
    // Generate JWT token
    // Update online status
    // Return user data and token
}
```

#### **Profile Queries**
```javascript
// Public profile data (exclude sensitive fields)
const profile = await User.findOne(
    { username: username },
    { password: 0, email: 0 }  // Exclude sensitive fields
);
```

## 🚀 **Deployment Architecture**

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

#### **Configuration**
```yaml
# render.yaml
services:
  - type: web
    name: mlnf-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

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

#### **Performance Optimization**
- Database indexes for common queries
- Connection pooling
- Query optimization
- Regular performance monitoring

## 🔒 **Security Architecture**

### **Frontend Security**
- Input validation and sanitization
- XSS prevention through proper HTML escaping
- CSRF protection via JWT tokens
- Secure token storage considerations

### **Backend Security**
- JWT token authentication
- Password hashing with bcrypt
- Input validation middleware
- CORS configuration
- Rate limiting (can be implemented)

### **Database Security**
- MongoDB Atlas security controls
- Database user permissions
- Network access control
- Encrypted connections

## 📊 **Performance Architecture**

### **Frontend Optimization**
- Minified CSS and JavaScript (production)
- Image optimization for avatars
- Lazy loading for user lists
- Browser caching strategies

### **Backend Optimization**
- Database connection pooling
- Query optimization with indexes
- Response caching opportunities
- API rate limiting

### **Monitoring & Analytics**
- Frontend: Can integrate analytics service
- Backend: Render provides basic monitoring
- Database: MongoDB Atlas monitoring dashboard
- Error tracking: Console logging (can enhance)

## 🔧 **Development Environment**

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

## 🚀 **Scalability Considerations**

### **Current Limitations**
- Session storage in localStorage (not ideal for multi-tab)
- No WebSocket implementation for real-time features
- Frontend state management is basic
- No caching layer implemented

### **Future Enhancements**
- WebSocket integration for real-time messaging
- Redis caching layer
- CDN for static assets
- Database sharding for large user base
- Microservices architecture for feature modules

---

*Complete technical architecture documentation for MLNF platform* 