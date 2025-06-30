# MLNF Versioning Guide - THE GOLDEN RULE

## 🚨 CRITICAL VERSIONING RULE 🚨

> **MANDATORY: ALWAYS bump version numbers when modifying files with ?v= parameters**

**This is the #1 cause of "changes don't appear" issues in MLNF development.**

## 📋 Files That REQUIRE Version Bumps

### CSS Files
```html
<!-- Main Styles -->
<link rel="stylesheet" href="css/styles.css?v=2.3">

<!-- Shared Components -->  
<link rel="stylesheet" href="components/shared/styles.css?v=5.0">

<!-- Page-specific -->
<link rel="stylesheet" href="css/features.css?v=2.3">
<link rel="stylesheet" href="css/active-users.css?v=2.0">
```

### JavaScript Files
```html
<!-- Core Scripts -->
<script src="js/main.js?v=2.0"></script>
<script src="js/mlnf-avatar-system.js?v=2.0"></script>

<!-- Shared Components -->
<script src="components/shared/messageModal.js?v=1.3"></script>
<script src="components/shared/authManager.js?v=1.3"></script>
<script src="components/shared/mlnf-core.js?v=1.3"></script>
```

## ⚡ When to Bump Versions

### ALWAYS Bump When You:
- ✅ **Modify CSS**: Any styling, layout, responsive design changes
- ✅ **Change JavaScript**: Functions, event handlers, API calls, UI behavior
- ✅ **Add Features**: New buttons, modals, forms, interactions
- ✅ **Fix Bugs**: Any code modification affecting user experience
- ✅ **Update Content**: Even small text changes in versioned files
- ✅ **Remove Features**: Like removing anonymous messaging
- ✅ **Refactor Code**: Even if functionality appears unchanged

### Examples from MLNF Development:
```bash
# Mobile modal optimization → styles.css v2.3 to v5.0
# Anonymous messaging removal → main.js v1.3 to v2.0
# Authentication changes → messageModal.js v1.2 to v1.3
```

## 🛠️ How to Bump Versions

### Quick Commands
```bash
# CSS Changes - Bump main styles
sed -i 's/styles.css?v=[0-9.]*/styles.css?v=6.0/g' /home/immortalal/sites/mlnf/front/index.html

# JavaScript Changes - Bump main.js
sed -i 's/main.js?v=[0-9.]*/main.js?v=3.0/g' /home/immortalal/sites/mlnf/front/index.html

# Shared Components - Bump shared styles
sed -i 's/shared\/styles.css?v=[0-9.]*/shared\/styles.css?v=6.0/g' /home/immortalal/sites/mlnf/front/index.html

# Multiple file updates
find /home/immortalal/sites/mlnf/front -name "*.html" -exec sed -i 's/messageModal.js?v=[0-9.]*/messageModal.js?v=2.0/g' {} \;
```

### Manual Method
1. Open the HTML file containing the reference
2. Find the line with the file you modified
3. Update the version number (e.g., `v=1.3` → `v=2.0`)
4. Save and commit

## 📊 Version Number Strategy

### Recommended Versioning:
- **Major Changes**: Increment whole number (`v=1.3` → `v=2.0`)
- **Minor Changes**: Increment decimal (`v=2.0` → `v=2.1`)
- **Emergency Fixes**: Add patch (`v=2.1` → `v=2.1.1`)

### Current MLNF Versions (as of 2025-06-30):
```
CSS:
- css/styles.css → v=2.3
- components/shared/styles.css → v=5.0 (mobile optimization)
- css/features.css → v=2.3

JavaScript:  
- js/main.js → v=2.0 (authentication changes)
- js/mlnf-avatar-system.js → v=2.0
- components/shared/messageModal.js → v=1.3
```

## ⚠️ Consequences of Not Versioning

### What Happens Without Version Bumps:
- **Users see cached old code**: Browser loads old version from cache
- **"Changes don't work"**: New functionality invisible to users
- **Inconsistent experience**: Some users see new, others see old
- **Development confusion**: "It works on my machine" scenarios
- **Lost time debugging**: Hours spent troubleshooting cache issues
- **User frustration**: Broken or inconsistent site behavior

### Real Examples from MLNF:
1. **Mobile modal fixes**: Didn't work until CSS version bumped
2. **Anonymous messaging removal**: Invisible until JS version bumped
3. **Authentication changes**: Cached until main.js version updated

## 🔄 Development Workflow with Versioning

### The Correct Process:
```bash
# 1. Make your changes
vim /home/immortalal/sites/mlnf/front/css/styles.css

# 2. IMMEDIATELY bump version
sed -i 's/styles.css?v=[0-9.]*/styles.css?v=6.0/g' /home/immortalal/sites/mlnf/front/index.html

# 3. Commit everything together
git add .
git commit -m "fix: improve mobile layout and bump CSS version"
git push origin main

# 4. Test on live site
```

### Integration with Git Workflow:
1. **Modify files** (CSS, JS, etc.)
2. **Bump versions FIRST** (before committing)
3. **Git add all changes** (including version bumps)
4. **Commit with descriptive message** (mention version bump)
5. **Push immediately**
6. **Test on live site**

## 🎯 Quick Reference Checklist

Before every commit, ask yourself:
- [ ] Did I modify any CSS files? → Bump CSS versions
- [ ] Did I modify any JavaScript files? → Bump JS versions  
- [ ] Did I add/remove features? → Bump relevant file versions
- [ ] Did I fix bugs in existing code? → Bump affected file versions
- [ ] Are all version numbers updated in HTML files?
- [ ] Will users see my changes immediately after deployment?

## 🚨 Emergency Version Bump

If you forgot to bump versions and changes aren't visible:

```bash
# Emergency cache bust - bump ALL versions
find /home/immortalal/sites/mlnf/front -name "*.html" -exec sed -i 's/\.css?v=[0-9.]*/\.css?v=99.0/g' {} \;
find /home/immortalal/sites/mlnf/front -name "*.html" -exec sed -i 's/\.js?v=[0-9.]*/\.js?v=99.0/g' {} \;

git add .
git commit -m "emergency: force cache refresh with version bump"
git push origin main
```

## 📚 Learning from MLNF History

### Major Versioning Milestones:
- **CSS v5.0**: Mobile modal optimization breakthrough
- **main.js v2.0**: Authentication requirement for soul messaging
- **styles.css v2.3**: Responsive design perfection

### Lessons Learned:
1. **Tupac was right**: "I see no changes" when versions aren't bumped
2. **Cache is persistent**: Browsers aggressively cache versioned files
3. **Version bumping is not optional**: It's a critical development step
4. **Prevention is easier**: Bump versions proactively, not reactively

---

## 🌟 The Golden Rule Summary

> **Every code change MUST include a version bump for affected files**

**Remember**: Version bumping is not a "nice to have" - it's a **mandatory step** that ensures your hard work is actually visible to users.

**Make versioning automatic**: Include it in every development workflow, every commit, every deployment.

**When in doubt**: Bump the version. It's better to over-version than under-version.

---

*This guide exists because we learned the hard way. Don't repeat our mistakes!*

*Last updated: 2025-06-30*  
*Current status: Versioning discipline established* ✅