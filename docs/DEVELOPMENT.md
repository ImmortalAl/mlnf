# MLNF Development Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Leadership & Development Analysis](#leadership--development-analysis)
4. [Development Best Practices](#development-best-practices)
5. [Architecture-First Development](#architecture-first-development)
6. [Troubleshooting Methodologies](#troubleshooting-methodologies)
7. [Frontend Development](#frontend-development)
8. [Backend Development](#backend-development)
9. [Development Standards & Preferences](#development-standards--preferences)
10. [Deployment](#deployment)
11. [Session Workflow](#session-workflow)
12. [Common Issues & Solutions](#common-issues--solutions)
13. [Debugging Tools](#debugging-tools)
14. [Additional Resources](#additional-resources)

---

## 🚀 Getting Started

### **Project Structure**

**⚠️ IMPORTANT: Git Repository Location**  
The Git repository is located in `MLNF/front/` subdirectory, **NOT** in the root `MLNF/` directory.

```
MLNF/                         # Project root (NOT the Git repository)
├── front/                    # Frontend (THIS IS THE GIT REPOSITORY - Netlify)
│   ├── .git/                 # Git repository files
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

**For AI Assistants & Developers:**
Use the script for pushing to Git

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

---

## 🏗️ Development Workflow

### **File Organization Rules**
- **Frontend changes**: Always work in `MLNF/front/` directory
- **Backend changes**: Always work in `MLNF/back/` directory
- **Git operations**: Run from `front/` directory (where .git is located)
- **Documentation**: Update `CHANGELOG.md` after each session

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

---

## 👥 Leadership & Development Analysis

*Based on comprehensive analysis of development workflow during online status debugging session*

### **Leadership Strengths Identified**

#### **1. Strategic Problem Recognition**
- **Systems Thinking**: Correctly identified online status issue as systemic rather than surface-level
- **Pattern Recognition**: Asked for deep diagnosis when repeated quick fixes failed
- **Scope Awareness**: Understood that avatar system changes affect entire site architecture

#### **2. Effective Feedback Patterns**
- **Specific Feedback**: Provided concrete observations ("still no green dots") rather than vague descriptions
- **Iterative Communication**: Maintained patience through multiple debugging cycles
- **Documentation Focus**: Emphasized importance of updating documentation post-resolution

#### **3. Continuous Deployment Leadership**
- **CLAUDE.md Standards**: Ensured immediate deployment of all fixes
- **Production Mindset**: Maintained focus on live site functionality throughout debugging

### **Development Process Improvements Identified**

#### **1. AI Development Issues Discovered**
- **Assumption-Based Coding**: Implementation without thorough architecture understanding
- **Single-Pattern Thinking**: Assumed CSS `::after` pseudo-elements without checking existing patterns
- **Incomplete Investigation**: Made changes without comprehensive system audit first

#### **2. Process Gaps Identified**
- **Missing Architecture Audit**: Should audit existing systems before any code changes
- **CSS Dependency Blindness**: Lacked understanding of which CSS files load on which pages
- **Integration Testing Gaps**: Tested on single page type instead of cross-site verification

### **Leadership Strategy Recommendations**

#### **For Complex Technical Issues**
1. **Demand Architecture Audit First**: Request comprehensive system understanding before implementation
2. **Require Cross-Page Testing Plan**: Ensure features work site-wide, not just in one location
3. **Enforce Documentation Review**: Verify existing system documentation before changes

#### **For AI Assistant Management**
1. **"No Assumptions" Policy**: Require verification of existing patterns before implementation
2. **Architecture-First Mandate**: No code changes without understanding current system
3. **Cross-Validation Requirements**: Demand testing across multiple page types/contexts

---

## 🏆 Development Best Practices

### **Core Development Principles**

#### **1. Architecture-First Approach**
- **Audit Before Implementation**: Always understand existing system architecture before making changes
- **Document Dependencies**: Map out CSS file dependencies and loading order
- **Verify Integration Points**: Understand how features integrate across different page types

#### **2. No Assumptions Rule**
- **Verify Existing Patterns**: Never assume how current systems work - always check
- **Test Current Functionality**: Verify what currently works before making changes
- **Cross-Reference Documentation**: Check if documentation matches actual implementation

#### **3. Systematic Testing Standards**
- **Multi-Page Testing**: Test all features across different page types
- **Cross-Browser Validation**: Verify functionality in different browsers
- **Mobile-First Testing**: Ensure features work on mobile devices first

#### **4. CSS Architecture Awareness**
- **Loading Order Understanding**: Know which CSS files load on which pages
- **Dependency Mapping**: Understand CSS file relationships and requirements
- **Global vs Component Styles**: Distinguish between site-wide and component-specific styles

### **Quality Assurance Standards**

#### **1. Code Quality Requirements**
- **Vanilla JavaScript**: No frameworks - maintain performance and simplicity
- **Modular CSS**: Component-based architecture with clear dependencies
- **Accessibility First**: Screen reader support, keyboard navigation
- **Mobile-First**: Responsive design for all devices

#### **2. Performance Standards**
- **Fast Loading Times**: Optimize asset loading and reduce HTTP requests
- **Lazy Loading**: Implement for images and non-critical resources
- **CSS Optimization**: Minimize and organize stylesheets efficiently
- **JavaScript Efficiency**: Avoid blocking operations and optimize DOM manipulation

---

## 🔧 Architecture-First Development

*Systematic approach to prevent architectural issues*

### **Pre-Development Architecture Audit**

#### **1. System Understanding Checklist**
- [ ] Map current feature architecture completely
- [ ] Identify all integration points and dependencies
- [ ] Document CSS file loading order and requirements
- [ ] Test current functionality across multiple page types
- [ ] Review existing documentation for architectural patterns

#### **2. CSS Dependency Analysis**
```
CSS Loading Order Analysis:
├── base-theme.css         # Global variables - ALL pages
├── styles.css             # Core styles - ALL pages  
├── components/shared/     # Shared components - MOST pages
├── active-users.css       # Sidebar only - LIMITED pages
└── page-specific.css      # Individual pages - SINGLE page
```

#### **3. JavaScript Integration Mapping**
```
Script Loading Order:
├── config.js              # Must load first - configuration
├── websocket.js           # Real-time features
├── navigation.js          # Site navigation
├── mlnf-core.js          # Core functionality
├── mlnf-avatar-system.js  # Avatar system (site-wide)
├── activeUsers.js         # User management
└── page-specific.js       # Page functionality
```

### **Implementation Strategy**

#### **1. System Integration Approach**
- **Understand Existing Patterns**: Study how similar features are currently implemented
- **Follow Established Architecture**: Use existing patterns rather than creating new ones
- **Verify Cross-Site Compatibility**: Ensure changes work across all relevant pages

#### **2. CSS Architecture Integration**
- **Global Styles**: Add to `styles.css` for site-wide features
- **Component Styles**: Add to appropriate component CSS for specific functionality
- **Page-Specific Styles**: Only for features unique to single pages

#### **3. Testing Strategy**
- **Component Testing**: Test individual components in isolation
- **Integration Testing**: Verify functionality across different page contexts
- **Cross-Browser Testing**: Ensure compatibility across browser types
- **Mobile Testing**: Validate responsive design and touch interactions

---

## 🔍 Troubleshooting Methodologies

*Systematic approaches for complex issue resolution*

### **Complex Issue Debugging Framework**

#### **1. Issue Classification**
- **Surface Issues**: Single component or page problems
- **Systemic Issues**: Cross-site functionality problems
- **Architecture Issues**: Fundamental system design problems

#### **2. Debugging Escalation Process**

**Level 1: Quick Diagnosis (< 30 minutes)**
- Check browser console for obvious errors
- Verify CSS and JavaScript file loading
- Test in different browsers/devices
- Review recent changes for obvious conflicts

**Level 2: Component Analysis (< 2 hours)**
- Audit specific component architecture
- Test functionality across multiple contexts
- Review integration points and dependencies
- Document current vs expected behavior

**Level 3: System Architecture Audit (> 2 hours)**
- Comprehensive system architecture review
- Map data flow from API to UI
- Analyze CSS dependency chain
- Document all integration points
- Create testing matrix for complex scenarios

#### **3. Documentation and Learning Integration**
- **Document Root Cause**: Record actual cause vs initial assumptions
- **Update Troubleshooting Guides**: Add new scenarios to documentation
- **Revise Development Process**: Incorporate lessons learned into standards
- **Share Knowledge**: Update AI development guidelines with new insights

### **Common Complex Issue Patterns**

#### **1. CSS Dependency Issues**
**Symptoms**: Feature works in some contexts but not others
**Diagnosis**: Map CSS file loading across different page types
**Solution**: Move styles to appropriate global or shared CSS files

#### **2. JavaScript Integration Problems**
**Symptoms**: JavaScript errors in browser console, features not working
**Diagnosis**: Check script loading order and dependency chain
**Solution**: Ensure proper script loading order and dependency management

#### **3. Cross-Site Feature Failures**
**Symptoms**: Feature works on one page type but fails on others
**Diagnosis**: Test feature across all relevant page types and contexts
**Solution**: Ensure consistent implementation across all integration points

---

## 🎨 Frontend Development

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
    <!-- Immortal-themed favicon -->
    <link rel="icon" type="image/svg+xml" href="../favicon.svg">
    <link rel="icon" type="image/x-icon" href="../favicon.ico">
    <link rel="apple-touch-icon" href="../favicon.svg">
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
    <script src="../js/mlnf-avatar-system.js"></script>
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

// Avatar system
const userDisplay = window.MLNFAvatars.createUserDisplay({
    username: 'username',
    online: true,
    mystical: false
});
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

### **UI Component Architecture**

#### **1. Component Stacking Context**
- **HTML Structure**: Components must be placed in correct DOM hierarchy for proper stacking
- **Z-Index Management**: 
  - Use consistent z-index scale across components
  - Consider parent stacking contexts when positioning elements
  - Avoid z-index conflicts by planning component hierarchy
- **Modal/Sidebar Positioning**: 
  - Place modals and sidebars outside main content flow
  - Use fixed positioning with proper z-index values
  - Ensure proper event propagation and scroll management

#### **2. Scroll Management**
- **Modal/Sidebar Scrolling**:
  - Prevent body scroll when modal/sidebar is open
  - Maintain scroll position when closing components
  - Handle nested scrollable areas properly
- **Scroll Lock Implementation**:
  - Use CSS `overflow: hidden` on body when needed
  - Restore scroll position on component close
  - Consider mobile-specific scroll behaviors

#### **3. Component Integration**
- **Event Handling**:
  - Properly manage event bubbling and capture
  - Implement click-outside detection correctly
  - Handle keyboard navigation and accessibility
- **State Management**:
  - Track component open/close states
  - Manage component interactions
  - Handle component lifecycle properly

---

## 🔧 Backend Development

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
GET /api/users           // List users (paginated) - Fallback
GET /api/users/online    // Get online users - Primary
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

---

## 🎯 Development Standards & Preferences

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
- **Cross-page testing**: Verify features work across all relevant pages

---

## 🚀 Deployment

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
- [ ] Test avatar system across multiple page types
- [ ] Verify online status indicators work site-wide

---

## 📋 Session Workflow

### **Starting a Development Session**
1. Review previous session in `CHANGELOG.md`
2. Check current git status and pull latest changes
3. Identify priority tasks from feature roadmap
4. **Conduct architecture audit if working on complex features**
5. Set up development environment (live server, etc.)

### **During Development**
- Follow established code patterns
- **Apply architecture-first approach for complex changes**
- Test changes live on internet after deployment
- **Test across multiple page types for site-wide features**
- Update documentation for new features
- Maintain consistent code style

### **Ending a Development Session**
1. Test all changes thoroughly across relevant contexts
2. Commit and push changes with descriptive messages
3. Update `CHANGELOG.md`