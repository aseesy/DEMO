# Marketing Site Separation - Progress

## ✅ Completed

### Phase 1: Marketing Site Structure
- [x] Created `marketing-site/` directory
- [x] Set up Vite configuration
- [x] Created `package.json` with minimal dependencies
- [x] Created Tailwind config
- [x] Created PostCSS config
- [x] Created `index.html`
- [x] Created `src/main.jsx` entry point
- [x] Created `src/index.css`

### Phase 2: Landing Page
- [x] Copied landing page components
- [x] Organized into `src/pages/LandingPage.jsx` and `src/components/landing/`
- [x] Updated `useLandingPageState` to use new API client
- [x] Created UI components (Button, SectionHeader, Heading)
- [x] Updated all imports

### Phase 3: Blog
- [x] Copied blog components to `src/pages/Blog/`
- [x] Created `App.jsx` with all blog routes
- [x] Blog image helper works (uses blogImageMap)

### Phase 4: API Client
- [x] Created `src/api/client.js` (simple fetch wrapper)
- [x] Created `src/config.js` for API URL
- [x] Updated landing page to use new API client

### Phase 5: Configuration
- [x] Created `vercel.json` for deployment
- [x] Copied public assets
- [x] Created README

## 🔄 In Progress

### Phase 6: Clean Main App
- [ ] Remove landing page from `ChatRoom.jsx`
- [ ] Remove landing page logic from `AuthGuard.jsx`
- [ ] Remove blog routes from `App.jsx`
- [ ] Delete `src/features/landing/` directory
- [ ] Delete `src/features/blog/` directory
- [ ] Remove `useLandingPageController` hook

### Phase 7: Backend CORS
- [ ] Update `chat-server/middleware.js` to allow both:
  - `https://www.coparentliaizen.com` (marketing)
  - `https://app.coparentliaizen.com` (main app)

## 📋 Next Steps

1. **Test Marketing Site Locally**
   ```bash
   cd marketing-site
   npm install
   npm run dev
   ```
   - Verify landing page loads
   - Test waitlist form submission
   - Test blog routes

2. **Clean Main App**
   - Remove landing/blog code
   - Update routing
   - Test main app still works

3. **Update Backend CORS**
   - Add both domains to allowed origins

4. **Deploy**
   - Deploy marketing site to Vercel (new project)
   - Deploy main app (existing project)
   - Configure domains:
     - Marketing: `www.coparentliaizen.com`
     - App: `app.coparentliaizen.com`

## 📝 Notes

- Marketing site uses port 5174 (main app uses 5173)
- Marketing site has minimal dependencies (no PWA, no socket.io)
- Both sites share the same backend API
- Blog images are served from backend (`/api/blog/images/*`)

## 🐛 Known Issues

- Need to verify all blog components work (may need additional UI components)
- Need to test waitlist API integration
- Need to verify blog image paths work correctly

