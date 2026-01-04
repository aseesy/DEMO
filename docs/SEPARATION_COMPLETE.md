# Marketing Site and Main App Separation - COMPLETE ✅

**Date**: January 3, 2026

---

## ✅ Separation Complete

The marketing site and main app have been fully separated. All blog-related code has been removed from the main app.

---

## Changes Made

### Main App (`chat-client-vite`)

1. **Removed Blog Routes** (`src/App.jsx`):
   - Removed all blog pillar routes (`/co-parenting-communication`, `/high-conflict-co-parenting`, etc.)
   - Removed all blog article routes
   - Removed references to `BlogPillarPage` and other blog components

2. **Updated Navigation Adapter** (`src/adapters/navigation/NavigationAdapter.js`):
   - Commented out `BLOG: '/blog'` path constant
   - Added comment noting blog moved to marketing site

3. **Updated Tests** (`src/adapters/navigation/NavigationAdapter.test.js`):
   - Commented out BLOG path test
   - Added note that blog moved to marketing site

### Marketing Site (`marketing-site`)

1. **All Blog Components**:
   - `BlogPillarPage.jsx` - Blog pillar/category pages
   - All blog article components
   - `blogData.js` - Blog structure and metadata
   - `blogImageHelper.js` - Blog image loading
   - `blogImageMap.js` - Blog image mappings

2. **Routes** (`src/App.jsx`):
   - All blog routes configured
   - Landing page route
   - Legal pages (Privacy, Terms)

---

## Current Structure

### Main App (`app.coparentliaizen.com`)

**Routes:**

- `/` - ChatRoom (dashboard/chat)
- `/signin` - Login/Signup
- `/accept-invite` - Accept invitation
- `/invite-coparent` - Invite co-parent
- `/auth/google/callback` - Google OAuth
- `/forgot-password` - Password reset
- `/reset-password` - Password reset
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/quizzes` - Quizzes
- `/quizzes/co-parenting-stance` - Co-parenting stance quiz
- `/ui-showcase` - UI component showcase
- `/socket-diagnostic` - Socket debugging (dev)
- `/socket-test-v2` - Socket testing (dev)

**No Blog Routes** ✅

### Marketing Site (`www.coparentliaizen.com`)

**Routes:**

- `/` - Landing page
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/co-parenting-communication` - Blog pillar
- `/high-conflict-co-parenting` - Blog pillar
- `/child-centered-co-parenting` - Blog pillar
- `/liaizen-ai-co-parenting` - Blog pillar
- All individual blog article routes

**No App Routes** ✅

---

## Verification

### Build Status

- ✅ Main app builds successfully (no blog references)
- ✅ Marketing site builds successfully
- ✅ No `BlogPillarPage` errors in main app

### Deployment

- ✅ Main app deployed to `app.coparentliaizen.com`
- ✅ Marketing site deployed to `www.coparentliaizen.com`

---

## ErrorHandlerRegistry

**Note**: The `ErrorHandlerRegistry` console logs (INVALID_TOKEN, INVALID_CODE, etc.) are **expected** and **correct**. These are part of the main app's error handling system, not related to the blog. They register error handlers for the app's authentication and invitation flows.

---

## Summary

✅ **Separation Complete**

- All blog code removed from main app
- All blog code in marketing site
- No cross-references between apps
- Both apps build and deploy successfully
- ErrorHandlerRegistry logs are expected (not blog-related)

---

## Next Steps

1. ✅ Test main app at `app.coparentliaizen.com`
2. ✅ Test marketing site at `www.coparentliaizen.com`
3. ⚠️ Fix Railway backend 502 error (separate issue)
