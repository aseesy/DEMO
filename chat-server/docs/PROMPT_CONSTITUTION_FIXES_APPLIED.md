# Prompt and Constitution Alignment - Fixes Applied

## Summary

Fixed conflicts between the system prompt and the AI mediation constitution. The prompt was instructing the AI to diagnose emotions and provide therapy-like responses, which violates Principle I of the constitution.

## Changes Made

### 1. Removed Emotion Diagnosis Fields (promptBuilder.js)

**Before:**

```json
{
  "emotion": {"currentEmotion": "neutral|frustrated|defensive", "stressLevel": 0-100}
}
```

**After:**

- Removed `emotion` field entirely from JSON schema
- AI no longer asked to diagnose emotions

### 2. Reframed Validation Instructions (promptBuilder.js)

**Before:**

> "Show deep understanding of their SPECIFIC situation — name the child, reference the concrete details, connect to their context. Make them feel truly seen and understood. Attuned, contextual, empathetic."

**After:**

> "Acknowledge the SPECIFIC situation (name the child, reference concrete details). Explain why this phrasing won't work (mechanics: what the words do, not what they feel). Normalize the reaction to the situation, not the emotional state."

**Key Change:** Focus on situation/context and language mechanics, not emotional attunement.

### 3. Updated Refocus Questions (fewShotExamples.js)

**Before:**

> "What are you feeling underneath the anger - hurt, scared, or disrespected?"

**After:**

> "What do you really need - an apology, better communication, or just to be included in decisions?"

**Key Change:** Questions now focus on needs, intentions, and communication mechanics, not emotions.

### 4. Fixed Human Understanding Module (humanUnderstanding.js)

**Before:**

> "What emotional or cognitive state led to this phrasing?"

**After:**

> "What communication patterns or language choices led to this phrasing?"

**Key Change:** Focus on communication patterns and language mechanics, not emotional/cognitive states.

### 5. Enhanced SYSTEM_PROMPT Clarity (promptBuilder.js)

Added explicit constitution compliance reminders:

- "Language, not emotions - describe phrasing mechanics, never diagnose feelings. Say 'This situation is frustrating' not 'You're frustrated'."
- Added constitution compliance section to instructions

## What We're Really Trying to Accomplish

**Goal**: Help co-parents communicate better through language coaching, not therapy.

**Key Distinctions**:

1. **Situation vs. Emotion**:
   - ✅ "This situation is frustrating" (acknowledging the situation)
   - ❌ "You're feeling frustrated" (diagnosing emotion)

2. **Needs vs. Feelings**:
   - ✅ "What do you need - an apology or better communication?" (need-focused)
   - ❌ "What are you feeling underneath the anger?" (emotion-focused)

3. **Language Mechanics vs. Mental States**:
   - ✅ "This phrasing implies blame" (describing what words do)
   - ❌ "You're being defensive" (diagnosing mental state)

4. **Context Understanding vs. Emotional Attunement**:
   - ✅ "When schedules don't align with your expectations, it disrupts planning" (situation-focused validation)
   - ❌ "I understand you're hurt and scared" (emotional attunement/therapy)

## Remaining Code References

Some code still references emotion fields for backward compatibility:

- `mediationService.js` - Creates default emotion objects (will be unused if AI doesn't return them)
- `response/recorder.js` - Tries to read emotion fields (will be undefined if not present)
- `response/resultBuilder.js` - Passes through emotion field (will be undefined if not present)

These are fine for backward compatibility. The AI won't return emotion fields anymore, so these will just be undefined/null.

## Testing Recommendations

1. Test that interventions still work correctly without emotion fields
2. Verify that validation focuses on situation/context, not emotions
3. Check that refocus questions focus on needs/mechanics, not feelings
4. Ensure no errors occur when emotion fields are missing

## Files Modified

1. `chat-server/src/core/engine/promptBuilder.js` - Removed emotion field, reframed instructions
2. `chat-server/src/core/engine/prompts/fewShotExamples.js` - Fixed emotion-focused question
3. `chat-server/src/core/engine/humanUnderstanding.js` - Removed emotional state questions

## Related Documentation

- `chat-server/docs/PROMPT_CONSTITUTION_ALIGNMENT.md` - Detailed analysis of conflicts
- `chat-server/ai-mediation-constitution.md` - The constitution itself
