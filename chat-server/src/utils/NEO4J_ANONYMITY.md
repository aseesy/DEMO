# Neo4j Anonymity Considerations

## Current Anonymity Risks ⚠️

### 1. **Identifying Information Stored**
- **Display Names** - User-provided names like "Alice", "Bob Smith" (identifying)
- **Room Names** - Names like "Mom A & Dad A" (identifying relationships)
- **User IDs** - PostgreSQL IDs that can be linked back to real identities
- **Usernames** - Database usernames (less identifying but still linkable)

### 2. **Graph Structure Reveals Relationships**
- Even without names, graph structure reveals:
  - Who is connected to whom
  - Relationship patterns (e.g., "User 123 has 2 co-parent relationships")
  - Network topology

### 3. **Linkability**
- User IDs can be linked between PostgreSQL and Neo4j
- Display names can be linked to real identities
- Room names reveal relationship composition

## Anonymity Levels

### Level 1: **Pseudonymization** (Current - Partial)
- Replace real names with pseudonyms
- Keep user IDs for functionality
- **Risk**: IDs can still be linked to identities

### Level 2: **K-Anonymity** (Recommended)
- Ensure each user is indistinguishable from at least K-1 other users
- Remove or generalize identifying attributes
- **Risk**: Graph structure may still reveal patterns

### Level 3: **Full Anonymization** (Maximum Privacy)
- Remove all identifying information
- Use only graph structure (no names, no IDs)
- **Risk**: Breaks functionality (can't link back to PostgreSQL)

## Recommended Approach: **Pseudonymization with Options**

### Option A: **Pseudonymized Display Names** (Recommended)
- Store hashed/pseudonymized display names
- Keep user IDs for functionality
- Remove room names (use generic identifiers)

### Option B: **No Display Names in Neo4j**
- Don't store displayName at all
- Only store userId and username (already pseudonymized)
- Display names retrieved from PostgreSQL when needed

### Option C: **Full Anonymization Mode** (Optional)
- Configurable anonymization level
- For analytics/research: fully anonymized
- For operations: pseudonymized

## Implementation Options

### 1. **Remove Display Names** (Simplest)
```javascript
// Don't store displayName in Neo4j
CREATE (u:User {
  userId: $userId,
  username: $username,
  // displayName: $displayName,  // ❌ Remove
  createdAt: datetime()
})
```

**Pros:**
- ✅ Removes identifying information
- ✅ Simple to implement
- ✅ Display names still available in PostgreSQL

**Cons:**
- ⚠️ Graph queries can't show display names directly
- ⚠️ Need to join with PostgreSQL for display

### 2. **Hash Display Names** (Pseudonymization)
```javascript
// Store hashed display name
const hashedDisplayName = hashDisplayName(displayName, userId);
CREATE (u:User {
  userId: $userId,
  username: $username,
  displayNameHash: $hashedDisplayName,  // ✅ Pseudonymized
  createdAt: datetime()
})
```

**Pros:**
- ✅ Consistent pseudonym per user
- ✅ Can still use for graph queries
- ✅ Not directly identifying

**Cons:**
- ⚠️ Hash can be reversed if display name is known
- ⚠️ Still linkable if user ID is known

### 3. **Remove Room Names** (Recommended)
```javascript
// Don't store identifying room names
MERGE (r:Room {roomId: $roomId})
SET r.type = "co-parent",
    // r.name = $roomName,  // ❌ Remove identifying name
    r.createdAt = datetime()
```

**Pros:**
- ✅ Room names like "Mom A & Dad A" are identifying
- ✅ Room ID is sufficient for functionality
- ✅ Simple to implement

**Cons:**
- ⚠️ Room names not available in graph queries
- ⚠️ Need to retrieve from PostgreSQL if needed

### 4. **Pseudonymized User IDs** (Advanced)
```javascript
// Use pseudonymized IDs instead of real user IDs
const pseudonymId = generatePseudonym(userId, secret);
CREATE (u:User {
  pseudonymId: $pseudonymId,  // ✅ Not directly linkable
  username: $username,
  createdAt: datetime()
})
```

**Pros:**
- ✅ User IDs not directly linkable
- ✅ Can still link back with secret key
- ✅ Maximum anonymity

**Cons:**
- ⚠️ Complex to implement
- ⚠️ Requires mapping table or reversible function
- ⚠️ May break existing functionality

## Recommended Implementation

### **Immediate: Remove Identifying Information**

1. **Remove displayName from Neo4j nodes**
   - Display names retrieved from PostgreSQL when needed
   - Graph queries use userId/username only

2. **Remove room names from Neo4j**
   - Room names are identifying (e.g., "Mom A & Dad A")
   - Use roomId only (already pseudonymized)

3. **Keep userId and username**
   - Necessary for functionality (linking to PostgreSQL)
   - Username is already pseudonymized (auto-generated like "alice123")
   - User ID is internal identifier

### **Future: Optional Anonymization Mode**

Add configuration for different anonymity levels:
- **Standard Mode**: Current (userId, username, no displayName, no room names)
- **High Anonymity Mode**: Pseudonymized IDs, hashed usernames
- **Analytics Mode**: Fully anonymized (no IDs, only graph structure)

## Privacy vs Functionality Trade-off

| Approach | Anonymity | Functionality | Complexity |
|----------|-----------|---------------|------------|
| **Current** | Low | High | Low |
| **Remove Display Names** | Medium | High | Low |
| **Hash Display Names** | Medium-High | High | Medium |
| **Pseudonymized IDs** | High | Medium | High |
| **Full Anonymization** | Very High | Low | Very High |

## Recommendation

**Implement "Remove Display Names" approach:**
- ✅ Simple to implement
- ✅ Removes identifying information
- ✅ Maintains functionality (display names in PostgreSQL)
- ✅ Good balance of privacy and usability

**Future enhancement:**
- Add optional anonymization mode for analytics/research
- Allow users to opt-in to higher anonymity levels

