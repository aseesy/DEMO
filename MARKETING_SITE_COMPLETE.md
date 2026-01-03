# Marketing Site Separation - Complete ✅

## Summary

Successfully separated the marketing site (landing page + blog) from the main application.

## Architecture

### Marketing Site (`marketing-site/`)

- **Purpose**: Waitlist signups, SEO content, blog articles
- **Domain**: `www.coparentliaizen.com` (or marketing subdomain)
- **Tech Stack**: Vite + React + Tailwind (minimal dependencies)
- **No PWA, no socket.io, no authentication**

### Main App (`chat-client-vite/`)

- **Purpose**: Full application (chat, dashboard, authenticated features)
- **Domain**: `app.coparentliaizen.com` (or current domain)
- **Tech Stack**: Vite + React + PWA + Socket.io
- **No marketing content**

### Backend (`chat-server/`)

- **Shared API**: Both sites use the same backend
- **CORS**: Updated to allow both `www` and `app` subdomains
- **Endpoints Used by Marketing**:
  - `POST /api/waitlist` - Waitlist signup
  - `GET /api/stats/user-count` - Social proof
  - `GET /api/blog/images/*` - Blog images

## Files Created

### Marketing Site

- `marketing-site/package.json` - Minimal dependencies
- `marketing-site/vite.config.js` - Vite configuration
- `marketing-site/tailwind.config.js` - Tailwind config
- `marketing-site/vercel.json` - Deployment config
- `marketing-site/src/App.jsx` - Routes (landing + blog)
- `marketing-site/src/pages/LandingPage.jsx` - Landing page
- `marketing-site/src/pages/Blog/` - All blog articles
- `marketing-site/src/components/landing/` - Landing page components
- `marketing-site/src/components/ui/` - UI components (Button, SectionHeader, Heading)
- `marketing-site/src/api/client.js` - Simple API client

### Main App Changes

- Removed `src/features/landing/` directory
- Removed `src/features/blog/` directory
- Removed `src/features/shell/hooks/useLandingPageController.js`
- Updated `ChatRoom.jsx` - removed landing page logic
- Updated `AuthGuard.jsx` - removed landing page rendering
- Updated `App.jsx` - removed blog routes
- Updated `useNavigationManager.js` - removed landing page logic

### Backend Changes

- Updated `middleware.js` - CORS now allows both `www` and `app` subdomains

## Deployment

### Marketing Site

1. Create new Vercel project
2. Set Root Directory: `marketing-site`
3. Set Environment Variable: `VITE_API_URL=https://demo-production-6dcd.up.railway.app`
4. Deploy
5. Configure domain: `www.coparentliaizen.com`

### Main App

1. Existing Vercel project (or create new)
2. Set Root Directory: `chat-client-vite`
3. Keep existing environment variables
4. Deploy
5. Configure domain: `app.coparentliaizen.com`

## Testing

### Local Development

**Marketing Site:**

```bash
cd marketing-site
npm install
npm run dev
# Runs on http://localhost:5174
```

**Main App:**

```bash
cd chat-client-vite
npm install
npm run dev
# Runs on http://localhost:5173
```

### Verify

- [ ] Marketing site loads landing page
- [ ] Waitlist form submits successfully
- [ ] Blog articles load correctly
- [ ] Blog images load from backend
- [ ] Main app shows login (no landing page)
- [ ] Main app routes work (chat, dashboard, etc.)
- [ ] CORS allows both sites

## Benefits

1. **Separation of Concerns**
   - Marketing = lightweight, fast, SEO-optimized
   - App = full-featured, PWA, real-time

2. **Independent Deployment**
   - Update marketing content without deploying app
   - Update app without affecting marketing

3. **Performance**
   - Marketing site: Small bundle, fast load
   - App: Can be larger, optimized for functionality

4. **Maintainability**
   - Clear boundaries
   - Easier to understand and modify

## Next Steps

1. **Deploy Marketing Site**
   - Create Vercel project
   - Configure domain
   - Set environment variables

2. **Update Main App Domain**
   - Configure `app.coparentliaizen.com` (or keep current)
   - Update any hardcoded URLs

3. **Test Production**
   - Verify both sites work
   - Test waitlist submission
   - Test blog articles
   - Test main app authentication

4. **SEO**
   - Update sitemap for marketing site
   - Configure redirects if needed
   - Update canonical URLs

## Notes

- Marketing site uses port 5174 (main app uses 5173)
- Both sites share the same backend API
- Blog images are served from backend (`/api/blog/images/*`)
- Simple analytics in marketing site (console.log - can add Google Analytics later)
