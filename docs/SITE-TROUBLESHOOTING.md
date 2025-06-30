# MLNF Site Troubleshooting Guide

## 🎉 Success Story
After extensive development and optimization, MLNF now works flawlessly across all devices and features! This comprehensive guide helps troubleshoot any issues you might encounter across the entire site.

## Common Site-Wide Issues & Solutions

### 1. 🎨 Changes Don't Reflect / CSS Not Updating

**Problem:** Made CSS changes but don't see them on the website
**Most Likely Cause:** CSS versioning/caching issue

**🚨 THE #1 RULE: ALWAYS BUMP VERSION NUMBERS 🚨**
**If you modify ANY file with ?v= parameter, you MUST update the version number!**

**Affected Areas:** All pages, styling, layout, responsiveness

**Solutions:**
1. **Check CSS Version Numbers**
   ```bash
   # Look for version numbers in HTML files  
   grep -r "\.css?v=" /home/immortalal/sites/mlnf/front/
   ```
   - Main styles: `styles.css?v=2.3` or higher
   - Shared components: `components/shared/styles.css?v=5.0` or higher
   - Page-specific: various version numbers

2. **Force Browser Cache Refresh**
   - **Hard Refresh:** Ctrl+Shift+R (PC) or Cmd+Shift+R (Mac)
   - **Chrome:** Hold refresh button → "Empty Cache and Hard Reload"
   - **Mobile:** Clear browser cache or try incognito/private mode
   - **Firefox:** Ctrl+F5 or Settings → Privacy → Clear Data

3. **Bump CSS Versions** (systematic approach)
   ```bash
   # Find all CSS version references
   find /home/immortalal/sites/mlnf/front -name "*.html" -exec grep -l "\.css?v=" {} \;
   
   # Update main styles version
   sed -i 's/styles.css?v=[0-9.]*/styles.css?v=6.0/g' /home/immortalal/sites/mlnf/front/index.html
   
   # Update shared components version  
   sed -i 's/shared\/styles.css?v=[0-9.]*/shared\/styles.css?v=6.0/g' /home/immortalal/sites/mlnf/front/index.html
   
   git add . && git commit -m "bump CSS versions for cache refresh" && git push origin main
   ```

### 2. 🚫 Page Not Loading / 404 Errors

**Problem:** Specific pages return 404 or fail to load
**Common Causes:** Missing files, incorrect paths, deployment issues

**Diagnosis:**
```bash
# Check if file exists
ls -la /home/immortalal/sites/mlnf/front/pages/[pagename].html

# Check for recent deletions
git log --oneline --follow -- pages/[pagename].html

# Verify file structure
find /home/immortalal/sites/mlnf/front -name "*.html" | sort
```

**Solutions:**
1. **Restore Missing Files**
   ```bash
   git checkout HEAD~1 -- pages/[pagename].html
   git add . && git commit -m "restore missing page" && git push origin main
   ```

2. **Fix Corrupted Files** (like soul-scrolls.html)
   ```bash
   # Check file size and content
   wc -c /home/immortalal/sites/mlnf/front/pages/soul-scrolls.html
   file /home/immortalal/sites/mlnf/front/pages/soul-scrolls.html
   
   # If corrupted, recreate from template
   cp /home/immortalal/sites/mlnf/front/templates/page-template.html /home/immortalal/sites/mlnf/front/pages/soul-scrolls.html
   ```

### 3. ⚡ JavaScript Features Not Working  

**Problem:** Interactive features broken (modals, forms, dynamic content)
**Affected Areas:** Message modal, user authentication, form submissions, real-time features

**Diagnosis:**
1. **Check Browser Console** (F12 → Console tab)
   - Look for red error messages
   - Check for failed network requests
   - Verify JavaScript files are loading

2. **Test Core Components**
   ```javascript
   // In browser console
   console.log('MLNF object:', window.MLNF);
   console.log('jQuery loaded:', typeof $);
   console.log('WebSocket available:', !!window.WebSocket);
   ```

**Solutions:**
1. **Fix JavaScript Loading Order**
   ```html
   <!-- Correct loading sequence in HTML -->
   <!-- 1. Core libraries first -->
   <script src="js/main.js"></script>
   <!-- 2. Shared components -->  
   <script src="components/shared/mlnf-core.js"></script>
   <!-- 3. Feature-specific scripts -->
   <script src="components/shared/messageModal.js"></script>
   ```

2. **Check for CORS Issues**
   ```bash
   # Verify API endpoints are accessible
   curl -I https://api.mlnf.net/status
   ```

### 4. 📱 Mobile Responsiveness Issues

**Problem:** Site looks broken on mobile devices
**Common Issues:** Layout overflow, buttons too small, text unreadable

**Diagnosis:**
```javascript
// Check viewport and screen dimensions
console.log('Screen:', screen.width, 'x', screen.height);
console.log('Window:', window.innerWidth, 'x', window.innerHeight);
console.log('Device pixel ratio:', window.devicePixelRatio);
```

**Solutions:**
1. **Test Responsive Breakpoints**
   - Desktop: 1024px+
   - Tablet: 768px - 1023px  
   - Mobile: 480px - 767px
   - Small Mobile: < 480px

2. **Force Mobile View** (for testing)
   ```css
   /* Add temporarily to CSS */
   @media (min-width: 0px) {
       /* Mobile styles here */
   }
   ```

### 5. 🔐 Authentication Issues

**Problem:** Can't log in, sessions expiring, user data not loading
**Areas Affected:** Login modal, user menu, protected content

**Diagnosis:**
```javascript
// Check authentication state
console.log('Session token:', localStorage.getItem('sessionToken'));
console.log('User data:', localStorage.getItem('user'));
console.log('Auth manager:', window.MLNF?.authManager);
```

**Solutions:**
1. **Clear Stored Auth Data**
   ```javascript
   localStorage.removeItem('sessionToken');
   localStorage.removeItem('user');
   location.reload();
   ```

2. **Check API Connectivity**
   ```bash
   # Test authentication endpoint
   curl -X POST https://api.mlnf.net/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"test"}'
   ```

### 6. 🌐 Deployment Issues

**Problem:** Changes deployed but not reflecting on live site
**Causes:** CDN caching, build process issues, file permissions

**Solutions:**
1. **Verify Deployment Status**
   ```bash
   # Check latest commit matches live site
   git log --oneline -3
   
   # Check if files were actually deployed
   curl -I https://mlnf.net/css/styles.css
   ```

2. **Force CDN Cache Clear**
   - If using Cloudflare: Caching → Purge Everything
   - If using Netlify: Deploys → Trigger Deploy
   - Manual: Add timestamp to CSS versions

### 7. 🎭 Content Management Issues

**Problem:** Blog posts, news, or dynamic content not displaying
**Areas:** News feed, blog posts, user-generated content

**Diagnosis:**
```bash
# Check content files exist
ls -la /home/immortalal/sites/mlnf/front/pages/
ls -la /home/immortalal/sites/mlnf/front/souls/

# Check for API connectivity
curl https://api.mlnf.net/news/latest
```

### 8. 🎯 Performance Issues

**Problem:** Site loading slowly, laggy interactions, high memory usage
**Common Causes:** Large images, too many animations, memory leaks, inefficient code

**Diagnosis:**
1. **Check Performance Metrics**
   ```javascript
   // In browser console
   console.log('Performance:', performance.timing);
   console.log('Memory:', performance.memory);
   ```

2. **Analyze Network Usage**
   - F12 → Network tab
   - Look for large files or slow requests
   - Check for failed requests (red status codes)

**Solutions:**
1. **Optimize Images**
   ```bash
   # Find large image files
   find /home/immortalal/sites/mlnf/front -name "*.jpg" -o -name "*.png" | xargs ls -lh | sort -k5 -hr
   
   # Compress if needed
   # Use tools like imagemin or online compressors
   ```

2. **Disable Animations** (for testing)
   ```css
   /* Add temporarily to identify animation issues */
   * { 
       transition: none !important; 
       animation: none !important; 
   }
   ```

3. **Check for Memory Leaks**
   - F12 → Memory tab → Take heap snapshot
   - Compare before/after using features
   - Look for increasing memory usage

### 9. 🔌 WebSocket/Real-time Features Issues

**Problem:** Live messaging, notifications, or real-time updates not working
**Affected Features:** Message notifications, active users, live updates

**Diagnosis:**
```javascript
// Check WebSocket connection
console.log('WebSocket support:', !!window.WebSocket);
console.log('MLNF WebSocket:', window.MLNF?.websocket);
console.log('Connection state:', window.MLNF?.websocket?.ws?.readyState);
```

**Solutions:**
1. **Check WebSocket URL**
   ```javascript
   // Verify correct WebSocket endpoint
   const ws = new WebSocket('wss://api.mlnf.net/ws');
   ws.onopen = () => console.log('WebSocket connected');
   ws.onerror = (err) => console.log('WebSocket error:', err);
   ```

2. **Test Network Connectivity**
   ```bash
   # Check if WebSocket endpoint is accessible
   curl -I https://api.mlnf.net/
   ```

### 10. 🖼️ Image Loading Issues

**Problem:** Images not displaying, broken image icons, slow loading
**Common Files:** Avatars, background images, icons, uploaded content

**Diagnosis:**
```bash
# Check if image files exist
ls -la /home/immortalal/sites/mlnf/front/assets/images/
ls -la /home/immortalal/sites/mlnf/front/favicon.*

# Check image permissions
stat /home/immortalal/sites/mlnf/front/assets/images/default.jpg
```

**Solutions:**
1. **Fix Missing Images**
   ```bash
   # Restore default images
   git checkout HEAD -- assets/images/
   
   # Check for correct paths in HTML/CSS
   grep -r "assets/images" /home/immortalal/sites/mlnf/front/
   ```

2. **Optimize Image Loading**
   ```html
   <!-- Add loading optimization -->
   <img src="image.jpg" loading="lazy" alt="Description">
   ```

## 🛠️ Quick Diagnostic Commands

### Site Health Check
```bash
# Check all CSS versions across site
grep -r "\.css?v=" /home/immortalal/sites/mlnf/front/ | grep -v ".git"

# Verify all HTML pages exist and aren't corrupted
find /home/immortalal/sites/mlnf/front -name "*.html" -exec wc -c {} \; | sort -n

# Check for recent changes
git log --oneline -10

# Verify file structure integrity
ls -la /home/immortalal/sites/mlnf/front/{pages,components,css,js}/

# Test live site connectivity
curl -I https://mlnf.net
curl -I https://api.mlnf.net
```

### Force Deployment
```bash
# Emergency deployment with cache busting
find /home/immortalal/sites/mlnf/front -name "*.html" -exec sed -i 's/\.css?v=[0-9.]*/\.css?v=99.0/g' {} \;
git add . && git commit -m "emergency cache bust" && git push origin main
```

### File Recovery
```bash
# Restore missing or corrupted files
git status  # See what's missing
git checkout HEAD~1 -- path/to/missing/file.html
git checkout HEAD -- .  # Restore everything to last commit

# Find and fix corrupted files
find /home/immortalal/sites/mlnf/front -name "*.html" -size -100c  # Files smaller than 100 bytes
```

## 🌐 Browser Console Debug Commands

### General Site Diagnostics
```javascript
// Check core functionality
console.log('MLNF object:', window.MLNF);
console.log('jQuery:', typeof $);
console.log('Current page:', window.location.pathname);

// Check responsive breakpoints
console.log('Screen:', screen.width + 'x' + screen.height);
console.log('Window:', window.innerWidth + 'x' + window.innerHeight);
console.log('Device pixel ratio:', window.devicePixelRatio);

// Check authentication state
console.log('User logged in:', !!localStorage.getItem('sessionToken'));
console.log('User data:', JSON.parse(localStorage.getItem('user') || 'null'));

// Test API connectivity
fetch('https://api.mlnf.net/status')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Feature-Specific Tests
```javascript
// Test modal functionality
window.MLNF?.openMessageModal?.('TestUser');

// Test WebSocket connection
console.log('WebSocket state:', window.MLNF?.websocket?.ws?.readyState);

// Test authentication
window.MLNF?.authManager?.checkAuthStatus?.();

// Test real-time features
window.MLNF?.websocket?.sendTypingIndicator?.('TestUser', true);
```

### Performance Diagnostics
```javascript
// Check loading performance
console.log('Page load time:', performance.timing.loadEventEnd - performance.timing.navigationStart, 'ms');

// Check memory usage (Chrome only)
if (performance.memory) {
    console.log('Memory usage:', performance.memory);
}

// Find slow elements
console.time('DOM ready');
document.addEventListener('DOMContentLoaded', () => console.timeEnd('DOM ready'));
```

## 🚨 Emergency Reset Procedures

### Level 1: Soft Reset (Cache Issues)
```bash
# Just clear cache and update versions
find /home/immortalal/sites/mlnf/front -name "*.html" -exec sed -i 's/styles\.css?v=[0-9.]*/styles.css?v=6.0/g' {} \;
git add . && git commit -m "bump CSS versions" && git push origin main
```

### Level 2: Component Reset (Feature Broken)
```bash
# Reset specific components to last working state
git log --oneline -- components/shared/messageModal.js
git checkout WORKING_COMMIT -- components/shared/messageModal.js
git add . && git commit -m "restore working modal" && git push origin main
```

### Level 3: Full Reset (Site Broken)
```bash
# Find last known working commit
git log --oneline -20

# Reset to specific commit (DANGER: loses recent work)
git reset --hard WORKING_COMMIT_HASH
git push --force origin main

# Or create a revert commit (safer)
git revert BAD_COMMIT_HASH
git push origin main
```

## 🛡️ Prevention & Best Practices

### Before Making Changes
1. **Create backup branch**: `git checkout -b backup-$(date +%Y%m%d)`
2. **Test locally first**: Use dev tools responsive mode
3. **Check browser console**: Ensure no existing errors
4. **Document version numbers**: Note current CSS versions

### During Development
1. **Commit frequently**: Small, focused commits
2. **Test incrementally**: Don't change everything at once
3. **Use descriptive commit messages**: Include what was changed
4. **Version your CSS changes**: Bump version numbers

### After Deployment
1. **Test immediately**: Check live site in multiple browsers
2. **Monitor for 24 hours**: Watch for user reports or errors
3. **Keep rollback plan ready**: Know how to revert quickly
4. **Document what was changed**: Update this troubleshooting guide

### Cross-Browser Testing Checklist
- ✅ Chrome (desktop & mobile)
- ✅ Firefox (desktop & mobile)  
- ✅ Safari (desktop & mobile)
- ✅ Edge (desktop)
- ✅ Various screen sizes (320px to 1920px)

## 📞 Escalation Path

When troubleshooting fails:

1. **Document the issue**: Screenshots, error messages, steps to reproduce
2. **Check this guide**: Ensure you've tried relevant solutions
3. **Test on multiple devices**: Isolate if it's device-specific
4. **Check recent commits**: `git log --oneline -10`
5. **Consider rollback**: If urgent, revert to last working state
6. **Search commit history**: Look for similar issues that were fixed

## 📝 Common File Locations

```bash
# Key configuration files
/home/immortalal/sites/mlnf/front/index.html           # Main page
/home/immortalal/sites/mlnf/front/components/shared/   # Shared components
/home/immortalal/sites/mlnf/front/css/                 # Stylesheets
/home/immortalal/sites/mlnf/front/js/                  # JavaScript files
/home/immortalal/sites/mlnf/front/pages/               # Individual pages

# Important config files
/home/immortalal/sites/mlnf/front/CLAUDE.md           # Development instructions
/home/immortalal/sites/mlnf/front/package.json        # Dependencies
/home/immortalal/sites/mlnf/front/_redirects          # URL redirects
```

---

*Last updated: 2025-06-30*  
*Current stable version: CSS v5.0, Shared Components v5.0*  
*Site status: Fully optimized and responsive across all devices* 🎉