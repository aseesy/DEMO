# Production Testing Guide

## Pre-Deployment Checklist

### Marketing Site

- [x] Builds successfully locally
- [x] All imports fixed
- [x] Blog images use API endpoint
- [x] Environment variables configured
- [x] `vercel.json` in place

### Main App

- [x] Builds successfully locally
- [x] Landing page removed
- [x] Blog removed
- [x] Environment variables configured
- [x] `vercel.json` in place

### Backend

- [x] CORS updated for both domains
- [x] Railway deployment working
- [x] API endpoints accessible

---

## Testing Checklist

### Marketing Site (`www.coparentliaizen.com`)

#### 1. Landing Page

- [ ] Page loads without errors
- [ ] All sections render correctly
- [ ] Images load properly
- [ ] Navigation works
- [ ] Mobile responsive

#### 2. Waitlist Form

- [ ] Form displays correctly
- [ ] Email validation works
- [ ] Submit button works
- [ ] Success message appears
- [ ] Error handling works
- [ ] API call succeeds (check Network tab)

#### 3. Blog Articles

- [ ] Blog pillar pages load
- [ ] Individual articles load
- [ ] Blog images load from backend API
- [ ] Navigation between articles works
- [ ] Mobile responsive

#### 4. API Integration

- [ ] `GET /api/stats/user-count` works
- [ ] `POST /api/waitlist` works
- [ ] CORS headers present
- [ ] No CORS errors in console

#### 5. Performance

- [ ] Page loads quickly (< 3s)
- [ ] Images optimized
- [ ] No console errors
- [ ] Lighthouse score > 80

---

### Main App (`app.coparentliaizen.com`)

#### 1. Authentication

- [ ] Login page loads
- [ ] Sign up works
- [ ] Google OAuth works
- [ ] Password reset works
- [ ] Session persists
- [ ] Redirects work correctly

#### 2. Dashboard

- [ ] Dashboard loads after login
- [ ] Navigation works
- [ ] All views accessible
- [ ] Mobile responsive

#### 3. Chat Functionality

- [ ] Socket.io connects
- [ ] Messages send/receive
- [ ] Real-time updates work
- [ ] Message history loads
- [ ] AI mediation works

#### 4. API Integration

- [ ] All API calls succeed
- [ ] CORS headers present
- [ ] No CORS errors
- [ ] Error handling works

#### 5. PWA Features

- [ ] Service worker registers
- [ ] Offline functionality works
- [ ] Push notifications work (if enabled)
- [ ] Install prompt works

---

### Backend (Railway)

#### 1. Health Check

- [ ] `/health` endpoint responds
- [ ] Database connection works
- [ ] All services initialized

#### 2. API Endpoints

- [ ] `/api/auth/*` endpoints work
- [ ] `/api/stats/*` endpoints work
- [ ] `/api/waitlist` endpoint works
- [ ] `/api/blog/images/*` serves images

#### 3. Socket.io

- [ ] WebSocket connections work
- [ ] Authentication middleware works
- [ ] Message events work
- [ ] Room management works

#### 4. CORS

- [ ] Allows `www.coparentliaizen.com`
- [ ] Allows `app.coparentliaizen.com`
- [ ] Allows `*.vercel.app` (preview deployments)
- [ ] Preflight requests succeed

---

## Browser Testing Commands

### Test Marketing Site

```bash
# Check if site is live
curl -I https://www.coparentliaizen.com

# Test API endpoint
curl https://demo-production-6dcd.up.railway.app/api/stats/user-count

# Test waitlist endpoint
curl -X POST https://demo-production-6dcd.up.railway.app/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Test Main App

```bash
# Check if site is live
curl -I https://app.coparentliaizen.com

# Test health endpoint
curl https://demo-production-6dcd.up.railway.app/health
```

---

## Console Checks

### Marketing Site

Open browser console and check for:

- ✅ No CORS errors
- ✅ No 404 errors for images
- ✅ API calls succeed
- ✅ No React errors
- ✅ Analytics events fire (if implemented)

### Main App

Open browser console and check for:

- ✅ Socket.io connects successfully
- ✅ No CORS errors
- ✅ No authentication errors
- ✅ No React errors
- ✅ Service worker registered

---

## Network Tab Checks

### Marketing Site

- ✅ All assets load (200 status)
- ✅ API calls return 200/201
- ✅ Images load from backend
- ✅ No failed requests

### Main App

- ✅ Socket.io handshake succeeds
- ✅ API calls return 200
- ✅ Service worker assets load
- ✅ No failed requests

---

## Common Issues & Fixes

### CORS Errors

**Symptom**: `Access to fetch blocked by CORS policy`
**Fix**:

1. Check Railway `FRONTEND_URL` includes both domains
2. Verify `middleware.js` allows both origins
3. Redeploy Railway backend

### Images Not Loading

**Symptom**: Blog images show broken image icon
**Fix**:

1. Verify images exist in backend `/api/blog/images/` directory
2. Check `API_BASE_URL` in marketing site config
3. Verify backend serves images correctly

### Socket.io Connection Fails

**Symptom**: Chat doesn't work, connection errors
**Fix**:

1. Check `VITE_API_URL` in main app
2. Verify Railway backend is running
3. Check Socket.io authentication middleware
4. Verify CORS allows Socket.io connections

### Build Fails on Vercel

**Symptom**: Deployment fails during build
**Fix**:

1. Check Root Directory is correct
2. Verify `vercel.json` is in correct location
3. Check build logs for specific errors
4. Verify all dependencies in `package.json`

---

## Performance Benchmarks

### Marketing Site

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s
- Lighthouse Score: > 80

### Main App

- First Contentful Paint: < 2s
- Largest Contentful Paint: < 3s
- Time to Interactive: < 4s
- Lighthouse Score: > 70 (PWA adds overhead)

---

## Next Steps After Testing

1. **Monitor Errors**
   - Set up error tracking (Sentry, etc.)
   - Monitor Vercel logs
   - Monitor Railway logs

2. **Performance Monitoring**
   - Set up Vercel Analytics
   - Monitor API response times
   - Track user metrics

3. **SEO**
   - Submit sitemap to Google
   - Verify meta tags
   - Test social sharing

4. **Security**
   - Verify HTTPS everywhere
   - Check security headers
   - Verify CORS is restrictive enough
