# Authentication Debugging Guide

## Problem: "Please authenticate" errors when already logged in

### Quick Fix (Do This First!)

1. **Open your browser console** (F12 → Console tab)
2. **Run these commands** to clear your session:
   ```javascript
   localStorage.removeItem('mlnf_token');
   localStorage.removeItem('mlnf_user');
   location.reload();
   ```
3. **Log in again** using the Login button

This will clear your old (likely expired/invalid) token and force a fresh login.

---

## Detailed Debugging

### Step 1: Check Your Current Token

Open browser console and run:
```javascript
console.log('Token:', localStorage.getItem('mlnf_token'));
console.log('User:', localStorage.getItem('mlnf_user'));
```

### Step 2: Test Token Validity

Run this in the console to test if your token is valid:
```javascript
fetch('https://much-love-no-fear.onrender.com/api/auth/debug-token', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('mlnf_token')
  }
})
.then(r => r.json())
.then(data => console.log('Token Status:', data));
```

### Step 3: Interpret Results

**If status is "no_token":**
- You're not actually logged in (frontend has no token)
- Solution: Log in again

**If status is "invalid":**
- Your token is expired or was created with a different JWT_SECRET
- Solution: Clear localStorage and log in again (see Quick Fix above)

**If status is "valid":**
- Token is fine, the issue is elsewhere
- Check the console logs for other errors
- Report the full error to support

### Step 4: Force Fresh Login

If clearing localStorage doesn't work:

1. Open DevTools → Application tab
2. Expand "Local Storage" on the left
3. Click on your site's domain
4. Delete all mlnf_* entries
5. Close all browser tabs for the site
6. Open a new tab and visit the site
7. Register a NEW account or login again

---

## Why This Happens

### Scenario 1: Backend Redeployment
If the backend was redeployed and the JWT_SECRET environment variable changed, all existing tokens become invalid instantly.

### Scenario 2: Token Expiration
Tokens expire after 7 days. If you logged in more than a week ago, your token is expired.

### Scenario 3: Database Changes
If the user was deleted from the database but the frontend still has the token.

---

## Backend Logs to Check

After deployment, check Render backend logs for:
```
❌ Auth failed: Invalid token - jwt expired
❌ Auth failed: Invalid token - invalid signature
❌ Auth failed: User not found for ID: [userId]
```

These will tell you exactly why authentication is failing.

---

## Permanent Fix Needed

To prevent this from happening to users, we should:

1. **Auto-detect expired tokens** and redirect to login
2. **Show token expiry warning** before it expires
3. **Implement refresh tokens** for seamless re-authentication
4. **Add JWT_SECRET to environment** consistently across deployments

---

## Contact Support

If none of these steps work:
1. Copy ALL console errors
2. Run the debug-token command and copy the output
3. Note what actions trigger the error
4. Report to: support@mlnf.net or create a GitHub issue
