# Neo4j Railway Setup Guide

## ✅ Current Status

### Local Development
- **Neo4j URI**: `http://127.0.0.1:7474`
- **Neo4j User**: `neo4j`
- **Neo4j Database**: `neo4j`
- **Status**: ✅ Configured and working
- **Version**: Neo4j 2025.10.1 Enterprise

### Production (Railway)
- **Status**: ⚠️ Needs configuration
- **Service**: `positive-recreation`
- **Domain**: `demo-production-6dcd.up.railway.app`

## 🚀 Setting Up Neo4j in Railway

### Option 1: Using Railway CLI (Recommended)

1. **Login to Railway** (if not already):
   ```bash
   railway login
   ```

2. **Link to your project** (if needed):
   ```bash
   cd chat-server
   railway link
   ```
   Select: **LiaiZen Demo** → **positive-recreation**

3. **Set Neo4j variables**:
   ```bash
   railway variables set NEO4J_URI="http://127.0.0.1:7474"
   railway variables set NEO4J_USER="neo4j"
   railway variables set NEO4J_PASSWORD="your-neo4j-password"
   railway variables set NEO4J_DATABASE="neo4j"
   ```

   **OR use the automated script**:
   ```bash
   ./scripts/setup-neo4j-railway.sh
   ```

### Option 2: Using Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Open **LiaiZen Demo** project
3. Open **positive-recreation** service
4. Go to **Variables** tab
5. Add these variables:

   ```
   NEO4J_URI=http://127.0.0.1:7474
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your-neo4j-password
   NEO4J_DATABASE=neo4j
   ```

## 🔍 Important Notes

### Neo4j Instance Details
- **Instance ID**: `4f54574b-f88f-4d58-83e3-668bdcafafe7`
- **Instance Name**: DEMO
- **Bolt URI**: `neo4j://127.0.0.1:7687` (for cypher-shell)
- **HTTP URI**: `http://127.0.0.1:7474` (for application)

### Protocol Difference
The application uses **HTTP API** (port 7474), not Bolt protocol (port 7687):
- ✅ **HTTP API**: `http://127.0.0.1:7474` ← Use this in `NEO4J_URI`
- ❌ **Bolt**: `neo4j://127.0.0.1:7687` ← Only for cypher-shell CLI

### For Neo4j Aura/Cloud
If your Neo4j instance is on Neo4j Aura or a remote server:
```bash
NEO4J_URI=https://your-instance.neo4j.io
# or
NEO4J_URI=http://your-neo4j-server.com:7474
```

## ✅ Verification

### Test Local Connection
```bash
cd chat-server
node -e "
require('dotenv').config();
const neo4jClient = require('./src/utils/neo4jClient');
console.log('Neo4j Available:', neo4jClient.isAvailable());
"
```

### Test Railway Connection
After setting variables, check Railway logs:
```bash
railway logs
```

Look for:
- ✅ `Created Neo4j user node for userId: ...`
- ❌ `Neo4j not configured - skipping user node creation`

### Test with Cypher Shell
```bash
cypher-shell -a neo4j://127.0.0.1:7687 -u neo4j -p your-password \
  "MATCH (u:User) RETURN count(u) as user_count;"
```

## 📊 Current Database Status

The Neo4j database currently contains:
- Session nodes
- Thread nodes
- OpenQuestion nodes
- HealthCheck nodes
- Insight nodes

User nodes will be automatically created when new users sign up.

## 🔗 Integration Points

Neo4j nodes are automatically created when:
- ✅ User signs up via email/password (`createUserWithEmail`)
- ✅ User signs up via username (`createUser`)
- ✅ User registers from invitation (`registerFromInvitation`)
- ✅ User registers from short code (`registerFromShortCode`)
- ✅ Co-parent relationship is created (`createCoParentRoom`, `addUserToRoom`)

## 🛠️ Troubleshooting

### Issue: "Neo4j not configured"
- Check that `NEO4J_URI` and `NEO4J_PASSWORD` are set
- Verify variables in Railway Dashboard → Variables tab
- Check Railway logs for connection errors

### Issue: Connection refused
- Verify Neo4j is running: `neo4j status`
- Check firewall/network settings
- For remote Neo4j, verify URI is correct

### Issue: Authentication failed
- Verify `NEO4J_USER` and `NEO4J_PASSWORD` are correct
- Test with cypher-shell: `cypher-shell -a neo4j://127.0.0.1:7687 -u neo4j -p password`

## 📝 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEO4J_URI` | Yes | - | Neo4j HTTP API URI (e.g., `http://localhost:7474`) |
| `NEO4J_USER` | No | `neo4j` | Neo4j username |
| `NEO4J_PASSWORD` | Yes | - | Neo4j password |
| `NEO4J_DATABASE` | No | `neo4j` | Database name |

