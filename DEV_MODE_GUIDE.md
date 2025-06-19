# 🚀 MLNF Development Mode Guide

Welcome, apprentice! This guide will help you use the development mode to test your MLNF site locally.

## 🎯 What is Development Mode?

Development Mode lets you:
- Test changes live on internet after deploying
- Work offline without internet
- Debug issues more easily
- Switch between local and production APIs instantly

## 🛠️ Quick Start (3 Easy Steps)

### Step 1: Start Your Local Backend
```powershell
# In your MLNF folder, run:
.\start-local-backend.ps1
```

### Step 2: Open Your Page
Open any MLNF page in your browser (e.g., `front/pages/news.html`)

### Step 3: Enable Dev Mode
Either:
- Press `Ctrl+Shift+D` on your keyboard, OR
- Click the 🛠️ button in the bottom-right corner

That's it! You're now in dev mode! 🎉

## 📋 Dev Mode Features

### 1. The Dev Button (Bottom-Right)
- **🛠️ DEV** = Development mode active (using local backend)
- **🛠️ PROD** = Production mode (using live Render backend)

### 2. Dev Panel Options
Click the dev button to see options:
- **Enable Dev Mode**: Toggle between local/production
- **API Endpoint**: Choose which backend to use
- **Debug Logging**: See detailed console messages
- **Mock Authentication**: Skip login for testing

### 3. Visual Indicators
- Red "DEV MODE" banner at the top when active
- Dev button changes color (red = dev, dark = prod)

## 🎮 Keyboard Shortcuts

- `Ctrl+Shift+D` - Toggle dev mode on/off
- `Ctrl+Shift+L` - Toggle debug logging

## 🔍 Troubleshooting

### "Failed to connect" error?
1. Make sure local backend is running (`.\start-local-backend.ps1`)
2. Check the dev panel - it shows connection status
3. Try switching back to production mode

### Modal not opening?
1. Check browser console (F12) for errors
2. Try refreshing the page (F5)
3. Clear browser cache (Ctrl+Shift+Delete)

### Changes not showing?
1. Hard refresh the page (Ctrl+F5)
2. Make sure you saved your files
3. Check you're in the right mode (dev vs prod)

## 💡 Pro Tips

1. **Always test live after deployment** - Monitor changes on the live site immediately
2. **Use debug logging** - It helps identify issues quickly
3. **Mock auth for testing** - Saves time when testing logged-in features
4. **Check the status indicator** - Green ✓ = connected, Red ✗ = offline

## 🚨 Common Mistakes to Avoid

1. **Don't commit dev mode enabled** - Always test in production mode before pushing
2. **Don't use mock auth in production** - It's only for local testing
3. **Don't forget to start the backend** - The local server must be running

## 📝 Example Workflow

1. Make changes to your code
2. Start local backend: `.\start-local-backend.ps1`
3. Open page in browser
4. Press `Ctrl+Shift+D` to enable dev mode
5. Test your changes
6. Press `Ctrl+Shift+D` to switch back to production
7. Verify everything still works
8. Commit and push your changes

## 🆘 Need Help?

- Check the browser console (F12) for error messages
- The dev panel shows connection status
- Look for the console messages starting with `[MLNF`

Remember: You're learning! It's okay to make mistakes. The dev mode is here to help you experiment safely.

Happy coding! 🌟 