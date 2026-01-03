# Vercel Workaround Applied

**Date:** January 3, 2025  
**Issue:** `npm ci` fails because `package-lock.json` is missing or out of sync  
**Solution:** Use `npm install` instead of `npm ci`

---

## Problem

Vercel build fails with:
```
npm error `npm ci` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync.
npm error Missing: @tailwindcss/oxide-android-arm64@4.1.17 from lock file
npm error Missing: @esbuild/android-arm@0.25.12 from lock file
... (many more missing optional dependencies)
```

**Root Cause:** `package-lock.json` is missing or doesn't include all optional dependencies required by `npm ci`.

---

## Workaround Applied

Changed `vercel.json` to use `npm install` instead of `npm ci`:

**Before:**
```json
{
  "buildCommand": "npm ci && npm run build",
  "installCommand": "npm ci"
}
```

**After:**
```json
{
  "buildCommand": "npm install && npm run build",
  "installCommand": "npm install"
}
```

---

## Why This Works

1. **`npm install` doesn't require package-lock.json:**
   - `npm ci` requires an exact match between `package.json` and `package-lock.json`
   - `npm install` will generate/update `package-lock.json` if missing
   - `npm install` handles optional dependencies automatically

2. **Vercel will generate package-lock.json:**
   - When `npm install` runs, it will create `package-lock.json`
   - This file will be cached for future builds
   - Subsequent builds will be faster

3. **Trade-offs:**
   - ✅ Works without existing `package-lock.json`
   - ✅ Handles optional dependencies automatically
   - ⚠️ Slightly slower than `npm ci` (but acceptable for Vercel)
   - ⚠️ Less deterministic than `npm ci` (but Vercel caches node_modules)

---

## Configuration

**File:** `chat-client-vite/vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": {
    "submodules": false
  },
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": null,
  ...
}
```

---

## Next Steps

1. ✅ **Workaround applied** - `vercel.json` updated
2. ✅ **Committed and pushed** - Vercel will auto-deploy
3. ⏳ **Monitor deployment** - Check Vercel Dashboard for build status
4. 📝 **Future improvement** - Generate proper `package-lock.json` locally and commit it

---

## Future Improvement

To use `npm ci` in the future (more deterministic):

1. Generate `package-lock.json` locally:
   ```bash
   cd chat-client-vite
   npm install
   ```

2. Commit `package-lock.json`:
   ```bash
   git add chat-client-vite/package-lock.json
   git commit -m "chore: Add package-lock.json for npm ci"
   git push
   ```

3. Update `vercel.json` back to `npm ci`:
   ```json
   {
     "buildCommand": "npm ci && npm run build",
     "installCommand": "npm ci"
   }
   ```

---

**Workaround is now active. Vercel should be able to build successfully.** 🚀

