# Railway Link Instructions

## Link to positive-recreation Service

Since Railway CLI requires interactive mode, run these commands in your terminal:

### Step 1: Navigate to chat-server directory
```bash
cd /Users/athenasees/Desktop/chat/chat-server
```

### Step 2: Link to Railway project
```bash
railway link
```

When prompted:
1. Select **"LiaiZen Demo"** project (ID: `6e885f2a-9248-4b5b-ab3c-242f2caa1e2a`)
2. Select **"positive-recreation"** service

### Step 3: Verify the link
```bash
railway status
```

You should see:
- Project: LiaiZen Demo
- Service: positive-recreation

### Step 4: Set Neo4j variables
```bash
railway variables --set "NEO4J_URI=http://127.0.0.1:7474"
railway variables --set "NEO4J_USER=neo4j"
railway variables --set "NEO4J_PASSWORD=kajsdfaijeoivjr"
railway variables --set "NEO4J_DATABASE=neo4j"
```

### Step 5: Verify variables were set
```bash
railway variables
```

You should see all the Neo4j variables listed.

## Alternative: Use Railway Dashboard

If CLI linking doesn't work, you can set variables directly in the Railway Dashboard:

1. Go to: https://railway.app/dashboard
2. Open **"LiaiZen Demo"** project
3. Open **"positive-recreation"** service
4. Go to **Variables** tab
5. Add these variables:
   - `NEO4J_URI` = `http://127.0.0.1:7474`
   - `NEO4J_USER` = `neo4j`
   - `NEO4J_PASSWORD` = `kajsdfaijeoivjr`
   - `NEO4J_DATABASE` = `neo4j`

