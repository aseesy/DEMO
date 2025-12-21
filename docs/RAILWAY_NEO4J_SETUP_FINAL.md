# Railway Neo4j Setup - Final Instructions

## ⚠️ Railway CLI Issue

The Railway CLI is having issues with interactive prompts. Use the **Railway Dashboard** instead (recommended and easier).

## ✅ Recommended: Use Railway Dashboard

### Step 1: Open Railway Dashboard

1. Go to: https://railway.app/dashboard
2. Login if needed

### Step 2: Navigate to Service

1. Click on **"LiaiZen Demo"** project
2. Click on **"positive-recreation"** service

### Step 3: Set Neo4j Variables

1. Click on **"Variables"** tab
2. Click **"+ New Variable"** for each:

   **Variable 1:**
   - Key: `NEO4J_URI`
   - Value: `http://127.0.0.1:7474`
   - Click **"Add"**

   **Variable 2:**
   - Key: `NEO4J_USER`
   - Value: `neo4j`
   - Click **"Add"**

   **Variable 3:**
   - Key: `NEO4J_PASSWORD`
   - Value: `kajsdfaijeoivjr`
   - Click **"Add"**

   **Variable 4:**
   - Key: `NEO4J_DATABASE`
   - Value: `neo4j`
   - Click **"Add"**

### Step 4: Verify

After adding all variables, you should see them listed in the Variables tab:

- ✅ NEO4J_URI
- ✅ NEO4J_USER
- ✅ NEO4J_PASSWORD
- ✅ NEO4J_DATABASE

### Step 5: Wait for Redeploy

Railway will automatically redeploy your service with the new variables. Check the **Deployments** tab to see the new deployment.

## 🔍 Verify Neo4j Connection

After Railway redeploys, check the logs:

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"View Logs"**
4. Look for:
   - ✅ `Created Neo4j user node for userId: ...` (success)
   - ❌ `Neo4j not configured - skipping user node creation` (failure)

## 📝 Alternative: Fix Railway CLI (If Needed)

If you want to use Railway CLI later, try:

```bash
# Re-authenticate
railway login

# Then try linking again
cd /Users/athenasees/Desktop/chat/chat-server
railway link
```

But the Dashboard method is recommended and more reliable.

## ✅ Summary

**Current Status:**

- ✅ Local Neo4j: Configured and working
- ⚠️ Railway Neo4j: Needs variables set via Dashboard

**Next Steps:**

1. Set variables in Railway Dashboard (see above)
2. Wait for redeploy
3. Test by creating a new user (should create Neo4j node)
4. Check logs to verify connection
