# MLNF Development Guide

## 🚀 Getting Started

### **Project Structure**
```
MLNF/
├── front/                    # Frontend (Git Repository - Netlify)
│   ├── components/shared/    # Reusable UI components
│   ├── css/                 # Modular CSS architecture
│   ├── js/                  # JavaScript modules
│   ├── pages/               # Static pages
│   ├── souls/               # Profile system
│   ├── admin/               # Admin panel (Immortal's Sanctum)
│   ├── _redirects           # Netlify routing (CRITICAL)
│   └── docs/                # Documentation center
└── back/                     # Backend API (Render)
    ├── routes/              # Express.js API endpoints
    ├── models/              # MongoDB schemas
    ├── middleware/          # Authentication & validation
    └── config/              # Configuration files
```

### **Environment Setup**

#### **Frontend Development**
```bash
cd front
# No build process - static files served directly
# Use live server extension or similar for development
```

#### **Backend Development**
```bash
cd back
npm install
npm start  # Starts on port 3001
```

#### **Required Environment Variables (Backend)**
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=3001
EMAIL_HOST=smtp.your-provider.com     # Optional (for owl messaging)
EMAIL_PORT=465                        # Optional
EMAIL_USER=your-email@domain.com      # Optional
EMAIL_PASS=your-app-password          # Optional
```

## 🏗️ **Development Workflow**

### **File Organization Rules**
- **Frontend changes**: Always work in `MLNF/front/` directory
- **Backend changes**: Always work in `MLNF/back/` directory
- **Git operations**: Run from `front/` directory (where .git is located)
- **Documentation**: Update `dev-log.md` after each session

### **Branch Strategy**
- **Main branch**: Production-ready code
- **Feature branches**: `feature/feature-name`
- **Hotfix branches**: `hotfix/issue-name`

### **Commit Message Convention**
```
type: description

feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: CSS/styling changes
refactor: Code refactoring
test: Testing changes
```

## 🎨 **Frontend Development**

### **Adding Shared Components to Pages**

#### **1. CSS Requirements (EXACT ORDER)**
```html
<!-- REQUIRED CORE (exact order) -->
<link rel="stylesheet" href="../css/base-theme.css">
<link rel="stylesheet" href="../css/styles.css">
<!-- SHARED COMPONENTS -->
<link rel="stylesheet" href="../components/shared/styles.css?v=1.2">
<!-- PAGE SPECIFIC (if needed) -->
<link rel="stylesheet" href="../css/[page-name].css">
```

#### **2. HTML Structure Template**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title - MLNF</title>
    <!-- CSS files in order above -->
</head>
<body>
    <!-- Empty header for navigation injection -->
    <header></header>
    
    <!-- Your page content -->
    <main>
        <!-- Page content here -->
    </main>
    
    <footer>
        <!-- Footer content -->
    </footer>
    
    <!-- Shared component scripts (order matters) -->
    <script src="../components/shared/config.js"></script>
    <script src="../components/shared/navigation.js"></script>
    <script src="../components/shared/userMenu.js"></script>
    <script src="../components/shared/authModal.js"></script>
    <script src="../components/shared/activeUsers.js"></script>
    <script src="../components/shared/messageModal.js"></script>
    <script src="../components/shared/mlnf-core.js"></script>
    <!-- Page-specific scripts -->
</body>
</html>
```

#### **3. Component Manual Control**
```javascript
// Authentication modal
window.MLNF.openSoulModal('login');
window.MLNF.openSoulModal('register');
window.MLNF.closeSoulModal();

// User interface updates
window.MLNF.updateUserMenu();
window.MLNF.updateUserSidebar();

// Active users sidebar
window.MLNF.toggleActiveUsers();
```

### **CSS Architecture Guidelines**

#### **CSS Variable Usage (REQUIRED)**
```css
/* ✅ CORRECT - Use CSS variables */
background: var(--primary);
color: var(--text);
border: 1px solid var(--secondary);

/* ❌ WRONG - Hard-coded values */
background: #0d0d1a;
color: #f0e6ff;
```

#### **Responsive Design Pattern**
```css
/* Mobile first approach */
.component {
    /* Mobile styles */
}

/* Tablet */
@media (min-width: 768px) {
    .component {
        /* Tablet styles */
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .component {
        /* Desktop styles */
    }
}
```

#### **File Naming Convention**
- `base-theme.css` - CSS variables only
- `styles.css` - Core layout (never rename)
- `[page-name].css` - Page-specific styles
- `[component-name].css` - Component-specific styles

## 🔧 **Backend Development**

### **API Architecture**

#### **Authentication Endpoints**
```javascript
POST /api/auth/signup    // User registration
POST /api/auth/login     // User login  
POST /api/auth/logout    // User logout
```

#### **User Management Endpoints**
```javascript
GET /api/users/me        // Get current user
GET /api/users/:username // Get user profile
PATCH /api/users/me      // Update current user
GET /api/users           // List users (paginated)
GET /api/users/online    // Get online users
```

#### **Owl Messaging Endpoints**
```javascript
POST /api/owls/whisper   // Send email message
```

### **Authentication Flow**
```javascript
// Token storage
localStorage.setItem('sessionToken', token);
localStorage.setItem('user', JSON.stringify(userData));

// API request headers
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
};
```

### **Database Models**

#### **User Schema (MongoDB)**
```javascript
{
    username: String (unique, required),
    email: String (unique, required),
    password: String (hashed, required),
    displayName: String,
    avatar: String (URL),
    status: String,
    bio: String,
    online: Boolean (default: false),
    createdAt: Date,
    isAdmin: Boolean (default: false)
}
```

## 🎯 **Development Standards & Preferences**

### **Site Philosophy**
- **Quality over Quantity**: Focus on attracting quality users, not mass appeal
- **Free Speech Platform**: Minimal moderation approach
- **Anti-SEO Stance**: Avoid mass appeal optimization
- **Professional Standards**: Implement features professional sites have

### **Code Quality Standards**
- **Vanilla JavaScript**: No frameworks (performance and simplicity)
- **Modular CSS**: Component-based architecture
- **Accessibility First**: Screen reader support, keyboard navigation
- **Mobile-First**: Responsive design for all devices
- **Performance**: Fast loading times, optimized assets

### **Feature Development Priorities**
1. **Fix Current Issues**: Always address existing bugs first
2. **Real-time Features**: WebSocket integration preferred
3. **User Experience**: Intuitive navigation and interactions
4. **Security**: Proper authentication and data validation

### **Testing Requirements**
- Test authentication flows thoroughly
- Verify API endpoints with various inputs
- Test responsive design on multiple devices
- Validate accessibility features
- Check cross-browser compatibility

## 🚀 **Deployment**

### **Frontend (Netlify)**
- **URL**: https://mlnf.net
- **Deployment**: Auto-deploy via GitHub integration
- **Configuration**: `_redirects` file handles routing
- **Domain**: Custom domain with SSL

### **Backend (Render)**
- **URL**: https://mlnf-auth.onrender.com/api
- **Deployment**: Auto-deploy from GitHub main branch
- **Database**: MongoDB Atlas
- **Environment**: Set via Render dashboard

### **Deployment Checklist**
- [ ] Test authentication on production
- [ ] Verify all API endpoints work
- [ ] Check profile URL routing
- [ ] Validate email functionality (if configured)
- [ ] Test admin panel access
- [ ] Verify all CSS/JS loads correctly

## 📋 **Session Workflow**

### **Starting a Development Session**
1. Review previous session in `dev-log.md`
2. Check current git status and pull latest changes
3. Identify priority tasks from feature roadmap
4. Set up development environment (live server, etc.)

### **During Development**
- Follow established code patterns
- Test changes locally before committing
- Update documentation for new features
- Maintain consistent code style

### **Ending a Development Session**
1. Test all changes thoroughly
2. Commit and push changes with descriptive messages
3. Update `dev-log.md` with session summary
4. Update feature roadmap status
5. Note any issues for next session

## 🆘 **Common Issues & Solutions**

### **CSS Not Loading**
- Verify CSS file order (base-theme.css → styles.css → shared → page-specific)
- Check file paths are correct
- Clear browser cache
- Validate CSS syntax

### **Authentication Issues**
- Check localStorage for sessionToken and user data
- Verify API endpoints match frontend calls
- Test JWT token expiration
- Check CORS settings

### **Profile URLs Not Working**
- Verify `_redirects` file configuration
- Check Netlify deployment logs
- Test profile template JavaScript
- Validate username parameter extraction

### **Git Repository Confusion**
```bash
# Always run git commands from front/ directory
cd front
git status
git add .
git commit -m "commit message"
git push
```

## 🔍 **Debugging Tools**

### **Browser Developer Tools**
- Console: Check for JavaScript errors
- Network: Monitor API calls and responses
- Elements: Inspect CSS and DOM structure
- Application: Check localStorage data

### **API Testing**
- Use browser network tab for API debugging
- Test endpoints with curl or Postman
- Check backend logs on Render dashboard
- Verify database operations in MongoDB Atlas

## 📚 **Additional Resources**

- **[FEATURES.md](./FEATURES.md)** - Current features and roadmap
- **[CSS-GUIDE.md](./CSS-GUIDE.md)** - Complete CSS documentation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture details
- **[AI-CONTEXT.md](./AI-CONTEXT.md)** - AI assistant context and handoff

---

*Last updated: Documentation consolidation - Complete development workflow guide* 