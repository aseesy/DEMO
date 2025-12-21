# Advanced AI Mediator Features

**Date**: 2024-12-19  
**Status**: ✅ Core Features Complete

## Overview

This document describes the advanced AI mediator features that make LiaiZen a truly useful system for conflict prevention, tactful intervention, personalized adaptation, and real-time coaching.

## Core Capabilities

### 1. ✅ Conflict Escalation Prediction

**What It Does**:

- Analyzes conversation patterns in real-time
- Tracks escalation indicators (accusatory language, triangulation, comparisons, blaming)
- Calculates escalation scores that decay over time
- Provides risk assessments (low/medium/high/critical) with confidence levels

**How It Works**:

- `conflictPredictor.js` monitors each message for conflict patterns
- Tracks pattern counts per room (accusatory, triangulation, comparison, blaming)
- Uses AI to assess overall escalation risk based on conversation context
- Provides urgency recommendations (none/gentle/moderate/urgent)

**Integration**:

- Runs before AI mediator analysis
- Escalation risk is passed to AI mediator for context-aware intervention
- High-risk conversations trigger more proactive intervention

### 2. ✅ Proactive Coaching (Before Sending)

**What It Does**:

- Analyzes draft messages as users type (debounced)
- Provides real-time feedback before message is sent
- Offers alternative rewrites that are more collaborative
- Learns from previously flagged messages

**How It Works**:

- `proactiveCoach.js` analyzes draft text when user pauses typing (1 second delay)
- Only analyzes messages with 10+ characters
- Considers recent conversation history, user context, and flagged messages
- Returns risk assessment, issues, coaching message, and rewrite options

**UI Features**:

- Orange banner appears above input when risk is detected
- Shows coaching message and specific issues
- Provides clickable rewrite options
- Input field highlights in orange when coaching is active

### 3. ✅ Real-Time Message Rewrite Suggestions

**What It Does**:

- Provides two alternative rewrites for problematic drafts
- Rewrites are child-focused, collaborative, and respectful
- One-click application to input field
- Clears coaching banner when rewrite is selected

**User Experience**:

- User types message → System analyzes → Shows coaching banner
- User clicks rewrite → Message replaces draft → User can edit or send
- Non-intrusive: Only shows when risk is detected

### 4. ✅ Escalation-Aware Intervention

**What It Does**:

- AI mediator receives escalation risk assessment
- Adjusts intervention urgency based on escalation level
- More proactive intervention for high-risk conversations
- Tracks escalation patterns over time

**Integration Points**:

- Escalation assessment runs before AI analysis
- Risk level, confidence, reasons, and urgency passed to AI
- AI mediator uses this context to make better intervention decisions

### 5. ✅ Personalized Learning from Flags

**What It Does**:

- Tracks what each user finds problematic
- Uses flagged messages to understand user-specific triggers
- Adapts coaching and intervention to individual preferences
- Stores flag reasons for long-term learning

**Learning Flow**:

1. User flags message with reason
2. Reason saved to `message_flags` table
3. Flagged messages included in proactive coaching context
4. AI mediator learns user-specific patterns over time

## Technical Architecture

### New Components

**`conflictPredictor.js`**:

- Pattern detection (regex + AI analysis)
- Escalation score calculation
- Risk assessment with confidence levels
- Room state tracking

**`proactiveCoach.js`**:

- Draft message analysis
- Context-aware coaching generation
- Rewrite generation
- Learning from flagged messages

**Database Tables**:

- `message_flags`: Stores flag records with reasons
- `user_intervention_preferences`: User preferences (future use)
- `escalation_tracking`: Escalation history (future use)

### Socket Events

**New Events**:

- `analyze_draft`: Client requests draft analysis
- `draft_analysis`: Server returns coaching suggestions

**Enhanced Events**:

- `send_message`: Now includes escalation assessment
- `message_flagged`: Includes flag reasons for learning

## User Flow Examples

### Example 1: Proactive Coaching Prevents Conflict

1. User types: "You always forget to pick up Emma on time"
2. System detects: Accusatory language, blaming pattern
3. Coaching banner appears: "This message could escalate conflict. Consider focusing on the child's needs rather than assigning blame."
4. Rewrite options shown:
   - "I noticed Emma was waiting longer than usual today. Could we discuss pickup times?"
   - "Emma mentioned she was waiting today. Can we coordinate better on pickup times?"
5. User clicks rewrite → Edits if needed → Sends improved message

### Example 2: Escalation Detection Triggers Intervention

1. Conversation shows multiple accusatory messages
2. Escalation score increases: 0 → 30 → 60
3. Next message analyzed with "high" risk level
4. AI mediator receives escalation context
5. More proactive intervention triggered
6. Intervention includes escalation-aware validation and tips

### Example 3: Learning from Flags

1. User flags message: "You're being unreasonable"
2. Reason provided: "Personal attack, not constructive"
3. System learns: This user finds personal attacks problematic
4. Future proactive coaching: Detects similar patterns and warns user
5. AI mediator: More likely to intervene on similar messages

## Performance Considerations

- **Debouncing**: Draft analysis waits 1 second after typing stops
- **Minimum Length**: Only analyzes messages with 10+ characters
- **Caching**: Escalation scores cached per room in memory
- **Decay**: Escalation scores decay over time (5 minutes)
- **Limits**: Only analyzes last 5 flagged messages for context

## Future Enhancements

### Personalized Intervention Styles (Pending)

- User preferences for intervention frequency
- Preferred tone (warm, direct, gentle)
- Coaching level (minimal, moderate, comprehensive)

### Communication Pattern Learning (Pending)

- Long-term pattern recognition
- Relationship-specific insights
- Predictive conflict prevention

## Benefits

1. **Anticipates Conflict**: Detects escalation patterns early
2. **Intervenes Tactfully**: Context-aware, warm, supportive
3. **Adapts to Individual Style**: Learns from user flags and preferences
4. **Provides Real-Time Coaching**: Helps users before they send problematic messages
5. **Continuous Learning**: Gets better over time with more data

## Testing Recommendations

1. **Escalation Detection**: Test with escalating conversation patterns
2. **Proactive Coaching**: Test with various problematic draft messages
3. **Rewrite Quality**: Verify rewrites are collaborative and child-focused
4. **Flag Learning**: Test that flagged messages improve future coaching
5. **Performance**: Ensure debouncing prevents excessive API calls
