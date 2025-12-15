# Neo4j Architecture Summary - Quick Reference

## Recommended Approach: **Hybrid Model (Option 4)**

### Visual Representation

```
┌─────────────────────────────────────────────────────────────┐
│                    Mom A's Relationships                     │
└─────────────────────────────────────────────────────────────┘

Mom A ──[CO_PARENT_WITH {roomId: "room_1"}]──> Dad A
  │                                                  │
  │                                                  │
  └──[CO_PARENT_WITH {roomId: "room_2"}]──> Mom A's Partner
       │
       │
       └──> Room 2 (Private)

Room 1 (Private) <──[MEMBER_OF]── Dad A
  ↑
  │
Mom A ──[MEMBER_OF]──> Room 1
```

### Key Structures

1. **Direct Relationships** (for fast queries):
   ```cypher
   (:User)-[:CO_PARENT_WITH {
     roomId: "room_123",
     active: true,
     createdAt: datetime()
   }]->(:User)
   ```

2. **Room Nodes** (for room-based queries):
   ```cypher
   (:User)-[:MEMBER_OF {role: "owner"}]->(:Room {
     roomId: "room_123",
     type: "co-parent"
   })
   ```

### When to Create Relationships

**Trigger Points:**
1. ✅ When `createCoParentRoom()` is called in `roomManager.js`
2. ✅ When `addUserToRoom()` adds a second user (co-parent connection)
3. ✅ When invitation is accepted (`registerFromInvitation`)
4. ✅ When pairing is accepted (`registerFromPairing`)

### Integration Points

**File: `chat-server/roomManager.js`**
- `createCoParentRoom()` → Create relationship + room node
- `addUserToRoom()` → If second member, create relationship

**File: `chat-server/auth.js`**
- `registerFromInvitation()` → After room created, create relationship
- `registerFromPairing()` → After room created, create relationship

### Example: Mom A's Evolving Relationships

**Initial State:**
```
Mom A ←→ Dad A (Room 1)
```

**After Mom A's Partner Joins:**
```
Mom A ←→ Dad A (Room 1)          [Still active]
Mom A ←→ Mom A's Partner (Room 2) [New relationship]
```

**Query Result:**
```cypher
MATCH (momA:User {userId: 1})-[:CO_PARENT_WITH {active: true}]->(coParent:User)
RETURN coParent
// Returns: [Dad A, Mom A's Partner]
```

### Privacy Model

- Each relationship = Private room
- Users only see relationships they're part of
- Room 1 (Mom A + Dad A) is invisible to Mom A's Partner
- Room 2 (Mom A + Partner) is invisible to Dad A

### Next Steps

1. **Add relationship creation** to `roomManager.createCoParentRoom()`
2. **Add relationship creation** to `roomManager.addUserToRoom()` (when second member)
3. **Backfill existing relationships** from PostgreSQL rooms
4. **Add relationship queries** for analytics and features

