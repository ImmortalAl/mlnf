# 🌟 Beginner's Guide to Local Testing - MLNF

Welcome! This guide explains **everything** you need to know about running your website locally for testing.

## 🤔 Why Do I Need a Local Server?

Think of it like this:
- **Website files** = Your HTML, CSS, JavaScript files
- **Web Browser** = Needs to "serve" these files properly
- **Local Server** = A mini web server running on your computer

### The Problem:
When you double-click an HTML file, it opens as `file:///C:/...` which:
- ❌ Can't load CSS/JS files with relative paths
- ❌ Can't make API calls
- ❌ Breaks most modern web features

### The Solution:
A local server serves files as `http://localhost:8080` which:
- ✅ Loads all files correctly
- ✅ Allows API calls
- ✅ Works exactly like a real website

## 🚀 Quick Start (Choose One Method)

### **Method 1: Use Our Script (Recommended)**
```powershell
# In your MLNF folder, run:
.\start-frontend-server.ps1
```
Then open: `http://localhost:8080/pages/news.html`

### **Method 2: Manual Python Server**
```powershell
# Navigate to frontend folder
cd front
# Start server
python -m http.server 8080
```
Then open: `http://localhost:8080/pages/news.html`

### **Method 3: Visual Studio Code (If You Have It)**
1. Install "Live Server" extension
2. Right-click `news.html` → "Open with Live Server"

## 📋 Complete Step-by-Step Instructions

### **Step 1: Check What You Have**
Open PowerShell and test these commands:

```powershell
# Test for Python
python --version
# OR
python3 --version

# Test for Node.js (if Python fails)
node --version
```

**Results:**
- ✅ **Shows version number** = You have it installed!
- ❌ **"Command not found"** = You need to install it

### **Step 2: Install Missing Software (If Needed)**

**Option A: Install Python (Easiest)**
1. Go to: https://python.org/downloads
2. Download and install Python
3. ✅ Check "Add Python to PATH" during installation

**Option B: Install Node.js**
1. Go to: https://nodejs.org
2. Download LTS version and install

### **Step 3: Start Your Frontend Server**

```powershell
# In your MLNF root folder:
.\start-frontend-server.ps1
```

**You should see:**
```
🌐 Starting MLNF Frontend Server...
🐍 Using Python HTTP server...
Serving HTTP on :: port 8080...
```

### **Step 4: Open Your Website**
1. **Open your web browser**
2. **Go to:** `http://localhost:8080/pages/news.html`
3. **You should see your website loading properly!**

## 🎯 What About the Backend?

Your website has **two parts**:

### **Frontend** (What users see)
- HTML, CSS, JavaScript files
- Runs in the browser
- **We just set this up!** ✅

### **Backend** (The API/Database)
- Handles login, data storage, API calls
- Currently running on Render (production)
- **You can use production backend for now**

### **Do I Need Both?**
For testing **frontend changes** (CSS, HTML, modal fixes):
- ✅ **Frontend server only** (what we just did)
- ✅ **Use production backend** (no extra setup needed)

For testing **backend changes** (API, database):
- 🛠️ **Need both servers** (use `.\start-local-backend.ps1`)

## 🛠️ Using Dev Mode for Testing

Once your frontend server is running:

1. **Open:** `http://localhost:8080/pages/news.html`
2. **Press:** `Ctrl+Shift+D` (toggles dev mode)
3. **Or click:** 🛠️ button (bottom-right corner)
4. **Configure:**
   - ✅ Enable Dev Mode
   - 📡 API Endpoint: "Production (Render)" 
   - 🐛 Enable Debug Logging
   - 💾 Click "Save"

## 🔍 Troubleshooting

### **"Command not found" error**
- Install Python or Node.js (see Step 2 above)

### **"Port already in use" error**
- Stop other servers (Ctrl+C)
- Or change port: `python -m http.server 8081`

### **Page loads but looks broken**
- Check console (F12) for errors
- Ensure you're using `http://localhost:8080` not `file://`

### **Login doesn't work**
- Normal! Tokens are domain-specific
- Use dev mode "Mock Authentication" for testing
- Or login fresh on localhost

### **Can't access dev mode**
- Make sure `dev-mode.js` file exists in `front/js/`
- Check browser console (F12) for JavaScript errors

## 📝 Common Testing Workflow

1. **Start frontend server:** `.\start-frontend-server.ps1`
2. **Open browser:** `http://localhost:8080/pages/news.html`
3. **Enable dev mode:** Press `Ctrl+Shift+D`
4. **Make changes to files**
5. **Refresh browser** to see changes
6. **Test functionality** (modals, forms, etc.)
7. **Check console** (F12) for any errors

## 🎓 Key Concepts for Beginners

### **Localhost vs Production**
- **localhost:8080** = Your computer (testing)
- **yourdomain.com** = Live website (users see this)

### **Frontend vs Backend**
- **Frontend** = What users see (HTML/CSS/JS)
- **Backend** = Data processing (API/Database)

### **Development vs Production**
- **Development** = Testing environment (your computer)
- **Production** = Live environment (real users)

### **Domains and Cookies**
- Login tokens are saved per-domain
- `localhost:8080` and `production.com` are different domains
- That's why you need to login again on localhost

## 🆘 Still Stuck?

1. **Check the exact error message**
2. **Look at browser console** (F12)
3. **Try the test modal page:** `http://localhost:8080/test-modal.html`
4. **Ask for help with specific error messages**

Remember: **Every developer goes through this learning process!** You're doing great by asking these questions. 🌟 