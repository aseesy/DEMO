# Neo4j Graph Architecture Options for Co-Parenting Relationships

## Scenario Overview

**Current State:**

- Mom A and Dad A have a private co-parenting connection
- They share a room and can communicate

**Evolving Relationships:**

- Mom A gets a new partner (Mom A's Partner)
- Dad A might get a new partner (Dad A's Partner)
- New co-parenting relationships form
- Privacy boundaries need to be maintained

## Architecture Options

### Option 1: Direct Relationship Model (Simple)

**Structure:**

```cypher
(:User)-[:CO_PARENT_WITH {roomId: "room_123", createdAt: datetime()}]->(:User)
```

**Pros:**

- ✅ Simple and intuitive
- ✅ Easy to query: `MATCH (u:User)-[:CO_PARENT_WITH]->(c:User)`
- ✅ Direct representation of relationships
- ✅ Fast traversal

**Cons:**

- ❌ Doesn't track relationship history (e.g., when Mom A's new partner joins)
- ❌ Hard to model complex scenarios (e.g., Mom A + Partner + Dad A dynamics)
- ❌ No way to represent "active" vs "inactive" relationships
- ❌ Limited metadata (can only store properties on relationship)

**Use Case:** Best for simple, static co-parenting pairs

---

### Option 2: Relationship Node Model (Flexible)

**Structure:**

```cypher
(:User)-[:PARTICIPATES_IN {role: "co-parent", joinedAt: datetime()}]->(:CoParentRelationship)
(:CoParentRelationship)-[:HAS_ROOM]->(:Room {roomId: "room_123"})
(:User)-[:PARTICIPATES_IN {role: "co-parent", joinedAt: datetime()}]->(:CoParentRelationship)
```

**Pros:**

- ✅ Can track relationship history (when people joined/left)
- ✅ Supports multiple participants (Mom A, Dad A, Mom A's Partner)
- ✅ Can store rich metadata on relationship node
- ✅ Easy to query all participants: `MATCH (r:CoParentRelationship)<-[:PARTICIPATES_IN]-(u:User)`
- ✅ Can mark relationships as active/inactive

**Cons:**

- ⚠️ More complex queries
- ⚠️ Requires relationship node management
- ⚠️ Slightly more storage overhead

**Use Case:** Best for evolving relationships and complex family structures

**Example Query:**

```cypher
// Find all active co-parenting relationships for a user
MATCH (u:User {userId: 123})-[:PARTICIPATES_IN {role: "co-parent"}]->(r:CoParentRelationship {active: true})
MATCH (r)<-[:PARTICIPATES_IN]-(other:User)
WHERE other.userId <> 123
RETURN r, collect(other) as coParents
```

---

### Option 3: Room-Centric Model (Aligns with PostgreSQL)

**Structure:**

```cypher
(:User)-[:MEMBER_OF {role: "owner", joinedAt: datetime()}]->(:Room {roomId: "room_123", type: "co-parent"})
(:User)-[:MEMBER_OF {role: "member", joinedAt: datetime()}]->(:Room)
(:Room)-[:PRIVATE_CONNECTION]->(:Room)  // If needed for room relationships
```

**Pros:**

- ✅ Aligns perfectly with existing PostgreSQL room structure
- ✅ Easy to sync: when room created in PostgreSQL, create in Neo4j
- ✅ Room can have metadata (name, type, privacy settings)
- ✅ Natural representation of "private connection" = shared room
- ✅ Can query all members of a room easily

**Cons:**

- ⚠️ Relationships are indirect (through room)
- ⚠️ Less intuitive for "who is co-parenting with whom" queries
- ⚠️ Requires room node management

**Use Case:** Best when you want Neo4j to mirror PostgreSQL structure

**Example Query:**

```cypher
// Find all co-parents (users in same co-parent room)
MATCH (u:User {userId: 123})-[:MEMBER_OF]->(r:Room {type: "co-parent"})
MATCH (r)<-[:MEMBER_OF]-(coParent:User)
WHERE coParent.userId <> 123
RETURN coParent
```

---

### Option 4: Hybrid Model (Recommended)

**Structure:**

```cypher
// Direct relationship for quick queries
(:User)-[:CO_PARENT_WITH {roomId: "room_123", active: true, createdAt: datetime()}]->(:User)

// Room node for room-based queries
(:User)-[:MEMBER_OF {role: "owner"}]->(:Room {roomId: "room_123", type: "co-parent"})
(:User)-[:MEMBER_OF {role: "member"}]->(:Room)
```

**Pros:**

- ✅ Best of both worlds: direct relationships + room structure
- ✅ Fast relationship queries: `MATCH (u)-[:CO_PARENT_WITH]->(c)`
- ✅ Room queries work: `MATCH (u)-[:MEMBER_OF]->(r:Room)`
- ✅ Can track relationship status (active/inactive)
- ✅ Supports both relationship and room-based analytics

**Cons:**

- ⚠️ Requires maintaining two structures (relationship + room membership)
- ⚠️ Need to keep them in sync
- ⚠️ More storage

**Use Case:** Best for production - balances performance and flexibility

**Example Queries:**

```cypher
// Quick: Find direct co-parents
MATCH (u:User {userId: 123})-[:CO_PARENT_WITH {active: true}]->(c:User)
RETURN c

// Detailed: Find co-parents with room info
MATCH (u:User {userId: 123})-[:CO_PARENT_WITH {active: true}]->(c:User)
MATCH (u)-[:MEMBER_OF]->(r:Room)<-[:MEMBER_OF]-(c)
RETURN c, r
```

---

## Handling Evolving Relationships: "Mom A's New Partner"

### Scenario: Mom A + Dad A → Mom A + Dad A + Mom A's Partner

### Option 2 (Relationship Node) - Best Fit:

```cypher
// Original relationship
(:MomA)-[:PARTICIPATES_IN {role: "co-parent", joinedAt: "2024-01-01"}]->(rel1:CoParentRelationship)
(:DadA)-[:PARTICIPATES_IN {role: "co-parent", joinedAt: "2024-01-01"}]->(rel1)

// New relationship when Mom A's Partner joins
(:MomA)-[:PARTICIPATES_IN {role: "co-parent", joinedAt: "2024-06-01"}]->(rel2:CoParentRelationship)
(:MomAPartner)-[:PARTICIPATES_IN {role: "co-parent", joinedAt: "2024-06-01"}]->(rel2)

// Mom A is now in TWO relationships
// Dad A remains in original relationship
```

**Query: Find all co-parents (including new partners):**

```cypher
MATCH (momA:User {userId: 1})-[:PARTICIPATES_IN]->(rel:CoParentRelationship {active: true})
MATCH (rel)<-[:PARTICIPATES_IN]-(coParent:User)
WHERE coParent.userId <> 1
RETURN rel, collect(coParent) as coParents
// Returns: [DadA] from rel1, [MomAPartner] from rel2
```

### Option 4 (Hybrid) - Alternative:

```cypher
// Original relationship
(:MomA)-[:CO_PARENT_WITH {roomId: "room_1", active: true}]->(:DadA)

// New relationship
(:MomA)-[:CO_PARENT_WITH {roomId: "room_2", active: true}]->(:MomAPartner)

// Mom A has TWO active co-parent relationships
// Each relationship has its own room
```

**Query:**

```cypher
MATCH (momA:User {userId: 1})-[:CO_PARENT_WITH {active: true}]->(coParent:User)
RETURN coParent
// Returns: DadA, MomAPartner
```

---

## Privacy Considerations

### Room-Based Privacy (Option 3 & 4):

- Each co-parenting relationship = private room
- Mom A + Dad A = Room 1 (private)
- Mom A + Mom A's Partner = Room 2 (private)
- Dad A cannot see Room 2, Mom A's Partner cannot see Room 1

### Relationship Privacy:

- Relationships are private by default
- Query only returns relationships user is part of:
  ```cypher
  MATCH (u:User {userId: $userId})-[:CO_PARENT_WITH]->(c:User)
  RETURN c
  ```

---

## Recommended Architecture: **Option 4 (Hybrid)**

### Implementation Plan:

1. **When co-parents connect (room created):**

   ```cypher
   // Create bidirectional relationship
   MATCH (u1:User {userId: $userId1})
   MATCH (u2:User {userId: $userId2})
   CREATE (u1)-[:CO_PARENT_WITH {
     roomId: $roomId,
     active: true,
     createdAt: datetime(),
     relationshipType: "co-parent"
   }]->(u2)
   CREATE (u2)-[:CO_PARENT_WITH {
     roomId: $roomId,
     active: true,
     createdAt: datetime(),
     relationshipType: "co-parent"
   }]->(u1)

   // Create room node and memberships
   CREATE (r:Room {roomId: $roomId, type: "co-parent", name: $roomName})
   CREATE (u1)-[:MEMBER_OF {role: "owner", joinedAt: datetime()}]->(r)
   CREATE (u2)-[:MEMBER_OF {role: "member", joinedAt: datetime()}]->(r)
   ```

2. **When relationship ends (room archived):**

   ```cypher
   MATCH (u1:User {userId: $userId1})-[r:CO_PARENT_WITH]->(u2:User {userId: $userId2})
   SET r.active = false, r.endedAt = datetime()
   ```

3. **When new partner joins:**
   - Create new room in PostgreSQL
   - Create new relationship in Neo4j
   - Original relationship remains active (Mom A still co-parents with Dad A)

### Benefits:

- ✅ Fast relationship queries
- ✅ Room structure matches PostgreSQL
- ✅ Supports evolving relationships
- ✅ Privacy maintained per room
- ✅ Can track relationship history

---

## Migration Strategy

1. **Phase 1:** Create user nodes (✅ Already done)
2. **Phase 2:** Create relationships when rooms are created
3. **Phase 3:** Backfill existing relationships from PostgreSQL
4. **Phase 4:** Add room nodes for room-based queries

---

## Example: Complete Graph for Mom A Scenario

```cypher
// Users
(:User {userId: 1, username: "moma", displayName: "Mom A"})
(:User {userId: 2, username: "dada", displayName: "Dad A"})
(:User {userId: 3, username: "momapartner", displayName: "Mom A's Partner"})

// Relationships
(:MomA)-[:CO_PARENT_WITH {roomId: "room_1", active: true}]->(:DadA)
(:DadA)-[:CO_PARENT_WITH {roomId: "room_1", active: true}]->(:MomA)
(:MomA)-[:CO_PARENT_WITH {roomId: "room_2", active: true}]->(:MomAPartner)
(:MomAPartner)-[:CO_PARENT_WITH {roomId: "room_2", active: true}]->(:MomA)

// Rooms
(:Room {roomId: "room_1", type: "co-parent", name: "Mom A & Dad A"})
(:Room {roomId: "room_2", type: "co-parent", name: "Mom A & Mom A's Partner"})

// Memberships
(:MomA)-[:MEMBER_OF {role: "owner"}]->(:Room1)
(:DadA)-[:MEMBER_OF {role: "member"}]->(:Room1)
(:MomA)-[:MEMBER_OF {role: "owner"}]->(:Room2)
(:MomAPartner)-[:MEMBER_OF {role: "member"}]->(:Room2)
```

**Query: Find all of Mom A's co-parents:**

```cypher
MATCH (momA:User {userId: 1})-[:CO_PARENT_WITH {active: true}]->(coParent:User)
RETURN coParent
// Returns: Dad A, Mom A's Partner
```
