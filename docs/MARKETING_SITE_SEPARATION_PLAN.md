# Marketing Site Separation Plan

## Goal

Separate the marketing site (landing page + blog) from the main application. The marketing site is for waitlist signups and SEO content, while the main app is the actual application.

## Current Architecture

### Current Structure

```
chat-client-vite/
├── src/
│   ├── features/
│   │   ├── landing/          # Marketing landing page
│   │   ├── blog/            # Blog articles
│   │   ├── chat/            # Main app
│   │   ├── dashboard/       # Main app
│   │   └── ...
│   └── App.jsx              # Routes both marketing and app
```

### Current Issues

- Marketing content (landing + blog) bundled with main app
- Main app includes PWA, authentication, socket.io - unnecessary for marketing
- Can't deploy marketing separately
- Marketing site should be lightweight and fast (SEO, conversions)

## Target Architecture

### New Structure

```
/
├── marketing-site/          # NEW: Separate marketing site
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   └── Blog/
│   │   ├── components/
│   │   ├── api/             # API client for waitlist
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
│
├── chat-client-vite/        # Main app (cleaned)
│   ├── src/
│   │   ├── features/
│   │   │   ├── chat/
│   │   │   ├── dashboard/
│   │   │   └── ...          # NO landing or blog
│   │   └── App.jsx          # Only app routes
│   └── ...
│
└── chat-server/            # Shared backend
    └── routes/
        ├── waitlist.js      # Used by marketing site
        └── blogImages.js    # Used by marketing site
```

## Implementation Plan

### Phase 1: Create Marketing Site Structure

1. **Create `marketing-site/` directory**
   - New Vite + React project
   - Minimal dependencies (React, React Router, Tailwind)
   - No PWA, no socket.io, no authentication

2. **Move Landing Page Components**
   - Copy `chat-client-vite/src/features/landing/` → `marketing-site/src/pages/`
   - Copy `chat-client-vite/src/features/landing/components/` → `marketing-site/src/components/`
   - Update imports (remove app-specific dependencies)

3. **Move Blog Components**
   - Copy `chat-client-vite/src/features/blog/` → `marketing-site/src/pages/Blog/`
   - Copy blog routes to marketing site
   - Update blog image references

### Phase 2: Create API Client for Marketing Site

1. **Create `marketing-site/src/api/client.js`**
   - Simple fetch wrapper
   - Points to backend API (`VITE_API_URL`)
   - Only needs:
     - `POST /api/waitlist` (waitlist signup)
     - `GET /api/stats/user-count` (social proof)
     - `GET /api/blog/images/*` (blog images)

2. **Update Landing Page State**
   - Replace `apiGet`/`apiPost` from main app
   - Use new marketing API client
   - Remove app-specific analytics (keep basic tracking)

### Phase 3: Clean Main App

1. **Remove from `chat-client-vite/`**
   - Delete `src/features/landing/`
   - Delete `src/features/blog/`
   - Remove blog routes from `App.jsx`
   - Remove landing page logic from `ChatRoom.jsx`

2. **Update `ChatRoom.jsx`**
   - Remove `useLandingPageController` hook
   - Remove `AuthGuard` landing page logic
   - Show login/signup directly (no landing page)

3. **Update `App.jsx`**
   - Remove all blog routes
   - Remove landing page imports
   - Keep only app routes (chat, dashboard, auth, etc.)

### Phase 4: Configure Marketing Site

1. **Create `marketing-site/vite.config.js`**
   - Simple Vite config (no PWA plugin)
   - Tailwind CSS
   - Basic build optimization

2. **Create `marketing-site/package.json`**
   - Minimal dependencies
   - React, React Router, Tailwind
   - No socket.io, no PWA

3. **Create `marketing-site/vercel.json`**
   - Deploy to separate Vercel project
   - Or subdomain (e.g., `www.coparentliaizen.com`)

### Phase 5: Update Backend CORS

1. **Update `chat-server/middleware.js`**
   - Add marketing site domain to `FRONTEND_URL`
   - Allow both:
     - Marketing site: `https://www.coparentliaizen.com` (or marketing subdomain)
     - Main app: `https://app.coparentliaizen.com` (or current domain)

### Phase 6: Deployment Strategy

#### Option A: Separate Vercel Projects

- **Marketing Site**: `marketing-site/` → New Vercel project
  - Domain: `www.coparentliaizen.com` (or `marketing.coparentliaizen.com`)
- **Main App**: `chat-client-vite/` → Existing Vercel project
  - Domain: `app.coparentliaizen.com` (or current domain)

#### Option B: Same Vercel Project, Different Routes

- Deploy marketing site to `/` (root)
- Deploy main app to `/app/*`
- Requires routing configuration

**Recommendation**: Option A (separate projects) - cleaner separation

## Files to Move/Copy

### Landing Page

- `chat-client-vite/src/features/landing/LandingPage.jsx`
- `chat-client-vite/src/features/landing/components/*` (all components)
- Dependencies:
  - `apiClient.js` → Create new simple API client
  - `analytics.js` → Keep basic tracking, remove app-specific

### Blog

- `chat-client-vite/src/features/blog/*` (all blog components)
- `chat-client-vite/src/features/blog/blogData.js`
- `chat-client-vite/src/features/blog/blogImageHelper.js`
- Routes from `App.jsx` (lines 244-325)

## Files to Update

### Main App (`chat-client-vite/`)

1. **`src/App.jsx`**
   - Remove blog route imports (lines 27-48)
   - Remove blog routes (lines 244-325)
   - Remove landing page logic

2. **`src/ChatRoom.jsx`**
   - Remove `useLandingPageController` import
   - Remove `AuthGuard` landing page logic
   - Remove `LandingPage` import

3. **`src/features/shell/hooks/useLandingPageController.js`**
   - DELETE (no longer needed)

4. **`src/features/shell/components/AuthGuard.jsx`**
   - Remove landing page rendering logic
   - Show login/signup directly

### Backend (`chat-server/`)

1. **`middleware.js`**
   - Add marketing site domain to CORS allowed origins

## Dependencies

### Marketing Site (New)

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.9.6"
  },
  "devDependencies": {
    "vite": "^7.2.2",
    "@vitejs/plugin-react": "^5.1.0",
    "tailwindcss": "^4.1.17",
    "autoprefixer": "^10.4.22",
    "postcss": "^8.5.6"
  }
}
```

### Main App (Updated)

- Remove blog/landing dependencies (if any)
- Keep all app dependencies (socket.io, PWA, etc.)

## Environment Variables

### Marketing Site

- `VITE_API_URL` - Backend API URL (same as main app)
- No other env vars needed

### Main App

- Keep existing env vars
- No changes needed

## Testing Checklist

- [ ] Marketing site loads landing page
- [ ] Waitlist form submits to backend
- [ ] Blog articles load correctly
- [ ] Blog images load from backend
- [ ] Main app no longer shows landing page
- [ ] Main app routes work (chat, dashboard, etc.)
- [ ] CORS allows both sites
- [ ] Both sites deploy independently

## Migration Steps

1. **Create marketing site structure**
2. **Copy landing page components**
3. **Copy blog components**
4. **Create API client for marketing site**
5. **Test marketing site locally**
6. **Remove landing/blog from main app**
7. **Test main app (no landing/blog)**
8. **Update backend CORS**
9. **Deploy marketing site**
10. **Deploy main app**
11. **Verify both work**

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

4. **Scalability**
   - Can use different tech stacks if needed
   - Can deploy to different CDNs/regions

5. **Maintainability**
   - Clear boundaries
   - Easier to understand and modify

## Questions to Resolve

1. **Domain Strategy**
   - Marketing: `www.coparentliaizen.com`?
   - App: `app.coparentliaizen.com`?
   - Or keep current setup?

2. **Analytics**
   - Keep same analytics setup?
   - Separate tracking for marketing vs app?

3. **Shared Components**
   - Any shared UI components?
   - Should we create a shared design system package?

4. **Blog Images**
   - Keep current backend route?
   - Or move to CDN?

## Next Steps

1. Get approval on plan
2. Create marketing site structure
3. Start Phase 1 implementation
