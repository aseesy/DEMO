# How to Access and View Database

## Method 1: API Debug Endpoint (Easiest)

The server has a debug endpoint that returns all users in JSON format.

### In Browser:

Open this URL while the server is running:

```
http://localhost:3001/api/debug/users
```

### Using curl:

```bash
curl http://localhost:3001/api/debug/users
```

### Pretty print with jq (if installed):

```bash
curl -s http://localhost:3001/api/debug/users | jq .
```

---

## Method 2: SQLite Command Line (Direct Database Access)

If you have `sqlite3` installed (comes with macOS by default):

### View all users:

```bash
cd /Users/athenasees/Desktop/chat/chat-server
sqlite3 chat.db "SELECT id, username, email, created_at, last_login FROM users ORDER BY created_at DESC;"
```

### View all users with better formatting:

```bash
sqlite3 chat.db -header -column "SELECT id, username, email, created_at, last_login FROM users ORDER BY created_at DESC;"
```

### View all tables:

```bash
sqlite3 chat.db ".tables"
```

### View all pending connections:

```bash
sqlite3 chat.db -header -column "SELECT * FROM pending_connections;"
```

### View all rooms:

```bash
sqlite3 chat.db -header -column "SELECT * FROM rooms;"
```

### Interactive SQLite shell:

```bash
sqlite3 chat.db
# Then you can run SQL queries:
# SELECT * FROM users;
# .tables
# .schema users
# .quit
```

---

## Method 3: Using Node.js Script

Create a simple script to view users:

```javascript
// view-users.js
const dbModule = require('./db');
const dbSafe = require('./dbSafe');

async function viewUsers() {
  const db = await dbModule.getDb();
  const result = await dbSafe.safeSelect(
    'users',
    {},
    {
      orderBy: 'created_at',
      orderDirection: 'DESC',
    }
  );

  const users = dbSafe.parseResult(result);
  console.log('\n📊 All Users:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  users.forEach(user => {
    console.log(
      `ID: ${user.id} | Username: ${user.username} | Email: ${user.email || 'N/A'} | Created: ${user.created_at}`
    );
  });
  console.log(`\nTotal: ${users.length} users\n`);
}

viewUsers().catch(console.error);
```

Then run:

```bash
node view-users.js
```

---

## Method 4: View Database File Directly

The database file is located at:

```
/Users/athenasees/Desktop/chat/chat-server/chat.db
```

You can:

- Use SQLite browser tools (like DB Browser for SQLite)
- Copy the file to view it elsewhere
- Use any SQLite-compatible tool

---

## Quick Commands Reference

### View Users (API):

```bash
curl http://localhost:3001/api/debug/users | jq .
```

### View Users (SQLite):

```bash
sqlite3 chat.db -header -column "SELECT * FROM users;"
```

### View Pending Connections:

```bash
curl http://localhost:3001/api/debug/pending-connections | jq .
```

### Count Users:

```bash
sqlite3 chat.db "SELECT COUNT(*) as total_users FROM users;"
```

---

## Important Notes

- The database file is `chat.db` in the `chat-server` directory
- The API debug endpoints only work when the server is running
- SQLite commands work directly on the database file
- Be careful with DELETE/UPDATE commands - always backup first!

---

## Backup Database

Before making changes, backup:

```bash
cp chat.db chat.db.backup
```
