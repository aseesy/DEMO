# Domain Configuration for coparentliaizen.com

This document explains how to configure DNS and deploy the application to work with `coparentliaizen.com`.

## 🌐 DNS Configuration

**YES, you need to configure DNS records!** Here's what you need:

### Current Domain Status

- **Domain**: COPARENTLIAIZEN.COM
- **Registrar**: Squarespace (migrated from Google Domains)
- **Nameservers**: Hostinger (nameservers redirected to Hostinger)
- **Status**: Active (clientTransferProhibited is normal - prevents unauthorized transfers)
- **Expiration**: 2026-01-12

### Important: Hostinger DNS Management

**Your domain nameservers have been redirected to Hostinger**. This means you now manage DNS records through Hostinger's interface, not Squarespace.

- **Hostinger**: Where you manage DNS records (https://hpanel.hostinger.com)
- **Squarespace**: Still the registrar, but DNS is managed by Hostinger
- **Google Cloud Platform**: Separate service where you might have had hosting, Cloud DNS, or other services configured

**Good News**: You don't need to find the old Google Cloud project! You can configure DNS directly in Hostinger.

### Accessing Your Domain in Hostinger

1. **Log into Hostinger**:
   - Go to https://hpanel.hostinger.com
   - Log in with your Hostinger account credentials

2. **Find Your Domain**:
   - Navigate to **"Websites"** section in the dashboard
   - Look for **COPARENTLIAIZEN.COM** in your domains list
   - If the domain isn't showing, click **"Add Website"** and enter your domain name

3. **Access DNS Settings**:
   - Click on your domain or click **"Manage"** next to it
   - Go to **"Advanced"** > **"DNS Zone Editor"** (or look for **"DNS"** or **"DNS Management"**)
   - This is where you'll add A records, CNAME records, etc.

### Finding Your Old Google Cloud Project (Optional)

If you need to recover resources from a deleted Google Cloud project:

1. **Check Google Cloud Console**:
   - Go to https://console.cloud.google.com
   - Click the project selector at the top
   - Look through all your projects (including archived/deleted ones)
   - Search for "coparentliaizen" or "liaizen" in project names

2. **Check Cloud DNS** (if you were using it):
   - Go to https://console.cloud.google.com/net-services/dns
   - Look for any DNS zones with your domain name

3. **Check Activity Logs**:
   - Go to https://console.cloud.google.com/activity
   - Filter by date range when you set up the domain
   - Look for DNS or domain-related activities

**Note**: If the project was deleted, you may not be able to recover it. But you can always reconfigure DNS in Hostinger directly!

### Option 1: VPS/Server (DigitalOcean, Linode, AWS EC2, etc.)

If you're running the server on your own VPS:

1. **Get your server's IP address** (e.g., `123.45.67.89`)

2. **Add DNS A Records in Hostinger**:
   - Go to https://hpanel.hostinger.com
   - Log in and navigate to **"Websites"**
   - Find and click on **COPARENTLIAIZEN.COM** (or click **"Manage"**)
   - Go to **"Advanced"** > **"DNS Zone Editor"**
   - Click **"Add Record"** and select **A** record type
   - Add the following A records:
   
   ```
   Type: A
   Name: @ (or leave blank for root domain)
   Value: YOUR_SERVER_IP
   TTL: 3600 (or default)
   
   Type: A
   Name: www
   Value: YOUR_SERVER_IP
   TTL: 3600 (or default)
   ```

   This points both `coparentliaizen.com` and `www.coparentliaizen.com` to your server.

   **Note**: Hostinger may show these as separate entries. Make sure both the root domain (@) and www subdomain point to your server IP.
   
   **Hostinger Tips**:
   - For root domain, use `@` or leave the name field blank
   - For www subdomain, enter `www` in the name field
   - TTL can be set to 3600 (1 hour) or use the default value

### Option 2: Platform Hosting (Heroku, Railway, Render, etc.)

If you're using a platform service:

1. **Get your app's hostname** (e.g., `your-app.herokuapp.com`)

2. **Add DNS CNAME Records in Hostinger**:
   - Go to https://hpanel.hostinger.com
   - Log in and navigate to **"Websites"**
   - Find and click on **COPARENTLIAIZEN.COM** (or click **"Manage"**)
   - Go to **"Advanced"** > **"DNS Zone Editor"**
   - Click **"Add Record"** and select **CNAME** record type
   - Add the following CNAME records:
   
   ```
   Type: CNAME
   Name: www
   Value: your-app.herokuapp.com
   TTL: 3600
   ```

   **Important for Hostinger:**
   - Hostinger **does NOT support CNAME on root domain (@)**
   - For the root domain, you'll need to:
     - Use an A record pointing to your platform's IP (if they provide one)
     - Or configure a redirect from root to www in your platform settings
     - Or use Hostinger's redirect feature if available
   - The `www` subdomain can use CNAME normally

### DNS Propagation

After adding DNS records:
- **Wait 5 minutes to 48 hours** for DNS to propagate globally
- Check propagation: https://www.whatsmydns.net/#A/coparentliaizen.com
- Test locally: `ping coparentliaizen.com` (should show your server IP)

## 🔒 SSL Certificate Setup

You **MUST** have HTTPS for production. Here are your options:

### Option A: Let's Encrypt (Free, Recommended for VPS)

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get certificate (if using nginx)
sudo certbot --nginx -d coparentliaizen.com -d www.coparentliaizen.com

# Or standalone mode (if nginx not configured yet)
sudo certbot certonly --standalone -d coparentliaizen.com -d www.coparentliaizen.com
```

Certificates auto-renew every 90 days. Set up auto-renewal:
```bash
sudo certbot renew --dry-run
```

### Option B: Cloudflare (Free SSL)

1. Use Cloudflare as your DNS provider
2. Enable "Full" or "Full (strict)" SSL mode in Cloudflare dashboard
3. SSL is automatic - no certificate installation needed

### Option C: Platform SSL (Heroku/Railway/Render)

Most platforms provide SSL automatically:
1. Add your domain in the platform dashboard
2. Platform handles SSL certificates automatically
3. Just point DNS to the platform

## 🖥️ Server Configuration

### Nginx Reverse Proxy Setup (For VPS)

Create `/etc/nginx/sites-available/coparentliaizen`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name coparentliaizen.com www.coparentliaizen.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name coparentliaizen.com www.coparentliaizen.com;
    
    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/coparentliaizen.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/coparentliaizen.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Frontend (Static files)
    location / {
        proxy_pass http://localhost:3000;  # Or wherever your frontend serves
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
    
    # WebSocket (Socket.io)
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/coparentliaizen /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Alternative: Single Server Setup

If your Node.js server serves both frontend and backend on port 3001:

```nginx
server {
    listen 443 ssl http2;
    server_name coparentliaizen.com www.coparentliaizen.com;
    
    ssl_certificate /etc/letsencrypt/live/coparentliaizen.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/coparentliaizen.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## ⚙️ Application Configuration

### Client-Side Configuration

The client automatically detects the domain and configures API URLs accordingly:

- **Production (coparentliaizen.com)**: Uses `https://coparentliaizen.com` for all API calls
- **Local Development**: Uses `http://localhost:3001` for development

The configuration is handled by `/chat-client/config.js`, which is automatically loaded before other scripts.

### Server-Side Environment Variables

Create or update `chat-server/.env` with the following:

```env
# Server Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://coparentliaizen.com,https://www.coparentliaizen.com

# Database (SQLite for now, PostgreSQL later)
# SQLite will use chat.db file automatically

# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
GMAIL_USER=info@liaizen.com
GMAIL_APP_PASSWORD=your_app_password
EMAIL_FROM=info@liaizen.com
APP_NAME=LiaiZen

# AI Moderation (OpenAI)
OPENAI_API_KEY=sk-your-openai-api-key

# Security (Optional - for JWT if you add it)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
```

### Key Configuration Points

1. **FRONTEND_URL**: This is critical for CORS. It tells the server which domains are allowed to make API requests.
   - Include both `https://coparentliaizen.com` and `https://www.coparentliaizen.com` if you want to support both
   - Separate multiple URLs with commas

2. **PORT**: The server will run on port 3001. Make sure your reverse proxy (nginx, etc.) forwards requests to this port.

## ✅ Complete Deployment Checklist

- [ ] **DNS Records**: Added A records (VPS) or CNAME records (Platform) pointing to your server
- [ ] **DNS Propagation**: Verified DNS resolves correctly (use `dig coparentliaizen.com` or https://www.whatsmydns.net)
- [ ] **SSL Certificate**: Installed and configured SSL certificate (Let's Encrypt, Cloudflare, or platform)
- [ ] **Reverse Proxy**: Configured nginx (or platform equivalent) to forward requests to port 3001
- [ ] **Environment Variables**: Created `chat-server/.env` file with production values
- [ ] **FRONTEND_URL**: Set to `https://coparentliaizen.com,https://www.coparentliaizen.com`
- [ ] **Server Running**: Started Node.js server on port 3001
- [ ] **Firewall**: Opened ports 80 (HTTP) and 443 (HTTPS) on your server
- [ ] **Test HTTPS**: Verified `https://coparentliaizen.com` loads correctly
- [ ] **Test API**: Verified API calls work from browser console
- [ ] **Test WebSocket**: Verified Socket.io connections work over HTTPS

## 🧪 Testing

After deployment, verify:

1. **DNS Resolution**: 
   ```bash
   dig coparentliaizen.com
   # Should show your server IP
   ```

2. **HTTPS Access**: 
   - Visit `https://coparentliaizen.com` in browser
   - Should show green lock icon (valid SSL)

3. **API Calls**: 
   - Open browser console (F12)
   - Check Network tab - API calls should go to `https://coparentliaizen.com/api/...`
   - No CORS errors

4. **WebSocket**: 
   - Check browser console for Socket.io connection
   - Should connect to `https://coparentliaizen.com`
   - No connection errors

## 📝 Files Modified

- `chat-client/config.js` - New file for domain detection
- `chat-client/index.html` - Updated to use configurable API URLs
- `chat-client/join.html` - Updated to use configurable API URLs
- `chat-client/service-worker.js` - Updated to skip caching for production domain

## 🆘 Troubleshooting

### DNS Not Resolving
- Wait up to 48 hours for full propagation
- Check DNS records are correct in registrar
- Verify server IP is correct

### SSL Certificate Errors
- Ensure DNS is pointing to correct server before requesting certificate
- Check certificate paths in nginx config
- Verify certbot renewal is working

### CORS Errors
- Verify `FRONTEND_URL` in `.env` matches your actual domain
- Check browser console for exact error message
- Ensure both `coparentliaizen.com` and `www.coparentliaizen.com` are in FRONTEND_URL if using both

### WebSocket Not Connecting
- Verify nginx is configured for WebSocket upgrades
- Check server logs for connection errors
- Ensure HTTPS is working (WebSocket requires HTTPS in production)

