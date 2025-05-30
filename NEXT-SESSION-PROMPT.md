# MLNF Development - Next Session Prompt

## 🎯 **Copy this entire prompt into your next Cursor conversation:**

---

I'm continuing development on **Manifest Liberation, Naturally Free (MLNF)**, a community platform for free thinkers. This is a **vanilla JavaScript frontend** with **Express.js/MongoDB backend**.

## 📍 **Current Project Status (May 30, 2025)**

### ✅ **Recently Fixed & Working**
- **Admin User Editing**: Fully functional, case-sensitivity issues resolved
- **Diagnostic Scripts**: Removed all temporary/diagnostic scripts from backend
- **Transcend Session Tooltip**: Added 'Log Out' tooltip to all 'Transcend Session' buttons site-wide
- **Admin Dashboard**: Polished UI, added tooltips for clarity
- **Documentation**: Updated dev-log, README.md, and NEXT-SESSION-PROMPT.md; removed outdated TODOs; added feedback system proposals

### 🏗️ **Project Structure**
```
MLNF/
├── front/                    # Frontend (Netlify deployment)
│   ├── components/shared/    # Reusable UI components
│   ├── css/                 # Modular CSS architecture
│   ├── souls/               # Profile system
│   ├── _redirects           # Netlify routing (CRITICAL for profiles)
│   └── dev-log.md           # Session documentation
└── back/                     # Backend API (Render deployment)
    ├── routes/              # Express.js API endpoints
    ├── models/              # MongoDB schemas (User.js, etc.)
    └── middleware/          # Authentication & validation
```

### 🔗 **Key Endpoints & URLs**
- **Frontend**: `https://mlnf.net` (Netlify)
- **Backend API**: `https://mlnf-auth.onrender.com/api` (Render)
- **Profile URLs**: `https://mlnf.net/souls/username` (dynamic routing)

## 🚀 **Next Development Priorities**

1. **Implement User Feedback System**
   - Start with a simple feedback form/modal (see README.md for proposals)
   - Add backend endpoint and feedback storage
   - Optionally expand to categories, status tracking, or public roadmap
2. **Consolidate Documentation**
   - Merge overlapping docs (README, dev-log, style guides)
   - Ensure all references use correct file names (User.js, etc.)
3. **Dashboard Polish**
   - Continue improving admin dashboard UI/UX as needed
   - Add more tooltips or help text if useful

## 🛠️ **Technical Context**

### **Authentication Flow**
- JWT tokens stored in `localStorage.getItem('sessionToken')`
- User data in `localStorage.getItem('user')`
- All API calls require `Authorization: Bearer ${token}` header

### **Profile System Architecture**
- **URL Pattern**: `/souls/username`
- **Routing**: Netlify `_redirects` → `/souls/[username].html`
- **Data Flow**: JavaScript extracts username → API call → Dynamic rendering
- **Backend**: `GET /api/users/:username` returns profile data

### **CSS Architecture**
- **Base Theme**: `css/base-theme.css` (CSS variables)
- **Global Styles**: `css/styles.css` (layout, typography)
- **Shared Components**: `components/shared/styles.css`
- **Page-Specific**: `css/[page-name].css`

### **JavaScript Components**
- **Shared**: `components/shared/` (authModal, userMenu, navigation, etc.)
- **Page-Specific**: `js/` directory
- **Global Config**: `components/shared/config.js`

## 📋 **Development Guidelines**

### **File Organization**
- Frontend changes: Work in `front/` directory
- Backend changes: Work in `back/` directory
- Always update `dev-log.md` after sessions
- Use existing CSS patterns and component structure

### **Deployment**
- **Frontend**: Auto-deploys via GitHub to Netlify
- **Backend**: Auto-deploys via GitHub to Render
- **Database**: MongoDB Atlas (connection in backend env vars)

### **Code Style**
- Vanilla JavaScript (no frameworks)
- Modular CSS with CSS variables
- RESTful API design
- Comprehensive error handling
- Mobile-first responsive design

## 🔍 **Known Issues & Considerations**

### **Messaging System**
- Currently shows mock responses
- Need to implement WebSocket for real-time

### **Performance**
- Consider pagination for large user lists
- Image optimization for avatars
- API response caching strategies

## 📚 **Key Files to Review**

### **Authentication**
- `front/components/shared/authModal.js` - Login/registration modal
- `back/routes/auth.js` - Authentication endpoints

### **User Management**
- `front/souls/[username].html` - Dynamic profile template
- `back/routes/users.js` - User API endpoints
- `back/models/User.js` - User database schema

### **Styling**
- `front/css/README.md` - Complete CSS documentation
- `front/css/STYLE-GUIDE.md` - Design system guide

### **Configuration**
- `front/_redirects` - Netlify routing rules
- `front/components/shared/config.js` - API configuration

## 🎯 **Immediate Next Steps**

1. messaging system
2. **Review Current Code**: Understand existing patterns and architecture
3. **Plan Implementation**: Database schema, API endpoints, frontend components
4. **Start Development**: Follow established patterns and update documentation

## 💡 **Development Philosophy**
- **User-First**: Every feature should enhance user experience
- **Modular Design**: Keep components reusable and maintainable
- **Documentation**: Update dev-log.md and relevant docs
- **Testing**: Test authentication flows and API endpoints thoroughly

Future Steps: Develop site subpages: Echoes Unbound, Boundless Chronicles, Clash of Immortals, Infinite Nexus, Timeless Vault

**Ready to continue building this digital sanctuary for free thinkers!** 🌟

*Last updated: May 30, 2025 - Admin Panel, Tooltips, and Documentation Maintenance Complete* 