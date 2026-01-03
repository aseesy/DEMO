# DNS Configuration Status

**Date**: January 3, 2026

---

## Current DNS Status

### ✅ DNS is Already Configured

Both domains are correctly pointing to Vercel:

```bash
$ dig www.coparentliaizen.com +short
55f5b5891d608fd9.vercel-dns-016.com.
216.150.16.129
216.150.1.129

$ dig app.coparentliaizen.com +short
55f5b5891d608fd9.vercel-dns-016.com.
216.150.1.129
216.150.16.129
```

**Conclusion**: DNS is correctly configured in Hostinger. Both subdomains point to Vercel.

---

## The Real Issue

The problem is **NOT DNS** - it's **Vercel project assignment**.

### Current Situation

- ✅ DNS: Both domains point to Vercel (correct)
- ❌ Vercel: `www.coparentliaizen.com` is assigned to wrong project
- ⚠️ Vercel: `app.coparentliaizen.com` may not be assigned to correct project

### What Needs to Happen

1. **In Vercel Dashboard** (not DNS):
   - Find the project that has `www.coparentliaizen.com`
   - Remove it from that project
   - Add it to `marketing-site` project

2. **Verify** `app.coparentliaizen.com`:
   - Ensure it's assigned to `chat-client-vite` project
   - If not, add it

---

## Why DNS Changes Aren't Needed

The DNS records in Hostinger are already correct:

- Both `www` and `app` subdomains have CNAME records pointing to Vercel
- Vercel handles routing based on which project the domain is assigned to
- Changing DNS won't fix the project assignment issue

---

## What to Do

### Option 1: Fix in Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/dashboard
2. Find project with `www.coparentliaizen.com`
3. Remove domain from that project
4. Add to `marketing-site` project
5. Verify `app.coparentliaizen.com` is in `chat-client-vite` project

### Option 2: Use Hostinger CLI (If You Want to Verify DNS)

If you want to verify or update DNS records:

1. Get Hostinger API token from: https://hpanel.hostinger.com → Account → API
2. Set environment variable:
   ```bash
   export HAPI_API_TOKEN='your_token'
   ```
3. Run the script:
   ```bash
   ./scripts/configure-hostinger-dns.sh
   ```

---

## Verification Commands

```bash
# Check DNS
dig www.coparentliaizen.com +short
dig app.coparentliaizen.com +short

# Both should show Vercel DNS (already correct)
```

---

## Summary

- ✅ **DNS**: Already configured correctly
- ❌ **Vercel Project Assignment**: Needs fixing
- ⚠️ **Action**: Move domains between projects in Vercel Dashboard

**No DNS changes needed** - the issue is entirely in Vercel's project configuration.
