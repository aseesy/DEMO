const dbSafe = require('./dbSafe');
const openaiClient = require('./openaiClient');

// =============================================================================
// THREAD CATEGORIES - All threads must belong to one of these
// =============================================================================
const THREAD_CATEGORIES = [
  'schedule',      // Pickup, dropoff, custody arrangements
  'medical',       // Doctor appointments, health issues, medications
  'education',     // School, homework, grades, teachers
  'finances',      // Child support, shared expenses, reimbursements
  'activities',    // Sports, hobbies, extracurriculars
  'travel',        // Vacations, trips, travel arrangements
  'safety',        // Emergency contacts, safety concerns
  'logistics',     // General coordination, supplies, belongings (default)
  'co-parenting',  // Relationship discussions, parenting decisions
];

/**
 * Validate that a category is valid
 * @param {string} category - Category to validate
 * @returns {string} - Valid category (defaults to 'logistics' if invalid)
 */
function validateCategory(category) {
  if (!category || !THREAD_CATEGORIES.includes(category.toLowerCase())) {
    return 'logistics'; // Default category
  }
  return category.toLowerCase();
}

// =============================================================================
// STOP WORDS - Filter these out before keyword matching
// These are common words that don't carry distinctive meaning
// =============================================================================
const STOP_WORDS = new Set([
  // Articles
  'a', 'an', 'the',
  // Prepositions
  'at', 'by', 'for', 'from', 'in', 'into', 'of', 'off', 'on', 'onto', 'out',
  'over', 'to', 'up', 'with', 'without',
  // Conjunctions
  'and', 'but', 'or', 'nor', 'so', 'yet',
  // Pronouns
  'i', 'me', 'my', 'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his',
  'she', 'her', 'it', 'its', 'they', 'them', 'their', 'this', 'that',
  'these', 'those', 'who', 'whom', 'which', 'what',
  // Common verbs (non-distinctive)
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
  'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
  'get', 'got', 'getting', 'go', 'going', 'went', 'gone',
  'make', 'made', 'making', 'take', 'took', 'taken', 'taking',
  'come', 'came', 'coming', 'give', 'gave', 'given', 'giving',
  'say', 'said', 'saying', 'see', 'saw', 'seen', 'seeing',
  'know', 'knew', 'known', 'knowing', 'think', 'thought', 'thinking',
  'want', 'wanted', 'wanting', 'need', 'needed', 'needing',
  'let', 'put', 'keep', 'kept', 'keeping',
  // Adverbs
  'also', 'just', 'only', 'even', 'still', 'already', 'always', 'never',
  'now', 'then', 'here', 'there', 'when', 'where', 'why', 'how',
  'very', 'really', 'quite', 'too', 'more', 'most', 'less', 'least',
  // Other common words
  'about', 'after', 'again', 'all', 'any', 'back', 'because', 'before',
  'between', 'both', 'each', 'first', 'last', 'like', 'new', 'next',
  'not', 'other', 'own', 'same', 'some', 'such', 'than', 'through',
  'under', 'well', 'while',
  // Co-parenting common but non-distinctive words
  'okay', 'sure', 'yes', 'yeah', 'no', 'thanks', 'thank', 'please',
  'sorry', 'fine', 'good', 'great', 'right', 'wrong',
]);

/**
 * Check if a word is a distinctive keyword (not a stop word)
 * @param {string} word - Word to check
 * @returns {boolean} - True if distinctive
 */
function isDistinctiveKeyword(word) {
  if (!word || word.length < 3) return false;
  const lower = word.toLowerCase();
  if (STOP_WORDS.has(lower)) return false;
  // Filter out numbers-only
  if (/^\d+$/.test(word)) return false;
  return true;
}

/**
 * Extract distinctive keywords from text
 * @param {string} text - Text to extract from
 * @param {number} minLength - Minimum word length (default 3)
 * @returns {string[]} - Array of distinctive keywords
 */
function extractDistinctiveKeywords(text, minLength = 3) {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.replace(/[^a-z0-9]/g, '')) // Remove punctuation
    .filter(w => w.length >= minLength && isDistinctiveKeyword(w));
}

// Neo4j client for semantic threading
let neo4jClient = null;
try {
  neo4jClient = require('./src/infrastructure/database/neo4jClient');
} catch (err) {
  console.warn('⚠️  Neo4j client not available - semantic threading will use fallback');
}

/**
 * Create a new top-level thread
 * For sub-threads, use createSubThread() instead
 * @param {string} roomId - Room ID
 * @param {string} title - Thread title
 * @param {string} createdBy - Username who created
 * @param {string|null} initialMessageId - Optional initial message to add
 * @param {string} category - Thread category (defaults to 'logistics')
 */
async function createThread(roomId, title, createdBy, initialMessageId = null, category = 'logistics') {
  try {
    const threadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const validCategory = validateCategory(category);

    await dbSafe.safeInsert('threads', {
      id: threadId,
      room_id: roomId,
      title: title,
      created_by: createdBy,
      created_at: now,
      updated_at: now,
      message_count: initialMessageId ? 1 : 0,
      last_message_at: initialMessageId ? now : null,
      is_archived: 0,
      category: validCategory,
      // Top-level thread: no parent, root is self, depth is 0
      parent_thread_id: null,
      root_thread_id: threadId, // Self-reference for top-level
      parent_message_id: null,
      depth: 0,
    });

    // Create thread node in Neo4j for semantic search
    if (neo4jClient && neo4jClient.isAvailable()) {
      try {
        await neo4jClient.createOrUpdateThreadNode(threadId, roomId, title);
      } catch (err) {
        console.warn('⚠️  Failed to create Neo4j thread node (non-fatal):', err.message);
      }
    }

    // If initial message provided, associate it with the thread
    if (initialMessageId) {
      await addMessageToThread(initialMessageId, threadId);
    }

    // PostgreSQL auto-commits, no manual save needed
    return threadId;
  } catch (error) {
    console.error('Error creating thread:', error);
    throw error;
  }
}

/**
 * Create a sub-thread (spawned from a message in an existing thread)
 * @param {string} roomId - Room ID
 * @param {string} title - Thread title
 * @param {string} createdBy - Username who created
 * @param {string} parentThreadId - Parent thread ID
 * @param {string} parentMessageId - Message that spawned this sub-thread
 * @param {string} category - Thread category (defaults to parent's category)
 * @returns {Promise<string>} New thread ID
 */
async function createSubThread(roomId, title, createdBy, parentThreadId, parentMessageId, category = null) {
  try {
    const db = require('./dbPostgres');
    const threadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Get parent thread to determine root, depth, and default category
    const parentResult = await db.query(
      'SELECT root_thread_id, depth, category FROM threads WHERE id = $1',
      [parentThreadId]
    );

    if (!parentResult.rows[0]) {
      throw new Error(`Parent thread not found: ${parentThreadId}`);
    }

    const parentThread = parentResult.rows[0];
    // Root is always the top-level ancestor (parent's root, or parent itself if parent is top-level)
    const rootThreadId = parentThread.root_thread_id || parentThreadId;
    const depth = (parentThread.depth || 0) + 1;
    // Inherit category from parent if not specified
    const validCategory = category ? validateCategory(category) : (parentThread.category || 'logistics');

    await dbSafe.safeInsert('threads', {
      id: threadId,
      room_id: roomId,
      title: title,
      created_by: createdBy,
      created_at: now,
      updated_at: now,
      message_count: 0,
      last_message_at: null,
      is_archived: 0,
      category: validCategory,
      parent_thread_id: parentThreadId,
      root_thread_id: rootThreadId,
      parent_message_id: parentMessageId,
      depth: depth,
    });

    // Create thread node in Neo4j with hierarchy info
    if (neo4jClient && neo4jClient.isAvailable()) {
      try {
        await neo4jClient.createOrUpdateThreadNode(threadId, roomId, title);
        // Link to parent thread in Neo4j
        await neo4jClient.linkThreadToParent(threadId, parentThreadId);
      } catch (err) {
        console.warn('⚠️  Failed to create Neo4j sub-thread node (non-fatal):', err.message);
      }
    }

    console.log(`[threadManager] Created sub-thread: ${threadId} (parent: ${parentThreadId}, root: ${rootThreadId}, depth: ${depth})`);
    return threadId;
  } catch (error) {
    console.error('Error creating sub-thread:', error);
    throw error;
  }
}

/**
 * Get all ancestor threads (parent chain up to root)
 * @param {string} threadId - Thread ID to get ancestors for
 * @returns {Promise<Array>} Array of ancestor threads, from immediate parent to root
 */
async function getThreadAncestors(threadId) {
  try {
    const db = require('./dbPostgres');

    // Use recursive CTE to get all ancestors
    const result = await db.query(`
      WITH RECURSIVE ancestors AS (
        -- Start with the parent of the given thread
        SELECT t.*, 1 as level
        FROM threads t
        WHERE t.id = (SELECT parent_thread_id FROM threads WHERE id = $1)

        UNION ALL

        -- Recursively get each parent's parent
        SELECT t.*, a.level + 1
        FROM threads t
        INNER JOIN ancestors a ON t.id = a.parent_thread_id
      )
      SELECT * FROM ancestors
      ORDER BY level ASC
    `, [threadId]);

    return result.rows;
  } catch (error) {
    console.error('Error getting thread ancestors:', error);
    return [];
  }
}

/**
 * Get direct child threads (sub-threads)
 * @param {string} threadId - Parent thread ID
 * @returns {Promise<Array>} Array of direct child threads
 */
async function getSubThreads(threadId) {
  try {
    const result = await dbSafe.safeSelect('threads', { parent_thread_id: threadId, is_archived: 0 }, {
      orderBy: 'updated_at',
      orderDirection: 'DESC',
    });

    return dbSafe.parseResult(result);
  } catch (error) {
    console.error('Error getting sub-threads:', error);
    return [];
  }
}

/**
 * Get complete thread hierarchy (all descendants)
 * @param {string} threadId - Root thread ID to get hierarchy for
 * @returns {Promise<Array>} Flat array of all threads in hierarchy with depth info
 */
async function getThreadHierarchy(threadId) {
  try {
    const db = require('./dbPostgres');

    // Use recursive CTE to get all descendants
    const result = await db.query(`
      WITH RECURSIVE descendants AS (
        -- Start with the given thread
        SELECT t.*, 0 as relative_depth
        FROM threads t
        WHERE t.id = $1

        UNION ALL

        -- Recursively get all children
        SELECT t.*, d.relative_depth + 1
        FROM threads t
        INNER JOIN descendants d ON t.parent_thread_id = d.id
        WHERE t.is_archived = 0
      )
      SELECT * FROM descendants
      ORDER BY relative_depth ASC, updated_at DESC
    `, [threadId]);

    return result.rows;
  } catch (error) {
    console.error('Error getting thread hierarchy:', error);
    return [];
  }
}

/**
 * Get all threads in a room that share the same root (entire conversation tree)
 * @param {string} rootThreadId - Root thread ID
 * @returns {Promise<Array>} All threads in the hierarchy
 */
async function getThreadsByRoot(rootThreadId) {
  try {
    const result = await dbSafe.safeSelect('threads', { root_thread_id: rootThreadId, is_archived: 0 }, {
      orderBy: 'depth',
      orderDirection: 'ASC',
    });

    return dbSafe.parseResult(result);
  } catch (error) {
    console.error('Error getting threads by root:', error);
    return [];
  }
}

/**
 * Get threads for a room (limited to most recent)
 * @param {string} roomId - Room ID
 * @param {boolean} includeArchived - Include archived threads
 * @param {number} limit - Maximum number of threads to return (default 10)
 */
async function getThreadsForRoom(roomId, includeArchived = false, limit = 10) {
  try {
    const whereClause = includeArchived ? { room_id: roomId } : { room_id: roomId, is_archived: 0 };

    const result = await dbSafe.safeSelect('threads', whereClause, {
      orderBy: 'updated_at',
      orderDirection: 'DESC',
      limit: limit,
    });

    return dbSafe.parseResult(result);
  } catch (error) {
    console.error('Error getting threads:', error);
    return [];
  }
}

/**
 * Get messages for a specific thread
 * Orders by sequence number (temporal integrity) with timestamp fallback
 */
async function getThreadMessages(threadId, limit = 50) {
  try {
    const db = require('./dbPostgres');
    // Get messages for this thread, excluding system messages, private, and flagged
    // Order by sequence number (handles out-of-order delivery), fallback to timestamp
    const query = `
      SELECT * FROM messages
      WHERE thread_id = $1
        AND (private = 0 OR private IS NULL)
        AND (flagged = 0 OR flagged IS NULL)
        AND type != 'system'
      ORDER BY COALESCE(thread_sequence, 0) ASC, timestamp ASC
      LIMIT $2
    `;

    const result = await db.query(query, [threadId, limit]);

    return result.rows.map(msg => ({
      id: msg.id,
      type: msg.type,
      username: msg.username,
      text: msg.text,
      timestamp: msg.timestamp,
      threadId: msg.thread_id,
      roomId: msg.room_id,
      sequenceNumber: msg.thread_sequence, // Include sequence for client-side ordering
    }));
  } catch (error) {
    console.error('Error getting thread messages:', error);
    return [];
  }
}

/**
 * Add message to thread
 * Uses atomic database operations - never calculate in application layer
 * - Assigns sequence number atomically for temporal integrity
 * - Increments message_count atomically
 * Returns the new message count and sequence number for delta updates
 */
async function addMessageToThread(messageId, threadId) {
  try {
    const db = require('./dbPostgres');
    const now = new Date().toISOString();

    // ATOMIC SEQUENCE ASSIGNMENT + INCREMENT in single transaction
    // This ensures no race conditions for sequence numbers
    const result = await db.query(
      `WITH sequence_assign AS (
         UPDATE threads
         SET next_sequence = next_sequence + 1,
             message_count = message_count + 1,
             last_message_at = $1,
             updated_at = $1
         WHERE id = $2
         RETURNING next_sequence - 1 as assigned_sequence, message_count, last_message_at
       )
       UPDATE messages
       SET thread_id = $2,
           thread_sequence = (SELECT assigned_sequence FROM sequence_assign)
       WHERE id = $3
       RETURNING thread_sequence, (SELECT message_count FROM sequence_assign) as message_count,
                 (SELECT last_message_at FROM sequence_assign) as last_message_at`,
      [now, threadId, messageId]
    );

    // Link message to thread in Neo4j for semantic search
    if (neo4jClient && neo4jClient.isAvailable()) {
      try {
        await neo4jClient.linkMessageToThread(messageId, threadId);
      } catch (err) {
        console.warn('⚠️  Failed to link message to thread in Neo4j (non-fatal):', err.message);
      }
    }

    const row = result.rows[0] || {};
    const messageCount = row.message_count || 0;
    const lastMessageAt = row.last_message_at || now;
    const sequenceNumber = row.thread_sequence || 0;

    return { success: true, messageCount, lastMessageAt, sequenceNumber };
  } catch (error) {
    console.error('Error adding message to thread:', error);
    return { success: false, messageCount: 0, lastMessageAt: null, sequenceNumber: null };
  }
}

/**
 * Remove message from thread (move back to main conversation)
 * Uses atomic database decrement - never calculate in application layer
 * Returns the threadId and new count for delta updates
 */
async function removeMessageFromThread(messageId) {
  try {
    const db = require('./dbPostgres');

    // First get the thread_id before we null it
    const msgResult = await db.query(
      'SELECT thread_id FROM messages WHERE id = $1',
      [messageId]
    );
    const threadId = msgResult.rows[0]?.thread_id;

    // Update message to remove from thread
    await dbSafe.safeUpdate('messages', { thread_id: null }, { id: messageId });

    if (!threadId) {
      return { success: true, threadId: null, messageCount: 0 };
    }

    // ATOMIC DECREMENT in database layer - never read-modify-write in app layer
    const now = new Date().toISOString();
    const result = await db.query(
      `UPDATE threads
       SET message_count = GREATEST(0, message_count - 1),
           updated_at = $1
       WHERE id = $2
       RETURNING message_count`,
      [now, threadId]
    );

    const messageCount = result.rows[0]?.message_count || 0;

    return { success: true, threadId, messageCount };
  } catch (error) {
    console.error('Error removing message from thread:', error);
    return { success: false, threadId: null, messageCount: 0 };
  }
}

/**
 * Update thread title
 */
async function updateThreadTitle(threadId, newTitle) {
  try {
    await dbSafe.safeUpdate(
      'threads',
      {
        title: newTitle,
        updated_at: new Date().toISOString(),
      },
      { id: threadId }
    );

    // PostgreSQL auto-commits, no manual save needed
    return true;
  } catch (error) {
    console.error('Error updating thread title:', error);
    return false;
  }
}

/**
 * Update thread category
 * @param {string} threadId - Thread ID
 * @param {string} newCategory - New category (must be valid)
 * @returns {Promise<boolean>} Success status
 */
async function updateThreadCategory(threadId, newCategory) {
  try {
    const validCategory = validateCategory(newCategory);

    await dbSafe.safeUpdate(
      'threads',
      {
        category: validCategory,
        updated_at: new Date().toISOString(),
      },
      { id: threadId }
    );

    return true;
  } catch (error) {
    console.error('Error updating thread category:', error);
    return false;
  }
}

/**
 * Get threads by category for a room
 * @param {string} roomId - Room ID
 * @param {string} category - Category to filter by
 * @param {number} limit - Maximum number of threads
 * @returns {Promise<Array>} Threads in category
 */
async function getThreadsByCategory(roomId, category, limit = 10) {
  try {
    const validCategory = validateCategory(category);
    const result = await dbSafe.safeSelect(
      'threads',
      { room_id: roomId, category: validCategory, is_archived: 0 },
      { orderBy: 'updated_at', orderDirection: 'DESC', limit }
    );

    return dbSafe.parseResult(result);
  } catch (error) {
    console.error('Error getting threads by category:', error);
    return [];
  }
}

/**
 * Archive/unarchive thread
 */
async function archiveThread(threadId, archived = true) {
  try {
    await dbSafe.safeUpdate(
      'threads',
      {
        is_archived: archived ? 1 : 0,
        updated_at: new Date().toISOString(),
      },
      { id: threadId }
    );

    // PostgreSQL auto-commits, no manual save needed
    return true;
  } catch (error) {
    console.error('Error archiving thread:', error);
    return false;
  }
}

/**
 * Auto-detect if a message should start a new thread or belong to an existing thread
 * Uses AI to analyze message content and recent conversation
 */
async function suggestThreadForMessage(message, recentMessages, roomId) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    // Get existing threads for this room
    const existingThreads = await getThreadsForRoom(roomId, false);

    // Analyze recent messages (last 10) to understand context
    const recentContext = recentMessages
      .slice(-10)
      .map(m => `${m.username}: ${m.text}`)
      .join('\n');

    const prompt = `Analyze this co-parenting message and determine if it:
1. Starts a NEW topic/thread (e.g., discussing pickup times, school events, medical appointments)
2. Belongs to an EXISTING thread (continuing a previous conversation)
3. Is a GENERAL message (doesn't need threading)

Current message: ${message.username}: "${message.text}"

Recent conversation:
${recentContext}

${
  existingThreads.length > 0
    ? `Existing threads:\n${existingThreads
        .slice(0, 5)
        .map(t => `- ${t.title} (${t.message_count} messages)`)
        .join('\n')}`
    : 'No existing threads'
}

Respond in JSON:
{
  "action": "new_thread|existing_thread|none",
  "threadTitle": "Suggested title if new_thread",
  "threadId": "thread_id if existing_thread",
  "confidence": 0-100,
  "reasoning": "Why this decision"
}`;

    const completion = await openaiClient.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at analyzing co-parenting conversations to identify distinct topics and threads. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const response = completion.choices[0].message.content.trim();
    const suggestion = JSON.parse(response);

    // Only suggest if confidence is high enough
    if (suggestion.confidence >= 60) {
      return {
        action: suggestion.action,
        threadTitle: suggestion.threadTitle || null,
        threadId: suggestion.threadId || null,
        confidence: suggestion.confidence,
        reasoning: suggestion.reasoning,
      };
    }

    return null;
  } catch (error) {
    console.error('Error suggesting thread:', error);
    return null;
  }
}

/**
 * Get thread details
 */
async function getThread(threadId) {
  try {
    const result = await dbSafe.safeSelect('threads', { id: threadId }, { limit: 1 });
    const threads = dbSafe.parseResult(result);
    return threads.length > 0 ? threads[0] : null;
  } catch (error) {
    console.error('Error getting thread:', error);
    return null;
  }
}

/**
 * Analyze conversation history to identify recurring topics and automatically create threads
 * Reviews all messages in a room to find ongoing or recurring conversation patterns
 * Automatically creates threads for identified topics
 *
 * @param {string} roomId - Room ID to analyze
 * @param {number} limit - Maximum number of messages to analyze (default: 100)
 * @returns {Promise<Object>} Object with suggestions and createdThreads arrays
 */
async function analyzeConversationHistory(roomId, limit = 100) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured, skipping conversation analysis');
    return {
      suggestions: [],
      createdThreads: [],
    };
  }

  try {
    console.log(
      `[threadManager] Starting conversation analysis for room: ${roomId}, limit: ${limit}`
    );
    const messageStore = require('./messageStore');

    // Get recent messages for the room (excluding system messages)
    const messages = await messageStore.getMessagesByRoom(roomId, limit);

    // Only analyze messages from the last 30 days to avoid old historical data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Filter out system messages, private messages, flagged messages, messages without text,
    // and messages older than 30 days
    const filteredMessages = messages.filter(m => {
      if (!m.text || m.type === 'system' || m.private || m.flagged || !m.username) {
        return false;
      }
      // Filter out old messages
      const msgDate = new Date(m.timestamp);
      return msgDate >= thirtyDaysAgo;
    });

    if (filteredMessages.length < 5) {
      // Not enough messages to analyze
      console.log(
        `[threadManager] Not enough messages to analyze (${filteredMessages.length} < 5)`
      );
      return {
        suggestions: [],
        createdThreads: [],
      };
    }

    console.log(
      `[threadManager] Analyzing ${filteredMessages.length} messages for room: ${roomId}`
    );

    // Get existing threads to avoid duplicates
    const existingThreads = await getThreadsForRoom(roomId, false);

    // Group messages by time windows to identify recurring topics
    // Analyze messages in chunks to find patterns
    const conversationText = filteredMessages
      .slice(-50) // Analyze last 50 messages for patterns
      .map(m => `${m.username}: ${m.text}`)
      .join('\n\n');

    const prompt = `Analyze this co-parenting conversation and identify distinct conversations (back-and-forth exchanges about specific subjects).

A "conversation" is a focused exchange between two people about ONE specific matter - NOT just a keyword.

Examples of good conversation titles:
- "Planning Thanksgiving Schedule" (specific event being discussed)
- "Emma's Doctor Appointment Friday" (specific appointment discussion)
- "Soccer Practice Carpool Arrangement" (specific logistical discussion)
- "Homework Help for Math Test" (specific child need being addressed)

Examples of BAD titles (too vague/keyword-based):
- "School" (too broad)
- "Pickup" (just a keyword)
- "Medical" (category, not a conversation)

CATEGORIES - Each conversation MUST be assigned to exactly one:
- schedule: Pickup, dropoff, custody, visitation times
- medical: Doctor appointments, health, medications, therapy
- education: School, homework, grades, teachers, tutoring
- finances: Money, expenses, support, reimbursements
- activities: Sports, hobbies, lessons, camps, extracurriculars
- travel: Vacations, trips, flights, visits
- safety: Emergency contacts, concerns, protection
- logistics: General coordination, supplies, belongings
- co-parenting: Parenting decisions, boundaries, communication

Conversation history (most recent messages):
${conversationText}

${
  existingThreads.length > 0
    ? `Existing conversations (avoid duplicates):\n${existingThreads
        .map(t => `- ${t.title} [${t.category || 'logistics'}] (${t.message_count} messages)`)
        .join('\n')}`
    : 'No existing conversations'
}

Identify 3-5 distinct CONVERSATIONS (not keywords). For each:
- Title should describe the SPECIFIC subject being discussed (3-7 words)
- Category MUST be one of: schedule, medical, education, finances, activities, travel, safety, logistics, co-parenting
- Must be a back-and-forth exchange (at least 2 participants)
- Should be actionable or about a specific event/need

Respond in JSON array format:
[
  {
    "title": "Specific conversation title",
    "category": "one of the 9 categories above",
    "messageCount": estimated_count,
    "isRecurring": true/false,
    "reasoning": "What makes this a distinct conversation",
    "confidence": 0-100
  }
]

Only include conversations with confidence >= 60 and at least 3 related messages.`;

    const completion = await openaiClient.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at analyzing co-parenting conversations to identify distinct recurring topics and ongoing conversations. Respond only with valid JSON array.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const response = completion.choices[0].message.content.trim();
    // Remove markdown code blocks if present
    const cleanResponse = response.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const suggestions = JSON.parse(cleanResponse);

    // Filter and validate suggestions
    const validSuggestions = suggestions
      .filter(s => s.confidence >= 60 && s.messageCount >= 3)
      .filter(s => {
        // Check if similar thread already exists
        const titleLower = s.title.toLowerCase();
        return !existingThreads.some(
          t =>
            t.title.toLowerCase().includes(titleLower) || titleLower.includes(t.title.toLowerCase())
        );
      })
      .sort((a, b) => b.messageCount - a.messageCount) // Sort by message count
      .slice(0, 5); // Limit to top 5 suggestions

    // Automatically create threads from suggestions using semantic search
    const createdThreads = [];
    console.log(`[threadManager] Processing ${validSuggestions.length} valid suggestions`);

    for (const suggestion of validSuggestions) {
      try {
        let matchingMessages = [];
        console.log(
          `[threadManager] Processing suggestion: "${suggestion.title}" (${suggestion.messageCount} messages)`
        );

        // Use Neo4j semantic search if available, otherwise fall back to keyword matching
        if (neo4jClient && neo4jClient.isAvailable()) {
          try {
            // Generate embedding for the thread title
            const threadEmbedding = await generateEmbeddingForText(suggestion.title);

            if (threadEmbedding) {
              console.log(`[threadManager] Using Neo4j semantic search for "${suggestion.title}"`);
              // Use cosine similarity function to find similar messages
              const similarMessages = await neo4jClient.findSimilarMessages(
                threadEmbedding,
                roomId,
                suggestion.messageCount || 20,
                0.7 // 70% similarity threshold
              );

              console.log(
                `[threadManager] Found ${similarMessages.length} similar messages via Neo4j`
              );
              // Map Neo4j results to message objects
              const messageIds = similarMessages.map(m => m.messageId);
              matchingMessages = filteredMessages.filter(
                msg => messageIds.includes(msg.id) && !msg.threadId
              );
            } else {
              console.warn(
                `[threadManager] Failed to generate embedding for "${suggestion.title}", using keyword fallback`
              );
            }
          } catch (neo4jError) {
            console.warn(
              `⚠️  Neo4j semantic search failed for "${suggestion.title}", using keyword fallback:`,
              neo4jError.message
            );
            // Fall through to keyword matching
          }
        } else {
          console.log(
            `[threadManager] Neo4j not available, using keyword matching for "${suggestion.title}"`
          );
        }

        // Fallback to keyword matching if Neo4j not available or failed
        if (matchingMessages.length < 3) {
          // Extract DISTINCTIVE keywords only (filter out stop words)
          const topicKeywords = extractDistinctiveKeywords(suggestion.title, 3);
          const reasoningKeywords = extractDistinctiveKeywords(suggestion.reasoning || '', 4);

          // Combine and deduplicate
          const allKeywords = [...new Set([...topicKeywords, ...reasoningKeywords])];

          console.log(`[threadManager] Keyword matching for "${suggestion.title}":`, {
            topicKeywords,
            reasoningKeywords: reasoningKeywords.slice(0, 5), // Log first 5
            totalDistinctive: allKeywords.length,
          });

          // Skip if no distinctive keywords found
          if (allKeywords.length === 0) {
            console.log(`[threadManager] No distinctive keywords for "${suggestion.title}", skipping`);
            continue;
          }

          matchingMessages = filteredMessages.filter(msg => {
            if (!msg.id || msg.threadId) {
              return false;
            }
            // Extract distinctive keywords from message
            const msgKeywords = extractDistinctiveKeywords(msg.text || '', 3);

            // Count how many topic keywords appear in message
            const matchedTopicKeywords = topicKeywords.filter(k => msgKeywords.includes(k));
            const matchedAllKeywords = allKeywords.filter(k => msgKeywords.includes(k));

            // STRICT MATCHING: Require at least 2 distinctive topic keywords
            // OR 1 topic keyword + 2 from reasoning
            return (
              matchedTopicKeywords.length >= 2 ||
              (matchedTopicKeywords.length >= 1 && matchedAllKeywords.length >= 3)
            );
          });
        }

        console.log(
          `[threadManager] Found ${matchingMessages.length} matching messages for "${suggestion.title}"`
        );

        if (matchingMessages.length >= 3) {
          // Create thread with category
          const threadCategory = validateCategory(suggestion.category);
          console.log(
            `[threadManager] Creating thread "${suggestion.title}" [${threadCategory}] with ${matchingMessages.length} messages`
          );
          const threadId = await createThread(roomId, suggestion.title, 'system', null, threadCategory);

          // Add matching messages to the thread (limit to avoid too many, prioritize recent)
          const messagesToAdd = matchingMessages
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Most recent first
            .slice(0, Math.min(suggestion.messageCount || 20, matchingMessages.length));

          let addedCount = 0;
          for (const msg of messagesToAdd) {
            if (msg.id && !msg.threadId) {
              // Only add messages that aren't already in a thread
              await addMessageToThread(msg.id, threadId);
              addedCount++;
            }
          }

          if (addedCount > 0) {
            console.log(
              `[threadManager] ✅ Created thread "${suggestion.title}" with ${addedCount} messages`
            );
            createdThreads.push({
              threadId,
              title: suggestion.title,
              messageCount: addedCount,
            });
          } else {
            console.warn(
              `[threadManager] ⚠️  No messages added to thread "${suggestion.title}", archiving empty thread`
            );
            // If no messages were added, delete the empty thread
            await archiveThread(threadId, true);
          }
        } else {
          console.log(
            `[threadManager] ⚠️  Not enough matching messages (${matchingMessages.length} < 3) for "${suggestion.title}"`
          );
        }
      } catch (error) {
        console.error(`[threadManager] ❌ Error creating thread for "${suggestion.title}":`, error);
        // Continue with other suggestions even if one fails
      }
    }

    console.log(`[threadManager] Analysis complete: ${createdThreads.length} threads created`);

    return {
      suggestions: validSuggestions,
      createdThreads,
    };
  } catch (error) {
    console.error('Error analyzing conversation history:', error);
    return {
      suggestions: [],
      createdThreads: [],
    };
  }
}

/**
 * Generate embedding for text (helper function)
 * @private
 */
async function generateEmbeddingForText(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return null;
  }

  try {
    // Use the OpenAI client from core/engine/client
    const openaiClient = require('./src/core/engine/client');
    const client = openaiClient.getClient();

    if (!client) {
      return null;
    }

    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.trim(),
    });

    if (!response.data || !response.data[0] || !response.data[0].embedding) {
      return null;
    }

    return response.data[0].embedding;
  } catch (error) {
    console.error('❌ Failed to generate embedding:', error.message);
    return null;
  }
}

// =============================================================================
// AUTO-ASSIGN MESSAGE TO THREAD (Fast, local - no AI call)
// =============================================================================

/**
 * Category keywords for fast local matching
 */
const CATEGORY_KEYWORDS = {
  schedule: ['pickup', 'dropoff', 'drop-off', 'pick-up', 'custody', 'visitation', 'weekend', 'weekday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'morning', 'evening', 'afternoon', 'time', 'schedule', 'arrangement', 'switch', 'exchange'],
  medical: ['doctor', 'hospital', 'medicine', 'medication', 'prescription', 'appointment', 'sick', 'fever', 'health', 'dentist', 'therapy', 'therapist', 'vaccine', 'checkup', 'illness', 'symptoms', 'allergy'],
  education: ['school', 'homework', 'teacher', 'grade', 'class', 'test', 'exam', 'tutor', 'tutoring', 'college', 'education', 'learning', 'assignment', 'project', 'report', 'conference'],
  finances: ['money', 'payment', 'expense', 'cost', 'bill', 'support', 'reimburse', 'financial', 'budget', 'pay', 'paid', 'owe', 'debt', 'invoice', 'receipt', 'spend', 'spent'],
  activities: ['soccer', 'basketball', 'baseball', 'football', 'practice', 'game', 'sport', 'activity', 'hobby', 'lesson', 'camp', 'club', 'dance', 'music', 'piano', 'swim', 'swimming', 'gymnastics', 'martial', 'arts', 'recital', 'tournament'],
  travel: ['travel', 'trip', 'vacation', 'flight', 'passport', 'visit', 'holiday', 'plane', 'airport', 'hotel', 'drive', 'road', 'destination', 'traveling'],
  safety: ['emergency', 'safety', 'concern', 'danger', 'worry', 'secure', 'protect', 'urgent', 'warning', 'alert', 'accident', 'injury', 'hurt'],
  logistics: ['clothes', 'clothing', 'shoes', 'backpack', 'supplies', 'stuff', 'things', 'items', 'belongings', 'forgot', 'left', 'bring', 'pack', 'packed'],
  'co-parenting': ['parenting', 'decision', 'agree', 'discuss', 'relationship', 'communication', 'boundary', 'boundaries', 'conflict', 'disagreement', 'cooperate', 'rules', 'discipline'],
};

/**
 * Auto-assign a message to the best matching existing thread
 * Uses fast keyword matching (no AI call) for real-time assignment
 *
 * @param {Object} message - Message object with id, text, roomId
 * @returns {Promise<Object|null>} - { threadId, threadTitle, category, score } or null
 */
async function autoAssignMessageToThread(message) {
  if (!message || !message.text || !message.roomId) {
    return null;
  }

  try {
    // Get existing active threads for this room
    const existingThreads = await getThreadsForRoom(message.roomId, false);

    if (existingThreads.length === 0) {
      return null;
    }

    // Extract keywords from the message
    const messageKeywords = extractDistinctiveKeywords(message.text, 3);

    if (messageKeywords.length === 0) {
      return null;
    }

    // Score each thread based on keyword overlap
    const scoredThreads = existingThreads.map(thread => {
      // Extract keywords from thread title
      const titleKeywords = extractDistinctiveKeywords(thread.title, 3);

      // Get category-specific keywords
      const categoryKeywords = CATEGORY_KEYWORDS[thread.category] || [];

      // Calculate score
      let score = 0;

      // 1. Direct keyword match with thread title (highest weight)
      const titleMatches = messageKeywords.filter(k => titleKeywords.includes(k));
      score += titleMatches.length * 3;

      // 2. Category keyword match (medium weight)
      const categoryMatches = messageKeywords.filter(k => categoryKeywords.includes(k));
      score += categoryMatches.length * 2;

      // 3. Bonus for category keywords appearing in thread title
      const titleCategoryOverlap = titleKeywords.filter(k => categoryKeywords.includes(k));
      if (titleCategoryOverlap.length > 0 && categoryMatches.length > 0) {
        score += 2; // Bonus for strong category alignment
      }

      return {
        threadId: thread.id,
        threadTitle: thread.title,
        category: thread.category,
        score,
        titleMatches,
        categoryMatches,
      };
    });

    // Find the best matching thread
    const bestMatch = scoredThreads
      .filter(t => t.score >= 3) // Minimum score threshold
      .sort((a, b) => b.score - a.score)[0];

    if (bestMatch) {
      console.log(`[threadManager] Auto-assigning message to thread "${bestMatch.threadTitle}" (score: ${bestMatch.score})`);

      // Actually assign the message to the thread
      await addMessageToThread(message.id, bestMatch.threadId);

      return {
        threadId: bestMatch.threadId,
        threadTitle: bestMatch.threadTitle,
        category: bestMatch.category,
        score: bestMatch.score,
      };
    }

    return null;
  } catch (error) {
    console.error('[threadManager] Error auto-assigning message to thread:', error);
    return null;
  }
}

module.exports = {
  // Constants
  THREAD_CATEGORIES,
  // Top-level thread operations
  createThread,
  getThreadsForRoom,
  getThreadMessages,
  addMessageToThread,
  removeMessageFromThread,
  updateThreadTitle,
  updateThreadCategory,
  getThreadsByCategory,
  archiveThread,
  suggestThreadForMessage,
  getThread,
  analyzeConversationHistory,
  autoAssignMessageToThread,
  // Hierarchical thread operations
  createSubThread,
  getThreadAncestors,
  getSubThreads,
  getThreadHierarchy,
  getThreadsByRoot,
  // Utilities
  validateCategory,
};
