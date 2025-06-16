# MLNF Development Instructions for Claude

## Critical Git Workflow

**ALWAYS follow this sequence after making ANY code changes:**

1. **Test changes locally** (if applicable)
2. **Git add all changes**: `git add .`
3. **Git commit with descriptive message**: `git commit -m "type: description"`
4. **Git push immediately**: `git push origin main`

**NEVER skip the push step** - all changes must be deployed to Netlify immediately.

## Commit Message Format
- `feat: description` - New features
- `fix: description` - Bug fixes  
- `update: description` - Updates to existing features
- `style: description` - CSS/styling changes
- `refactor: description` - Code restructuring
- `docs: description` - Documentation updates

## Development Best Practices

### Architecture-First Development
- **Always audit existing systems** before making any changes
- **Understand CSS dependencies** - know which CSS files load on which pages
- **Test across multiple page types** for site-wide features
- **Never assume existing patterns** - always verify current implementation

### Online Status System Notes
- Online status styles MUST be in `styles.css` (global) not component-specific CSS
- Avatar system creates DOM elements, not HTML strings
- Test avatar functionality across: Active Users, Comments, Blog, Profiles, Souls Directory

### CSS Architecture Awareness
- `styles.css` - Global styles, loaded on ALL pages
- `components/shared/styles.css` - Shared components, loaded on MOST pages  
- `active-users.css` - Component-specific, loaded only where needed
- Page-specific CSS - loaded only on individual pages

### Cross-Site Feature Development
1. Map which pages will use the feature
2. Ensure required CSS files are loaded on those pages
3. Test functionality on multiple page types
4. Verify integration points work consistently

## Auto-Push Reminder
After completing any task involving file changes, Claude must:
1. Run git status to verify changes
2. Add, commit, and push all changes
3. Confirm successful deployment

This ensures continuous deployment and prevents work loss.