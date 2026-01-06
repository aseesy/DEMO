# AI Thread Summaries - Implementation Plan

**Feature**: AI-Summarized Conversation Threads with Citations
**Spec**: `specs/ai-thread-summaries/spec.md`
**Created**: 2026-01-04

---

## Phase 0: Research & Dependencies

### Existing Infrastructure to Leverage

| Component | Location | Purpose |
|-----------|----------|---------|
| Message Embeddings | `src/core/memory/narrativeMemory.js` | pgvector embeddings already generated |
| Thread Operations | `src/services/threads/threadOperations.js` | CRUD for threads |
| AI Client | `src/core/engine/client.js` | OpenAI integration |
| Profile Analyzer | `src/core/profiles/profileAnalyzer.js` | User pattern extraction |

### Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Clustering Algorithm | DBSCAN via pgvector | Works with existing embeddings, no predefined cluster count needed |
| Summary Model | GPT-4o-mini | Cost-effective, fast, good for structured output |
| Citation Format | JSON with message IDs | Easy to parse, enables jump-to-message |
| Storage | PostgreSQL | Consistent with existing architecture |

### Open Questions Resolved

1. **Summary Perspective**: Use "you" for current user, first name for co-parent
2. **Update Frequency**: Debounce 30 seconds after last message in topic
3. **Historical Data**: Generate for conversations with 10+ messages on demand
4. **Confidence Threshold**: < 0.7 shows "Summary may be incomplete" warning

---

## Phase 1: Database Schema

### Migration: `migrations/040_topic_summaries.sql`

```sql
-- Topic summaries table
CREATE TABLE IF NOT EXISTS topic_summaries (
  id TEXT PRIMARY KEY DEFAULT 'topic-' || extract(epoch from now())::text || '-' || substr(md5(random()::text), 1, 8),
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS summary_citations (
  id TEXT PRIMARY KEY DEFAULT 'cite-' || extract(epoch from now())::text || '-' || substr(md5(random()::text), 1, 8),
  summary_id TEXT NOT NULL REFERENCES topic_summaries(id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL,
  claim_start_index INTEGER NOT NULL,
  claim_end_index INTEGER NOT NULL,
  message_ids TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topic-message mapping
CREATE TABLE IF NOT EXISTS topic_messages (
  topic_id TEXT NOT NULL REFERENCES topic_summaries(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  relevance_score DECIMAL(3,2) DEFAULT 1.0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (topic_id, message_id)
);

-- Summary version history
CREATE TABLE IF NOT EXISTS summary_history (
  id TEXT PRIMARY KEY DEFAULT 'hist-' || extract(epoch from now())::text || '-' || substr(md5(random()::text), 1, 8),
  summary_id TEXT NOT NULL REFERENCES topic_summaries(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  summary_text TEXT NOT NULL,
  citations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_topic_summaries_room ON topic_summaries(room_id);
CREATE INDEX IF NOT EXISTS idx_topic_summaries_category ON topic_summaries(room_id, category);
CREATE INDEX IF NOT EXISTS idx_topic_summaries_updated ON topic_summaries(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_summary_citations_summary ON summary_citations(summary_id);
CREATE INDEX IF NOT EXISTS idx_topic_messages_topic ON topic_messages(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_messages_message ON topic_messages(message_id);
```

---

## Phase 2: Topic Detection Service

### File: `src/services/topics/TopicDetector.js`

```javascript
/**
 * TopicDetector - Clusters messages into topics using semantic similarity
 *
 * Algorithm:
 * 1. Get message embeddings from narrativeMemory
 * 2. Use DBSCAN clustering (eps=0.3, minPts=3)
 * 3. Generate topic title from cluster keywords
 * 4. Assign category based on content analysis
 */

class TopicDetector {
  constructor(options = {}) {
    this.minMessages = options.minMessages || 3;
    this.similarityThreshold = options.similarityThreshold || 0.75;
  }

  /**
   * Detect topics in a room's conversation
   * @param {string} roomId
   * @param {Object} options - { since: Date, limit: number }
   * @returns {Array<{ title, category, messageIds, confidence }>}
   */
  async detectTopics(roomId, options = {}) {
    // 1. Get messages with embeddings
    // 2. Cluster using cosine similarity
    // 3. Extract topic title and category per cluster
    // 4. Return topic candidates
  }

  /**
   * Find which topic a new message belongs to
   * @param {Object} message - Message with embedding
   * @param {string} roomId
   * @returns {string|null} - Topic ID or null if new topic needed
   */
  async assignMessageToTopic(message, roomId) {
    // Compare message embedding to existing topic centroids
    // Return matching topic or null
  }
}
```

### Integration Points

- Uses `narrativeMemory.findSimilar()` for embedding queries
- Stores results in `topic_summaries` and `topic_messages` tables
- Triggers `topic_created` event for real-time updates

---

## Phase 3: Summary Generation Service

### File: `src/services/topics/SummaryGenerator.js`

```javascript
/**
 * SummaryGenerator - Creates AI summaries with citations
 *
 * Uses GPT-4o-mini to:
 * 1. Summarize topic messages into 1-3 sentences
 * 2. Extract key facts with source message IDs
 * 3. Generate structured citation data
 */

class SummaryGenerator {
  constructor(aiClient) {
    this.aiClient = aiClient;
    this.model = 'gpt-4o-mini';
    this.maxTokens = 500;
  }

  /**
   * Generate summary for a topic
   * @param {string} topicId
   * @param {Array<Object>} messages - Messages in topic with IDs
   * @param {Object} context - { participants, category }
   * @returns {{ summary: string, citations: Array }}
   */
  async generateSummary(topicId, messages, context) {
    const prompt = this.buildPrompt(messages, context);
    const response = await this.aiClient.chat({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    return this.parseResponse(response);
  }

  buildPrompt(messages, context) {
    return `You are summarizing a co-parent conversation about: ${context.category}

Participants: ${context.participants.join(', ')}

Messages (with IDs):
${messages.map(m => `[${m.id}] ${m.sender}: ${m.text}`).join('\n')}

Generate a 1-3 sentence factual summary that:
1. States key facts (who, what, when, amounts, deadlines)
2. Notes any agreements or decisions
3. Uses neutral language

Output JSON:
{
  "summary": "Your summary here",
  "citations": [
    {"claim": "specific fact", "message_ids": ["msg_id1", "msg_id2"]}
  ]
}`;
  }
}
```

---

## Phase 4: REST API Endpoints

### File: `routes/topics.js`

```javascript
const router = express.Router();
const { TopicService } = require('../src/services/topics');

// GET /api/rooms/:roomId/topics
// Returns all topics with summary previews
router.get('/rooms/:roomId/topics', verifyAuth, async (req, res) => {
  const { roomId } = req.params;
  const topics = await TopicService.getTopicsForRoom(roomId);
  res.json({ topics });
});

// GET /api/topics/:topicId
// Returns full topic with summary and citations
router.get('/topics/:topicId', verifyAuth, async (req, res) => {
  const { topicId } = req.params;
  const topic = await TopicService.getTopicWithCitations(topicId);
  res.json(topic);
});

// POST /api/topics/:topicId/regenerate
// Force regenerate summary
router.post('/topics/:topicId/regenerate', verifyAuth, async (req, res) => {
  const { topicId } = req.params;
  const result = await TopicService.regenerateSummary(topicId);
  res.json(result);
});

// POST /api/rooms/:roomId/topics/detect
// Run topic detection on room
router.post('/rooms/:roomId/topics/detect', verifyAuth, async (req, res) => {
  const { roomId } = req.params;
  const topics = await TopicService.detectAndCreateTopics(roomId);
  res.json({ topics, count: topics.length });
});
```

---

## Phase 5: Socket.io Events

### File: `socketHandlers/topicHandler.js`

```javascript
function registerTopicHandlers(socket, io, services) {
  const { topicService, userSessionService } = services;

  // Get topics for room
  socket.on('get_topics', async ({ roomId }) => {
    const topics = await topicService.getTopicsForRoom(roomId);
    socket.emit('topics_list', { topics });
  });

  // Get topic details with citations
  socket.on('get_topic_details', async ({ topicId }) => {
    const topic = await topicService.getTopicWithCitations(topicId);
    socket.emit('topic_details', topic);
  });

  // Jump to cited message
  socket.on('citation_jump', async ({ messageId, topicId }) => {
    const context = await topicService.getMessageContext(messageId);
    socket.emit('citation_jump_result', {
      messageId,
      context,
      topicId
    });
  });
}

// Event emissions (called from TopicService):
// io.to(roomId).emit('topic_created', { topic })
// io.to(roomId).emit('topic_updated', { topicId, summary, citations })
```

---

## Phase 6: Frontend Components

### Component Structure

```
src/features/topics/
├── components/
│   ├── TopicCard.jsx          # Dashboard preview card
│   ├── TopicDetails.jsx       # Full topic with citations
│   ├── CitationLink.jsx       # Clickable citation
│   └── TopicList.jsx          # List of topics
├── hooks/
│   ├── useTopics.js           # Topic data management
│   └── useCitationJump.js     # Jump-to-message logic
├── context/
│   └── TopicContext.jsx       # Topic state provider
└── index.js                   # Public exports
```

### TopicCard Component

```jsx
function TopicCard({ topic, onViewDetails, onCitationClick }) {
  return (
    <div className="bg-white rounded-xl border-2 border-teal-light p-4 shadow-sm">
      {/* Category badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-teal-dark">{topic.title}</span>
        <CategoryBadge category={topic.category} />
      </div>

      {/* Summary with citations */}
      <p className="text-sm text-gray-700">
        <SummaryWithCitations
          text={topic.summary_text}
          citations={topic.citations}
          onCitationClick={onCitationClick}
        />
      </p>

      {/* Meta */}
      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
        <span>{topic.message_count} messages</span>
        <span>Updated {formatRelativeTime(topic.updated_at)}</span>
      </div>

      <button
        onClick={() => onViewDetails(topic.id)}
        className="mt-2 text-sm text-teal-600 hover:text-teal-800"
      >
        View conversation →
      </button>
    </div>
  );
}
```

### Citation Jump Hook

```javascript
function useCitationJump() {
  const { socket } = useChatContext();
  const navigate = useNavigate();

  const jumpToMessage = useCallback((messageId, topicId) => {
    socket.emit('citation_jump', { messageId, topicId });
  }, [socket]);

  useEffect(() => {
    socket.on('citation_jump_result', ({ messageId, context }) => {
      // Navigate to chat view
      navigate('/chat');
      // Set messages to context
      // Highlight target message
      setTimeout(() => {
        const el = document.getElementById(`message-${messageId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.classList.add('highlight-pulse');
      }, 100);
    });
  }, [socket, navigate]);

  return { jumpToMessage };
}
```

---

## Phase 7: Integration & Real-time Updates

### Message Handler Integration

```javascript
// In socketHandlers/messageHandler.js

// After message is saved:
async function onMessageSaved(message, roomId) {
  // 1. Generate embedding (already done by narrativeMemory)

  // 2. Check if message belongs to existing topic
  const existingTopic = await topicDetector.assignMessageToTopic(message, roomId);

  if (existingTopic) {
    // Add to topic and regenerate summary
    await topicService.addMessageToTopic(message.id, existingTopic.id);
    await topicService.regenerateSummary(existingTopic.id);
    io.to(roomId).emit('topic_updated', { topicId: existingTopic.id });
  } else {
    // Queue for topic detection (batch process)
    await topicDetector.queueForDetection(message.id, roomId);
  }
}
```

### Summary Regeneration Debouncing

```javascript
// Debounce summary regeneration to avoid excessive API calls
const regenerationQueue = new Map(); // topicId -> timeout

function queueRegeneration(topicId) {
  if (regenerationQueue.has(topicId)) {
    clearTimeout(regenerationQueue.get(topicId));
  }

  const timeout = setTimeout(async () => {
    await summaryGenerator.regenerateSummary(topicId);
    regenerationQueue.delete(topicId);
  }, 30000); // 30 second debounce

  regenerationQueue.set(topicId, timeout);
}
```

---

## Testing Plan

### Unit Tests

| Test | File | Coverage |
|------|------|----------|
| Topic clustering | `__tests__/TopicDetector.test.js` | Cluster accuracy, edge cases |
| Summary generation | `__tests__/SummaryGenerator.test.js` | Prompt building, response parsing |
| Citation extraction | `__tests__/CitationParser.test.js` | JSON parsing, validation |

### Integration Tests

| Test | Description |
|------|-------------|
| End-to-end flow | Message → Topic → Summary → Citation |
| Real-time updates | Topic update on new message |
| Citation jump | Click → Navigate → Highlight |

### Acceptance Tests

```gherkin
Feature: AI Thread Summaries

Scenario: View topic summary
  Given I have sent 5 messages about "soccer uniform fee"
  When I view the dashboard
  Then I should see a topic card titled "Soccer Uniform Fee"
  And the summary should mention the key facts

Scenario: Click citation
  Given I see a summary with citations
  When I click on a citation link
  Then I should be taken to the original message
  And the message should be highlighted
```

---

## Rollout Timeline

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1 | Foundation | Database schema, TopicDetector, basic tests |
| 2 | Summaries | SummaryGenerator, citations, API endpoints |
| 3 | Frontend | TopicCard, CitationLink, dashboard integration |
| 4 | Real-time | Socket events, message handler integration, polish |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| LLM hallucination | Citation validation against actual message IDs |
| High API costs | GPT-4o-mini, aggressive debouncing, caching |
| Slow clustering | Pre-computed embeddings, background processing |
| Poor topic quality | Manual correction UI, confidence indicators |

---

## Success Criteria

- [ ] Topics detected with > 80% accuracy (manual review)
- [ ] Summaries factually accurate (no fabricated details)
- [ ] Citations link to correct messages 100%
- [ ] Summary regeneration < 5 seconds
- [ ] UI renders on mobile and desktop
