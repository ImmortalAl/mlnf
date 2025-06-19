# MLNF AI Development Context & Handoff Guide

## Table of Contents

1. [Project Overview](#-project-overview)
2. [Current Project Status](#-current-project-status-december-2024)
3. [Development Philosophy & Preferences](#-development-philosophy--preferences)
4. [Technical Architecture](#-technical-architecture)
5. [Common Development Patterns](#-common-development-patterns)
6. [Known Issues & Considerations](#-known-issues--considerations)
7. [Development Workflow](#-development-workflow)
8. [Debugging & Troubleshooting](#-debugging--troubleshooting)
9. [AI Assistant Guidelines](#-ai-assistant-guidelines)

---

## 🎯 **Project Overview**

**Manifest Liberation, Naturally Free (MLNF)** is a community platform for free thinkers built with vanilla JavaScript frontend and Express.js/MongoDB backend.

### **Current Production URLs**
- **Frontend**: https://mlnf.net (Netlify)
- **Backend API**: https://mlnf-auth.onrender.com/api (Render)

### **Local Development Structure**
```
C:\Users\coold\Documents\Sites\MLNF\
├── front/                    # Git repository (Netlify deployment)
│   ├── docs/                # Documentation center (THIS FOLDER)
│   └── [frontend files]
└── back/                     # Backend API (Render deployment)
    └── [backend files]
```

## 📋 **Current Project Status (December 2024)**

### **✅ Recently Completed**
- **Admin Panel**: Removed email field from user editing, streamlined for privacy
- **Documentation Reorganization**: Consolidated scattered docs into centralized `docs/` folder
- **CSS Architecture**: Fixed modal conflicts, improved component isolation
- **Backend Dependencies**: Added nodemailer, committed and deployed successfully

### **🔧 Currently Functional Systems**
- ✅ User authentication (registration, login, JWT tokens)
- ✅ Public profile system (`/souls/username` URLs)
- ✅ Admin panel (Immortal's Sanctum) with user management
- ✅ Real-time online status tracking
- ✅ Responsive design across all devices
- ✅ Modal systems (auth, messaging, admin)


## 🎨 **Development Philosophy & Preferences**

### **Site Philosophy**
- **Quality over Quantity**: Focus on attracting quality users, not mass appeal
- **Free Speech Platform**: Minimal moderation approach  
- **Anti-SEO Stance**: "The less that normies come the better" - avoid mass appeal optimization
- **Professional Standards**: Implement features that professional site builders wouldn't overlook

### **Technical Preferences**
- **Vanilla JavaScript**: No frameworks (performance and simplicity)
- **Modular CSS**: Component-based architecture with CSS variables
- **Accessibility First**: Screen reader support, keyboard navigation
- **Mobile-First**: Responsive design approach
- **Real-time Features**: WebSocket integration preferred
- **Performance**: Fast loading times, optimized assets

### **Code Quality Standards**
- Use established patterns from existing codebase
- Follow CSS variable system (see base-theme.css)
- Maintain component modularity
- Update dev-log.md after each session
- Test authentication flows thoroughly
- Ensure cross-browser compatibility

## 🏗️ **Technical Architecture**

### **Authentication Flow**
```javascript
// Token storage
localStorage.setItem('sessionToken', token);
localStorage.setItem('user', JSON.stringify(userData));

// API requests
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
};
```

### **Profile System Architecture**
- **URL Pattern**: `/souls/username`
- **Routing**: Netlify `_redirects` → `/souls/[username].html`
- **Data Flow**: JavaScript extracts username → API call → Dynamic rendering
- **Backend**: `GET /api/users/:username` returns profile data

### **CSS Architecture** 
```html
<!-- CRITICAL: Exact loading order -->
<link rel="stylesheet" href="../css/base-theme.css">      <!-- Variables -->
<link rel="stylesheet" href="../css/styles.css">          <!-- Main layout -->
<link rel="stylesheet" href="../components/shared/styles.css"> <!-- Components -->
<link rel="stylesheet" href="../css/[page-name].css">     <!-- Page-specific -->
```

### **Shared Components**
```javascript
// Available global functions
window.MLNF.openSoulModal('login'|'register');
window.MLNF.closeSoulModal();
window.MLNF.updateUserMenu();
window.MLNF.toggleActiveUsers();
```

## 🔧 **Common Development Patterns**

### **API Endpoints**
```javascript
// Authentication
POST /api/auth/signup    // Registration with auto-login
POST /api/auth/login     // User login
POST /api/auth/logout    // User logout

// User Management  
GET /api/users/me        // Current user data
GET /api/users/:username // Public profile data
PATCH /api/users/me      // Update user profile
GET /api/users           // List users (paginated)
GET /api/users/online    // Online users for sidebar

// Owl Messaging
POST /api/owls/whisper   // Send email message (graceful fallback)
```

### **Error Handling Pattern**
```javascript
try {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    // Handle success
} catch (error) {
    console.error('API Error:', error);
    // Provide user-friendly fallback
}
```

### **Modal System Pattern**
```javascript
// High-specificity CSS to avoid conflicts
#modal-id.component-class {
    /* Styles with !important if needed */
}

// JavaScript initialization
function initializeModal() {
    // Setup event listeners
    // Handle show/hide logic
    // Manage focus and accessibility
}
```

## 🚨 **Known Issues & Considerations**

### **Current Limitations**
- **Email Service**: Owl messaging works with fallback, can be enhanced with full SMTP config
- **Admin Role Detection**: Currently by username, could use database field
- **Search Functionality**: Not implemented in user directory

### **Performance Considerations**
- **Large User Lists**: May need pagination implementation
- **Image Optimization**: Avatar loading could be optimized
- **API Caching**: Consider response caching for better performance

### **Security Notes**  
- JWT tokens in localStorage (consider httpOnly cookies for enhanced security)
- CORS properly configured between frontend and backend
- Input validation on both frontend and backend
- Admin panel access control in place

## 📝 **Development Workflow**

### **Starting a Session**
1. Review `development-log.md` for recent changes
2. Check git status: `cd front && git status`
3. Review current issues in FEATURES.md

### **During Development**
- Follow established code patterns
- Use existing CSS variables and components
- Test changes live on internet after deployment
- Maintain documentation updates

### **Ending a Session**  
1. Test all changes thoroughly
2. Commit with descriptive messages
3. Update `CHANGELOG.md` with session summary
4. Update FEATURES.md if roadmap changes
5. Note any blocking issues for next session

### **Git Workflow & Critical Directory Information**

**⚠️ CRITICAL: Git Repository Location**
- **Git repository is in `MLNF/front/` NOT in `MLNF/` root**
- **Always navigate to `front/` directory before Git operations**
- **Working directory should be: `C:\Users\coold\Documents\Sites\MLNF\front`**

```bash
# ALWAYS start with this from MLNF root:
cd front

# Verify you're in the right location:
pwd  # Should show: C:\Users\coold\Documents\Sites\MLNF\front

# Then proceed with Git operations:
git status
git add .
git commit -m "type: description"
git push origin main
```

**Common AI Assistant Mistakes to Avoid:**
1. **Don't run Git commands from MLNF root directory** - Git repo is in front/
2. **Always check current directory** with `pwd` before Git operations
3. **Remember: Shell starts in MLNF root, but Git repo is in front/**
4. **Use `cd front` as first command** in new conversations

## 🔍 **Debugging & Troubleshooting**

### **Common Issues**
1. **CSS Not Loading**: Check file order, clear cache, verify paths
2. **Authentication Problems**: Check localStorage tokens, verify API endpoints
3. **Profile URLs Not Working**: Check `_redirects` file, test JavaScript extraction
4. **Modal Positioning Issues**: Use high-specificity selectors, check z-index
5. **API Errors**: Check network tab, verify backend is running, check CORS

### **Debugging Tools**
- Browser Developer Tools (Console, Network, Elements)
- Render backend logs for API issues
- Netlify deployment logs for frontend issues
- MongoDB Atlas for database operations


### **Real Messaging System** 
- Conversation threading and history
- File/image sharing capabilities

## 🤖 **AI Assistant Guidelines**

### **Decision Making**
- Bias towards existing patterns over new approaches
- Always test authentication flows after changes
- Prioritize user experience and accessibility
- Maintain professional code quality standards

### **Documentation Requirements**
- Update `development_log.md` after significant changes
- Keep FEATURES.md roadmap current
- Update this file if architecture changes
- Note any breaking changes or migrations needed

### **Code Preferences**
- Use CSS variables, not hard-coded values
- Follow mobile-first responsive design
- Implement proper error handling with user-friendly messages
- Maintain component modularity and reusability

### **Testing Priorities**
1. Authentication flows (login, register, logout)
2. Profile system (public URLs, data display)
3. Admin panel functionality (user management)
4. Modal systems (positioning, functionality)
5. Responsive design across devices

## 📊 **Project Health Metrics**

### **Backend Status**
- ✅ API endpoints functional
- ✅ Database connections stable
- ✅ Authentication system working
- ✅ Auto-deployment from GitHub

### **Frontend Status**
- ✅ All pages loading correctly
- ✅ CSS architecture organized
- ✅ JavaScript components modular
- ✅ Responsive design implemented
- ✅ Modal systems functional

### **Documentation Status**
- ✅ Centralized documentation structure
- ✅ Development guides complete
- ✅ Architecture documented
- ✅ AI context maintained
- ✅ Feature roadmap updated

---

*Complete AI assistant context for seamless development continuation*  
*Last updated: Documentation consolidation phase* 