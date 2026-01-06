# AI Thread Summaries - Task Breakdown

**Feature**: AI-Summarized Conversation Threads with Citations
**Spec**: `specs/ai-thread-summaries/spec.md`
**Plan**: `specs/ai-thread-summaries/plan.md`
**Generated**: 2026-01-04

---

## Task Summary

| Phase | Tasks | Parallel | Sequential |
|-------|-------|----------|------------|
| 1. Database | 2 | 0 | 2 |
| 2. Topic Detection | 4 | 2 | 2 |
| 3. Summary Generation | 4 | 1 | 3 |
| 4. API Layer | 3 | 2 | 1 |
| 5. Socket Events | 3 | 1 | 2 |
| 6. Frontend | 6 | 3 | 3 |
| 7. Integration | 4 | 1 | 3 |
| **Total** | **26** | **10** | **16** |

---

## Phase 1: Database Foundation [Sequential]

### Task 1.1: Create Topic Summaries Migration
- **Agent**: database-specialist
- **Depends on**: None
- **Effort**: 1 hour
- **File**: `migrations/040_topic_summaries.sql`

**Acceptance Criteria**:
- [ ] Creates `topic_summaries` table with all required columns
- [ ] Creates `summary_citations` table with foreign key to summaries
- [ ] Creates `topic_messages` junction table
- [ ] Creates `summary_history` for version tracking
- [ ] All indexes created for query performance
- [ ] Migration runs without errors on PostgreSQL

**Implementation**:
```sql
-- See plan.md Phase 1 for full schema
CREATE TABLE IF NOT EXISTS topic_summaries (...)
CREATE TABLE IF NOT EXISTS summary_citations (...)
CREATE TABLE IF NOT EXISTS topic_messages (...)
CREATE TABLE IF NOT EXISTS summary_history (...)
```

---

### Task 1.2: Run and Validate Migration
- **Agent**: database-specialist
- **Depends on**: Task 1.1
- **Effort**: 30 mins

**Acceptance Criteria**:
- [ ] Migration executes successfully: `npm run migrate`
- [ ] Tables visible in database: `\dt topic_*`
- [ ] Foreign keys working (test insert/delete cascade)
- [ ] Indexes created: `\di` shows expected indexes

---

## Phase 2: Topic Detection Service [Mixed]

### Task 2.1: Create TopicDetector Class Structure
- **Agent**: backend-architect
- **Depends on**: Task 1.2
- **Effort**: 2 hours
- **File**: `src/services/topics/TopicDetector.js`

**Acceptance Criteria**:
- [ ] Class exports `detectTopics(roomId, options)`
- [ ] Class exports `assignMessageToTopic(message, roomId)`
- [ ] Constructor accepts configuration options
- [ ] Integrates with existing `narrativeMemory` for embeddings
- [ ] Basic error handling and logging

---

### Task 2.2: Implement DBSCAN Clustering Algorithm
- **Agent**: backend-architect
- **Depends on**: Task 2.1
- **Effort**: 3 hours

**Acceptance Criteria**:
- [ ] Clusters messages using cosine similarity on embeddings
- [ ] Configurable `eps` (similarity threshold) and `minPts` (min messages)
- [ ] Returns cluster assignments with confidence scores
- [ ] Handles edge cases: empty room, single message, all similar

**Algorithm**:
```javascript
// 1. Get embeddings for recent messages
// 2. Build similarity matrix using pgvector <=> operator
// 3. Apply DBSCAN clustering
// 4. Return clusters with message IDs
```

---

### Task 2.3: [P] Implement Topic Title Generation
- **Agent**: backend-architect
- **Depends on**: Task 2.1
- **Effort**: 1 hour

**Acceptance Criteria**:
- [ ] Extracts key terms from cluster messages
- [ ] Generates descriptive title (3-5 words)
- [ ] Falls back to first message preview if extraction fails

---

### Task 2.4: [P] Implement Category Assignment
- **Agent**: backend-architect
- **Depends on**: Task 2.1
- **Effort**: 1 hour

**Acceptance Criteria**:
- [ ] Assigns category based on message content
- [ ] Categories: Medical, School, Activities, Logistics, Financial, General
- [ ] Uses keyword matching + optional LLM classification
- [ ] Returns confidence score for category

---

## Phase 3: Summary Generation Service [Mixed]

### Task 3.1: Create SummaryGenerator Class Structure
- **Agent**: backend-architect
- **Depends on**: Task 1.2
- **Effort**: 1 hour
- **File**: `src/services/topics/SummaryGenerator.js`

**Acceptance Criteria**:
- [ ] Class accepts AI client in constructor
- [ ] Exports `generateSummary(topicId, messages, context)`
- [ ] Exports `regenerateSummary(topicId)`
- [ ] Configurable model and token limits

---

### Task 3.2: Implement Summary Prompt Builder
- **Agent**: backend-architect
- **Depends on**: Task 3.1
- **Effort**: 2 hours

**Acceptance Criteria**:
- [ ] Builds prompt with message context
- [ ] Includes participant names and category
- [ ] Requests JSON output with summary + citations
- [ ] Prompt follows co-parenting neutral tone guidelines
- [ ] Handles long conversations (truncation/chunking)

**Prompt Template**:
```
You are summarizing a co-parent conversation about: {category}
Participants: {participants}
Messages (with IDs): {formatted_messages}

Generate a 1-3 sentence factual summary...
Output JSON: { "summary": "...", "citations": [...] }
```

---

### Task 3.3: Implement Citation Parser
- **Agent**: backend-architect
- **Depends on**: Task 3.2
- **Effort**: 1.5 hours

**Acceptance Criteria**:
- [ ] Parses LLM JSON response
- [ ] Validates citation message IDs exist
- [ ] Calculates claim positions in summary text
- [ ] Handles malformed responses gracefully
- [ ] Returns structured citation objects

**Output Format**:
```javascript
{
  summary: "The soccer coach needs $50...",
  citations: [
    { claim: "$50", startIndex: 25, endIndex: 28, messageIds: ["msg_123"] }
  ]
}
```

---

### Task 3.4: [P] Implement Summary Storage
- **Agent**: backend-architect
- **Depends on**: Task 3.3
- **Effort**: 1 hour

**Acceptance Criteria**:
- [ ] Saves summary to `topic_summaries` table
- [ ] Saves citations to `summary_citations` table
- [ ] Archives previous version to `summary_history`
- [ ] Updates `updated_at` and `summary_version`

---

## Phase 4: REST API Layer [Mixed]

### Task 4.1: Create Topics Router
- **Agent**: backend-architect
- **Depends on**: Task 2.2, Task 3.4
- **Effort**: 1 hour
- **File**: `routes/topics.js`

**Acceptance Criteria**:
- [ ] Router registered in `routeManager.js`
- [ ] All endpoints use `verifyAuth` middleware
- [ ] Error handling with appropriate status codes

---

### Task 4.2: [P] Implement GET Endpoints
- **Agent**: backend-architect
- **Depends on**: Task 4.1
- **Effort**: 1.5 hours

**Endpoints**:
```
GET /api/rooms/:roomId/topics
GET /api/topics/:topicId
```

**Acceptance Criteria**:
- [ ] Returns topics with summary previews
- [ ] Returns full topic with citations
- [ ] Supports pagination for topic list
- [ ] Verifies user has access to room

---

### Task 4.3: [P] Implement POST Endpoints
- **Agent**: backend-architect
- **Depends on**: Task 4.1
- **Effort**: 1.5 hours

**Endpoints**:
```
POST /api/topics/:topicId/regenerate
POST /api/rooms/:roomId/topics/detect
POST /api/topics/:topicId/report
```

**Acceptance Criteria**:
- [ ] Regenerate triggers new summary generation
- [ ] Detect runs topic detection on room
- [ ] Report logs inaccurate summary for review
- [ ] All return appropriate success/error responses

---

## Phase 5: Socket.io Events [Mixed]

### Task 5.1: Create Topic Socket Handler
- **Agent**: backend-architect
- **Depends on**: Task 4.2
- **Effort**: 1 hour
- **File**: `socketHandlers/topicHandler.js`

**Acceptance Criteria**:
- [ ] Handler registered in `sockets.js`
- [ ] Uses `userSessionService` for auth
- [ ] Proper error handling

---

### Task 5.2: Implement Topic Events
- **Agent**: backend-architect
- **Depends on**: Task 5.1
- **Effort**: 1.5 hours

**Events**:
```
get_topics → topics_list
get_topic_details → topic_details
```

**Acceptance Criteria**:
- [ ] Events emit to requesting socket only
- [ ] Validates user membership in room

---

### Task 5.3: [P] Implement Citation Jump Event
- **Agent**: backend-architect
- **Depends on**: Task 5.1
- **Effort**: 1 hour

**Event**:
```
citation_jump → citation_jump_result
```

**Acceptance Criteria**:
- [ ] Returns message context (surrounding messages)
- [ ] Includes target message ID for highlighting
- [ ] Works across topic → chat view transition

---

## Phase 6: Frontend Components [Mixed]

### Task 6.1: Create Topics Feature Directory
- **Agent**: frontend-specialist
- **Depends on**: Task 4.2
- **Effort**: 30 mins
- **Directory**: `src/features/topics/`

**Structure**:
```
topics/
├── components/
├── hooks/
├── context/
└── index.js
```

---

### Task 6.2: Implement useTopics Hook
- **Agent**: frontend-specialist
- **Depends on**: Task 6.1
- **Effort**: 1.5 hours
- **File**: `src/features/topics/hooks/useTopics.js`

**Acceptance Criteria**:
- [ ] Fetches topics via socket `get_topics`
- [ ] Stores topics in state
- [ ] Handles real-time updates (`topic_created`, `topic_updated`)
- [ ] Exports `topics`, `isLoading`, `getTopicDetails`

---

### Task 6.3: [P] Implement TopicCard Component
- **Agent**: frontend-specialist
- **Depends on**: Task 6.2
- **Effort**: 2 hours
- **File**: `src/features/topics/components/TopicCard.jsx`

**Acceptance Criteria**:
- [ ] Displays topic title, category badge, summary preview
- [ ] Shows message count and "Updated X ago"
- [ ] "View conversation" button
- [ ] Follows design system (teal colors, rounded corners)
- [ ] Responsive on mobile

---

### Task 6.4: [P] Implement CitationLink Component
- **Agent**: frontend-specialist
- **Depends on**: Task 6.2
- **Effort**: 1.5 hours
- **File**: `src/features/topics/components/CitationLink.jsx`

**Acceptance Criteria**:
- [ ] Renders as underlined clickable text
- [ ] Shows superscript citation number
- [ ] Tooltip with message preview on hover
- [ ] Calls `onCitationClick` with message ID

---

### Task 6.5: [P] Implement useCitationJump Hook
- **Agent**: frontend-specialist
- **Depends on**: Task 6.4
- **Effort**: 1.5 hours
- **File**: `src/features/topics/hooks/useCitationJump.js`

**Acceptance Criteria**:
- [ ] Emits `citation_jump` socket event
- [ ] Handles `citation_jump_result` response
- [ ] Navigates to chat view
- [ ] Scrolls to and highlights target message
- [ ] Highlight fades after 3 seconds

---

### Task 6.6: Integrate Topics into Dashboard
- **Agent**: frontend-specialist
- **Depends on**: Task 6.3, Task 6.4, Task 6.5
- **Effort**: 2 hours
- **File**: `src/features/dashboard/DashboardView.jsx`

**Acceptance Criteria**:
- [ ] Topics section added to dashboard grid
- [ ] Shows TopicCards for room topics
- [ ] "No topics yet" state when empty
- [ ] Citation clicks navigate correctly

---

## Phase 7: Integration & Real-time [Mixed]

### Task 7.1: Integrate Topic Detection into Message Flow
- **Agent**: backend-architect
- **Depends on**: Task 2.2, Task 5.2
- **Effort**: 2 hours
- **File**: `socketHandlers/messageHandler.js`

**Acceptance Criteria**:
- [ ] After message saved, check for topic assignment
- [ ] If matches existing topic, add and queue regeneration
- [ ] If no match, queue for batch detection
- [ ] Emits `topic_updated` on changes

---

### Task 7.2: Implement Regeneration Debouncing
- **Agent**: backend-architect
- **Depends on**: Task 7.1
- **Effort**: 1 hour

**Acceptance Criteria**:
- [ ] Debounces regeneration requests (30 second window)
- [ ] Only one regeneration per topic in flight
- [ ] Queue processes after debounce expires

---

### Task 7.3: [P] Add Topic Events to Frontend Socket Handlers
- **Agent**: frontend-specialist
- **Depends on**: Task 6.2
- **Effort**: 1 hour
- **File**: `src/features/chat/handlers/`

**Acceptance Criteria**:
- [ ] Listens for `topic_created`, `topic_updated`
- [ ] Updates topic state in context
- [ ] Shows notification/toast on new topic

---

### Task 7.4: End-to-End Testing
- **Agent**: testing-specialist
- **Depends on**: Task 7.1, Task 7.3
- **Effort**: 3 hours

**Test Scenarios**:
- [ ] Send messages → Topic detected → Summary generated
- [ ] Click citation → Navigate to message → Highlight
- [ ] Add message to topic → Summary regenerates
- [ ] Manual regenerate → New summary appears

---

## Dependency Graph

```
Phase 1 (Database)
    │
    ├── Task 1.1 → Task 1.2
    │
    ▼
Phase 2 (Detection)              Phase 3 (Summaries)
    │                                   │
    ├── Task 2.1 ─┬─ Task 2.2          ├── Task 3.1 → Task 3.2 → Task 3.3 → Task 3.4
    │             ├─ Task 2.3 [P]      │
    │             └─ Task 2.4 [P]      │
    │                                   │
    └───────────────┬───────────────────┘
                    │
                    ▼
            Phase 4 (API)
                │
                ├── Task 4.1 ─┬─ Task 4.2 [P]
                │             └─ Task 4.3 [P]
                │
                ▼
            Phase 5 (Sockets)
                │
                ├── Task 5.1 → Task 5.2
                │           └─ Task 5.3 [P]
                │
                ▼
            Phase 6 (Frontend)
                │
                ├── Task 6.1 → Task 6.2 ─┬─ Task 6.3 [P]
                │                        ├─ Task 6.4 [P]
                │                        └─ Task 6.5 [P]
                │                                │
                │                                ▼
                │                           Task 6.6
                │
                ▼
            Phase 7 (Integration)
                │
                ├── Task 7.1 → Task 7.2
                ├── Task 7.3 [P]
                └── Task 7.4 (depends on all)
```

---

## Execution Order (Recommended)

### Week 1: Foundation
1. Task 1.1 - Database migration
2. Task 1.2 - Validate migration
3. Task 2.1 - TopicDetector structure
4. Task 2.2 - DBSCAN clustering
5. Task 2.3 [P] - Title generation (parallel with 2.4)
6. Task 2.4 [P] - Category assignment

### Week 2: Core Services
7. Task 3.1 - SummaryGenerator structure
8. Task 3.2 - Prompt builder
9. Task 3.3 - Citation parser
10. Task 3.4 [P] - Summary storage
11. Task 4.1 - Topics router
12. Task 4.2 [P] - GET endpoints (parallel with 4.3)
13. Task 4.3 [P] - POST endpoints

### Week 3: Frontend
14. Task 5.1 - Socket handler
15. Task 5.2 - Topic events
16. Task 5.3 [P] - Citation jump
17. Task 6.1 - Feature directory
18. Task 6.2 - useTopics hook
19. Task 6.3 [P] - TopicCard (parallel with 6.4, 6.5)
20. Task 6.4 [P] - CitationLink
21. Task 6.5 [P] - useCitationJump

### Week 4: Integration & Polish
22. Task 6.6 - Dashboard integration
23. Task 7.1 - Message flow integration
24. Task 7.2 - Debouncing
25. Task 7.3 [P] - Frontend socket handlers
26. Task 7.4 - E2E testing

---

## Estimated Total Effort

| Role | Hours |
|------|-------|
| Backend | ~22 hours |
| Frontend | ~10 hours |
| Testing | ~3 hours |
| **Total** | **~35 hours** |

With 2 developers working in parallel on backend/frontend after Phase 4, estimated calendar time: **2-3 weeks**.
