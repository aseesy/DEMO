# Dual-Brain AI Mediator - Task List

**Generated from**: `specs/dual-brain-mediator/plan.md`
**Total Tasks**: 24
**Parallelization Opportunities**: 6 parallel groups

---

## Phase 1: PostgreSQL + pgvector Foundation [Sequential]

### Task 1.1: Verify Railway pgvector Support

- **Priority**: P0 (Blocker)
- **Depends on**: None
- **Effort**: 15 min
- **Agent**: ops/devops

**Description**: Connect to Railway PostgreSQL and verify pgvector can be enabled.

**Acceptance Criteria**:

- [ ] `CREATE EXTENSION IF NOT EXISTS vector;` succeeds
- [ ] `SELECT * FROM pg_extension WHERE extname = 'vector';` returns a row
- [ ] Document any Railway-specific configuration needed

**Commands**:

```bash
# Connect to Railway PostgreSQL
railway run psql

# Test pgvector
CREATE EXTENSION IF NOT EXISTS vector;
SELECT * FROM pg_extension WHERE extname = 'vector';
```

---

### Task 1.2: Create Migration 044 - pgvector Extension

- **Priority**: P0
- **Depends on**: Task 1.1
- **Effort**: 30 min
- **Agent**: backend

**Description**: Create migration to add pgvector extension and embedding column to messages table.

**File**: `chat-server/migrations/044_pgvector_extension.sql`

**Acceptance Criteria**:

- [ ] Migration creates pgvector extension
- [ ] Adds `embedding vector(1536)` column to messages table
- [ ] Creates IVFFlat index for cosine similarity search
- [ ] Migration is idempotent (can run multiple times safely)
- [ ] Rollback script exists

---

### Task 1.3: Create Migration 045 - User Narrative Profiles

- **Priority**: P0
- **Depends on**: Task 1.2
- **Effort**: 30 min
- **Agent**: backend

**Description**: Create user_narrative_profiles table for storing extracted beliefs, triggers, and patterns.

**File**: `chat-server/migrations/045_user_narrative_profiles.sql`

**Acceptance Criteria**:

- [ ] Table has all required columns (core_values, known_triggers, etc.)
- [ ] JSONB columns have sensible defaults
- [ ] Foreign key to users table with CASCADE delete
- [ ] Unique constraint on (user_id, room_id)
- [ ] Index on user_id, room_id for fast lookups
- [ ] Migration is idempotent

---

### Task 1.4: Run Migrations on Railway

- **Priority**: P0
- **Depends on**: Tasks 1.2, 1.3
- **Effort**: 15 min
- **Agent**: ops/devops

**Description**: Apply migrations to Railway PostgreSQL.

**Acceptance Criteria**:

- [ ] `npm run migrate` succeeds
- [ ] Tables exist in production database
- [ ] No data loss from existing tables

---

### Task 1.5: Create Narrative Memory Service

- **Priority**: P0
- **Depends on**: Task 1.4
- **Effort**: 2-3 hours
- **Agent**: backend

**Description**: Create service for PostgreSQL + pgvector operations.

**Files**:

- `chat-server/src/core/memory/index.js`
- `chat-server/src/core/memory/narrativeMemory.js`

**Functions to Implement**:

```javascript
// Store embedding for a message
async function storeMessageEmbedding(messageId, text)

// Find semantically similar messages
async function findSimilarMessages(queryText, userId, roomId, limit = 5)

// Get user's narrative profile
async function getUserNarrativeProfile(userId, roomId)

// Update user's narrative profile
async function updateNarrativeProfile(userId, roomId, analysis)

// Generate embedding using OpenAI
async function generateEmbedding(text)
```

**Acceptance Criteria**:

- [ ] All functions implemented and exported
- [ ] Uses existing OpenAI client from `src/core/engine/client.js`
- [ ] Handles errors gracefully (returns null/empty on failure)
- [ ] Respects existing database connection patterns
- [ ] JSDoc comments on all public functions

---

### Task 1.6: Write Tests for Narrative Memory Service

- **Priority**: P1
- **Depends on**: Task 1.5
- **Effort**: 1-2 hours
- **Agent**: backend

**File**: `chat-server/__tests__/memory/narrativeMemory.test.js`

**Test Cases**:

- [ ] `storeMessageEmbedding` - stores and retrieves embedding
- [ ] `findSimilarMessages` - returns similar messages sorted by similarity
- [ ] `findSimilarMessages` - respects room_id filter
- [ ] `getUserNarrativeProfile` - returns null for non-existent profile
- [ ] `updateNarrativeProfile` - creates new profile if doesn't exist
- [ ] `updateNarrativeProfile` - updates existing profile

**Acceptance Criteria**:

- [ ] All tests pass
- [ ] Tests use mock database (not production)
- [ ] 80%+ code coverage

---

## Phase 2: Therapist Pass - User Profiling [Parallel Group A]

### Task 2.1: [P] Create Profile Analyzer

- **Priority**: P1
- **Depends on**: Task 1.5
- **Effort**: 3-4 hours
- **Agent**: backend/ai

**Description**: Create AI-powered user profile analyzer that extracts beliefs, triggers, and patterns.

**File**: `chat-server/src/core/profiles/profileAnalyzer.js`

**Functions to Implement**:

```javascript
// Analyze user's messages from their perspective
async function analyzeUserPerspective(userId, roomId, messages)

// Build prompt for user analysis
function buildUserAnalysisPrompt(userMessages, username)

// Parse AI response into structured profile
function parseProfileResponse(aiResponse)
```

**Prompt Strategy**:

- Focus ONLY on the specific user's perspective
- Extract: core_values, known_triggers, communication_patterns, recurring_complaints, conflict_themes
- Output structured JSON

**Acceptance Criteria**:

- [ ] Follows AI Mediation Constitution principles
- [ ] Outputs valid JSON matching user_narrative_profiles schema
- [ ] Handles edge cases (empty messages, single message, etc.)
- [ ] Rate-limits OpenAI calls appropriately

---

### Task 2.2: [P] Create Ingestion Script

- **Priority**: P1
- **Depends on**: Tasks 1.5, 2.1
- **Effort**: 2-3 hours
- **Agent**: backend

**Description**: One-time script to ingest historical conversation data.

**File**: `chat-server/scripts/ingest-conversation-history.js`

**Workflow**:

1. Get all messages for a room
2. Chunk into batches of 50
3. Generate embeddings for each message (with rate limiting)
4. Store embeddings in PostgreSQL
5. Run profile analysis for each user in room
6. Store profiles in user_narrative_profiles

**Acceptance Criteria**:

- [ ] Can be run multiple times safely (idempotent)
- [ ] Has progress logging
- [ ] Handles API rate limits (exponential backoff)
- [ ] Can resume from failure
- [ ] Has `--dry-run` option

**Usage**:

```bash
node scripts/ingest-conversation-history.js --room-id=<roomId> [--dry-run]
```

---

### Task 2.3: [P] Write Tests for Profile Analyzer

- **Priority**: P2
- **Depends on**: Task 2.1
- **Effort**: 1-2 hours
- **Agent**: backend

**File**: `chat-server/__tests__/profiles/profileAnalyzer.test.js`

**Test Cases**:

- [ ] `buildUserAnalysisPrompt` - generates valid prompt
- [ ] `parseProfileResponse` - handles valid JSON
- [ ] `parseProfileResponse` - handles malformed response
- [ ] `analyzeUserPerspective` - integration test with mock AI

**Acceptance Criteria**:

- [ ] All tests pass
- [ ] Uses mocked OpenAI client

---

### Task 2.4: Ingest Test Data (athena + yashir)

- **Priority**: P1
- **Depends on**: Tasks 2.1, 2.2
- **Effort**: 1 hour
- **Agent**: ops

**Description**: Run ingestion script on athena + yashir test conversation.

**Acceptance Criteria**:

- [ ] All messages have embeddings
- [ ] Both users have narrative profiles
- [ ] Profiles contain meaningful data (not empty arrays)
- [ ] Document sample profile output

---

## Phase 3: Graph Pass - Entity Extraction [Parallel Group B]

### Task 3.1: [P] Create Entity Extractor

- **Priority**: P1
- **Depends on**: Task 1.5
- **Effort**: 3-4 hours
- **Agent**: backend/ai

**Description**: Extract people, locations, and topics from messages.

**File**: `chat-server/src/core/intelligence/entityExtractor.js`

**Functions to Implement**:

```javascript
// Extract all entities from messages
async function extractEntities(messages, roomId)

// Extract entities from single message (for real-time)
async function extractEntitiesFromText(text)

// Analyze sentiment toward each entity
async function analyzeEntitySentiment(entity, contextMessages, userId)
```

**Entity Types**:

- **Person**: Grandma, Teacher, New Partner, Doctor, etc.
- **Location**: School, Soccer Field, Mom's House
- **Topic**: Homework, Schedule, Medical, Money

**Output Format**:

```javascript
{
  people: [
    { name: "Grandma", mentionCount: 5, sentiment: "positive", relationship: "paternal" }
  ],
  locations: [...],
  topics: [...]
}
```

**Acceptance Criteria**:

- [ ] Accurately extracts person names (not pronouns)
- [ ] Determines sentiment (positive/negative/neutral)
- [ ] Handles nicknames and variations ("Grandma", "Nana", "my mother")
- [ ] Doesn't extract the co-parents themselves as entities

---

### Task 3.2: [P] Extend Neo4j Schema

- **Priority**: P1
- **Depends on**: None (can start immediately)
- **Effort**: 1-2 hours
- **Agent**: backend

**Description**: Add new node types and relationships to Neo4j.

**File**: Extend `chat-server/src/infrastructure/database/neo4jClient.js`

**New Functions**:

```javascript
// Create or update Person node
async function createOrUpdatePersonNode(name, roomId, metadata)

// Create MENTIONS relationship
async function createMentionsRelationship(userId, personName, roomId, sentiment, count)

// Create TRUSTS/DISLIKES/NEUTRAL relationship
async function createSentimentRelationship(userId, personName, roomId, type, strength, reason)

// Get relationship context for people in a message
async function getRelationshipContext(senderUserId, receiverUserId, personNames)
```

**Acceptance Criteria**:

- [ ] Person nodes are pseudonymized (no real names stored)
- [ ] Relationships have timestamp metadata
- [ ] Indexes created for efficient queries
- [ ] Privacy constraints enforced (no PII)

---

### Task 3.3: [P] Create Social Map Builder

- **Priority**: P1
- **Depends on**: Tasks 3.1, 3.2
- **Effort**: 2-3 hours
- **Agent**: backend

**Description**: Orchestrate building the Neo4j social graph from extracted entities.

**File**: `chat-server/src/core/intelligence/socialMapBuilder.js`

**Functions to Implement**:

```javascript
// Build complete social map for a room
async function buildSocialMap(roomId, messages)

// Update social map incrementally (for real-time)
async function updateSocialMapFromMessage(message, userId, roomId)

// Get social map summary for a user
async function getSocialMapSummary(userId, roomId)
```

**Acceptance Criteria**:

- [ ] Creates Person nodes for all mentioned people
- [ ] Creates MENTIONS relationships with counts
- [ ] Creates sentiment relationships (TRUSTS/DISLIKES/NEUTRAL)
- [ ] Handles incremental updates without duplicates
- [ ] Can be called repeatedly safely (idempotent)

---

### Task 3.4: [P] Write Tests for Entity Extraction

- **Priority**: P2
- **Depends on**: Task 3.1
- **Effort**: 1-2 hours
- **Agent**: backend

**File**: `chat-server/__tests__/intelligence/entityExtractor.test.js`

**Test Cases**:

- [ ] Extracts person names correctly
- [ ] Handles variations ("Grandma" vs "my grandmother")
- [ ] Analyzes sentiment accurately
- [ ] Doesn't extract co-parent names as entities
- [ ] Handles empty/single messages

---

### Task 3.5: Build Social Map for Test Data

- **Priority**: P1
- **Depends on**: Tasks 3.1, 3.2, 3.3, 2.4
- **Effort**: 1 hour
- **Agent**: ops

**Description**: Run social map builder on athena + yashir test data.

**Acceptance Criteria**:

- [ ] Neo4j has Person nodes for mentioned people
- [ ] MENTIONS relationships exist with correct counts
- [ ] Sentiment relationships are populated
- [ ] Can query "Who does User A trust? Who do they distrust?"

---

## Phase 4: Runtime Integration [Sequential - Final]

### Task 4.1: Create Dual-Brain Context Builder

- **Priority**: P0
- **Depends on**: Tasks 1.5, 3.3
- **Effort**: 3-4 hours
- **Agent**: backend

**Description**: Create the context builder that queries both PostgreSQL and Neo4j.

**File**: `chat-server/src/core/engine/contextBuilders/dualBrainContext.js`

**Functions to Implement**:

```javascript
// Build complete dual-brain context for a message
async function buildDualBrainContext(message, senderUserId, receiverUserId, roomId)

// Detect if this is a recurring pattern
function detectPattern(similarMessages)

// Check if mentioned person is sensitive for either party
function detectSensitivePerson(relationshipContext)

// Generate human-readable synthesis for AI prompt
function generateSynthesis(narrativeProfile, relationshipContext)
```

**Output Format**:

```javascript
{
  historical: {
    similarMessages: [...],
    isRecurringPattern: boolean,
    knownTriggers: string[],
  },
  social: {
    mentionedPeople: string[],
    senderSentiment: { person: sentiment },
    receiverSentiment: { person: sentiment },
    isSensitiveTopic: boolean,
  },
  synthesis: "User mentions Grandma. Safe topic for sender (TRUSTS),
              but trigger for receiver (DISLIKES, reason: boundaries).
              Similar message sent 3 months ago led to conflict."
}
```

**Acceptance Criteria**:

- [ ] Queries both stores in parallel for performance
- [ ] Handles missing data gracefully
- [ ] Synthesis is concise (max 200 words)
- [ ] Follows AI Mediation Constitution (no emotional diagnoses)

---

### Task 4.2: Integrate into Mediator

- **Priority**: P0
- **Depends on**: Task 4.1
- **Effort**: 2-3 hours
- **Agent**: backend

**Description**: Modify the AI Mediator to use dual-brain context.

**File**: Modify `chat-server/src/core/engine/mediator.js`

**Changes**:

1. Import dualBrainContext builder
2. Call `buildDualBrainContext()` in `analyzeMessage()`
3. Pass synthesis to promptBuilder
4. Update prompt template to include dual-brain context

**Acceptance Criteria**:

- [ ] Dual-brain context is fetched for every message
- [ ] Context is passed to AI prompt
- [ ] Fallback to existing behavior if dual-brain fails
- [ ] No performance regression (parallel queries)

---

### Task 4.3: Update Prompt Builder

- **Priority**: P0
- **Depends on**: Task 4.2
- **Effort**: 1-2 hours
- **Agent**: backend/ai

**Description**: Update the AI prompt to include dual-brain context.

**File**: Modify `chat-server/src/core/engine/promptBuilder.js`

**Prompt Addition**:

```
## Historical Context
${dualBrainContext.synthesis}

Consider this context when deciding whether to intervene.
If this is a recurring pattern, the user may need different coaching.
If a mentioned person is sensitive for the receiver, be extra careful.
```

**Acceptance Criteria**:

- [ ] Context is clearly separated in prompt
- [ ] Follows AI Mediation Constitution
- [ ] Instructions are actionable for the AI

---

### Task 4.4: Write Integration Tests

- **Priority**: P1
- **Depends on**: Tasks 4.1, 4.2, 4.3
- **Effort**: 2-3 hours
- **Agent**: backend

**File**: `chat-server/__tests__/engine/dualBrainContext.test.js`

**Test Cases**:

- [ ] `buildDualBrainContext` returns valid structure
- [ ] Handles missing narrative profile
- [ ] Handles missing Neo4j data
- [ ] `detectPattern` identifies recurring messages
- [ ] `detectSensitivePerson` flags trigger topics
- [ ] End-to-end: message → context → AI prompt

---

### Task 4.5: Manual Testing & Tuning

- **Priority**: P1
- **Depends on**: Task 4.4
- **Effort**: 2-4 hours
- **Agent**: product-manager

**Description**: Test the complete system with athena + yashir data and tune prompts.

**Test Scenarios**:

1. Send message mentioning "Grandma" (should note sensitivity)
2. Send message similar to past conflict (should detect pattern)
3. Send message with known trigger phrase (should catch early)
4. Send benign message (should not over-intervene)

**Acceptance Criteria**:

- [ ] Context appears in AI reasoning
- [ ] Interventions are more contextual than before
- [ ] No regression in basic functionality
- [ ] Document any prompt adjustments made

---

## Phase 5: Real-Time Integration [Parallel Group C - Future]

### Task 5.1: [P] Real-Time Embedding Generation

- **Priority**: P2
- **Depends on**: Task 4.5
- **Effort**: 2 hours
- **Agent**: backend

**Description**: Generate embeddings for new messages in real-time.

**Integration Point**: After message is saved in `messageHandler.js`

**Acceptance Criteria**:

- [ ] Non-blocking (doesn't slow down message send)
- [ ] Handles failures gracefully (message still sends)
- [ ] Rate-limited to avoid OpenAI throttling

---

### Task 5.2: [P] Real-Time Entity Extraction

- **Priority**: P2
- **Depends on**: Task 4.5
- **Effort**: 2 hours
- **Agent**: backend

**Description**: Extract entities from new messages and update Neo4j.

**Acceptance Criteria**:

- [ ] Runs asynchronously after message save
- [ ] Updates mention counts
- [ ] Detects new people automatically

---

### Task 5.3: [P] Profile Update Scheduler

- **Priority**: P2
- **Depends on**: Task 4.5
- **Effort**: 2 hours
- **Agent**: backend/ops

**Description**: Schedule nightly profile re-analysis.

**Acceptance Criteria**:

- [ ] Runs via cron or Railway scheduled task
- [ ] Only processes rooms with new messages
- [ ] Has monitoring/alerting

---

## Dependency Graph

```
Phase 1: Foundation
    1.1 ──► 1.2 ──► 1.3 ──► 1.4 ──► 1.5 ──► 1.6
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
Phase 2: Therapist Pass              Phase 3: Graph Pass
    [P] 2.1 ──► 2.3                     [P] 3.1 ──► 3.4
         │                                   │
         └──► 2.2 ──► 2.4                   └──► 3.3 ──► 3.5
                      │                              │
                      └──────────────┬───────────────┘
                                     ▼
Phase 4: Runtime Integration
    4.1 ──► 4.2 ──► 4.3 ──► 4.4 ──► 4.5
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                ▼                ▼
Phase 5: Real-Time (Future)
    [P] 5.1         [P] 5.2         [P] 5.3
```

---

## Summary

| Phase             | Tasks  | Parallel | Sequential | Est. Effort     |
| ----------------- | ------ | -------- | ---------- | --------------- |
| 1: Foundation     | 6      | 0        | 6          | 5-7 hours       |
| 2: Therapist Pass | 4      | 3        | 1          | 7-10 hours      |
| 3: Graph Pass     | 5      | 4        | 1          | 8-11 hours      |
| 4: Runtime        | 5      | 0        | 5          | 10-16 hours     |
| 5: Real-Time      | 3      | 3        | 0          | 6 hours         |
| **Total**         | **23** | **10**   | **13**     | **36-50 hours** |

---

## Quick Start

To begin implementation:

```bash
# 1. Verify pgvector support (Task 1.1)
railway run psql -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 2. Create migrations (Tasks 1.2, 1.3)
# Files: chat-server/migrations/044_pgvector_extension.sql
#        chat-server/migrations/045_user_narrative_profiles.sql

# 3. Run migrations (Task 1.4)
cd chat-server && npm run migrate

# 4. Start implementing narrativeMemory.js (Task 1.5)
```
