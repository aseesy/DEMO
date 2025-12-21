# LiaiZen Development Troubleshooting Guide

## Quick Reference

### Blank Screen Issues

**Symptom**: Page loads but shows blank/white screen

**Common Causes**:

1. **Invalid Route**: Navigating to a route that doesn't exist (e.g., `/signup` instead of `/signin`)
2. **React Error**: Component threw an error but Error Boundary wasn't set up
3. **Authentication Redirect Loop**: User is authenticated but redirect logic is broken

**Solutions**:

1. Check browser console for errors (`F12` → Console tab)
2. Use `window.getErrorLog()` to see captured errors
3. Verify route exists in `App.jsx`
4. Check if Error Boundary is working (should show error UI, not blank screen)

**Valid Routes**:

- `/` - Main dashboard/chat
- `/signin` - Login/Signup page
- `/accept-invite` - Accept co-parent invitation
- `/invite-coparent` - Generate invitation for co-parent
- `/auth/google/callback` - Google OAuth callback
- `/ui-showcase` - Design system showcase
- `/privacy` - Privacy policy
- `/terms` - Terms of service

---

## Common Issues

### 1. Database Connection Errors

**Error**: `database "athenasees" does not exist` or `relation "users" does not exist`

**Cause**: PostgreSQL database not configured or migrations not run

**Solution**:

```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Run migrations
cd chat-server
node run-migration.js
```

---

### 2. Invite Feature Not Working

**Symptom**: Invite links don't work or emails not sent

**Common Issues**:

- `APP_URL` not set in `.env` → links point to wrong domain
- Email service not configured → emails logged to console instead
- User already authenticated → redirect happens before invite page loads

**Solution**:

```bash
# Set APP_URL in .env
echo "APP_URL=http://localhost:5173" >> chat-server/.env

# Check email logs in server console
# Look for "📧 EMAIL (Development Mode)"
```

---

### 3. Authentication Redirect Loop

**Symptom**: Page keeps redirecting, never loads

**Cause**: Auth state and routing logic conflict

**Debug Steps**:

1. Open browser console
2. Check `localStorage.getItem('isAuthenticated')`
3. Check `localStorage.getItem('chatUser')`
4. Clear localStorage if needed: `localStorage.clear()`

---

### 4. Frontend Not Updating After Code Changes

**Symptom**: Changes to React components don't appear

**Solution**:

```bash
# Hard refresh browser
# Mac: Cmd + Shift + R
# Windows: Ctrl + Shift + R

# Or restart dev server
cd chat-client-vite
npm run dev
```

---

### 5. Server Crashes on Startup

**Common Errors**:

- `DATABASE_URL not set` → Add to `.env`
- `Port 3001 already in use` → Kill existing process
- `Cannot find module` → Run `npm install`

**Solution**:

```bash
# Kill existing server
pkill -f "node server.js"

# Install dependencies
cd chat-server
npm install

# Start server
node server.js
```

---

## Debugging Tools

### Browser Console Commands

```javascript
// View captured errors
window.getErrorLog();

// Clear error log
window.clearErrorLog();

// Check auth state
localStorage.getItem('isAuthenticated');
localStorage.getItem('chatUser');

// Clear auth state
localStorage.clear();
```

### Server Logs

```bash
# Watch server logs
tail -f chat-server/server.log

# Check for email logs
grep "EMAIL" chat-server/server.log

# Check for errors
grep "ERROR" chat-server/server.log
```

---

## Prevention Checklist

Before pushing code:

- [ ] Test all routes manually
- [ ] Check browser console for errors
- [ ] Verify Error Boundary catches errors (not blank screen)
- [ ] Test with cleared localStorage
- [ ] Test with and without authentication
- [ ] Check server logs for errors

---

## Getting Help

1. **Check Error Log**: `window.getErrorLog()` in browser console
2. **Check Server Logs**: Look at terminal running `node server.js`
3. **Check Database**: Verify migrations ran successfully
4. **Clear State**: Try `localStorage.clear()` and reload
5. **Restart Everything**: Kill all processes and restart fresh

---

## Quick Fixes

### Clear Everything and Start Fresh

```bash
# Stop all processes
pkill -f "node server.js"
pkill -f "npm run dev"

# Clear browser
# In browser console:
localStorage.clear()
# Then hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

# Restart backend
cd chat-server
node server.js

# Restart frontend (in new terminal)
cd chat-client-vite
npm run dev
```

### Reset Database (Development Only)

```bash
cd chat-server
node scripts/clear_db.js
node run-migration.js
```

**⚠️ WARNING**: This deletes all data!
