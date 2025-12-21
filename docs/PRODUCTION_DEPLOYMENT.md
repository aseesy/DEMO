# 🚀 Production Deployment Guide - LiaiZen

Complete guide to move LiaiZen from development to production and start getting real users.

## 📋 Pre-Deployment Checklist

### ✅ Critical Security (Must Fix Before Launch)

- [ ] **Fix SQL Injection** - Already using `dbSafe` with parameterized queries ✅
- [ ] **Password Hashing** - Check if using bcrypt (already in dependencies)
- [ ] **HTTPS/SSL Certificate** - Required for production
- [ ] **Environment Variables** - All secrets in `.env`, never in code
- [ ] **CORS Configuration** - Set to production domain only
- [ ] **Rate Limiting** - Already configured ✅
- [ ] **Input Sanitization** - Already implemented ✅

### ✅ Infrastructure Setup

- [ ] **Hosting Provider** - Choose and set up (see options below)
- [ ] **Domain Name** - Purchase and configure DNS
- [ ] **SSL Certificate** - Free via Let's Encrypt
- [ ] **Database** - SQLite for small scale, PostgreSQL for growth
- [ ] **Backup Strategy** - Automated daily backups
- [ ] **Monitoring** - Error tracking and uptime monitoring

### ✅ Application Configuration

- [ ] **Environment Variables** - Production `.env` file
- [ ] **Email Service** - Gmail/email provider configured
- [ ] **AI API Key** - OpenAI API key for moderation
- [ ] **Frontend Build** - Optimize and minify assets
- [ ] **PWA Icons** - App icons ready ✅

---

## 🏗️ Step 1: Choose Your Hosting Provider

### Option A: VPS (Recommended for Start)

**Best for:** Full control, cost-effective, scalable

**Providers:**

- **DigitalOcean** ($6-12/month) - Simple, great docs
- **Linode** ($5-10/month) - Good performance
- **Vultr** ($6/month) - Competitive pricing
- **AWS Lightsail** ($3.50-10/month) - AWS ecosystem

**Pros:**

- Full control
- Can run both frontend and backend
- Easy to scale
- Cost-effective

**Cons:**

- Requires server management
- Need to set up SSL yourself

### Option B: Platform as a Service (Easiest)

**Best for:** Quick deployment, minimal setup

**Providers:**

- **Heroku** ($7-25/month) - Easiest, but more expensive
- **Railway** ($5-20/month) - Modern, good DX
- **Render** ($7-25/month) - Simple, good free tier
- **Fly.io** ($3-15/month) - Global edge deployment

**Pros:**

- Automatic SSL
- Easy deployments
- Built-in monitoring
- Less server management

**Cons:**

- More expensive
- Less control
- Vendor lock-in

### Option C: Cloud Providers (For Scale)

**Best for:** Large scale, enterprise needs

**Providers:**

- **AWS** (EC2, ECS, Lambda)
- **Google Cloud Platform** (Compute Engine, Cloud Run)
- **Microsoft Azure** (App Service, Container Instances)

**Pros:**

- Highly scalable
- Enterprise features
- Global infrastructure

**Cons:**

- Complex setup
- Can be expensive
- Steeper learning curve

---

## 🔧 Step 2: Environment Configuration

### Create Production `.env` File

Create `chat-server/.env` with these variables:

```env
# Server Configuration
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com

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

# Optional: Database URL (if using PostgreSQL)
# DATABASE_URL=postgresql://user:password@host:5432/liaizen
```

### Frontend Configuration

Update `chat-client/index.html` or create environment config:

```javascript
// Update SOCKET_URL for production
const SOCKET_URL = process.env.VITE_SOCKET_URL || 'https://api.yourdomain.com';
```

---

## 🌐 Step 3: Domain & SSL Setup

### 3.1 Purchase Domain

1. Buy domain from:
   - Namecheap ($10-15/year)
   - Google Domains ($12/year)
   - Cloudflare ($8-10/year - includes free privacy)

2. Recommended domains:
   - `liaizen.com` (if available)
   - `liaizen.app`
   - `getliaizen.com`

### 3.2 DNS Configuration

Point your domain to your server:

**For VPS:**

```
A Record: @ → YOUR_SERVER_IP
A Record: www → YOUR_SERVER_IP
```

**For Platform (Heroku/Railway/etc):**

```
CNAME: @ → your-app.herokuapp.com
CNAME: www → your-app.herokuapp.com
```

### 3.3 SSL Certificate (HTTPS)

**Option A: Let's Encrypt (Free) - Recommended**

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Auto-renewal (add to crontab)
sudo certbot renew --dry-run
```

**Option B: Cloudflare (Free SSL)**

- Use Cloudflare as DNS provider
- Enable "Full" SSL mode
- Automatic SSL for free

**Option C: Platform SSL**

- Heroku/Railway/Render provide SSL automatically
- Just add your domain in dashboard

---

## 🗄️ Step 4: Database Setup

### Option A: Keep SQLite (For < 100 Users)

**Good for:** Starting out, MVP launch

**Setup:**

- SQLite file (`chat.db`) works as-is
- Ensure proper file permissions
- Set up automated backups

**Backup Script:**

```bash
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
cp /path/to/chat.db /backups/chat_$DATE.db
# Keep only last 30 days
find /backups -name "chat_*.db" -mtime +30 -delete
```

**Cron Job (Daily at 2 AM):**

```bash
0 2 * * * /path/to/backup-db.sh
```

### Option B: PostgreSQL (For Growth)

**When to migrate:** 50+ concurrent users, need better performance

**Setup:**

1. Install PostgreSQL on server or use managed service
2. Create database and user
3. Migrate data from SQLite
4. Update connection code

**Managed Options:**

- **Supabase** (Free tier, PostgreSQL)
- **Railway** (PostgreSQL addon)
- **Heroku Postgres** (Addon)
- **AWS RDS** (Full control)

---

## 📧 Step 5: Email Configuration

### Gmail Setup (Already Documented)

See `chat-server/GMAIL_SETUP.md` for detailed instructions.

**Quick Setup:**

1. Enable 2-Step Verification on Gmail
2. Generate App Password
3. Add to `.env`:
   ```env
   GMAIL_USER=info@liaizen.com
   GMAIL_APP_PASSWORD=your_16_char_app_password
   ```

**Alternative Email Services:**

- **SendGrid** (Free: 100 emails/day)
- **Mailgun** (Free: 5,000 emails/month)
- **AWS SES** (Very cheap, $0.10 per 1,000 emails)

---

## 🚀 Step 6: Deployment Process

### VPS Deployment (DigitalOcean Example)

**1. Server Setup:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (reverse proxy)
sudo apt install -y nginx
```

**2. Deploy Application:**

```bash
# Clone your repo or upload files
cd /var/www
git clone your-repo-url liaizen
cd liaizen

# Install dependencies
cd chat-server && npm install --production
cd ../chat-client && npm install --production

# Create .env file
nano chat-server/.env
# (paste your production .env content)

# Start with PM2
cd chat-server
pm2 start server.js --name liaizen-backend
pm2 save
pm2 startup  # Auto-start on reboot

# Start frontend
cd ../chat-client
pm2 start "npm start" --name liaizen-frontend
pm2 save
```

**3. Configure Nginx:**

```nginx
# /etc/nginx/sites-available/liaizen
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
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

    # WebSocket
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

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/liaizen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Platform Deployment (Heroku Example)

**1. Install Heroku CLI:**

```bash
npm install -g heroku
heroku login
```

**2. Create Apps:**

```bash
# Backend
cd chat-server
heroku create liaizen-api
heroku config:set NODE_ENV=production
heroku config:set FRONTEND_URL=https://liaizen.herokuapp.com
# Add all other env vars
heroku config:set OPENAI_API_KEY=sk-...
git push heroku main

# Frontend
cd ../chat-client
heroku create liaizen
heroku config:set VITE_SOCKET_URL=https://liaizen-api.herokuapp.com
git push heroku main
```

---

## 🔒 Step 7: Security Hardening

### 7.1 Update CORS for Production

In `chat-server/server.js`, ensure:

```javascript
const allowedOrigins = (process.env.FRONTEND_URL || 'https://yourdomain.com')
  .split(',')
  .map(url => url.trim());
```

### 7.2 Environment-Specific Error Messages

Already implemented ✅ - Errors only show details in development.

### 7.3 Rate Limiting

Already configured ✅ - 100 requests per 15 minutes per IP.

### 7.4 Security Headers

Already using Helmet.js ✅

### 7.5 Firewall Configuration

```bash
# UFW (Ubuntu Firewall)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 📊 Step 8: Monitoring & Logging

### 8.1 Error Tracking

**Free Options:**

- **Sentry** (Free: 5,000 events/month)
- **LogRocket** (Free trial)
- **Rollbar** (Free: 5,000 events/month)

**Setup Sentry:**

```bash
npm install @sentry/node
```

```javascript
// In server.js
const Sentry = require('@sentry/node');
Sentry.init({ dsn: 'your-sentry-dsn' });
```

### 8.2 Uptime Monitoring

**Free Services:**

- **UptimeRobot** (Free: 50 monitors)
- **Pingdom** (Free trial)
- **StatusCake** (Free tier)

### 8.3 Application Logs

**PM2 Logs:**

```bash
pm2 logs liaizen-backend
pm2 logs liaizen-frontend
```

**Log Rotation:**

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 🧪 Step 9: Testing Checklist

### Pre-Launch Testing

- [ ] **Authentication** - Sign up, login, logout work
- [ ] **Chat** - Messages send/receive in real-time
- [ ] **Invites** - Co-parent invitation flow works
- [ ] **AI Moderation** - Message moderation working
- [ ] **Mobile** - Test on iPhone and Android
- [ ] **PWA Install** - Can install on mobile devices
- [ ] **Email** - Invitation emails send successfully
- [ ] **Database** - Data persists correctly
- [ ] **Performance** - Load time < 3 seconds
- [ ] **SSL** - HTTPS works, no mixed content warnings

### Load Testing

**Tools:**

- **Apache Bench** (simple)
- **k6** (free, powerful)
- **Loader.io** (free tier)

**Test Scenarios:**

- 10 concurrent users
- 50 concurrent users
- 100 concurrent users

---

## 📱 Step 10: Mobile App Distribution

### PWA Installation

Already set up ✅ - Users can install from browser.

### App Store Distribution (Future)

For native app stores, consider:

- **Capacitor** - Wrap PWA as native app
- **React Native** - Full native rewrite (more work)

---

## 💰 Cost Estimates

### Infrastructure Costs

#### Minimal Setup (VPS)

- **Domain:** $10-15/year
- **VPS (DigitalOcean):** $6-12/month
- **Email (Gmail):** Free
- **SSL (Let's Encrypt):** Free
- **Total Infrastructure:** ~$82-159/year

#### Platform Setup (Heroku)

- **Domain:** $10-15/year
- **Backend (Heroku):** $7-25/month
- **Frontend (Heroku):** $7-25/month
- **Email:** Free (Gmail) or $15/month (SendGrid)
- **Total Infrastructure:** ~$178-630/year

#### Scale Setup (AWS)

- **Domain:** $10-15/year
- **EC2:** $10-50/month
- **RDS (PostgreSQL):** $15-100/month
- **S3 (Backups):** $1-5/month
- **Total Infrastructure:** ~$432-2,040/year

### Feature Pricing (3 Tiers)

#### Tier 1: AI Mediation

- **Monthly:** $15/month
- **Yearly:** $180/year (14 months - 2 months free)

#### Tier 2: Integrated Co-Parent Platform

- **Monthly:** $20/month
- **Yearly:** $240/year (14 months - 2 months free)
- Includes: Calendar, Expenses, Document Sharing

#### Tier 3: Analytics and Coaching

- **Monthly:** $25/month
- **Yearly:** $300/year (14 months - 2 months free)

### Infrastructure Costs (Separate)

- **VPS (DigitalOcean):** $6-12/month
- **Platform (Railway/Render):** $0-7/month (free tier) or $7-25/month
- **Domain:** $10-15/year
- **Email:** Free (Gmail)
- **SSL:** Free (Let's Encrypt)

---

## 🎯 Launch Strategy

### Phase 1: Soft Launch (Week 1-2)

- [ ] Deploy to production
- [ ] Test with 5-10 beta users
- [ ] Monitor for issues
- [ ] Fix critical bugs

### Phase 2: Limited Launch (Week 3-4)

- [ ] Invite 50-100 users
- [ ] Gather feedback
- [ ] Monitor performance
- [ ] Optimize based on usage

### Phase 3: Public Launch (Month 2+)

- [ ] Marketing website
- [ ] Social media presence
- [ ] User onboarding flow
- [ ] Support system

---

## 🚨 Critical Issues to Address

### Before Launch:

1. **Password Hashing** - Verify using bcrypt (check `auth.js`)
2. **Database Backups** - Set up automated daily backups
3. **Error Monitoring** - Set up Sentry or similar
4. **Uptime Monitoring** - Set up UptimeRobot
5. **SSL Certificate** - HTTPS is mandatory
6. **Environment Variables** - All secrets in `.env`

### First Month:

1. **Database Migration** - Consider PostgreSQL if growing
2. **Performance Monitoring** - Track response times
3. **User Analytics** - Track usage patterns
4. **Backup Testing** - Verify restore process works

---

## 📞 Support & Maintenance

### Daily:

- Check error logs
- Monitor uptime
- Review user feedback

### Weekly:

- Review analytics
- Test backup restore
- Update dependencies (security patches)

### Monthly:

- Performance review
- Security audit
- User feedback analysis
- Plan improvements

---

## 🎓 Resources

- **DigitalOcean Tutorials:** https://www.digitalocean.com/community/tags/node-js
- **Let's Encrypt:** https://letsencrypt.org/getting-started/
- **PM2 Docs:** https://pm2.keymetrics.io/docs/
- **Nginx Config:** https://nginx.org/en/docs/

---

## ✅ Quick Start Commands

```bash
# 1. Set up server
ssh user@your-server-ip

# 2. Install dependencies
sudo apt update && sudo apt install -y nodejs nginx

# 3. Clone and deploy
git clone your-repo
cd liaizen/chat-server
npm install --production
cp .env.example .env
nano .env  # Edit with production values

# 4. Start with PM2
npm install -g pm2
pm2 start server.js --name liaizen-api
pm2 save
pm2 startup

# 5. Set up SSL
sudo certbot --nginx -d yourdomain.com

# 6. Configure Nginx (see config above)
sudo nano /etc/nginx/sites-available/liaizen
sudo systemctl restart nginx
```

---

**You're ready to launch! 🚀**

Start with a VPS (DigitalOcean) for the best balance of control and simplicity. The setup above will get you production-ready in about 2-4 hours.
