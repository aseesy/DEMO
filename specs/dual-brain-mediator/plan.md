# Dual-Brain AI Mediator Implementation Plan

## Executive Summary

Transform LiaiZen's AI mediator into a context-aware "Dual-Brain" system that combines:

- **Narrative Memory** (PostgreSQL + pgvector): Understanding _what happened_ - beliefs, patterns, historical wounds
- **Social Map** (Neo4j): Understanding _who matters_ - relationships, entities, sentiment toward people

This enables the mediator to understand each user's communication patterns, triggers, and relationships without storing sensitive data inappropriately.

---

## Current State Analysis

### What Exists

| Component         | Status     | Location                                                 |
| ----------------- | ---------- | -------------------------------------------------------- |
| **AI Mediator**   | ✅ Active  | `chat-server/src/core/engine/mediator.js`                |
| **Neo4j Client**  | ✅ Working | `chat-server/src/infrastructure/database/neo4jClient.js` |
| **User Profiles** | ✅ Basic   | `chat-server/src/core/profiles/userContext.js`           |
| **Embeddings**    | ✅ OpenAI  | `neo4jClient.js:generateEmbedding()`                     |
| **Constitution**  | ✅ Active  | `chat-server/ai-mediation-constitution.md`               |

### What's Missing

1. **pgvector in PostgreSQL** - No vector storage for semantic search
2. **User Belief Profiles** - No structured "what does this user believe/value" storage
3. **Entity Extraction** - No automatic detection of mentioned people
4. **Relationship Sentiment** - No tracking of sentiment toward specific people
5. **Runtime Synthesis** - Mediator doesn't query both stores for context

---

## Architecture Design

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MESSAGE ARRIVES                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DUAL-BRAIN CONTEXT GATHERING                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────┐    ┌─────────────────────────────┐        │
│  │   NARRATIVE MEMORY          │    │   SOCIAL MAP                │        │
│  │   (PostgreSQL + pgvector)   │    │   (Neo4j)                   │        │
│  ├─────────────────────────────┤    ├─────────────────────────────┤        │
│  │ • Similar past messages     │    │ • People mentioned          │        │
│  │ • User belief profile       │    │ • Relationship sentiment    │        │
│  │ • Known triggers            │    │ • Shared contacts           │        │
│  │ • Communication patterns    │    │ • Conflict history          │        │
│  └─────────────────────────────┘    └─────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CONTEXT SYNTHESIS                                  │
│                                                                             │
│  "User A mentions 'Grandma' → Safe for A (TRUSTS), trigger for B (DISLIKES)"│
│  "User A has pattern: 'You never...' → Historical wound about being unheard"│
│  "This phrasing similar to past conflict 3 months ago about money"          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI MEDIATOR                                        │
│                   (Enhanced with dual-brain context)                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Boundaries (Critical)

| Data Type               | PostgreSQL   | Neo4j            | Rationale                         |
| ----------------------- | ------------ | ---------------- | --------------------------------- |
| Raw message text        | ✅ Store     | ❌ Never         | Privacy liability, bloats graph   |
| Message embeddings      | ✅ pgvector  | ❌ No            | Postgres is better for vector ops |
| User belief profiles    | ✅ Store     | ❌ Abstract only | Full profile is sensitive         |
| Entity names            | ✅ Full      | ✅ Pseudonymized | Graph needs relationships         |
| Relationship sentiment  | ❌ No        | ✅ Store         | This IS what Neo4j is for         |
| PII (email, real names) | ✅ Encrypted | ❌ Never         | Already enforced in neo4jClient   |

---

## Implementation Phases

### Phase 1: PostgreSQL + pgvector Setup

**Goal**: Enable semantic search over message history

#### 1.1 Add pgvector Extension

```sql
-- Migration: 044_pgvector_extension.sql
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS messages_embedding_idx
ON messages USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

#### 1.2 Create User Narrative Profile Table

```sql
-- Migration: 045_user_narrative_profiles.sql
CREATE TABLE IF NOT EXISTS user_narrative_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,

  -- Core beliefs (extracted by AI)
  core_values JSONB DEFAULT '[]',           -- ["fairness", "respect", "consistency"]
  known_triggers JSONB DEFAULT '[]',        -- ["accusations of laziness", "money topics"]
  communication_patterns JSONB DEFAULT '{}', -- {"tendency": "uses absolutes", "strength": 0.8}

  -- Historical pain points
  recurring_complaints JSONB DEFAULT '[]',  -- ["feeling unheard", "schedule changes"]
  conflict_themes JSONB DEFAULT '[]',       -- ["custody", "finances", "new partners"]

  -- Embeddings for semantic search
  profile_embedding vector(1536),           -- Embedding of overall profile

  -- Metadata
  last_analyzed_at TIMESTAMPTZ,
  message_count_analyzed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, room_id)
);

-- Index for profile retrieval
CREATE INDEX idx_user_narrative_profiles_user_room
ON user_narrative_profiles(user_id, room_id);
```

#### 1.3 Create Narrative Memory Service

**Location**: `chat-server/src/core/memory/narrativeMemory.js`

```javascript
// Key functions:
// - storeMessageEmbedding(messageId, text)
// - findSimilarMessages(queryText, userId, roomId, limit)
// - getUserNarrativeProfile(userId, roomId)
// - updateNarrativeProfile(userId, roomId, analysis)
```

### Phase 2: Therapist Pass - User Profiling Pipeline

**Goal**: Extract beliefs, triggers, and patterns from conversation history

#### 2.1 Create Profile Analyzer

**Location**: `chat-server/src/core/profiles/profileAnalyzer.js`

```javascript
/**
 * Analyze user's message history from THEIR perspective
 *
 * Prompt strategy: "You are analyzing User A's communication patterns.
 * Focus ONLY on User A's perspective. Ignore User B for now.
 *
 * Extract:
 * 1. Core values (what they care about most)
 * 2. Recurring triggers (what phrases/topics upset them)
 * 3. Communication patterns (how they express frustration)
 * 4. Unresolved wounds (what complaints keep coming back)
 * 5. Mentioned people (who do they talk about and how)"
 */
async function analyzeUserPerspective(userId, roomId, messages) {
  // 1. Filter messages by this user
  // 2. Build prompt with user-focused analysis
  // 3. Parse structured response
  // 4. Store in user_narrative_profiles
  // 5. Extract entities for Neo4j
}
```

#### 2.2 Create Ingestion Pipeline

**Location**: `chat-server/scripts/ingest-conversation-history.js`

```javascript
/**
 * One-time ingestion of historical conversations
 * Run for athena + yashir test data
 *
 * Steps:
 * 1. Get all messages for room
 * 2. Chunk into batches of 50
 * 3. Generate embeddings for each message
 * 4. Store in PostgreSQL
 * 5. Run profile analysis for each user
 * 6. Extract entities for Neo4j
 */
```

### Phase 3: Graph Pass - Entity Extraction

**Goal**: Populate Neo4j with people, relationships, and sentiment

#### 3.1 Create Entity Extractor

**Location**: `chat-server/src/core/intelligence/entityExtractor.js`

```javascript
/**
 * Extract entities from messages
 *
 * Entity types:
 * - Person (Grandma, Teacher, New Partner, Doctor)
 * - Location (School, Soccer Field, Mom's House)
 * - Topic (Homework, Schedule, Medical)
 *
 * For each Person entity:
 * - Count mentions
 * - Analyze sentiment of surrounding context
 * - Determine relationship to each co-parent
 */
async function extractEntities(messages, roomId) {
  // Returns: { people: [...], locations: [...], topics: [...] }
}
```

#### 3.2 Neo4j Schema Extensions

Add to existing neo4jClient.js:

```javascript
// New node types
// (:Person {name, roomId, mentionCount, firstMentioned, lastMentioned})

// New relationship types
// (:User)-[:MENTIONS {sentiment, count, lastMentioned}]->(:Person)
// (:User)-[:TRUSTS|DISLIKES|NEUTRAL {reason, strength}]->(:Person)
// (:Person)-[:RELATED_TO {relationship}]->(:Person) // e.g., Grandma-[PARENT_OF]->Dad
```

#### 3.3 Create Social Map Builder

**Location**: `chat-server/src/core/intelligence/socialMapBuilder.js`

```javascript
/**
 * Build social map in Neo4j from extracted entities
 *
 * For each person mentioned:
 * 1. Create or update Person node
 * 2. Create MENTIONS relationship from User
 * 3. Analyze sentiment and create TRUSTS/DISLIKES/NEUTRAL
 * 4. Link related people (Grandma -> Dad if detected)
 */
async function buildSocialMap(userId, roomId, entities, sentimentAnalysis) {
  // Uses neo4jClient.executeCypher internally
}
```

### Phase 4: Runtime Synthesis

**Goal**: Query both stores when mediating messages

#### 4.1 Create Dual-Brain Context Builder

**Location**: `chat-server/src/core/engine/contextBuilders/dualBrainContext.js`

```javascript
/**
 * Build context from both Narrative Memory and Social Map
 * Called during message mediation
 */
async function buildDualBrainContext(message, senderUserId, receiverUserId, roomId) {
  // 1. NARRATIVE: Find similar past messages
  const similarMessages = await narrativeMemory.findSimilarMessages(
    message.text,
    senderUserId,
    roomId,
    5
  );

  // 2. NARRATIVE: Get sender's profile
  const senderProfile = await narrativeMemory.getUserNarrativeProfile(senderUserId, roomId);

  // 3. SOCIAL: Extract mentioned people from current message
  const mentionedPeople = await entityExtractor.extractPeopleFromText(message.text);

  // 4. SOCIAL: Get relationship context for mentioned people
  const relationshipContext = await neo4jClient.getRelationshipContext(
    senderUserId,
    receiverUserId,
    mentionedPeople
  );

  // 5. SYNTHESIZE: Combine into actionable context
  return {
    historical: {
      similarMessages,
      isRecurringPattern: detectPattern(similarMessages),
      knownTriggers: senderProfile.known_triggers,
    },
    social: {
      mentionedPeople,
      senderSentiment: relationshipContext.senderSentiment,
      receiverSentiment: relationshipContext.receiverSentiment,
      isSensitiveTopic: detectSensitivePerson(relationshipContext),
    },
    synthesis: generateSynthesis(senderProfile, relationshipContext),
  };
}
```

#### 4.2 Integrate into Mediator

Modify `chat-server/src/core/engine/mediator.js`:

```javascript
// In analyzeMessage(), before calling AI:
const dualBrainContext = await buildDualBrainContext(message, senderUserId, receiverUserId, roomId);

// Add to prompt context
const enrichedPrompt = promptBuilder.build({
  ...existingContext,
  dualBrainContext: dualBrainContext.synthesis,
});
```

---

## File Structure

```
chat-server/
├── migrations/
│   ├── 044_pgvector_extension.sql       # NEW
│   └── 045_user_narrative_profiles.sql  # NEW
│
├── src/core/
│   ├── memory/                          # NEW DIRECTORY
│   │   ├── index.js
│   │   └── narrativeMemory.js           # PostgreSQL + pgvector operations
│   │
│   ├── profiles/
│   │   ├── userContext.js               # Existing
│   │   └── profileAnalyzer.js           # NEW: User perspective analysis
│   │
│   ├── intelligence/
│   │   ├── userIntelligence.js          # Existing
│   │   ├── entityExtractor.js           # NEW: Extract people/places/topics
│   │   └── socialMapBuilder.js          # NEW: Build Neo4j graph
│   │
│   └── engine/
│       ├── contextBuilders/
│       │   ├── index.js                 # Existing
│       │   └── dualBrainContext.js      # NEW: Combine Postgres + Neo4j
│       └── mediator.js                  # MODIFY: Use dual-brain context
│
├── scripts/
│   └── ingest-conversation-history.js   # NEW: One-time ingestion
│
└── __tests__/
    ├── memory/
    │   └── narrativeMemory.test.js      # NEW
    └── intelligence/
        └── entityExtractor.test.js      # NEW
```

---

## Implementation Order

### Week 1: Foundation

1. **Migration 044**: Add pgvector extension
2. **Migration 045**: Create user_narrative_profiles table
3. **narrativeMemory.js**: Basic CRUD operations
4. **Test**: Verify embeddings store and retrieve correctly

### Week 2: Therapist Pass

5. **profileAnalyzer.js**: User perspective analysis prompt
6. **ingest-conversation-history.js**: Batch processing script
7. **Run**: Ingest athena + yashir test data
8. **Verify**: Check profiles populated correctly

### Week 3: Graph Pass

9. **entityExtractor.js**: People/location/topic extraction
10. **socialMapBuilder.js**: Neo4j relationship creation
11. **Run**: Build social map for test data
12. **Verify**: Check Neo4j has correct relationships

### Week 4: Runtime Integration

13. **dualBrainContext.js**: Query both stores
14. **Modify mediator.js**: Integrate dual-brain context
15. **Test**: End-to-end message mediation with context
16. **Tune**: Adjust prompts based on results

---

## Privacy & Security Considerations

### Data Minimization

- **Neo4j**: Only stores pseudonymized IDs, relationship types, sentiment scores
- **PostgreSQL**: Stores full data but access-controlled

### What NEVER Goes in Neo4j

1. Raw message text (analysis only)
2. Email addresses
3. Real names (use nicknames like "Grandma", "Teacher")
4. Health/financial details (only abstract: `HAS_STRESSOR {type: "financial"}`)

### Encryption

- Profile embeddings are numeric vectors (no PII)
- Belief profiles use abstract terms ("values fairness") not specifics

---

## Success Metrics

| Metric                             | Baseline | Target                       |
| ---------------------------------- | -------- | ---------------------------- |
| Context relevance (manual review)  | N/A      | 80%+ useful context          |
| Entity extraction accuracy         | N/A      | 90%+ correct people detected |
| Intervention appropriateness       | Current  | +20% more contextual         |
| False positives (over-intervening) | Current  | -30% reduction               |

---

## Open Questions

1. **Embedding Model**: Use `text-embedding-3-small` (1536d) or `text-embedding-3-large` (3072d)?
   - Recommendation: Start with small, upgrade if needed

2. **Profile Update Frequency**: Real-time or batch?
   - Recommendation: Batch nightly, with real-time for new entities

3. **Historical Depth**: How far back to analyze?
   - Recommendation: All available history for initial profiles, last 30 days for updates

4. **Railway pgvector**: Verify pgvector extension is available
   - Action: Test on Railway PostgreSQL instance

---

## Next Steps

After plan approval:

1. Run `/tasks` to generate dependency-ordered task list
2. Verify Railway PostgreSQL supports pgvector
3. Begin Phase 1 implementation
