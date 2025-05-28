# CSS Implementation Checklist

## 🔧 New Page CSS Template

### **Required CSS Loading Order (Copy-Paste Ready)**

```html
<!-- STEP 1: REQUIRED CORE STYLESHEETS (exact order) -->
<link rel="stylesheet" href="../css/base-theme.css">
<link rel="stylesheet" href="../css/styles.css">

<!-- STEP 2: SHARED COMPONENT STYLES -->
<link rel="stylesheet" href="../components/shared/styles.css?v=1.2">

<!-- STEP 3: PAGE-SPECIFIC STYLES (if needed) -->
<link rel="stylesheet" href="../css/[page-name].css">

<!-- STEP 4: EXTERNAL LIBRARIES (Font Awesome, etc.) -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

### **Path Adjustments by Location**
- **Root level** (`index.html`, `lander.html`): Use `css/` 
- **Pages folder** (`pages/*.html`): Use `../css/`
- **Souls folder** (`souls/*.html`): Use `../css/`
- **Profile folder** (`profile/*.html`): Use `../css/`

## ✅ Pre-Launch Validation Checklist

### **CSS Loading Verification**
- [ ] `base-theme.css` loads first (contains CSS variables)
- [ ] `styles.css` loads second (contains core layout)
- [ ] `shared/styles.css` loads third (contains component styles)
- [ ] Page-specific CSS loads last
- [ ] All paths are correct for file location
- [ ] Cache-busting version numbers added (`?v=1.2`)

### **Header Structure Verification**
- [ ] Uses `title-stack` structure for responsive title
- [ ] Includes `<a href="/">` wrapper around logo
- [ ] Has `main-nav` with `<ul></ul>` for navigation.js
- [ ] Includes `user-menu` container for userMenu.js
- [ ] Has mobile navigation toggle button

### **Component Integration Verification**
- [ ] Active users sidebar included (`id="activeUsers"`)
- [ ] Message modal included (`id="messageModal"`)
- [ ] User sidebar included (if needed)
- [ ] All required script tags loaded in correct order

### **Script Loading Verification**
- [ ] `config.js` loads first
- [ ] `mlnf-core.js` loads before other components
- [ ] Component scripts load in dependency order
- [ ] Page-specific scripts load last

## 🚨 Common Pitfalls & Solutions

### **Problem: Styles Not Loading**
**Symptoms:** Page appears unstyled, no background, broken layout
**Solution:** Check CSS loading order, ensure `styles.css` is included

### **Problem: Navigation Not Working**
**Symptoms:** Empty navigation, console errors about UL not found
**Solution:** Ensure `<nav class="main-nav"><ul></ul></nav>` structure

### **Problem: Components Not Functioning**
**Symptoms:** Modals don't open, sidebars don't work
**Solution:** Check script loading order, ensure all dependencies loaded

### **Problem: Mobile Layout Broken**
**Symptoms:** Title doesn't collapse, navigation doesn't work on mobile
**Solution:** Verify `title-stack` structure and mobile navigation setup

## 🔍 CSS Validation Script

### **Quick Validation Commands**
```bash
# Check if all pages have required CSS files
grep -r "base-theme.css" front/ --include="*.html"
grep -r "styles.css" front/ --include="*.html"

# Find pages missing shared component styles
grep -L "shared/styles.css" front/**/*.html

# Check for hardcoded colors (should use CSS variables)
grep -r "#[0-9a-fA-F]\{6\}" front/css/ --include="*.css"
```

### **Browser Console Validation**
```javascript
// Run in browser console to check CSS loading
console.log('CSS Files Loaded:');
Array.from(document.styleSheets).forEach(sheet => {
  try {
    console.log(sheet.href || 'Inline styles');
  } catch(e) {
    console.log('External stylesheet (CORS blocked)');
  }
});

// Check for CSS variables availability
console.log('CSS Variables Available:', 
  getComputedStyle(document.documentElement).getPropertyValue('--primary')
);
```

## 📋 Component Dependency Matrix

### **Required for All Pages**
- `base-theme.css` - CSS variables
- `styles.css` - Core layout
- `config.js` - Configuration
- `mlnf-core.js` - Core initialization

### **Required for Interactive Pages**
- `shared/styles.css` - Component styles
- `navigation.js` - Navigation functionality
- `userMenu.js` - User menu functionality

### **Optional Components**
- `activeUsers.js` + `active-users.css` - Active users sidebar
- `messageModal.js` - Direct messaging
- `authModal.js` - Authentication modal
- `user-sidebar.js` - User profile sidebar

## 🎯 Quality Gates

### **Before Committing Code**
1. **Visual Check:** Page loads with proper styling
2. **Console Check:** No CSS-related errors in browser console
3. **Mobile Check:** Responsive design works on mobile
4. **Component Check:** All interactive elements function

### **Before Deploying**
1. **Cross-page Check:** Verify changes don't break other pages
2. **Performance Check:** CSS files load efficiently
3. **Accessibility Check:** Proper contrast and focus states
4. **Browser Check:** Works in major browsers

## 🔄 Maintenance Schedule

### **Weekly**
- [ ] Check for new pages missing CSS requirements
- [ ] Validate CSS variable usage consistency
- [ ] Review component integration across pages

### **Monthly**
- [ ] Audit CSS file sizes and optimization opportunities
- [ ] Update cache-busting version numbers
- [ ] Review and update this checklist based on new patterns

### **Per Release**
- [ ] Full CSS validation across all pages
- [ ] Performance audit of CSS loading
- [ ] Documentation updates for new components

---

## 🚀 Quick Start for New Pages

1. **Copy CSS template** from this checklist
2. **Adjust paths** based on file location
3. **Add page-specific CSS** if needed
4. **Test with validation checklist**
5. **Commit and deploy**

---
*Last updated: Phase 3 Complete*
*Next: Apply fixes to remaining pages* 