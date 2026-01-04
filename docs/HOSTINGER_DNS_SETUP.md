# Hostinger DNS Configuration Guide

## Current DNS Status

Based on DNS lookups:

- ✅ `www.coparentliaizen.com` → Points to Vercel (`55f5b5891d608fd9.vercel-dns-016.com`)
- ✅ `app.coparentliaizen.com` → Points to Vercel (`55f5b5891d608fd9.vercel-dns-016.com`)

**Note**: Both domains are already pointing to Vercel DNS. The issue is **project assignment in Vercel**, not DNS configuration.

---

## Hostinger API CLI Setup

### Step 1: Install Hostinger API CLI

```bash
# Download for macOS
cd ~
curl -L -o hapi.tar.gz https://github.com/hostinger/api-cli/releases/latest/download/hapi-darwin-amd64.tar.gz

# Extract
tar -xzf hapi.tar.gz

# Move to PATH
sudo mv hapi /usr/local/bin/hapi
# OR
mkdir -p ~/.local/bin
mv hapi ~/.local/bin/hapi
export PATH="$PATH:$HOME/.local/bin"
```

### Step 2: Get API Token

1. Log in to Hostinger: https://hpanel.hostinger.com
2. Go to **Account Settings** → **API**
3. Generate a new token
4. Copy the token

### Step 3: Configure CLI

**Option A: Environment Variable**

```bash
export HAPI_API_TOKEN="your_api_token_here"
```

**Option B: Config File**

```bash
# Download config template
curl -o ~/.hapi.yaml https://raw.githubusercontent.com/hostinger/api-cli/main/hapi.yaml

# Edit and add your token
nano ~/.hapi.yaml
# Add: api_token: your_api_token_here
```

### Step 4: Verify Installation

```bash
hapi --help
```

---

## DNS Records Needed

### For Marketing Site (www.coparentliaizen.com)

Vercel will provide DNS instructions. Typically:

- **CNAME Record**:
  - **Name**: `www`
  - **Type**: `CNAME`
  - **Value**: `cname.vercel-dns.com` (or specific Vercel CNAME)
  - **TTL**: `3600`

### For Main App (app.coparentliaizen.com)

Vercel will provide DNS instructions. Typically:

- **CNAME Record**:
  - **Name**: `app`
  - **Type**: `CNAME`
  - **Value**: `cname.vercel-dns.com` (or specific Vercel CNAME)
  - **TTL**: `3600`

---

## Using Hostinger API CLI

### List DNS Records

```bash
# List all DNS zones
hapi dns zone list

# Get DNS records for a domain
hapi dns record list --domain coparentliaizen.com
```

### Add DNS Records

```bash
# Add CNAME for www
hapi dns record create \
  --domain coparentliaizen.com \
  --type CNAME \
  --name www \
  --value cname.vercel-dns.com \
  --ttl 3600

# Add CNAME for app
hapi dns record create \
  --domain coparentliaizen.com \
  --type CNAME \
  --name app \
  --value cname.vercel-dns.com \
  --ttl 3600
```

### Update DNS Records

```bash
# Update existing record (need record ID first)
hapi dns record update \
  --domain coparentliaizen.com \
  --id <record_id> \
  --value new-cname.vercel-dns.com
```

### Delete DNS Records

```bash
# Delete a record
hapi dns record delete \
  --domain coparentliaizen.com \
  --id <record_id>
```

---

## Important Notes

1. **DNS is Already Configured**: Both domains are pointing to Vercel
2. **Issue is Vercel Project Assignment**: The domain `www.coparentliaizen.com` needs to be moved from the old project to `marketing-site` project in Vercel dashboard
3. **No DNS Changes Needed**: If both domains already point to Vercel, you only need to:
   - Move `www.coparentliaizen.com` to marketing-site project in Vercel
   - Ensure `app.coparentliaizen.com` is assigned to chat-client-vite project

---

## Verification

After making changes:

```bash
# Check DNS propagation
dig www.coparentliaizen.com +short
dig app.coparentliaizen.com +short

# Should show Vercel DNS records
```

---

## Alternative: Manual DNS Configuration

If you prefer to configure DNS manually in Hostinger:

1. Go to: https://hpanel.hostinger.com
2. Navigate to: **Websites** → **coparentliaizen.com** → **DNS Zone Editor**
3. Add/Update records as needed
4. Wait for DNS propagation (5-30 minutes)
