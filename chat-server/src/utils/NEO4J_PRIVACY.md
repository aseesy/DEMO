# Neo4j Privacy & Security Considerations

## Current Privacy Risks ⚠️

### 1. **No Query-Level Authentication**
- `getCoParents()` accepts any userId without verifying the caller
- No check that the requesting user is authenticated
- No verification that user can only query their own relationships

### 2. **Server-Side Service Account**
- All queries use single Neo4j service account (`NEO4J_USER`/`NEO4J_PASSWORD`)
- Any code that can call Neo4j functions has full database access
- No per-user access control in Neo4j

### 3. **Email Storage in Graph**
- User emails are stored in Neo4j nodes
- If Neo4j is compromised, emails could be exposed
- Consider data minimization principles

### 4. **No Query Scoping**
- Queries don't filter by authenticated user context
- Could potentially query other users' relationships if userId is manipulated

## Privacy Safeguards Needed ✅

### 1. **Query Authentication & Authorization**
- All query functions should verify the requesting user is authenticated
- Users should only be able to query their own relationships
- Add `req.user` or `authenticatedUserId` parameter to all query functions

### 2. **Data Minimization**
- Consider removing email from Neo4j nodes (only store userId, username, displayName)
- Email is already in PostgreSQL - no need to duplicate in Neo4j

### 3. **Query Scoping**
- All queries should be scoped to the authenticated user
- Never allow queries for other users' data
- Add validation: `if (requestedUserId !== authenticatedUserId) throw error`

### 4. **Access Control**
- Neo4j should be behind firewall/VPN in production
- Use strong passwords for Neo4j service account
- Rotate credentials regularly
- Enable Neo4j authentication and authorization (if available)

### 5. **Audit Logging**
- Log all Neo4j queries with user context
- Track who accessed what data
- Monitor for suspicious query patterns

## Recommended Implementation

### Secure Query Pattern
```javascript
async function getCoParents(userId, authenticatedUserId) {
  // PRIVACY: Verify user can only query their own relationships
  if (userId !== authenticatedUserId) {
    throw new Error('Unauthorized: Cannot query other users\' relationships');
  }
  
  // Query only relationships where user is a participant
  const query = `
    MATCH (u:User {userId: $userId})-[r:CO_PARENT_WITH {active: true}]->(coParent:User)
    RETURN coParent.userId, coParent.displayName, r.roomId
  `;
  // ...
}
```

### Data Minimization
```javascript
// Remove email from user nodes - only store what's needed for graph queries
CREATE (u:User {
  userId: $userId,
  username: $username,
  displayName: $displayName,  // ✅ Keep
  // email: $email,  // ❌ Remove - not needed for graph queries
  createdAt: datetime()
})
```

## Privacy Principles

1. **Principle of Least Privilege**: Users can only access their own data
2. **Data Minimization**: Store only what's necessary for graph queries
3. **Defense in Depth**: Multiple layers of protection (auth, query scoping, network security)
4. **Audit Trail**: Log all data access for compliance and security

## Production Checklist

- [ ] Add authentication checks to all query functions
- [ ] Remove email from Neo4j user nodes
- [ ] Add query scoping (users can only query their own data)
- [ ] Secure Neo4j network (firewall/VPN)
- [ ] Use strong, rotated credentials
- [ ] Enable Neo4j audit logging
- [ ] Document privacy policy for users
- [ ] Add rate limiting to Neo4j queries
- [ ] Implement query monitoring/alerts

