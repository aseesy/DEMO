# DNS and Vercel Status

**Date**: January 3, 2026

---

## ✅ DNS Status: CORRECT

Both domains are correctly pointing to Vercel:

```bash
$ dig www.coparentliaizen.com +short
55f5b5891d608fd9.vercel-dns-016.com.

$ dig app.coparentliaizen.com +short
55f5b5891d608fd9.vercel-dns-016.com.
```

**Conclusion**: DNS in Hostinger is correctly configured. No DNS changes needed.

---

## ❌ Vercel Project Assignment Issue

### Problem

- `www.coparentliaizen.com` is assigned to another Vercel project (not `marketing-site`)
- Cannot add it to `marketing-site` because it's already assigned elsewhere
- Error: `Cannot add www.coparentliaizen.com since it's already assigned to another project. (400)`

### Solution

**Must be done in Vercel Dashboard** (not via CLI):

1. **Find the project with `www.coparentliaizen.com`**:
   - Go to: https://vercel.com/dashboard
   - Check all projects in your account
   - Look for `www.coparentliaizen.com` in Settings → Domains

2. **Remove domain from old project**:
   - Go to that project → Settings → Domains
   - Find `www.coparentliaizen.com`
   - Click "Remove" or "..." → "Remove"

3. **Add to marketing-site project**:
   - Go to `marketing-site` project → Settings → Domains
   - Click "Add Domain"
   - Enter: `www.coparentliaizen.com`
   - Follow any DNS instructions (though DNS is already correct)

---

## Hostinger API Token

✅ **Token loaded from**: `chat-server/.env`

- Variable: `HAPI_API_TOKEN`
- Status: Token found and loaded

**Note**: Hostinger API endpoints are returning Cloudflare errors (1016), but this is not critical since:

1. DNS is already correctly configured
2. The issue is Vercel project assignment, not DNS

---

## Current Status Summary

| Component     | Status           | Action Needed                 |
| ------------- | ---------------- | ----------------------------- |
| DNS (www)     | ✅ Correct       | None                          |
| DNS (app)     | ✅ Correct       | None                          |
| Vercel (www)  | ❌ Wrong project | Move to marketing-site        |
| Vercel (app)  | ⚠️ Unknown       | Verify assignment             |
| Hostinger API | ⚠️ API errors    | Not critical (DNS is correct) |

---

## Next Steps

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Find project with `www.coparentliaizen.com`**
3. **Remove domain from that project**
4. **Add to `marketing-site` project**
5. **Verify `app.coparentliaizen.com` is in `chat-client-vite` project**

---

## Verification Commands

```bash
# Check DNS (already correct)
dig www.coparentliaizen.com +short
dig app.coparentliaizen.com +short

# Check Vercel domains (after fixing)
cd marketing-site && vercel domains ls
cd ../chat-client-vite && vercel domains ls
```
