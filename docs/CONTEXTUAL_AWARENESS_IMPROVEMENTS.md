# LiaiZen Contextual Awareness & User Perspective Improvements

**Date:** December 8, 2025  
**Status:** Analysis & Recommendations  
**Priority:** High - Core to mediation quality

---

## Executive Summary

LiaiZen currently has **good foundational context** but significant gaps in:

1. **User perspective preservation** - Voice, style, personal context
2. **Deep contextual awareness** - Limited message history, no pattern tracking
3. **Personal context integration** - User profile data underutilized
4. **Temporal awareness** - No time-based context or situational awareness

**Current Score: 6.5/10** → **Target Score: 9/10**

---

## 🎯 Key Improvement Areas

### 1. User Perspective & Voice Preservation

#### Current State

- ✅ Tracks communication patterns (tone, phrases)
- ✅ Uses temporal decay for pattern relevance
- ❌ Doesn't preserve user's unique voice in rewrites
- ❌ Doesn't track what makes each user's communication style unique
- ❌ Rewrites sometimes sound generic/corporate

#### Improvements Needed

**A. Voice Signature Extraction**

```javascript
// Track unique voice markers per user
{
  voice_signature: {
    sentence_structure: "short_direct" | "detailed_explanatory" | "question_heavy",
    formality_level: "casual" | "formal" | "mixed",
    punctuation_style: "minimal" | "standard" | "expressive",
    common_starters: ["I need", "Can we", "Just wanted"],
    preferred_closings: ["Thanks", "Let me know", "Talk soon"],
    unique_phrases: ["no worries", "sounds good", "appreciate it"]
  }
}
```

**B. Voice-Aware Rewrites**

- Preserve user's sentence structure preferences
- Maintain their formality level
- Keep their unique phrases when appropriate
- Don't make casual users sound formal, or vice versa

**C. Personal Context Integration**

```javascript
// Include user's personal context in rewrites
{
  personal_context: {
    occupation: "Mail carrier (5am-5pm)",
    parenting_philosophy: "I like to have fun with my kids",
    communication_preferences: "Brief, direct, prefers text",
    stress_points: ["Last-minute changes", "Timing conflicts"],
    values: ["Punctuality", "Clear communication"]
  }
}
```

**Implementation Priority:** 🔴 **HIGH** - Core to user trust and acceptance

---

### 2. Deep Message History & Pattern Tracking

#### Current State

- ✅ Last 10-15 messages included
- ❌ No conversation patterns tracked
- ❌ No topic continuity
- ❌ No response time analysis
- ❌ No conversation summaries

#### Improvements Needed

**A. Extended Message History**

```javascript
// Increase from 10-15 to 20-30 messages
// Include metadata: timestamps, edits, reactions
const messageHistory = {
  messages: recentMessages.slice(-25), // Increased depth
  metadata: {
    timestamps: messages.map(m => m.created_at),
    edits: messages.filter(m => m.edited_at),
    reactions: messages.filter(m => m.reactions?.length > 0),
  },
};
```

**B. Conversation Pattern Analysis**

```javascript
{
  conversation_patterns: {
    initiator_balance: "sender_60%_receiver_40%",
    avg_response_time: "2.5 hours",
    response_time_trend: "improving", // faster/slower/stable
    message_length_trend: "stable",
    topic_transitions: [
      { from: "scheduling", to: "parenting", trigger: "school event" }
    ],
    conversation_rhythm: "back_and_forth" | "bursts" | "steady"
  }
}
```

**C. Topic Continuity Tracking**

```javascript
{
  active_topics: [
    {
      topic: "pickup_coordination",
      started: "2025-12-05",
      message_count: 8,
      participants: ["sender", "receiver"],
      status: "ongoing",
      last_mentioned: "2025-12-08"
    }
  ],
  topic_history: [
    // Previous topics and their resolution
  ]
}
```

**D. Conversation Summaries**

```javascript
// Generate periodic summaries for long conversations
{
  conversation_summary: {
    period: "last_week",
    main_topics: ["scheduling", "school events"],
    tone: "cooperative",
    key_decisions: ["Agreed on pickup time", "Discussed school event"],
    unresolved_items: ["Weekend schedule"]
  }
}
```

**Implementation Priority:** 🟡 **MEDIUM** - Enhances quality but not critical

---

### 3. User Profile Data Integration

#### Current State

- ❌ User profile data exists but **not used** in mediation
- ❌ Missing: occupation, parenting philosophy, personal growth goals
- ❌ Missing: household members, communication preferences

#### Improvements Needed

**A. Full Profile Integration**

```javascript
// In userContext.formatContextForAI()
{
  user_profile: {
    // Basic info
    name: "John Doe",
    occupation: "Mail carrier",
    work_schedule: "5am-5pm, Mon-Fri",

    // Parenting context
    parenting_philosophy: "I like to have fun with my kids",
    personal_growth_goals: "Better communication, less conflict",

    // Communication style
    communication_style: "Brief, direct",
    preferred_communication_times: "Evenings after 6pm",

    // Household
    household_members: ["New partner: Jane"],

    // Location context
    address: "City, State" // For timezone/scheduling context
  }
}
```

**B. Context-Aware Coaching**

- Reference user's occupation when discussing scheduling
- Acknowledge their parenting philosophy in rewrites
- Consider their communication preferences (brief vs. detailed)
- Factor in their work schedule for timing suggestions

**Implementation Priority:** 🔴 **HIGH** - Easy win, high impact

---

### 4. Temporal & Situational Awareness

#### Current State

- ❌ No time-based context
- ❌ No awareness of special dates
- ❌ No day-of-week patterns
- ❌ No situational context (holidays, school events)

#### Improvements Needed

**A. Temporal Context**

```javascript
{
  temporal_context: {
    time_of_day: "evening", // morning, afternoon, evening, night
    day_of_week: "monday",
    is_weekend: false,
    is_holiday: false,
    special_dates: [
      { type: "child_birthday", date: "2025-12-15", child: "Sarah" },
      { type: "holiday", date: "2025-12-25", name: "Christmas" }
    ],
    typical_communication_time: true, // Is this when they usually communicate?
    stress_indicators: {
      monday_morning: "High stress - work week starting",
      friday_evening: "Weekend transition - pickup coordination"
    }
  }
}
```

**B. Situational Awareness**

```javascript
{
  situational_context: {
    school_calendar: {
      current_period: "regular_school",
      upcoming_events: ["Winter break: Dec 20-Jan 5"],
      recent_events: ["Parent-teacher conference: Dec 3"]
    },
    custody_schedule: {
      current_week: "sender_week",
      upcoming_switch: "2025-12-10",
      typical_pattern: "Week on, week off"
    },
    recent_changes: [
      "Pickup time changed last week",
      "New school event added"
    ]
  }
}
```

**C. Pattern-Based Timing**

- Recognize when conversations typically happen
- Understand stress patterns (Monday mornings, Friday evenings)
- Adapt coaching tone based on time context
- Reference upcoming events naturally

**Implementation Priority:** 🟡 **MEDIUM** - Nice to have, moderate effort

---

### 5. Relationship Dynamics & Learning

#### Current State

- ✅ Basic relationship insights (communication style, topics)
- ❌ Not persistent (lost on restart)
- ❌ Doesn't learn from intervention outcomes
- ❌ Limited depth in insights

#### Improvements Needed

**A. Persistent Relationship Insights**

```javascript
// Store in database instead of memory
CREATE TABLE relationship_insights (
  room_id TEXT PRIMARY KEY,
  sender_id TEXT,
  receiver_id TEXT,
  insights JSONB,
  updated_at TIMESTAMP
);

{
  insights: {
    communication_style: {
      sender: "brief_direct",
      receiver: "detailed_explanatory",
      compatibility: "moderate" // good, moderate, challenging
    },
    common_topics: ["scheduling", "school events", "pickup times"],
    tension_points: ["last-minute changes", "timing conflicts"],
    positive_patterns: ["Both respond quickly", "Child-focused"],
    conflict_triggers: ["Schedule changes without notice"],
    successful_resolutions: [
      "When sender gives advance notice, receiver responds positively"
    ],
    questions_to_explore: [
      "Preferred communication times",
      "Scheduling preferences"
    ]
  }
}
```

**B. Intervention Learning**

```javascript
{
  intervention_learning: {
    successful_interventions: [
      {
        pattern: "Schedule conflict",
        intervention_type: "validation + rewrite",
        outcome: "accepted",
        user_feedback: "helpful"
      }
    ],
    unsuccessful_interventions: [
      {
        pattern: "Parenting disagreement",
        intervention_type: "comment",
        outcome: "rejected",
        reason: "Too clinical"
      }
    ],
    user_preferences: {
      prefers_rewrites_over_comments: true,
      likes_metaphors: true,
      dislikes_clinical_language: true
    }
  }
}
```

**C. Adaptive Coaching**

- Learn what types of interventions work for each user
- Adapt coaching style based on past success
- Avoid repeating unsuccessful approaches
- Build on what has worked before

**Implementation Priority:** 🟡 **MEDIUM** - Important for long-term quality

---

### 6. Task & Activity Context

#### Current State

- ❌ Task context available but **not used** in mediation
- ❌ Can't reference ongoing parenting tasks
- ❌ No connection between tasks and messages

#### Improvements Needed

**A. Active Task Integration**

```javascript
{
  task_context: {
    active_tasks: [
      {
        id: "task_123",
        title: "Pickup coordination",
        due_date: "2025-12-08",
        participants: ["sender", "receiver"],
        status: "in_progress",
        related_messages: ["msg_456", "msg_789"]
      }
    ],
    recent_completed: [
      {
        task: "School event planning",
        completed: "2025-12-05",
        outcome: "successful"
      }
    ],
    task_patterns: {
      sender_tends_to_initiate: "scheduling_tasks",
      receiver_tends_to_initiate: "school_related_tasks"
    }
  }
}
```

**B. Task-Aware Mediation**

- Reference active tasks in rewrites when relevant
- Understand task-related context in messages
- Connect messages to ongoing responsibilities
- Acknowledge task completion patterns

**Implementation Priority:** 🟢 **LOW** - Useful but not critical

---

## 📊 Implementation Roadmap

### Phase 1: Quick Wins (1-2 days) 🔴 HIGH PRIORITY

1. **User Profile Integration**
   - Include occupation, parenting philosophy, communication preferences
   - Reference in context building
   - **Impact:** High - Easy win, immediate improvement

2. **Voice Signature Extraction**
   - Track sentence structure, formality, unique phrases
   - Use in rewrite generation
   - **Impact:** High - Core to user acceptance

3. **Extended Message History**
   - Increase from 10-15 to 20-25 messages
   - Include message metadata (timestamps, edits)
   - **Impact:** Medium - Better context

### Phase 2: Enhanced Context (3-5 days) 🟡 MEDIUM PRIORITY

4. **Persistent Relationship Insights**
   - Store in database
   - Load on conversation start
   - **Impact:** Medium - Better long-term learning

5. **Conversation Pattern Analysis**
   - Track initiator balance, response times
   - Analyze conversation rhythm
   - **Impact:** Medium - Deeper understanding

6. **Intervention Learning**
   - Track intervention outcomes
   - Learn user preferences
   - **Impact:** High - Adaptive coaching

### Phase 3: Advanced Features (1-2 weeks) 🟢 LOWER PRIORITY

7. **Temporal Awareness**
   - Time of day, day of week
   - Special dates, holidays
   - **Impact:** Low-Medium - Nice to have

8. **Topic Continuity Tracking**
   - Track active topics across messages
   - Generate conversation summaries
   - **Impact:** Medium - Better continuity

9. **Task Context Integration**
   - Reference active tasks
   - Connect messages to tasks
   - **Impact:** Low - Useful but not critical

---

## 🎯 Success Metrics

Track improvements with:

- **Intervention Acceptance Rate** - % of rewrites accepted (target: >70%)
- **User Satisfaction** - Feedback on helpfulness (target: >4.5/5)
- **Voice Preservation** - User recognition of their voice in rewrites
- **Context Usage** - How often AI references specific context
- **Conflict Reduction** - Measured decrease in conflict-triggering messages

---

## 💡 Example: Enhanced Context in Action

### Before (Current):

```
User Context: dad - Co-parenting with: mom; Shared custody of: Sarah (age 9)

Recent messages (last 5):
mom: Can we talk about pickup time?
dad: Sure, what time works for you?
```

### After (Enhanced):

```
User Context: dad (John Doe)
- Co-parenting with: mom
- Separation: 3 years (established co-parenting)
- Shared custody: Sarah (age 9, 50/50 shared)
- Parenting philosophy: "I like to have fun with my kids"
- Occupation: Mail carrier (5am-5pm, Mon-Fri)
- Communication style: Brief, direct, prefers text
- Preferred times: Evenings after 6pm
- Known triggers: Last-minute changes, timing conflicts

Voice Signature:
- Sentence structure: Short, direct
- Formality: Casual
- Common phrases: "sounds good", "no worries", "let me know"
- Preferred closings: "Thanks", "Talk soon"

Relationship Insights (learned over 6 months):
- Communication style: Sender brief/direct, receiver detailed/explanatory
- Common topics: Pickup times (60%), school events (25%), scheduling (15%)
- Tension points: Last-minute changes, timing conflicts
- Positive patterns: Both respond quickly, child-focused
- Successful pattern: When sender gives advance notice, receiver responds positively

Active Tasks:
- Pickup coordination (due: Today, in progress)
- School event planning (due: This week)

Recent conversation (last 20 messages):
[20 messages with timestamps, showing pattern of brief exchanges]

Temporal Context:
- Time: Evening (6:30 PM) - Typical communication time for sender
- Day: Monday - Work week starting, potential stress
- Upcoming: Winter break starts Dec 20 (next week)

Conversation Patterns:
- Initiator balance: Sender 55%, Receiver 45%
- Avg response time: 2.5 hours (improving trend)
- Conversation rhythm: Back and forth, steady
- Topic: Pickup coordination (ongoing, 8 messages)
```

---

## 🔧 Technical Implementation Notes

### Database Schema Additions

```sql
-- Relationship insights persistence
CREATE TABLE relationship_insights (
  room_id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  insights JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Voice signatures
ALTER TABLE user_context ADD COLUMN voice_signature JSONB;

-- Intervention learning
CREATE TABLE intervention_outcomes (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  intervention_type TEXT,
  pattern TEXT,
  outcome TEXT, -- accepted, rejected, modified
  user_feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Code Changes Required

1. **userContext.js** - Add profile data to `formatContextForAI()`
2. **mediator.js** - Increase message history, add pattern analysis
3. **mediationContext.js** - Include voice signature, temporal context
4. **New modules:**
   - `voiceSignature.js` - Extract and apply voice signatures
   - `temporalContext.js` - Build temporal awareness
   - `conversationPatterns.js` - Analyze conversation patterns
   - `interventionLearning.js` - Track and learn from outcomes

---

## 📝 Next Steps

1. **Review this plan** with the team
2. **Prioritize Phase 1** quick wins (user profile, voice signature)
3. **Implement incrementally** - Test each improvement
4. **Measure impact** - Track metrics before/after
5. **Iterate** - Refine based on user feedback

---

_Last Updated: December 8, 2025_

