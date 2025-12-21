# 🚨 Quick Fix: ERR_CERT_COMMON_NAME_INVALID

## ⚠️ The Problem

You're getting `ERR_CERT_COMMON_NAME_INVALID` when accessing `www.coparentliaizen.com`.

This means:

- DNS is not pointing to Vercel correctly, OR
- Domain is not configured in Vercel, OR
- SSL certificate hasn't been provisioned yet

## ✅ Quick Fix Steps

### Step 1: Verify Domain is Added to Vercel

1. **Go to Vercel Dashboard**:
   - Visit: https://vercel.com/dashboard
   - Click on your project (`chat-client`)

2. **Check Settings → Domains**:
   - Go to **Settings** tab
   - Click on **Domains** section
   - Verify `coparentliaizen.com` and `www.coparentliaizen.com` are listed

3. **If NOT added**:
   - Click **Add Domain**
   - Enter: `coparentliaizen.com`
   - Click **Add**
   - Also add: `www.coparentliaizen.com`

4. **Copy DNS Records from Vercel**:
   - Vercel will show you DNS records to add
   - You'll see:
     - **A Record**: `@` → `[Vercel IP]` (e.g., `76.76.21.21`)
     - **CNAME Record**: `www` → `[Vercel CNAME]` (e.g., `cname.vercel-dns.com`)

### Step 2: Check DNS Configuration in Hostinger

1. **Go to Hostinger DNS Zone Editor**:
   - Log in to Hostinger
   - Go to **Websites** → Your Domain → **DNS Zone Editor**

2. **Check Current DNS Records**:
   - Look for A record for root domain (@)
   - Look for CNAME record for www subdomain
   - **IMPORTANT**: Verify they point to Vercel (NOT Railway)

3. **Remove OLD DNS Records** (if pointing to Railway):
   - Remove any A records pointing to Railway
   - Remove any CNAME records pointing to Railway
   - Remove any other conflicting records

4. **Add Vercel DNS Records**:
   - **A Record** (Root Domain):
     - **Name**: `@` (or leave blank)
     - **Type**: `A`
     - **Value**: (IP address from Vercel - copy from Vercel dashboard)
     - **TTL**: `3600`
   - **CNAME Record** (www subdomain):
     - **Name**: `www`
     - **Type**: `CNAME`
     - **Value**: (CNAME from Vercel - copy from Vercel dashboard)
     - **TTL**: `3600`

5. **Save DNS Records**:
   - Click **Save** or **Add Record**

### Step 3: Wait for DNS Propagation

1. **DNS Propagation**:
   - DNS changes take 5-15 minutes to propagate
   - Can take up to 48 hours in some cases
   - Usually completes within 30 minutes

2. **Check DNS Propagation**:
   - Visit: https://www.whatsmydns.net
   - Enter: `coparentliaizen.com`
   - Check if A record points to Vercel IP
   - Check if CNAME for www points to Vercel

### Step 4: Wait for SSL Certificate Provisioning

1. **Vercel Auto-Provisions SSL**:
   - Vercel automatically provisions SSL certificates
   - Usually takes 5-15 minutes after DNS is configured
   - Can take up to 24 hours in some cases

2. **Check SSL Status in Vercel**:
   - Go to **Settings** → **Domains**
   - Check SSL certificate status
   - Should show "Valid" when ready

3. **Wait Patiently**:
   - DNS propagation: 5-15 minutes
   - SSL provisioning: 5-15 minutes (after DNS)
   - Total: Usually 10-30 minutes

### Step 5: Test the Domain

1. **Test Domain**:
   - Visit: `https://coparentliaizen.com`
   - Visit: `https://www.coparentliaizen.com`
   - Should not show SSL error when ready

2. **Check SSL Certificate**:
   - Click on the padlock icon in browser
   - Click "Certificate"
   - Verify certificate is valid
   - Verify certificate is issued by Vercel/Let's Encrypt

## 🔍 Common Issues

### Issue 1: DNS Still Points to Railway

**Solution**:

1. Go to Hostinger DNS Zone Editor
2. Remove ALL records pointing to Railway
3. Add ONLY Vercel DNS records
4. Wait for DNS propagation

### Issue 2: Domain Not Added to Vercel

**Solution**:

1. Go to Vercel Dashboard → Settings → Domains
2. Add `coparentliaizen.com`
3. Add `www.coparentliaizen.com`
4. Copy DNS records from Vercel
5. Add DNS records to Hostinger

### Issue 3: SSL Certificate Not Provisioned

**Solution**:

1. Verify DNS is pointing to Vercel correctly
2. Wait 5-15 minutes for SSL provisioning
3. Check SSL status in Vercel dashboard
4. If still not working, remove domain from Vercel and add it again

### Issue 4: Mixed DNS Configuration

**Solution**:

1. Remove ALL old DNS records
2. Add ONLY Vercel DNS records
3. Verify all records point to Vercel (not Railway)
4. Wait for DNS propagation

## ✅ Verification Checklist

- [ ] Domain added to Vercel (Settings → Domains)
- [ ] DNS A record points to Vercel IP (not Railway)
- [ ] DNS CNAME record points to Vercel (not Railway)
- [ ] All old DNS records removed (pointing to Railway)
- [ ] DNS propagation complete (check with DNS checker)
- [ ] SSL certificate provisioned (check in Vercel dashboard)
- [ ] SSL certificate valid (test in browser)
- [ ] Domain accessible via HTTPS (no SSL errors)

## 🎯 Summary

**The fix**:

1. ✅ Add domain to Vercel (if not added)
2. ✅ Update DNS in Hostinger to point to Vercel (not Railway)
3. ✅ Remove old DNS records pointing to Railway
4. ✅ Wait for DNS propagation (5-15 minutes)
5. ✅ Wait for SSL certificate provisioning (5-15 minutes)
6. ✅ Test domain - should work without SSL errors

**Most common issue**: DNS still pointing to Railway instead of Vercel.

**Quick check**: Use https://www.whatsmydns.net to verify DNS points to Vercel.

---

**Next Steps: Check DNS in Hostinger, ensure it points to Vercel (not Railway), then wait for DNS and SSL to complete!** 🔒
