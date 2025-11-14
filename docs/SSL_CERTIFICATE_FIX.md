# 🔒 SSL Certificate Fix: ERR_CERT_COMMON_NAME_INVALID

## ⚠️ Error: ERR_CERT_COMMON_NAME_INVALID

This error means the SSL certificate doesn't match the domain, usually because:
1. DNS is not pointing to Vercel correctly
2. Domain is not properly configured in Vercel
3. SSL certificate hasn't been provisioned yet
4. DNS propagation is still in progress

## 🔍 Step 1: Verify Vercel Domain Configuration

### Check Domain in Vercel Dashboard

1. **Go to Vercel Dashboard**:
   - Navigate to: https://vercel.com/dashboard
   - Click on your project (`chat-client`)

2. **Check Settings → Domains**:
   - Go to **Settings** tab
   - Click on **Domains** section
   - Verify `coparentliaizen.com` and `www.coparentliaizen.com` are listed

3. **Check Domain Status**:
   - **Valid Configuration**: Should show "Valid" or "Ready"
   - **Invalid Configuration**: Should show "Invalid Configuration" or "Missing DNS"
   - **SSL Certificate**: Should show "Valid" or "Provisioning"

### If Domain is Not Added to Vercel

1. **Add Domain**:
   - Click **Add Domain**
   - Enter: `coparentliaizen.com`
   - Click **Add**
   - Also add: `www.coparentliaizen.com`

2. **Vercel will provide DNS records**:
   - A record for root domain (@)
   - CNAME record for www subdomain
   - Copy these DNS records

## 🔍 Step 2: Verify DNS Configuration in Hostinger

### Check DNS Records in Hostinger

1. **Go to Hostinger DNS Zone Editor**:
   - Log in to Hostinger
   - Go to **Websites** → Your Domain → **DNS Zone Editor**

2. **Check Current DNS Records**:
   - Look for A record for root domain (@)
   - Look for CNAME record for www subdomain
   - Verify they point to Vercel (not Railway)

3. **Remove Old DNS Records** (if any):
   - Remove any A records pointing to Railway
   - Remove any CNAME records pointing to Railway
   - Remove any other conflicting records

### Add Vercel DNS Records

1. **Add A Record** (Root Domain):
   - **Name**: `@` (or leave blank)
   - **Type**: `A`
   - **Value**: (IP address from Vercel, e.g., `76.76.21.21`)
   - **TTL**: `3600` (or default)

2. **Add CNAME Record** (www subdomain):
   - **Name**: `www`
   - **Type**: `CNAME`
   - **Value**: (CNAME from Vercel, e.g., `cname.vercel-dns.com`)
   - **TTL**: `3600` (or default)

3. **Save DNS Records**:
   - Click **Save** or **Add Record**
   - Wait for DNS propagation (5-15 minutes)

## 🔍 Step 3: Verify DNS Propagation

### Check DNS Propagation

1. **Use DNS Checker**:
   - Visit: https://www.whatsmydns.net
   - Enter: `coparentliaizen.com`
   - Check A record points to Vercel IP
   - Check CNAME for www points to Vercel

2. **Check from Terminal**:
   ```bash
   # Check A record
   dig coparentliaizen.com A
   
   # Check CNAME record
   dig www.coparentliaizen.com CNAME
   ```

3. **Verify DNS Points to Vercel**:
   - A record should point to Vercel IP (not Railway)
   - CNAME should point to Vercel (not Railway)

## 🔍 Step 4: Wait for SSL Certificate Provisioning

### Vercel SSL Certificate

1. **Vercel Auto-Provisions SSL**:
   - Vercel automatically provisions SSL certificates
   - Usually takes 5-15 minutes after DNS is configured
   - Can take up to 24 hours in some cases

2. **Check SSL Status in Vercel**:
   - Go to **Settings** → **Domains**
   - Check SSL certificate status
   - Should show "Valid" when ready

3. **Wait for Propagation**:
   - DNS changes can take 5-15 minutes to propagate
   - SSL certificates can take additional time to provision
   - Be patient and wait for both to complete

## 🔍 Step 5: Verify SSL Certificate

### Test SSL Certificate

1. **Test Domain**:
   - Visit: `https://coparentliaizen.com`
   - Visit: `https://www.coparentliaizen.com`
   - Should not show SSL error when certificate is valid

2. **Check SSL Certificate**:
   - Click on the padlock icon in browser
   - Click "Certificate"
   - Verify certificate is valid
   - Verify certificate is issued by Vercel/Let's Encrypt

3. **Use SSL Checker**:
   - Visit: https://www.ssllabs.com/ssltest/
   - Enter: `coparentliaizen.com`
   - Check SSL certificate status

## 🆘 Troubleshooting

### DNS Not Pointing to Vercel

**Issue**: DNS still points to Railway or other service

**Solution**:
1. **Check DNS Records**:
   - Verify A record points to Vercel IP
   - Verify CNAME points to Vercel
   - Remove any conflicting records

2. **Wait for DNS Propagation**:
   - DNS changes can take 5-15 minutes
   - Can take up to 48 hours in some cases
   - Use DNS checker to verify propagation

### SSL Certificate Not Provisioned

**Issue**: SSL certificate hasn't been provisioned yet

**Solution**:
1. **Wait for SSL Provisioning**:
   - Vercel automatically provisions SSL
   - Usually takes 5-15 minutes after DNS is configured
   - Can take up to 24 hours in some cases

2. **Check Vercel Dashboard**:
   - Go to **Settings** → **Domains**
   - Check SSL certificate status
   - Should show "Valid" when ready

3. **Trigger SSL Provisioning**:
   - Remove domain from Vercel
   - Add domain again
   - This will trigger SSL provisioning

### Domain Not Added to Vercel

**Issue**: Domain is not configured in Vercel

**Solution**:
1. **Add Domain to Vercel**:
   - Go to **Settings** → **Domains**
   - Click **Add Domain**
   - Enter: `coparentliaizen.com`
   - Also add: `www.coparentliaizen.com`

2. **Verify Domain Configuration**:
   - Check domain shows as "Valid" or "Ready"
   - Verify DNS records are correct

### Mixed DNS Configuration

**Issue**: Some DNS records point to Railway, others to Vercel

**Solution**:
1. **Remove All Railway DNS Records**:
   - Remove A records pointing to Railway
   - Remove CNAME records pointing to Railway
   - Remove any other conflicting records

2. **Add Only Vercel DNS Records**:
   - Add A record pointing to Vercel
   - Add CNAME record pointing to Vercel
   - Verify all records point to Vercel

## ✅ Verification Checklist

- [ ] Domain added to Vercel (Settings → Domains)
- [ ] DNS A record points to Vercel IP (not Railway)
- [ ] DNS CNAME record points to Vercel (not Railway)
- [ ] DNS propagation complete (check with DNS checker)
- [ ] SSL certificate provisioned (check in Vercel dashboard)
- [ ] SSL certificate valid (test in browser)
- [ ] Domain accessible via HTTPS (no SSL errors)

## 📚 Additional Resources

- **Vercel Domains Docs**: https://vercel.com/docs/concepts/projects/domains
- **Vercel SSL Docs**: https://vercel.com/docs/concepts/projects/domains/ssl-certificates
- **DNS Checker**: https://www.whatsmydns.net
- **SSL Checker**: https://www.ssllabs.com/ssltest/

---

**Next Steps: Verify DNS is pointing to Vercel, then wait for SSL certificate to be provisioned!** 🔒

