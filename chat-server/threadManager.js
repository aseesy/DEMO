const dbSafe = require('./dbSafe');
const openaiClient = require('./openaiClient');

/**
 * Create a new thread
 */
async function createThread(roomId, title, createdBy, initialMessageId = null) {
  try {
    const threadId = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await dbSafe.safeInsert('threads', {
      id: threadId,
      room_id: roomId,
      title: title,
      created_by: createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      message_count: initialMessageId ? 1 : 0,
      last_message_at: initialMessageId ? new Date().toISOString() : null,
      is_archived: 0,
    });

    // If initial message provided, associate it with the thread
    if (initialMessageId) {
      await dbSafe.safeUpdate('messages', { thread_id: threadId }, { id: initialMessageId });
    }

    // PostgreSQL auto-commits, no manual save needed
    return threadId;
  } catch (error) {
    console.error('Error creating thread:', error);
    throw error;
  }
}

/**
 * Get all threads for a room
 */
async function getThreadsForRoom(roomId, includeArchived = false) {
  try {
    const whereClause = includeArchived ? { room_id: roomId } : { room_id: roomId, is_archived: 0 };

    const result = await dbSafe.safeSelect('threads', whereClause, {
      orderBy: 'updated_at',
      orderDirection: 'DESC',
    });

    return dbSafe.parseResult(result);
  } catch (error) {
    console.error('Error getting threads:', error);
    return [];
  }
}

/**
 * Get messages for a specific thread
 */
async function getThreadMessages(threadId, limit = 50) {
  try {
    const db = require('./dbPostgres');
    // Get messages for this thread, excluding system messages, private, and flagged
    const query = `
      SELECT * FROM messages
      WHERE thread_id = $1
        AND (private = 0 OR private IS NULL)
        AND (flagged = 0 OR flagged IS NULL)
        AND type != 'system'
      ORDER BY timestamp ASC
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
    }));
  } catch (error) {
    console.error('Error getting thread messages:', error);
    return [];
  }
}

/**
 * Add message to thread
 */
async function addMessageToThread(messageId, threadId) {
  try {
    // Update message
    await dbSafe.safeUpdate('messages', { thread_id: threadId }, { id: messageId });

    // Update thread stats
    const threadResult = await dbSafe.safeSelect('threads', { id: threadId }, { limit: 1 });
    const threads = dbSafe.parseResult(threadResult);

    if (threads.length > 0) {
      const messageResult = await dbSafe.safeSelect('messages', { id: messageId }, { limit: 1 });
      const messages = dbSafe.parseResult(messageResult);
      const message = messages[0];

      await dbSafe.safeUpdate(
        'threads',
        {
          message_count: (threads[0].message_count || 0) + 1,
          last_message_at: message?.timestamp || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { id: threadId }
      );
    }

    // PostgreSQL auto-commits, no manual save needed
    return true;
  } catch (error) {
    console.error('Error adding message to thread:', error);
    return false;
  }
}

/**
 * Remove message from thread (move back to main conversation)
 */
async function removeMessageFromThread(messageId) {
  try {
    await dbSafe.safeUpdate('messages', { thread_id: null }, { id: messageId });

    // Update thread stats
    const messageResult = await dbSafe.safeSelect('messages', { id: messageId }, { limit: 1 });
    const messages = dbSafe.parseResult(messageResult);
    const threadId = messages[0]?.thread_id;

    if (threadId) {
      const threadResult = await dbSafe.safeSelect('threads', { id: threadId }, { limit: 1 });
      const threads = dbSafe.parseResult(threadResult);

      if (threads.length > 0) {
        await dbSafe.safeUpdate(
          'threads',
          {
            message_count: Math.max(0, (threads[0].message_count || 1) - 1),
            updated_at: new Date().toISOString(),
          },
          { id: threadId }
        );
      }
    }

    // PostgreSQL auto-commits, no manual save needed
    return true;
  } catch (error) {
    console.error('Error removing message from thread:', error);
    return false;
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
    return [];
  }

  try {
    const messageStore = require('./messageStore');

    // Get recent messages for the room (excluding system messages)
    const messages = await messageStore.getMessagesByRoom(roomId, limit);
    // Filter out system messages, private messages, flagged messages, and messages without text
    const filteredMessages = messages.filter(
      m =>
        m.text &&
        m.type !== 'system' &&
        !m.private &&
        !m.flagged &&
        m.username // Ensure username exists
    );

    if (filteredMessages.length < 5) {
      // Not enough messages to analyze
      return [];
    }

    // Get existing threads to avoid duplicates
    const existingThreads = await getThreadsForRoom(roomId, false);

    // Group messages by time windows to identify recurring topics
    // Analyze messages in chunks to find patterns
    const conversationText = filteredMessages
      .slice(-50) // Analyze last 50 messages for patterns
      .map(m => `${m.username}: ${m.text}`)
      .join('\n\n');

    const prompt = `Analyze this co-parenting conversation history and identify recurring or ongoing topics that could be organized into threads.

Conversation history (most recent messages):
${conversationText}

${
  existingThreads.length > 0
    ? `Existing threads (avoid duplicates):\n${existingThreads
        .map(t => `- ${t.title} (${t.message_count} messages)`)
        .join('\n')}`
    : 'No existing threads'
}

Identify 3-5 distinct recurring topics or ongoing conversations. For each topic:
- Provide a clear, descriptive title (2-5 words)
- Estimate how many messages relate to this topic
- Note if it's an ongoing/recurring conversation

Respond in JSON array format:
[
  {
    "title": "Topic title",
    "messageCount": estimated_count,
    "isRecurring": true/false,
    "reasoning": "Why this is a distinct topic",
    "confidence": 0-100
  }
]

Only include topics with confidence >= 60 and at least 3 related messages.`;

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
          t => t.title.toLowerCase().includes(titleLower) || titleLower.includes(t.title.toLowerCase())
        );
      })
      .sort((a, b) => b.messageCount - a.messageCount) // Sort by message count
      .slice(0, 5); // Limit to top 5 suggestions

    // Automatically create threads from suggestions
    const createdThreads = [];
    for (const suggestion of validSuggestions) {
      try {
        // Find messages that match this topic
        // Use keyword matching based on title and reasoning
        const topicKeywords = suggestion.title.toLowerCase().split(/\s+/).filter(k => k.length > 2);
        const reasoningKeywords = (suggestion.reasoning || '')
          .toLowerCase()
          .split(/\s+/)
          .filter(k => k.length > 3);
        
        const allKeywords = [...new Set([...topicKeywords, ...reasoningKeywords])];
        
        const matchingMessages = filteredMessages.filter(msg => {
          if (!msg.id || msg.threadId) {
            // Skip messages already in a thread
            return false;
          }
          const msgText = (msg.text || '').toLowerCase();
          // Match if message contains at least 2 keywords from the topic
          const matchCount = allKeywords.filter(keyword => msgText.includes(keyword)).length;
          return matchCount >= 2 || (matchCount >= 1 && topicKeywords.some(k => msgText.includes(k)));
        });

        if (matchingMessages.length >= 3) {
          // Create thread
          const threadId = await createThread(roomId, suggestion.title, 'system');
          
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
            createdThreads.push({
              threadId,
              title: suggestion.title,
              messageCount: addedCount,
            });
          } else {
            // If no messages were added, delete the empty thread
            await archiveThread(threadId, true);
          }
        }
      } catch (error) {
        console.error(`Error creating thread for "${suggestion.title}":`, error);
        // Continue with other suggestions even if one fails
      }
    }

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

module.exports = {
  createThread,
  getThreadsForRoom,
  getThreadMessages,
  addMessageToThread,
  removeMessageFromThread,
  updateThreadTitle,
  archiveThread,
  suggestThreadForMessage,
  getThread,
  analyzeConversationHistory,
};
