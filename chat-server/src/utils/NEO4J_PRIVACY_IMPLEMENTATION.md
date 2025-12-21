# Neo4j Privacy Implementation Guide

## Privacy Safeguards Implemented ✅

### 1. **Data Minimization**

- ✅ **Email removed from Neo4j nodes** - Only userId, username, and displayName stored
- ✅ Email remains in PostgreSQL only (source of truth)
- ✅ Reduces data exposure if Neo4j is compromised

### 2. **Query Authentication**

- ✅ `getCoParents()` now requires `authenticatedUserId` parameter
- ✅ Validates that user can only query their own relationships
- ✅ Throws error if user attempts to query another user's data

### 3. **Secure Query Function**

- ✅ `getCoParentsSecure()` - Automatically enforces authentication
- ✅ Use this from API routes where `req.user` is available
- ✅ Prevents accidental privacy violations

## Usage Examples

### ✅ CORRECT: Using from API Route (Secure)

```javascript
// In routes/user.js or similar
router.get('/co-parents', authenticate, async (req, res) => {
  try {
    // req.user.id is guaranteed to be authenticated user's ID
    const coParents = await neo4jClient.getCoParentsSecure(req.user.id);
    res.json({ coParents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### ✅ CORRECT: Manual Authentication Check

```javascript
// When you have authenticatedUserId from elsewhere
const authenticatedUserId = req.user.id; // From JWT token
const coParents = await neo4jClient.getCoParents(authenticatedUserId, authenticatedUserId);
```

### ❌ WRONG: No Authentication Check

```javascript
// DON'T DO THIS - No privacy protection
const userId = req.params.userId; // Could be any user!
const coParents = await neo4jClient.getCoParents(userId); // Privacy violation!
```

### ❌ WRONG: Querying Other User's Data

```javascript
// DON'T DO THIS - Will throw error (good!)
const otherUserId = 999; // Different user
const authenticatedUserId = 123; // Current user
const coParents = await neo4jClient.getCoParents(otherUserId, authenticatedUserId);
// Throws: "Unauthorized: Cannot query other users' relationships"
```

## Privacy Principles Enforced

1. **Principle of Least Privilege** ✅
   - Users can only access their own relationships
   - Enforced at function level

2. **Data Minimization** ✅
   - Email not stored in Neo4j
   - Only graph-necessary data stored

3. **Defense in Depth** ✅
   - Authentication required at API level
   - Validation at Neo4j client level
   - Query scoping in Cypher queries

## API Route Integration

### Example: Get User's Co-Parents Endpoint

```javascript
// routes/user.js
const neo4jClient = require('../src/utils/neo4jClient');
const { authenticate } = require('../middleware/auth');

router.get('/co-parents', authenticate, async (req, res) => {
  try {
    // req.user.id is guaranteed to be authenticated user's ID
    const coParents = await neo4jClient.getCoParentsSecure(req.user.id);

    res.json({
      success: true,
      coParents: coParents.map(cp => ({
        userId: cp.userId,
        displayName: cp.displayName,
        roomId: cp.roomId,
      })),
    });
  } catch (error) {
    console.error('Error fetching co-parents:', error);
    res.status(500).json({
      error: 'Failed to fetch co-parents',
      message: error.message,
    });
  }
});
```

## Privacy Checklist for New Features

When adding new Neo4j query functions:

- [ ] Add `authenticatedUserId` parameter
- [ ] Validate `userId === authenticatedUserId`
- [ ] Log privacy violations
- [ ] Don't store sensitive data (email, passwords, etc.)
- [ ] Scope queries to authenticated user only
- [ ] Use `getCoParentsSecure()` pattern for API routes
- [ ] Document privacy considerations in function JSDoc

## Network Security (Production)

### Neo4j Access Control

1. **Firewall Rules**
   - Neo4j should only accept connections from application servers
   - Block direct internet access to Neo4j ports (7474, 7687)

2. **VPN/Private Network**
   - Deploy Neo4j in private network/VPC
   - Application servers connect via private network only

3. **Authentication**
   - Use strong, unique password for Neo4j service account
   - Rotate credentials regularly
   - Enable Neo4j authentication (if available)

4. **Encryption**
   - Use HTTPS for Neo4j HTTP API (`https://` in `NEO4J_URI`)
   - Enable TLS for Bolt protocol (if using driver)

## Monitoring & Auditing

### Log Privacy Violations

```javascript
// Already implemented in getCoParents()
if (authenticatedUserId !== null && userId !== authenticatedUserId) {
  console.error(
    `❌ PRIVACY VIOLATION: User ${authenticatedUserId} attempted to query relationships for user ${userId}`
  );
  throw new Error("Unauthorized: Cannot query other users' relationships");
}
```

### Recommended: Add Audit Logging

```javascript
// Future enhancement: Log all Neo4j queries
async function executeCypher(query, params = {}, userId = null) {
  // Log query with user context
  if (userId) {
    console.log(`[Neo4j Query] User ${userId}: ${query.substring(0, 100)}...`);
  }
  // ... execute query
}
```

## Data Retention & Deletion

### User Deletion

When a user deletes their account:

1. Delete user node from Neo4j
2. Delete all relationships involving that user
3. Delete room memberships

```cypher
// Delete user and all relationships
MATCH (u:User {userId: $userId})-[r]-()
DELETE r, u
```

## Summary

✅ **Privacy safeguards implemented:**

- Data minimization (no email in Neo4j)
- Query authentication and authorization
- Secure query functions for API routes
- Privacy violation detection and logging

⚠️ **Still needed for production:**

- Network security (firewall/VPN)
- Strong credentials and rotation
- Audit logging for compliance
- User data deletion procedures
