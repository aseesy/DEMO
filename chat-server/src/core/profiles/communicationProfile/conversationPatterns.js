/**
 * Conversation Pattern Analysis
 *
 * Analyzes conversation patterns to understand communication dynamics:
 * - Initiator balance (who starts conversations)
 * - Response times (how quickly people respond)
 * - Conversation rhythm (back-and-forth, bursts, steady)
 * - Message length trends
 * - Topic transitions
 *
 * Feature: Contextual Awareness Improvements - Phase 1
 */

/**
 * Analyze conversation patterns from recent messages
 * @param {Array} messages - Array of message objects with {username, text, timestamp}
 * @param {string} senderId - Current sender's ID
 * @param {string} receiverId - Current receiver's ID
 * @returns {Object} - Conversation pattern analysis
 */
function analyzeConversationPatterns(messages, senderId, receiverId) {
  if (!messages || messages.length < 2) {
    return getDefaultPatterns();
  }

  // Ensure messages have timestamps
  const validMessages = messages
    .filter(msg => msg && msg.username && msg.text && msg.timestamp)
    .map(msg => ({
      username: msg.username,
      text: msg.text,
      timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp,
      length: msg.text.length,
    }))
    .sort((a, b) => a.timestamp - b.timestamp); // Sort chronologically

  if (validMessages.length < 2) {
    return getDefaultPatterns();
  }

  // Analyze initiator balance
  const initiatorBalance = analyzeInitiatorBalance(validMessages, senderId, receiverId);

  // Analyze response times
  const responseTimes = analyzeResponseTimes(validMessages, senderId, receiverId);

  // Analyze conversation rhythm
  const rhythm = analyzeConversationRhythm(validMessages, responseTimes);

  // Analyze message length trends
  const lengthTrend = analyzeMessageLengthTrend(validMessages);

  // Analyze topic transitions (basic)
  const topicTransitions = analyzeTopicTransitions(validMessages);

  return {
    initiator_balance: initiatorBalance,
    response_times: responseTimes,
    conversation_rhythm: rhythm,
    message_length_trend: lengthTrend,
    topic_transitions: topicTransitions,
    sample_size: validMessages.length,
    analyzed_at: new Date().toISOString(),
  };
}

/**
 * Analyze who initiates conversations
 * @param {Array} messages - Sorted messages
 * @param {string} senderId - Sender ID
 * @param {string} receiverId - Receiver ID
 * @returns {Object} - Initiator balance analysis
 */
function analyzeInitiatorBalance(messages, senderId, receiverId) {
  // Count messages per user
  const senderCount = messages.filter(m => m.username === senderId).length;
  const receiverCount = messages.filter(m => m.username === receiverId).length;
  const total = messages.length;

  const senderPercent = Math.round((senderCount / total) * 100);
  const receiverPercent = Math.round((receiverCount / total) * 100);

  // Determine balance type
  let balanceType = 'balanced';
  if (senderPercent > 65) balanceType = 'sender_dominant';
  else if (receiverPercent > 65) balanceType = 'receiver_dominant';
  else if (Math.abs(senderPercent - receiverPercent) < 10) balanceType = 'balanced';
  else balanceType = 'slightly_imbalanced';

  // Count conversation starts (first message after a gap > 1 hour)
  const conversationStarts = [];
  for (let i = 1; i < messages.length; i++) {
    const prevMsg = messages[i - 1];
    const currMsg = messages[i];
    const timeDiff = currMsg.timestamp - prevMsg.timestamp;
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // If gap > 1 hour, this is a new conversation start
    if (hoursDiff > 1) {
      conversationStarts.push({
        username: currMsg.username,
        timestamp: currMsg.timestamp,
      });
    }
  }

  // Count who starts conversations
  const senderStarts = conversationStarts.filter(s => s.username === senderId).length;
  const receiverStarts = conversationStarts.filter(s => s.username === receiverId).length;
  const totalStarts = conversationStarts.length || 1; // Avoid division by zero

  return {
    sender_percent: senderPercent,
    receiver_percent: receiverPercent,
    balance_type: balanceType,
    sender_starts_percent: Math.round((senderStarts / totalStarts) * 100),
    receiver_starts_percent: Math.round((receiverStarts / totalStarts) * 100),
    total_conversation_starts: conversationStarts.length,
  };
}

/**
 * Analyze response times between messages
 * @param {Array} messages - Sorted messages
 * @param {string} senderId - Sender ID
 * @param {string} receiverId - Receiver ID
 * @returns {Object} - Response time analysis
 */
function analyzeResponseTimes(messages, senderId, receiverId) {
  const responseTimes = []; // in milliseconds

  for (let i = 1; i < messages.length; i++) {
    const prevMsg = messages[i - 1];
    const currMsg = messages[i];

    // Only count if different users (actual response)
    if (prevMsg.username !== currMsg.username) {
      const timeDiff = currMsg.timestamp - prevMsg.timestamp;
      responseTimes.push({
        from: prevMsg.username,
        to: currMsg.username,
        milliseconds: timeDiff,
        hours: timeDiff / (1000 * 60 * 60),
      });
    }
  }

  if (responseTimes.length === 0) {
    return {
      avg_hours: null,
      median_hours: null,
      min_hours: null,
      max_hours: null,
      trend: 'unknown',
      sample_count: 0,
    };
  }

  // Calculate statistics
  const hours = responseTimes.map(rt => rt.hours).sort((a, b) => a - b);
  const avgHours = hours.reduce((sum, h) => sum + h, 0) / hours.length;
  const medianHours = hours[Math.floor(hours.length / 2)];
  const minHours = hours[0];
  const maxHours = hours[hours.length - 1];

  // Determine trend (comparing first half vs second half)
  const firstHalf = hours.slice(0, Math.floor(hours.length / 2));
  const secondHalf = hours.slice(Math.floor(hours.length / 2));
  const firstHalfAvg = firstHalf.reduce((sum, h) => sum + h, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, h) => sum + h, 0) / secondHalf.length;

  let trend = 'stable';
  const threshold = 0.2; // 20% change threshold
  if (secondHalfAvg < firstHalfAvg * (1 - threshold)) {
    trend = 'improving'; // Getting faster
  } else if (secondHalfAvg > firstHalfAvg * (1 + threshold)) {
    trend = 'slowing'; // Getting slower
  }

  // Format average for display
  const formatHours = h => {
    if (h < 1) return `${Math.round(h * 60)} minutes`;
    if (h < 24) return `${Math.round(h * 10) / 10} hours`;
    return `${Math.round((h / 24) * 10) / 10} days`;
  };

  return {
    avg_hours: Math.round(avgHours * 10) / 10,
    avg_formatted: formatHours(avgHours),
    median_hours: Math.round(medianHours * 10) / 10,
    min_hours: Math.round(minHours * 10) / 10,
    max_hours: Math.round(maxHours * 10) / 10,
    trend: trend,
    sample_count: responseTimes.length,
  };
}

/**
 * Analyze conversation rhythm
 * @param {Array} messages - Sorted messages
 * @param {Object} responseTimes - Response time analysis
 * @returns {Object} - Rhythm analysis
 */
function analyzeConversationRhythm(messages, responseTimes) {
  if (messages.length < 3) {
    return {
      type: 'unknown',
      description: 'Not enough messages to determine rhythm',
    };
  }

  // Calculate time gaps between consecutive messages
  const gaps = [];
  for (let i = 1; i < messages.length; i++) {
    const gap = messages[i].timestamp - messages[i - 1].timestamp;
    gaps.push(gap / (1000 * 60)); // Convert to minutes
  }

  // Check for back-and-forth pattern (alternating users)
  let alternations = 0;
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].username !== messages[i - 1].username) {
      alternations++;
    }
  }
  const alternationRatio = alternations / (messages.length - 1);

  // Check for bursts (multiple messages from same user in short time)
  const burstThreshold = 5; // minutes
  let bursts = 0;
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].username === messages[i - 1].username && gaps[i - 1] < burstThreshold) {
      bursts++;
    }
  }

  // Determine rhythm type
  let rhythmType = 'steady';
  let description = '';

  if (alternationRatio > 0.8 && responseTimes.avg_hours < 2) {
    rhythmType = 'back_and_forth';
    description = 'Active back-and-forth conversation with quick responses';
  } else if (bursts > messages.length * 0.3) {
    rhythmType = 'bursts';
    description = 'Conversation happens in bursts with multiple messages at once';
  } else if (responseTimes.avg_hours > 12) {
    rhythmType = 'sparse';
    description = 'Conversation is sparse with long gaps between messages';
  } else {
    rhythmType = 'steady';
    description = 'Steady conversation flow with regular exchanges';
  }

  return {
    type: rhythmType,
    description: description,
    alternation_ratio: Math.round(alternationRatio * 100),
    burst_count: bursts,
  };
}

/**
 * Analyze message length trends
 * @param {Array} messages - Sorted messages
 * @returns {Object} - Length trend analysis
 */
function analyzeMessageLengthTrend(messages) {
  if (messages.length < 3) {
    return {
      trend: 'unknown',
      avg_length: messages.reduce((sum, m) => sum + m.length, 0) / messages.length,
    };
  }

  const lengths = messages.map(m => m.length);
  const firstHalf = lengths.slice(0, Math.floor(lengths.length / 2));
  const secondHalf = lengths.slice(Math.floor(lengths.length / 2));

  const firstHalfAvg = firstHalf.reduce((sum, l) => sum + l, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, l) => sum + l, 0) / secondHalf.length;

  let trend = 'stable';
  const threshold = 0.15; // 15% change threshold
  if (secondHalfAvg > firstHalfAvg * (1 + threshold)) {
    trend = 'increasing';
  } else if (secondHalfAvg < firstHalfAvg * (1 - threshold)) {
    trend = 'decreasing';
  }

  return {
    trend: trend,
    avg_length: Math.round(lengths.reduce((sum, l) => sum + l, 0) / lengths.length),
    first_half_avg: Math.round(firstHalfAvg),
    second_half_avg: Math.round(secondHalfAvg),
  };
}

/**
 * Analyze topic transitions (basic keyword-based)
 * @param {Array} messages - Sorted messages
 * @returns {Array} - Topic transitions
 */
function analyzeTopicTransitions(messages) {
  // Simple keyword-based topic detection
  const topicKeywords = {
    scheduling: ['time', 'pickup', 'drop', 'schedule', 'pm', 'am', 'when'],
    financial: ['money', 'pay', 'owe', 'expense', 'cost', 'support'],
    parenting: ['school', 'homework', 'bedtime', 'sick', 'doctor', 'discipline'],
    logistics: ['can you', 'will you', 'need', 'help'],
  };

  const topics = [];
  for (const msg of messages) {
    const text = msg.text.toLowerCase();
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        topics.push({ topic, timestamp: msg.timestamp, username: msg.username });
        break;
      }
    }
  }

  // Find transitions
  const transitions = [];
  for (let i = 1; i < topics.length; i++) {
    if (topics[i].topic !== topics[i - 1].topic) {
      transitions.push({
        from: topics[i - 1].topic,
        to: topics[i].topic,
        timestamp: topics[i].timestamp,
      });
    }
  }

  return transitions.slice(-5); // Last 5 transitions
}

/**
 * Get default patterns (when insufficient data)
 * @returns {Object} - Default pattern structure
 */
function getDefaultPatterns() {
  return {
    initiator_balance: {
      sender_percent: 50,
      receiver_percent: 50,
      balance_type: 'unknown',
      sender_starts_percent: 50,
      receiver_starts_percent: 50,
      total_conversation_starts: 0,
    },
    response_times: {
      avg_hours: null,
      avg_formatted: 'unknown',
      trend: 'unknown',
      sample_count: 0,
    },
    conversation_rhythm: {
      type: 'unknown',
      description: 'Not enough data to determine rhythm',
    },
    message_length_trend: {
      trend: 'unknown',
      avg_length: 0,
    },
    topic_transitions: [],
    sample_size: 0,
    analyzed_at: new Date().toISOString(),
  };
}

/**
 * Format conversation patterns for AI prompt
 * @param {Object} patterns - Pattern analysis result
 * @returns {string} - Formatted string for AI prompt
 */
function formatPatternsForAI(patterns) {
  if (!patterns || patterns.sample_size < 2) {
    return '';
  }

  const parts = [];

  parts.push('=== CONVERSATION PATTERNS ===');

  // Initiator balance
  if (patterns.initiator_balance) {
    const ib = patterns.initiator_balance;
    if (ib.balance_type !== 'unknown') {
      parts.push(
        `Initiator balance: ${ib.sender_percent}% sender, ${ib.receiver_percent}% receiver (${ib.balance_type})`
      );
    }
  }

  // Response times
  if (patterns.response_times && patterns.response_times.avg_formatted !== 'unknown') {
    const rt = patterns.response_times;
    let responseInfo = `Average response time: ${rt.avg_formatted}`;
    if (rt.trend !== 'stable' && rt.trend !== 'unknown') {
      responseInfo += ` (${rt.trend} trend)`;
    }
    parts.push(responseInfo);
  }

  // Conversation rhythm
  if (patterns.conversation_rhythm && patterns.conversation_rhythm.type !== 'unknown') {
    const rhythm = patterns.conversation_rhythm;
    parts.push(`Conversation rhythm: ${rhythm.description}`);
  }

  // Message length trend
  if (patterns.message_length_trend && patterns.message_length_trend.trend !== 'unknown') {
    const trend = patterns.message_length_trend;
    if (trend.trend !== 'stable') {
      parts.push(`Message length trend: ${trend.trend} (avg ${trend.avg_length} chars)`);
    }
  }

  // Topic transitions (if any)
  if (patterns.topic_transitions && patterns.topic_transitions.length > 0) {
    const recentTransition = patterns.topic_transitions[patterns.topic_transitions.length - 1];
    parts.push(`Recent topic shift: ${recentTransition.from} → ${recentTransition.to}`);
  }

  parts.push(
    'Use these patterns to understand the conversation dynamics and adapt your coaching accordingly.'
  );
  parts.push('=== END PATTERNS ===');

  return parts.join('\n');
}

module.exports = {
  analyzeConversationPatterns,
  formatPatternsForAI,
  getDefaultPatterns,
};
