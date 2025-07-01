# Features.css Maintenance Guide

## Quick Reference

### Current Status (2025-06-30)
- **Standard Version**: v4.5
- **File Size**: 1,885 lines
- **Load Method**: Asynchronous (performance optimized)
- **All Pages Standardized**: ✅ YES

### Version Update Commands
```bash
# Update ALL pages at once (RECOMMENDED)
find /home/immortalal/sites/mlnf/front -name "*.html" -exec sed -i 's/features\.css?v=[0-9.]*/features.css?v=5.0/g' {} \;

# Verify all pages updated
grep -r "features\.css?v=" /home/immortalal/sites/mlnf/front --include="*.html" | cut -d: -f2 | sort | uniq
```

## Before Making Changes

### Pre-Change Checklist
- [ ] Note current version number across all pages
- [ ] Test current functionality on homepage
- [ ] Document what you're changing and why
- [ ] Plan version number increment

### Identify Impact
1. **Visual Changes**: Will affect all pages with highlight sections
2. **Responsive Design**: Will affect mobile/tablet users
3. **Interactive Features**: Will affect user experience

## Making Changes

### Safe Change Process
1. **Edit features.css** with your changes
2. **Update version in CSS header** (line 2-3)
3. **Bump version across ALL pages** simultaneously
4. **Test on homepage first** (has most features)
5. **Test responsive design** on mobile/tablet
6. **Commit and push** immediately

### Change Categories

#### High-Risk Changes (Require Extra Testing)
- `.highlights` base styles (affects all highlight sections)
- `.soul-highlight-card` styles (affects homepage cards)
- Responsive breakpoints (affects mobile users)
- Pseudo-elements (`::before`, `::after`)

#### Medium-Risk Changes
- Component-specific styles
- New feature additions
- Color/spacing adjustments

#### Low-Risk Changes
- Comments and documentation
- Unused code removal
- Code organization

## Testing Checklist

### Essential Tests After Changes
- [ ] **Homepage highlight sections** display correctly
- [ ] **Soul Scrolls top border** appears (gradient line)
- [ ] **Soul highlight cards** show colored top borders
- [ ] **Mobile responsive design** works (480px, 768px)
- [ ] **Other pages** with features.css still work

### Pages to Test
1. **index.html** - Homepage (most critical)
2. **pages/blog.html** - Blog features
3. **pages/messageboard.html** - Forum features
4. **lander.html** - Landing page
5. **Mobile view** - All above pages

## Troubleshooting

### "Changes Don't Appear"
1. **Check version numbers** - Are they bumped?
2. **Hard refresh browser** - Ctrl+Shift+R
3. **Verify file saves** - Git status should show changes
4. **Check CSS syntax** - Look for syntax errors

### "Features Work on Some Pages, Not Others"
- **Root Cause**: Version mismatch between pages
- **Solution**: Re-run the "update ALL pages" command
- **Prevention**: Always update all pages simultaneously

### "Mobile Layout Broken"
1. **Check responsive breakpoints** in features.css
2. **Test on actual mobile device**, not just browser tools
3. **Verify viewport meta tag** is present in HTML

## File Organization

### Major Sections (Line Numbers)
1. **Highlight Items & Debate** (1-143) - Core highlight styling
2. **Soul Scrolls** (144-569) - Blog/article highlights  
3. **Chronicles** (570-600) - News highlights
4. **Profile Systems** (657-914) - User profiles/avatars
5. **Echoes Unbound** (1099-1313) - **CRITICAL: Contains `.highlights::before`**
6. **Responsive Design** (1563-1885) - Mobile/tablet layouts

### Critical Rules to Never Break
- `.highlights::before` (lines 1119-1133) - Creates top gradient borders
- `.soul-highlight-card` (lines 1170+) - Homepage soul cards
- Responsive breakpoints at 480px and 768px

## Emergency Procedures

### Revert to Last Working Version
```bash
# Find last working version
git log --oneline | grep "features.css"

# Revert to specific commit
git checkout COMMIT_HASH -- css/features.css

# Update version numbers to force refresh
find /home/immortalal/sites/mlnf/front -name "*.html" -exec sed -i 's/features\.css?v=[0-9.]*/features.css?v=99.0/g' {} \;

# Commit emergency revert
git add . && git commit -m "emergency: revert features.css to working state" && git push origin main
```

### Cache Force Refresh
```bash
# Emergency cache bust - increment all versions by 1
current_version="4.5"
new_version="4.6"
find /home/immortalal/sites/mlnf/front -name "*.html" -exec sed -i "s/features\.css?v=$current_version/features.css?v=$new_version/g" {} \;
```

## Optimization Notes

### Performance Considerations
- **Asynchronous loading** prevents render blocking
- **File size** (1,885 lines) could be split but currently manageable
- **Critical CSS** should stay in styles.css, not features.css

### Future Improvements
1. **Split into smaller files** by component (highlight.css, soul-cards.css, responsive.css)
2. **Remove unused CSS** through audit process
3. **Automate version bumping** with build scripts
4. **Add CSS linting** to catch syntax errors

## Version History

### v4.5 (2025-06-30) - CURRENT
- Standardized across all pages
- Fixed Soul Scrolls top border issue
- Improved soul highlight card positioning
- Enhanced mobile responsive design

### v4.4 and below
- Version inconsistencies across pages
- Soul Scrolls missing top border
- Button alignment issues

---

**Remember**: features.css powers the enhanced user experience of MLNF. Handle with care, test thoroughly, and always update all pages simultaneously!

*Last updated: 2025-06-30*