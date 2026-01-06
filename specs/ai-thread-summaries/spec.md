# AI Thread Summaries Feature Specification

**Feature ID**: AI-THREAD-SUM-001
**Version**: 1.0.0
**Status**: Draft
**Last Updated**: 2026-01-04
**Author**: specification-agent

---

## 1. Overview

### 1.1 Feature Name

**AI Thread Summaries** - Automatically group related messages into topic threads with AI-generated narrative summaries and clickable citations.

### 1.2 Business Objective

**Primary Goal**: Transform fragmented back-and-forth messages into coherent, evolving narrative summaries organized by topic, making it easy for co-parents to understand conversation history at a glance.

**Why This Matters for Co-Parents**:

- **Instant Context**: See "Soccer coach needs $50 by 1/25. You agreed to pay half." instead of scrolling through 20 messages
- **Living Documentation**: Summaries update automatically as conversations continue
- **Accountability**: Citations link directly to original messages for verification
- **Reduced Conflict**: Objective AI summary reduces "I never said that" disputes
- **Time Savings**: Quickly catch up on topics without reading every message

**How This Benefits Children**:

- Parents make faster, better-informed decisions
- Important details (amounts, dates, deadlines) are surfaced prominently
- Less parental conflict from miscommunication or forgotten context

### 1.3 Success Metrics

**Adoption Metrics**:
- 70% of users view thread summaries weekly
- Average user clicks 3+ citations per session
- 50% reduction in "scroll to find" behavior

**Effectiveness Metrics**:
- 30% reduction in "what did we agree on?" type messages
- 20% faster response time on thread-related topics
- 85% accuracy on citation-to-message linking

**Engagement Metrics**:
- Average thread summary viewed 5+ times
- 90% user satisfaction with summary accuracy (survey)
- 40% of users report "easier to co-parent" after feature launch

### 1.4 Priority & Scope

**Priority**: High
**Target Release**: Q2 2026
**Estimated Effort**: 3-4 weeks (1 backend, 1 frontend, AI integration)

**In Scope**:
- Automatic topic detection from conversation flow
- AI-generated narrative summaries per topic
- Clickable citations linking to source messages
- Real-time summary updates as new messages arrive
- Summary accuracy indicators
- Manual topic correction/merging

**Out of Scope** (Future Iterations):
- Voice summary playback
- Summary export to PDF
- Third-party sharing of summaries
- Multi-language summary translation

---

## 2. User Stories

### 2.1 Primary User Stories

#### Story 1: View Topic Summary

**As a** co-parent
**I want to** see an AI-generated summary of a conversation topic
**So that** I can quickly understand what was discussed without reading every message

**Acceptance Criteria**:
- [ ] Dashboard shows topic cards with AI-generated summaries
- [ ] Summary is 1-3 sentences capturing key points
- [ ] Summary includes: WHO, WHAT, WHEN, HOW MUCH (if applicable)
- [ ] Summary updates automatically when new related messages arrive
- [ ] Last updated timestamp shows when summary was refreshed

**Example**:
```
📋 Soccer Uniform Fee
"The soccer coach needs $50 for Maia's uniform by January 25th.
You agreed to pay half ($25)."
Updated: 2 hours ago • 6 messages
[View conversation →]
```

#### Story 2: Click Citation to Jump to Source

**As a** co-parent
**I want to** click on a specific claim in the summary
**So that** I can verify the original message and context

**Acceptance Criteria**:
- [ ] Key facts in summary are underlined/highlighted as clickable
- [ ] Clicking citation scrolls to and highlights the source message
- [ ] Multiple citations can link to different messages
- [ ] Citation tooltip shows message preview on hover

**Example**:
```
"The soccer coach needs [$50]¹ for Maia's uniform by [January 25th]².
[You agreed to pay half]³."

¹ → Message from Dad, Jan 3, 10:42 AM
² → Message from Mom, Jan 3, 10:45 AM
³ → Message from Dad, Jan 3, 10:51 AM
```

#### Story 3: Automatic Topic Detection

**As a** co-parent
**I want** the system to automatically identify conversation topics
**So that** I don't have to manually organize every discussion

**Acceptance Criteria**:
- [ ] AI detects when 3+ related messages form a topic cluster
- [ ] Topics are categorized (Medical, School, Activities, Logistics, etc.)
- [ ] New messages are automatically assigned to existing topics or create new ones
- [ ] User can manually reassign messages between topics
- [ ] Confidence indicator shows topic detection accuracy

#### Story 4: Live Summary Updates

**As a** co-parent
**I want** summaries to update as the conversation continues
**So that** the summary always reflects the latest information

**Acceptance Criteria**:
- [ ] New related messages trigger summary regeneration (debounced)
- [ ] Summary shows "Updating..." indicator during regeneration
- [ ] Previous summary preserved until new one is ready
- [ ] User notified when summary content changes significantly
- [ ] Summary version history available (last 5 versions)

### 2.2 Secondary User Stories

#### Story 5: Correct Topic Assignment

**As a** co-parent
**I want to** move a message to a different topic
**So that** I can fix AI mistakes in topic detection

#### Story 6: Merge Related Topics

**As a** co-parent
**I want to** combine two related topics into one
**So that** related discussions aren't fragmented

#### Story 7: Flag Inaccurate Summary

**As a** co-parent
**I want to** report when a summary is wrong
**So that** the system can improve and I can request a manual review

---

## 3. Functional Requirements

### 3.1 Topic Detection Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| TD-01 | Detect topic clusters using semantic similarity of messages | Must Have |
| TD-02 | Minimum 3 messages to form a topic | Must Have |
| TD-03 | Assign category (Medical, School, Activities, Logistics, Financial, General) | Must Have |
| TD-04 | Generate descriptive topic title from message content | Must Have |
| TD-05 | Merge messages into existing topic if similarity > 0.8 | Should Have |
| TD-06 | Split topic if sub-themes diverge significantly | Could Have |

### 3.2 Summary Generation

| ID | Requirement | Priority |
|----|-------------|----------|
| SG-01 | Generate 1-3 sentence narrative summary per topic | Must Have |
| SG-02 | Extract key facts: names, dates, amounts, deadlines | Must Have |
| SG-03 | Maintain neutral, factual tone (no interpretation) | Must Have |
| SG-04 | Include attribution ("You said...", "They mentioned...") | Must Have |
| SG-05 | Regenerate summary when new messages added (debounce 30s) | Must Have |
| SG-06 | Track summary version history (last 5) | Should Have |
| SG-07 | Support summary in both parents' perspectives | Could Have |

### 3.3 Citation System

| ID | Requirement | Priority |
|----|-------------|----------|
| CT-01 | Link each factual claim to source message ID(s) | Must Have |
| CT-02 | Clickable citations in summary text | Must Have |
| CT-03 | Jump-to-message navigation on citation click | Must Have |
| CT-04 | Highlight source message for 3 seconds after jump | Must Have |
| CT-05 | Citation tooltip with message preview | Should Have |
| CT-06 | Support multiple sources for single claim | Should Have |

### 3.4 User Interface

| ID | Requirement | Priority |
|----|-------------|----------|
| UI-01 | Topic cards on dashboard with summary preview | Must Have |
| UI-02 | Expand topic to see full summary with citations | Must Have |
| UI-03 | "View conversation" link to see all topic messages | Must Have |
| UI-04 | Topic category badge and icon | Must Have |
| UI-05 | "Updated X ago" timestamp | Must Have |
| UI-06 | Message count indicator | Must Have |
| UI-07 | Manual topic correction UI (move message) | Should Have |
| UI-08 | "Report inaccurate" button | Should Have |

---

## 4. Technical Requirements

### 4.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                            │
│  TopicCard → SummaryView → CitationLink → MessageJump           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Socket.io / REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js)                           │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │ Topic Detector  │───▶│ Summary Engine  │                    │
│  │ (Clustering)    │    │ (LLM + Citations)│                    │
│  └─────────────────┘    └─────────────────┘                    │
│           │                      │                              │
│           ▼                      ▼                              │
│  ┌─────────────────────────────────────────┐                   │
│  │           PostgreSQL + pgvector          │                   │
│  │  - message_embeddings (semantic search)  │                   │
│  │  - topic_summaries (generated summaries) │                   │
│  │  - summary_citations (message links)     │                   │
│  └─────────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Database Schema (New Tables)

```sql
-- Topic summaries table
CREATE TABLE topic_summaries (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  summary_text TEXT NOT NULL,
  summary_version INTEGER DEFAULT 1,
  message_count INTEGER DEFAULT 0,
  first_message_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confidence_score DECIMAL(3,2) DEFAULT 0.80,
  is_archived BOOLEAN DEFAULT FALSE
);

-- Citations linking summary claims to messages
CREATE TABLE summary_citations (
  id TEXT PRIMARY KEY,
  summary_id TEXT NOT NULL REFERENCES topic_summaries(id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL,           -- The specific claim being cited
  claim_position INTEGER NOT NULL,    -- Position in summary text
  message_ids TEXT[] NOT NULL,        -- Array of source message IDs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topic-message mapping (which messages belong to which topic)
CREATE TABLE topic_messages (
  topic_id TEXT NOT NULL REFERENCES topic_summaries(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  relevance_score DECIMAL(3,2) DEFAULT 1.0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (topic_id, message_id)
);

-- Summary version history
CREATE TABLE summary_history (
  id TEXT PRIMARY KEY,
  summary_id TEXT NOT NULL REFERENCES topic_summaries(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  summary_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 API Endpoints

```
GET  /api/rooms/:roomId/topics
     → Returns all topics for room with summary previews

GET  /api/topics/:topicId
     → Returns full topic with summary and citations

POST /api/topics/:topicId/regenerate
     → Force regenerate summary

PATCH /api/topics/:topicId/messages/:messageId
      → Move message to different topic

POST /api/topics/merge
     → Merge two topics into one

POST /api/topics/:topicId/report
     → Report inaccurate summary
```

### 4.4 Socket Events

```
topic_created      → New topic detected and summarized
topic_updated      → Summary regenerated with new messages
topic_merged       → Two topics combined
citation_click     → Request to jump to message
```

### 4.5 AI Integration

**Topic Detection**:
- Use existing pgvector embeddings for semantic clustering
- K-means or DBSCAN clustering on message embeddings
- Cluster coherence threshold: 0.75

**Summary Generation**:
- Model: GPT-4o-mini (cost-effective for summaries)
- Prompt includes: messages, participants, category context
- Output format: JSON with summary + citations array
- Token limit: 500 tokens per summary

**Citation Extraction**:
- LLM identifies key facts during summary generation
- Returns fact + source message ID pairs
- Validation: each citation must map to real message

---

## 5. User Interface Mockups

### 5.1 Dashboard Topic Card

```
┌────────────────────────────────────────────────────┐
│ 📋 Soccer Uniform Fee                    Activities │
│────────────────────────────────────────────────────│
│ "The soccer coach needs $50 for Maia's uniform    │
│ by January 25th. You agreed to pay half ($25)."   │
│                                                    │
│ 6 messages • Updated 2 hours ago                   │
│                                     [View thread →]│
└────────────────────────────────────────────────────┘
```

### 5.2 Expanded Topic with Citations

```
┌────────────────────────────────────────────────────┐
│ ← Back to Topics                                   │
│                                                    │
│ 📋 Soccer Uniform Fee                              │
│ Category: Activities                               │
│────────────────────────────────────────────────────│
│                                                    │
│ "The soccer coach [emailed about uniform fees]¹.  │
│ The cost is [$50]² due by [January 25th]³.        │
│ [You agreed to pay half]⁴ ($25)."                 │
│                                                    │
│────────────────────────────────────────────────────│
│ Citations:                                         │
│ ¹ Dad, Jan 3, 10:42 AM - "The soccer coach just.."│
│ ² Dad, Jan 3, 10:44 AM - "He says it's $50 for..."│
│ ³ Mom, Jan 3, 10:45 AM - "When is it due? By the."│
│ ⁴ Dad, Jan 3, 10:51 AM - "I can pay half if you.."│
│                                                    │
│ [View full conversation]  [Report inaccurate]      │
└────────────────────────────────────────────────────┘
```

### 5.3 Citation Jump Behavior

```
User clicks citation ¹ →
  1. View switches to Chat
  2. Scrolls to message ID
  3. Message highlighted with yellow pulse (3s)
  4. Back button returns to topic view
```

---

## 6. Edge Cases & Error Handling

### 6.1 Edge Cases

| Scenario | Handling |
|----------|----------|
| Less than 3 messages on topic | Don't create summary, show "Gathering context..." |
| Messages span > 30 days | Split into time-based sub-topics |
| Contradictory statements | Include both with "Initially X, later Y" |
| Ambiguous topic boundary | Show confidence score, allow manual split |
| Deleted source message | Citation shows "[Message deleted]" |
| Very long conversation (100+ msgs) | Summarize in chunks, combine |

### 6.2 Error Handling

| Error | User Experience |
|-------|-----------------|
| LLM timeout | Show cached summary with "Updating..." |
| Invalid citation | Log error, hide broken citation |
| Topic detection fails | Fall back to time-based grouping |
| Rate limit exceeded | Queue regeneration, show stale indicator |

---

## 7. Co-Parenting Domain Considerations

### 7.1 Conflict Reduction

- Summaries use neutral language ("You mentioned..." not "You claimed...")
- Both parents see identical summaries (no perspective bias)
- Citations provide verifiable source for disputed facts
- No emotional interpretation in summaries

### 7.2 Privacy & Security

- Summaries stored with same encryption as messages
- No summary data shared with third parties
- Citation links require room membership to access
- Summary history retained for accountability

### 7.3 Accessibility

- Summaries work well with screen readers
- Citation numbers are keyboard navigable
- Mobile-friendly tap targets for citations
- Color-blind safe category indicators

---

## 8. Dependencies

### 8.1 Existing Features Required

- [x] Message embeddings (pgvector) - Already implemented
- [x] Thread infrastructure - Already implemented
- [ ] Dashboard topic section - Needs enhancement

### 8.2 External Dependencies

- OpenAI API (GPT-4o-mini for summaries)
- pgvector extension (for clustering)

---

## 9. Testing Requirements

### 9.1 Unit Tests

- Topic clustering algorithm accuracy
- Summary generation with various message counts
- Citation extraction and validation
- Message-to-topic assignment

### 9.2 Integration Tests

- End-to-end topic detection → summary → citation flow
- Real-time summary updates via Socket.io
- Citation jump navigation
- Topic merge/split operations

### 9.3 User Acceptance Tests

- Summary accurately reflects conversation
- Citations link to correct messages
- Topics make logical sense to users
- UI is intuitive on mobile and desktop

---

## 10. Rollout Plan

### Phase 1: Foundation (Week 1)
- Database schema migration
- Topic detection algorithm
- Basic summary generation

### Phase 2: Citations (Week 2)
- Citation extraction in summaries
- Jump-to-message navigation
- Citation UI components

### Phase 3: Real-time (Week 3)
- Live summary updates
- Socket.io integration
- Dashboard topic cards

### Phase 4: Polish (Week 4)
- Manual topic correction
- Report inaccurate flow
- Performance optimization
- QA and bug fixes

---

## 11. Open Questions

1. **Summary Perspective**: Should summaries use "you/they" or actual names?
2. **Update Frequency**: Regenerate on every message or batch (every 5 mins)?
3. **Historical Data**: Generate summaries for existing conversations or only new?
4. **Confidence Threshold**: What score triggers "low confidence" warning?

---

## Appendix A: Example Summary Generation Prompt

```
You are summarizing a co-parent conversation about a specific topic.

Topic: {topic_title}
Category: {category}
Participants: {parent1_name}, {parent2_name}

Messages (chronological):
{messages_with_ids}

Generate a 1-3 sentence factual summary that:
1. States the key facts (who, what, when, amounts)
2. Notes any agreements or decisions made
3. Uses neutral language (no emotional interpretation)
4. References participants as "you" and "{other_parent_name}"

Also identify citations - for each key fact, list the message ID(s) that support it.

Output JSON:
{
  "summary": "The soccer coach needs $50 for the uniform by January 25th. You agreed to pay half.",
  "citations": [
    {"claim": "$50", "message_ids": ["msg_123"]},
    {"claim": "January 25th", "message_ids": ["msg_124", "msg_125"]},
    {"claim": "agreed to pay half", "message_ids": ["msg_127"]}
  ]
}
```
