# AI Mediator Contextual Awareness Assessment

**Date**: 2025-01-20  
**Status**: Good foundation, significant room for improvement

---

## ✅ Current Contextual Awareness

### 1. User Context (Basic)

**Source**: `userContext.js` → `formatContextForAI()`

**Includes**:

- ✅ Co-parent name
- ✅ Separation date
- ✅ Children names and birthdays
- ✅ Concerns
- ✅ New partner information

**Limitations**:

- ❌ Only includes data from `userContext` table (set via API)
- ❌ Does NOT include user profile data from `users` table:
  - First name, last name
  - Address
  - Occupation
  - Parenting philosophy
  - Personal growth goals
  - Household members

### 2. Contact Context (Good)

**Source**: `server.js` → Contact database queries

**Includes**:

- ✅ Contact names and relationships
- ✅ Shared children identification (cross-references both co-parents' contacts)
- ✅ Contact notes
- ✅ Relationship-specific concerns:
  - Difficult aspects
  - Friction situations
  - Safety concerns
  - Legal matters
  - Substance/mental health concerns
  - Neglect/abuse concerns
- ✅ Child-specific data:
  - Child age
  - Child birthdate
  - School
  - Custody arrangement
  - Other parent linkage

**Strengths**:

- ✅ Smart shared child detection (checks both co-parents' contacts)
- ✅ Rich relationship metadata

**Limitations**:

- ❌ Contact triggering reasons (from flagged messages) stored but not used
- ❌ Contact context formatting could be more structured

### 3. Message History (Limited)

**Source**: `recentMessages` parameter

**Includes**:

- ✅ Last 5 messages for context
- ✅ Username and text content

**Limitations**:

- ❌ Only 5 messages (very limited for longer conversations)
- ❌ No message metadata (timestamps, edits, reactions)
- ❌ No conversation patterns (who initiates, response times)
- ❌ No topic tracking across messages

### 4. Relationship Insights (Good Foundation)

**Source**: `conversationContext.relationshipInsights` Map

**Includes**:

- ✅ Communication style (learned over time)
- ✅ Common topics
- ✅ Tension points
- ✅ Positive patterns
- ✅ Questions to explore

**Strengths**:

- ✅ Learns and accumulates insights
- ✅ Room-specific (per `roomId`)

**Limitations**:

- ❌ Insights extraction only runs occasionally (not on every message)
- ❌ No persistence (lost on server restart)
- ❌ Limited depth (basic categories only)

### 5. Conversation Context Tracking (Basic)

**Source**: `conversationContext` object

**Includes**:

- ✅ Recent messages (last 20)
- ✅ User sentiments (Map, but not actively used)
- ✅ Topic changes
- ✅ Last intervention timestamp
- ✅ Comment frequency limiting

**Limitations**:

- ❌ Sentiment tracking exists but not used in prompts
- ❌ No persistence (lost on restart)
- ❌ No conversation summaries

---

## ❌ Missing Contextual Information

### 1. User Profile Data

**Available but NOT used**:

- User's first name, last name
- Address/location
- Occupation
- Parenting philosophy
- Personal growth goals
- Household members

**Impact**: AI doesn't know user's background, values, or situation details

### 2. Task Context

**Available but NOT used**:

- Shared parenting tasks
- Task history and completion patterns
- Task-related conversations

**Impact**: AI can't reference ongoing parenting responsibilities or task-related context

### 3. Historical Interventions

**Available but NOT used**:

- Previous interventions and their outcomes
- Which rewrites were used
- User responses to interventions
- Patterns in what triggers interventions

**Impact**: AI doesn't learn from past interventions or adapt to what works

### 4. Room Context

**Available but NOT used**:

- Room name/description
- Room creation date
- Member join history
- Room-specific settings

**Impact**: AI doesn't know room purpose or history

### 5. Temporal Context

**Not tracked**:

- Time of day
- Day of week
- Special dates (holidays, birthdays)
- Conversation timing patterns

**Impact**: AI can't adapt to time-sensitive situations or patterns

### 6. Message Metadata

**Available but NOT used**:

- Message timestamps (for timing analysis)
- Message edits
- Message reactions
- Message flags

**Impact**: AI can't detect patterns in editing behavior or reactions

### 7. Contact Triggering Reasons

**Stored but NOT used**:

- `triggering_reasons` field in contacts table (JSON array)
- Reasons messages were flagged for specific contacts

**Impact**: AI can't learn what triggers conflict with specific contacts

---

## 📊 Contextual Awareness Score

### Current Score: **6.5/10**

| Category              | Score | Notes                                       |
| --------------------- | ----- | ------------------------------------------- |
| User Context          | 5/10  | Basic info only, missing profile data       |
| Contact Context       | 8/10  | Good shared child detection, rich metadata  |
| Message History       | 4/10  | Only 5 messages, no patterns                |
| Relationship Insights | 7/10  | Good foundation, but not persistent         |
| Task Context          | 0/10  | Not included at all                         |
| Historical Learning   | 2/10  | Some insights, but no intervention learning |
| Temporal Awareness    | 0/10  | Not tracked                                 |
| Profile Integration   | 3/10  | User profile data exists but unused         |

---

## 🎯 Recommended Improvements

### Priority 1: High Impact, Easy Implementation

#### 1. Include User Profile Data

**Impact**: High  
**Effort**: Low

Add user profile fields to context:

```javascript
// In userContext.formatContextForAI()
- First name, last name
- Parenting philosophy
- Occupation (for scheduling context)
- Address (for location-based context)
```

#### 2. Expand Message History

**Impact**: Medium  
**Effort**: Low

Increase from 5 to 10-15 messages for better conversation context:

```javascript
// In aiMediator.js
const messageHistory = recentMessages.slice(-15); // Increased from 5
```

#### 3. Include Task Context

**Impact**: High  
**Effort**: Medium

Add recent/active tasks to context:

```javascript
// Get user's active tasks
const tasks = await getActiveTasks(user.username);
const taskContext = formatTasksForAI(tasks);
```

### Priority 2: Medium Impact, Medium Effort

#### 4. Persist Relationship Insights

**Impact**: Medium  
**Effort**: Medium

Store insights in database instead of memory:

```javascript
// Store in database
await db.run(
  `
  INSERT OR REPLACE INTO relationship_insights 
  (room_id, insights_json, updated_at) 
  VALUES (?, ?, ?)
`,
  [roomId, JSON.stringify(insights), new Date()]
);
```

#### 5. Learn from Past Interventions

**Impact**: High  
**Effort**: Medium-High

Track intervention outcomes:

```javascript
// Store intervention history
- Which rewrites were selected
- User responses to interventions
- Patterns in successful interventions
```

#### 6. Use Contact Triggering Reasons

**Impact**: Medium  
**Effort**: Low

Include triggering reasons in contact context:

```javascript
if (contact.triggering_reasons) {
  const reasons = JSON.parse(contact.triggering_reasons);
  parts.push(`Known conflict triggers: ${reasons.join(', ')}`);
}
```

### Priority 3: Lower Priority, Higher Effort

#### 7. Temporal Context

**Impact**: Low-Medium  
**Effort**: Medium

Add time-based awareness:

```javascript
const temporalContext = {
  timeOfDay: getTimeOfDay(),
  dayOfWeek: getDayOfWeek(),
  isWeekend: isWeekend(),
  specialDates: getSpecialDates(user),
};
```

#### 8. Conversation Pattern Analysis

**Impact**: Medium  
**Effort**: High

Track patterns:

- Who initiates conversations
- Response times
- Message lengths
- Topic transitions

#### 9. Sentiment History Integration

**Impact**: Low-Medium  
**Effort**: Medium

Use tracked sentiment in prompts:

```javascript
const userSentiment = conversationContext.userSentiments.get(message.username);
// Include in prompt if available
```

---

## 🔧 Implementation Plan

### Phase 1: Quick Wins (1-2 days)

1. ✅ Include user profile data in context
2. ✅ Expand message history to 10-15 messages
3. ✅ Use contact triggering reasons
4. ✅ Improve contact context formatting

### Phase 2: Enhanced Context (3-5 days)

1. ✅ Add task context
2. ✅ Persist relationship insights to database
3. ✅ Track intervention outcomes
4. ✅ Improve shared child context formatting

### Phase 3: Advanced Features (1-2 weeks)

1. ✅ Temporal context awareness
2. ✅ Conversation pattern analysis
3. ✅ Sentiment history integration
4. ✅ Topic tracking across conversations

---

## 📝 Example: Enhanced Context Format

### Current Context (Simplified):

```
User Context Information:
dad's context: Co-parenting with: mom; Shared custody of: Sarah (born 2015)

Contacts and Relationships:
Sarah (relationship: Child) [SHARED CHILD with co-parent: mom]
- Difficult aspects: Scheduling conflicts

Recent conversation:
mom: Can we talk about pickup time?
dad: Sure, what time works for you?
```

### Enhanced Context (Proposed):

```
User Context Information:
dad (Father Test):
- Co-parenting with: mom
- Separation since: 2020
- Shared custody of: Sarah (age 9, born 2015)
- Parenting philosophy: "I like to have fun with my kids"
- Occupation: Mail carrier (5am-5pm, Mon-Fri)
- Concerns: Scheduling conflicts, communication timing

mom:
- Co-parenting with: dad
- [Similar context...]

Contacts and Relationships:
Sarah (Child, age 9):
- SHARED CHILD with co-parent: mom
- School: [School name]
- Custody arrangement: [Details]
- Known conflict triggers: Scheduling discussions, pickup times
- Difficult aspects: Scheduling conflicts
- Friction situations: Last-minute changes

Active Parenting Tasks:
- Pickup coordination (due: Today)
- School event planning (due: This week)

Recent conversation (last 10 messages):
[10 messages with timestamps]

Relationship Insights (learned over time):
- Communication style: Brief, direct, prefers text
- Common topics: Pickup times, school events, scheduling
- Tension points: Last-minute changes, timing conflicts
- Positive patterns: Both respond quickly, child-focused
- Questions to explore: Preferred communication times, scheduling preferences

Temporal Context:
- Time: Evening (6:30 PM)
- Day: Monday
- Context: After work hours, typical pickup coordination time
```

---

## 🎯 Success Metrics

Track improvements with:

- **Intervention Accuracy**: % of interventions that were helpful
- **Context Usage**: How often AI references specific context
- **User Satisfaction**: Feedback on AI helpfulness
- **Conflict Reduction**: Measured decrease in conflict-triggering messages

---

## Next Steps

1. **Review this assessment** with the team
2. **Prioritize improvements** based on user feedback
3. **Implement Phase 1** quick wins
4. **Test and iterate** on contextual awareness
5. **Measure impact** of improvements

---

_Last Updated: 2025-01-20_
