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

## Auto-Push Reminder
After completing any task involving file changes, Claude must:
1. Run git status to verify changes
2. Add, commit, and push all changes
3. Confirm successful deployment

This ensures continuous deployment and prevents work loss.