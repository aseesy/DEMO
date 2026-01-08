# LiaiZen Marketing Site

Separate marketing website for LiaiZen - landing page and blog content.

## Overview

The marketing site is a lightweight, SEO-optimized React application that serves as the public-facing website for LiaiZen. It hosts the landing page, blog articles, and waitlist signup functionality. It's intentionally separate from the main application to allow independent deployment cycles.

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **DOMPurify** - XSS prevention for dynamic content

## Purpose

This separate marketing site:
- Shows the landing page with waitlist signup
- Hosts blog articles for SEO and content marketing
- Provides social proof and testimonials
- Directs users to the main app when ready
- Allows independent deployment from the main application

## Quick Start

### Prerequisites

- Node.js 20+ (see `engines` in `package.json`)
- npm

### Installation

```bash
cd marketing-site
npm install
```

**Note:** This is a separate project with its own `package.json`. It must be installed independently from the monorepo root.

### Environment Variables

Create a `.env` file in the `marketing-site/` directory:

```env
VITE_API_URL=http://localhost:8080
```

**Production:**
```env
VITE_API_URL=https://your-railway-domain.up.railway.app
```

### Development

```bash
npm run dev
```

Starts dev server at `http://localhost:5174` (different from main app's port 5173).

### Build

```bash
npm run build
```

Builds for production to `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

Preview the production build locally.

## Project Structure

```
marketing-site/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx      # Main landing page
│   │   └── Blog/                # Blog articles
│   │       ├── BlogPillarPage.jsx
│   │       ├── AiGuidedMediation.jsx
│   │       ├── WhyArgumentsRepeat.jsx
│   │       └── ... (20+ blog articles)
│   ├── components/
│   │   ├── landing/             # Landing page sections
│   │   │   ├── HeroSection.jsx
│   │   │   ├── FeaturesSection.jsx
│   │   │   ├── FAQSection.jsx
│   │   │   └── ... (12 sections)
│   │   └── ui/                  # Reusable UI components
│   ├── api/
│   │   └── client.js            # API client (waitlist, stats)
│   └── config.js                # Configuration
├── public/
│   └── assets/                  # Images and static assets
│       ├── blog-images/         # Blog article images
│       └── Logo.svg
└── index.html                   # HTML entry point
```

## Features

### Landing Page

The landing page includes multiple sections:

- **Hero Section** - Main value proposition with waitlist signup
- **Problem Section** - Explains co-parenting challenges
- **Wish List Section** - What parents want in a solution
- **Product Mockup** - Visual preview of the app
- **Features Section** - Key features and benefits
- **Parallel Parenting Section** - Communication approach
- **How It Works** - Product explanation
- **Testimonials** - Social proof
- **FAQ Section** - Common questions
- **Principles Section** - Co-parenting principles
- **Resources Section** - Educational content
- **Sticky Mobile CTA** - Mobile-optimized call-to-action

### Blog Articles

The site hosts 20+ SEO-optimized blog articles covering:

**Communication Pillar:**
- Why arguments repeat
- Emotional triggers
- Emotional regulation
- Reaction vs. response
- Pause before reacting
- Defensiveness strategies

**High Conflict Pillar:**
- Why it feels impossible
- De-escalation techniques
- Gaslighting, guilt, and blame
- Mental health protection
- Every conversation is a fight

**Child-Centered Pillar:**
- Long-term effects
- What kids need
- Stability and stress
- Modeling communication
- AI-guided mediation

### Waitlist

- Email collection form
- Integration with backend API
- Success/error handling
- Social proof (families helped count)

## Development Scripts

```bash
npm run dev          # Start dev server (port 5174)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## API Integration

The marketing site connects to the backend API at `VITE_API_URL`.

### API Endpoints Used

- `POST /api/waitlist` - Submit waitlist signup
  ```javascript
  {
    email: "user@example.com",
    source: "landing_page" // or "blog_article"
  }
  ```

- `GET /api/stats/user-count` - Get user count for social proof
  ```javascript
  {
    count: 1234,
    message: "1,234 families helped"
  }
  ```

- `GET /api/blog/images/*` - Blog images via direct URLs

## Blog Article Structure

Blog articles are React components in `src/pages/Blog/`:

```jsx
// Example blog article
export function ArticleName() {
  return (
    <BlogArticleLayout
      title="Article Title"
      category="communication"
      publishDate="2024-01-01"
      readingTime="5 min"
    >
      {/* Article content */}
    </BlogArticleLayout>
  );
}
```

Articles are automatically linked in the blog navigation and pillar pages.

## SEO Optimization

- **Meta Tags** - Comprehensive meta tags per page
- **Structured Data** - JSON-LD structured data
- **Semantic HTML** - Proper heading hierarchy
- **Alt Text** - All images have descriptive alt text
- **Internal Linking** - Strategic internal links between articles
- **URL Structure** - Clean, descriptive URLs

## Deployment

The marketing site is deployed to Vercel as a **separate project** from the main app.

**Production URL**: https://www.coparentliaizen.com

### Vercel Configuration

- **Root Directory**: `marketing-site`
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `dist`
- **Framework Preset**: Other
- **Node Version**: 20+

### Domain Configuration

- **Primary Domain**: `www.coparentliaizen.com`
- **Apex Domain**: `coparentliaizen.com` (redirects to www)
- **SSL**: Automatic via Vercel

### Environment Variables (Vercel)

Set in Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://your-railway-domain.up.railway.app
```

## Why Separate?

The marketing site is intentionally separate from the main application to:

1. **Independent Deployment** - Marketing content can be updated without affecting the app
2. **Different Release Cycles** - Blog and landing page updates don't require app deployment
3. **SEO Benefits** - Separate domain structure improves SEO
4. **Performance** - Lighter bundle for marketing pages
5. **Team Separation** - Marketing team can work independently

**Note:** This project is excluded from the monorepo workspace. It requires its own `npm install` in the `marketing-site/` directory.

## Content Management

### Adding a New Blog Article

1. Create new component in `src/pages/Blog/YourArticle.jsx`
2. Use `BlogArticleLayout` wrapper
3. Add route in `src/App.jsx`
4. Add entry to `src/pages/Blog/blogData.js`
5. Add header image to `public/assets/blog-images/`

### Updating Landing Page

Edit components in `src/components/landing/`:

- `HeroSection.jsx` - Main hero section
- `FeaturesSection.jsx` - Features grid
- `FAQSection.jsx` - FAQ items
- And other section components

## Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Custom Colors** - Co-parenting brand colors
- **Responsive Design** - Mobile-first approach
- **Dark Mode** - (Planned)

## Performance

- **Code Splitting** - Route-based code splitting
- **Image Optimization** - Optimized blog images
- **Lazy Loading** - Lazy load images and components
- **Static Generation** - Pre-rendered pages

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Analytics

- **Google Analytics** - Via `inject-google-tag.js`
- **Conversion Tracking** - Waitlist signup events
- **Page Views** - Automatic page view tracking

## Additional Resources

- **Main README**: See `/README.md` for project overview
- **Architecture**: See `docs/architecture.md` for system design
- **Deployment**: See `docs/deployment.md` for deployment guides
- **Backend API**: See `chat-server/README.md` for API documentation

## Troubleshooting

### Port Already in Use

If port 5174 is in use, Vite will automatically try the next available port. Check console output for the actual port.

### API Connection Issues

Verify `VITE_API_URL` is set correctly and the backend is running.

### Build Errors

Clear `node_modules` and rebuild:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

For questions or issues, see the main project README or open an issue on GitHub.
