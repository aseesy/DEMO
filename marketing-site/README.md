# Marketing Site

Separate marketing site for LiaiZen - landing page and blog content.

## Purpose

This is a lightweight, SEO-optimized marketing site that:
- Shows the landing page with waitlist signup
- Hosts blog articles for SEO and content marketing
- Directs users to the main app when ready

## Structure

- `src/pages/LandingPage.jsx` - Main landing page
- `src/pages/Blog/` - Blog articles
- `src/components/landing/` - Landing page components
- `src/api/client.js` - Simple API client (waitlist, stats)

## Development

```bash
npm install
npm run dev
```

Runs on port 5174 (different from main app's 5173)

## Build

```bash
npm run build
```

## Environment Variables

- `VITE_API_URL` - Backend API URL (defaults to localhost:3000 in dev, Railway in prod)

## Deployment

Deploy to Vercel as a separate project:
- Domain: `www.coparentliaizen.com` (or marketing subdomain)
- Root Directory: `marketing-site`
- Build Command: `npm install && npm run build`
- Output Directory: `dist`

## API Endpoints Used

- `POST /api/waitlist` - Waitlist signup
- `GET /api/stats/user-count` - Social proof (families helped count)
- `GET /api/blog/images/*` - Blog images (via direct URLs)

