# MLNF Development - Next Session Prompt

## 🎯 **Copy this entire prompt into your next Cursor conversation:**

---

I'm continuing development on **Manifest Liberation, Naturally Free (MLNF)**, a community platform for free thinkers. This is a **vanilla JavaScript frontend** with **Express.js/MongoDB backend**.

## 📍 **Current Project Status (May 28, 2025)**

### ✅ **Recently Fixed & Working**
- **Authentication System**: Registration and login fully functional (fixed critical endpoint mismatch)
- **Public Profiles**: Dynamic profile pages at `/souls/username` working via Netlify redirects
- **User Management**: Complete backend API for user operations
- **CSS Architecture**: Modular, well-documented system with comprehensive style guide

### 🏗️ **Project Structure**
```
MLNF/
├── front/                    # Frontend (Netlify deployment)
│   ├── components/shared/    # Reusable UI components
│   ├── css/                 # Modular CSS architecture
│   ├── souls/               # Profile system
│   │   ├── index.html       # Profile listing page
│   │   └── [username].html  # Dynamic profile template
│   ├── _redirects           # Netlify routing (CRITICAL for profiles)
│   └── dev-log.md           # Session documentation
└── back/                     # Backend API (Render deployment)
    ├── routes/              # Express.js API endpoints
    ├── models/              # MongoDB schemas
    └── middleware/          # Authentication & validation
```

### 🔗 **Key Endpoints & URLs**
- **Frontend**: `https://mlnf.net` (Netlify)
- **Backend API**: `https://mlnf-auth.onrender.com/api` (Render)
- **Profile URLs**: `https://mlnf.net/souls/username` (dynamic routing)

## 🚀 **Next Development Priorities**

### **1. Administrative Control Center** (HIGH PRIORITY)
Create `/admin` dashboard with:
- **User Management**: View, search, ban/suspend users, role assignment
- **Content Moderation**: Reported content queue, automated flagging
- **Site Analytics**: Registration trends, active users, system health
- **Configuration**: Site announcements, feature toggles, backups

**Implementation Notes:**
- Requires admin role in User model
- Protected routes with admin middleware
- Real-time dashboard with WebSocket updates
- Responsive design matching existing UI patterns

### **2. Real Messaging System** (HIGH PRIORITY)
Replace mock responses in `messageModal.js` with:
- **Backend**: Message/Conversation models, WebSocket integration
- **Frontend**: Persistent message history, typing indicators, file sharing
- **Database Schema**: Messages, Conversations, Participants collections
- **Real-time**: Socket.io for instant message delivery

**Current State**: Mock responses in `front/components/shared/messageModal.js`

### **3. Enhanced Community Features**
- User search and discovery improvements
- Interest-based matching system
- Achievement/badge system
- Community guidelines enforcement tools

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
- Consider rate limiting for spam prevention

### **Admin Dashboard**
- No admin role system yet (needs User model update)
- Requires secure authentication middleware
- Should include audit logging

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

1. **Choose Priority**: Admin dashboard OR messaging system
2. **Review Current Code**: Understand existing patterns and architecture
3. **Plan Implementation**: Database schema, API endpoints, frontend components
4. **Start Development**: Follow established patterns and update documentation

## 💡 **Development Philosophy**
- **User-First**: Every feature should enhance user experience
- **Modular Design**: Keep components reusable and maintainable
- **Documentation**: Update dev-log.md and relevant docs
- **Testing**: Test authentication flows and API endpoints thoroughly

---

**Ready to continue building this digital sanctuary for free thinkers!** 🌟

*Last updated: May 28, 2025 - Authentication & Profile System Fixes Complete* 