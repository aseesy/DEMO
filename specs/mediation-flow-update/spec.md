# Feature Specification: Mediation Flow Update

## Overview

**Feature Name**: Mediation Flow Update - Replace Tip with Rationale

**Business Objective**: Update the LiaiZen mediation intervention flow to replace the "tip" with a "rationale" that explains why the suggested rewrites are better, creating a more educational and transparent coaching experience.

**Current Flow**:

1. Address the message author (personalMessage)
2. Provide one tip (tip1) - max 10 words, actionable skill
3. Provide two suggestions (rewrite1, rewrite2)

**New Flow**:

1. Address the message author (personalMessage)
2. Provide two suggestions (rewrite1, rewrite2)
3. Provide the rationale - explains why these rewrites are better

**Success Metrics**:

- Users understand why their message was flagged
- Users learn communication principles through rationale
- Rationale provides educational value beyond quick tips
- Intervention flow remains clear and actionable

## User Stories

**As a co-parent**, I want to **see a rationale explaining why my message needs rewriting**, so that **I understand the communication principles and can improve my future messages**.

**Acceptance Criteria**:

- Rationale appears after the two rewrite suggestions
- Rationale explains the communication principles behind the rewrites
- Rationale is educational and helps users understand why the original message was problematic
- Rationale is clear, concise, and actionable (max 3-4 sentences)

**As a co-parent**, I want to **see two rewrite suggestions before the rationale**, so that **I can quickly see my options and then understand why they're better**.

**Acceptance Criteria**:

- Two rewrite suggestions appear before the rationale
- Suggestions are clearly labeled and clickable
- Rationale appears after suggestions with clear visual separation

## Functional Requirements

### FR1: Replace Tip with Rationale in AI Prompt

**Requirement**: Update the AI mediation prompt to generate a "rationale" field instead of "tip1".

**Details**:

- Remove tip1 from required fields
- Add rationale as a required field
- Rationale should explain:
  - Why the original message was problematic
  - What communication principles the rewrites demonstrate
  - How these principles lead to better outcomes
- Rationale format: 3-4 sentences, educational tone

**Business Rules**:

- Rationale must be specific to the message (not generic)
- Rationale must reference the communication principles being applied
- Rationale must explain the benefit to the sender (why this helps them achieve their goal)

### FR2: Update Backend Message Structure

**Requirement**: Update the intervention message structure to include rationale instead of tip1.

**Details**:

- Replace `tip1` field with `rationale` field in intervention message object
- Update validation to require rationale instead of tip1
- Maintain backward compatibility for existing messages with tip1

**Files to Update**:

- `chat-server/aiMediator.js` - Update prompt and validation
- `chat-server/server.js` - Update intervention message structure
- `chat-server/ai-mediation-constitution.md` - Update framework documentation

### FR3: Update Frontend Display

**Requirement**: Update the UI to display rationale instead of tip.

**Details**:

- Remove tip1 display section
- Add rationale display section after rewrite suggestions
- Rationale should have clear visual hierarchy
- Use appropriate styling consistent with design system

**Files to Update**:

- `chat-client-vite/src/ChatRoom.jsx` - Update intervention message rendering

### FR4: Database Schema (Optional)

**Requirement**: Consider if database schema needs updating.

**Details**:

- Current schema has `tip1` column in messages table
- Options:
  1. Reuse `tip1` column for rationale (rename in code, keep column name)
  2. Add new `rationale` column (requires migration)
  3. Store in existing `validation` or `explanation` field
- **Recommendation**: Reuse `tip1` column, rename in application code only

## Non-Functional Requirements

### NFR1: Backward Compatibility

**Requirement**: Existing messages with tip1 should still display correctly.

**Details**:

- Check for both tip1 and rationale fields
- Display tip1 if rationale doesn't exist (for old messages)
- Gracefully handle missing rationale field

### NFR2: Performance

**Requirement**: No performance degradation from rationale generation.

**Details**:

- Rationale generation should not significantly increase AI response time
- Rationale should be concise (3-4 sentences max)
- Frontend rendering should remain fast

### NFR3: Usability

**Requirement**: Rationale should be easy to read and understand.

**Details**:

- Clear typography and spacing
- Appropriate visual hierarchy
- Accessible (WCAG 2.1 AA)

## Technical Constraints

### Architecture

**Backend** (Node.js + Express):

- AI prompt in `chat-server/aiMediator.js`
- Message structure in `chat-server/server.js`
- Database schema in `chat-server/migrations/`

**Frontend** (React + Vite):

- Message rendering in `chat-client-vite/src/ChatRoom.jsx`
- Uses existing design system tokens

### AI Prompt Structure

**Current Prompt Section**:

```
2. ONE TIP (tip1): Single, precise adjustment (max 10 words)
```

**New Prompt Section**:

```
2. TWO REWRITES (rewrite1, rewrite2): Complete message alternatives
   - Preserve sender's underlying intent/concern
   - Improve clarity and dignity
   - Ready to send as-is
   - Use DIFFERENT approaches:
     * Rewrite 1: I-statement (feeling + need) - "I feel... when... I need..."
     * Rewrite 2: Observation + request - "I've noticed... Can we..."

3. RATIONALE (rationale): Explain why these rewrites are better
   - Explain the communication principles being applied
   - Reference why the original message was problematic
   - Show how the rewrites lead to better outcomes
   - Max 3-4 sentences
   - Educational tone, specific to this message
```

### Design System

**Rationale Display**:

- Use existing teal color palette
- Consistent with explanation card styling
- Appropriate icon (lightbulb or info icon)
- Clear typography hierarchy

**Visual Order**:

1. Address (personalMessage) - at top
2. Two rewrite suggestions - middle section
3. Rationale - bottom section

### API Changes

**Intervention Message Structure**:

```javascript
{
  id: string,
  type: 'ai_intervention',
  personalMessage: string,  // Address - unchanged
  rewrite1: string,          // Suggestion 1 - unchanged
  rewrite2: string,          // Suggestion 2 - unchanged
  rationale: string,          // NEW - replaces tip1
  originalMessage: object,   // Unchanged
  // ... other fields
}
```

## Acceptance Criteria

### AC1: AI Generates Rationale

- ✅ AI prompt includes rationale requirement
- ✅ AI generates rationale field in intervention response
- ✅ Rationale is 3-4 sentences, educational, specific
- ✅ Validation requires rationale (not tip1)

### AC2: Backend Handles Rationale

- ✅ Intervention message includes rationale field
- ✅ Rationale is sent to frontend in message object
- ✅ Backward compatibility with tip1 maintained

### AC3: Frontend Displays Rationale

- ✅ Rationale appears after rewrite suggestions
- ✅ Rationale has appropriate styling and hierarchy
- ✅ Tip section is removed
- ✅ Order: Address → Suggestions → Rationale

### AC4: User Experience

- ✅ Users can read rationale and understand principles
- ✅ Rationale helps users learn communication skills
- ✅ Flow is clear and logical
- ✅ No confusion from removed tip

## Implementation Notes

### Prompt Engineering

**Rationale Prompt Template**:

```
3. RATIONALE (rationale): Explain why these rewrites are better
   - Explain the communication principles being applied (e.g., I-statements, observation-based requests)
   - Reference why the original message was problematic (e.g., "blame language triggers defensiveness")
   - Show how the rewrites lead to better outcomes (e.g., "this approach invites collaboration")
   - Max 3-4 sentences
   - Educational tone, specific to THIS message
   - Format: "[Principle] + [Why original fails] + [How rewrite succeeds]"

   Examples:
   * "I-statements focus on your experience rather than assigning blame, which reduces defensiveness. The original message's accusatory tone ('you never') triggers resistance, while the rewrite invites understanding and collaboration."
   * "Observation-based requests create space for dialogue instead of demands. The original message's command structure ('you need to') creates power dynamics, while the rewrite frames it as a shared problem to solve together."
```

### Database Considerations

**Option 1: Reuse tip1 Column** (Recommended)

- Rename `tip1` to `rationale` in application code
- Keep database column name as `tip1`
- Simplest approach, no migration needed
- Backward compatible

**Option 2: Add rationale Column**

- Create migration to add `rationale` column
- Keep `tip1` column for backward compatibility
- More explicit, but requires migration

**Recommendation**: Use Option 1 for simplicity and speed.

### UI Component Structure

```jsx
{
  /* Address */
}
{
  msg.personalMessage && <p>{msg.personalMessage}</p>;
}

{
  /* Two Suggestions */
}
{
  (msg.rewrite1 || msg.rewrite2) && (
    <div>
      <h3>Suggestions</h3>
      {msg.rewrite1 && <button>{msg.rewrite1}</button>}
      {msg.rewrite2 && <button>{msg.rewrite2}</button>}
    </div>
  );
}

{
  /* Rationale */
}
{
  msg.rationale && (
    <div>
      <h3>Why these work better</h3>
      <p>{msg.rationale}</p>
    </div>
  );
}
```

## Dependencies

- AI prompt engineering for rationale generation
- Frontend UI component updates
- Backend message structure updates
- Documentation updates (constitution.md)

## Risks

1. **AI Quality**: Rationale might be too generic or not educational enough
   - **Mitigation**: Provide clear examples and format in prompt

2. **User Confusion**: Removing tip might reduce quick actionable advice
   - **Mitigation**: Rationale should still be actionable, just more educational

3. **Backward Compatibility**: Old messages with tip1 might break
   - **Mitigation**: Check for both fields, display tip1 if rationale missing

## Related Documentation

- `chat-server/ai-mediation-constitution.md` - Framework documentation
- `chat-server/aiMediator.js` - AI prompt and logic
- `chat-client-vite/src/ChatRoom.jsx` - Frontend rendering

## Next Steps

1. Update AI prompt in `aiMediator.js`
2. Update backend message structure in `server.js`
3. Update frontend rendering in `ChatRoom.jsx`
4. Update documentation in `ai-mediation-constitution.md`
5. Test with various message types
6. Verify backward compatibility

---

**Status**: Ready for Implementation
**Priority**: High
**Estimated Complexity**: Medium
