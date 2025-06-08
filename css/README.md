# MLNF CSS Architecture Documentation

> **📚 For complete CSS documentation, see [../docs/CSS-GUIDE.md](../docs/CSS-GUIDE.md)**  
> *This file provides quick reference for developers working directly in the CSS folder.*

## 📋 CSS File Inventory

### **Core Stylesheets (Required Order)**
1. **`base-theme.css`** - CSS Variables & Theme Foundation
   - Contains all CSS custom properties (--primary, --secondary, etc.)
   - Must load FIRST on every page
   - No actual styling, only variable definitions

2. **`styles.css`** - Main Layout & Core Components
   - Body, header, navigation, footer styles
   - Button styles, form elements, typography
   - Grid systems, responsive breakpoints
   - **CRITICAL**: Must load after base-theme.css

3. **`components/shared/styles.css`** - Shared Component Styles
   - Modal styles, sidebar styles, user menu
   - Active users panel, message components
   - Component-specific responsive behavior

### **Page-Specific Stylesheets**
- `souls-listing.css` - Profile cards, search bar, grid layout
- `active-users.css` - Active users sidebar styling
- `blog.css` - Blog post layout and forms
- `profile-setup.css` - Profile setup form styling
- `messageboard.css` - Message board and thread styling

### **Current Page CSS Usage Matrix**

| Page | base-theme | styles | shared/styles | Page-specific | Status |
|------|------------|--------|---------------|---------------|---------|
| `souls/index.html` | ✅ | ✅ | ✅ | souls-listing.css | ✅ Fixed |
| `pages/blog.html` | ✅ | ✅ | ✅ | blog.css | ✅ Fixed |
| `pages/profile-setup.html` | ✅ | ✅ | ✅ | profile-setup.css | ✅ Fixed |
| `pages/messageboard.html` | ✅ | ✅ | ✅ | messageboard.css | ✅ Fixed |
| `index.html` | ✅ | ✅ | ? | ? | 🔍 Needs component audit |
| `lander.html` | ✅ | ✅ | ? | ? | 🔍 Needs component audit |
| `profile/index.html` | ? | ? | ? | ? | 🔍 Needs full audit |

## 🚨 Critical Issues Found & Fixed

### **Root Cause of Recent Styling Problems**
- **Missing `styles.css`** on multiple pages
- Pages had `base-theme.css` (variables only) but no actual layout styles
- Result: No body styling, header formatting, or component layouts

### **Prevention Checklist**
Every new page MUST include this exact CSS loading order:
```html
<!-- REQUIRED CORE (exact order) -->
<link rel="stylesheet" href="../css/base-theme.css">
<link rel="stylesheet" href="../css/styles.css">
<!-- SHARED COMPONENTS -->
<link rel="stylesheet" href="../components/shared/styles.css?v=1.2">
<!-- PAGE SPECIFIC (if needed) -->
<link rel="stylesheet" href="../css/[page-name].css">
```

## 📐 CSS Architecture Rules

### **File Naming Convention**
- `base-theme.css` - Variables only
- `styles.css` - Core layout (never rename)
- `[page-name].css` - Page-specific styles
- `[component-name].css` - Component-specific styles

### **CSS Variable Usage**
All colors, spacing, and theme values MUST use CSS variables from `base-theme.css`:
```css
/* ✅ CORRECT */
background: var(--primary);
color: var(--text);

/* ❌ WRONG */
background: #0d0d1a;
color: #f0e6ff;
```

### **Responsive Design Pattern**
Mobile-first approach with consistent breakpoints:
```css
/* Mobile first */
.component { }

/* Tablet */
@media (min-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }
```

## 🔧 Next Steps
1. ✅ Audit remaining pages (index.html, lander.html, profile/index.html)
2. ⏳ Fix any missing CSS references
3. ⏳ Create CSS validation script
4. ⏳ Document component dependencies

---
*Last updated: $(date)*
*Status: Phase 1 Complete - Inventory & Critical Fixes* 