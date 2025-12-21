# Neo4j Graph Database Integration

## Overview

The LiaiZen application automatically creates user nodes in Neo4j when new users sign up. This enables graph-based analysis of user relationships, communication patterns, and co-parenting dynamics.

## Configuration

### Environment Variables

Set these environment variables to enable Neo4j integration:

```bash
NEO4J_URI=http://localhost:7474          # Neo4j server URI
NEO4J_USER=neo4j                          # Neo4j username (default: neo4j)
NEO4J_PASSWORD=your-password              # Neo4j password (required)
NEO4J_DATABASE=neo4j                       # Database name (default: neo4j)
```

### Local Development

1. **Install Neo4j Desktop** or use Docker:

   ```bash
   docker run -d \
     --name neo4j \
     -p 7474:7474 -p 7687:7687 \
     -e NEO4J_AUTH=neo4j/your-password \
     neo4j:latest
   ```

2. **Set environment variables** in your `.env` file:

   ```bash
   NEO4J_URI=http://localhost:7474
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your-password
   ```

3. **Access Neo4j Browser**: Open http://localhost:7474 in your browser

### Production (Railway)

1. Add Neo4j service in Railway dashboard
2. Railway will automatically provide connection details
3. Set environment variables in your service:
   - `NEO4J_URI` - Provided by Railway
   - `NEO4J_USER` - Usually `neo4j`
   - `NEO4J_PASSWORD` - Provided by Railway

## User Node Structure

When a user signs up, a node is created with the following properties:

```cypher
(:User {
  userId: 123,              # PostgreSQL user ID
  username: "alice123",     # Database username (unique identifier)
  email: "alice@example.com",
  displayName: "Alice",
  createdAt: datetime()     # ISO timestamp
})
```

## Integration Points

Neo4j user nodes are automatically created when users sign up via:

- ✅ Email/password registration (`createUserWithEmail`)
- ✅ Explicit username registration (`createUser`)
- ✅ Invitation-based registration (`registerFromInvitation`)
- ✅ Short code registration (`registerFromShortCode`)
- ✅ Pairing-based registration (`registerFromPairing`)
- ✅ Google OAuth registration (`getOrCreateGoogleUser`)

## Error Handling

**Important**: Neo4j integration is **non-blocking**. If Neo4j is unavailable or misconfigured:

- ✅ User registration will still succeed
- ⚠️ Errors are logged but don't prevent user creation
- ℹ️ The application continues to function normally

This ensures that user signup is never blocked by Neo4j issues.

## Querying User Nodes

Example Cypher queries:

```cypher
// Find all users
MATCH (u:User) RETURN u LIMIT 10

// Find user by PostgreSQL ID
MATCH (u:User {userId: 123}) RETURN u

// Find user by email
MATCH (u:User {email: "alice@example.com"}) RETURN u

// Count total users
MATCH (u:User) RETURN count(u) as totalUsers
```

## Future Enhancements

Potential graph relationships to add:

- `(:User)-[:CO_PARENT_WITH]->(:User)` - Co-parenting relationships
- `(:User)-[:IN_ROOM]->(:Room)` - Room membership
- `(:User)-[:SENT_MESSAGE]->(:Message)` - Message history
- `(:User)-[:HAS_CONTACT]->(:Contact)` - Contact relationships

## Troubleshooting

### Neo4j not creating nodes

1. Check environment variables are set correctly
2. Verify Neo4j is running and accessible
3. Check server logs for Neo4j connection errors
4. Test connection manually:
   ```bash
   curl -u neo4j:password http://localhost:7474/db/neo4j/tx/commit \
     -H "Content-Type: application/json" \
     -d '{"statements":[{"statement":"RETURN 1"}]}'
   ```

### Connection errors

- Ensure `NEO4J_URI` includes protocol (`http://` or `https://`)
- Verify firewall/network allows connections to Neo4j port
- Check Neo4j authentication credentials
