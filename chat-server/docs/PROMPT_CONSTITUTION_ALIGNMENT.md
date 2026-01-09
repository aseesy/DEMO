# Prompt and Constitution Alignment Analysis

## Problem Statement

The system prompt and constitution have conflicting instructions about emotional diagnosis and therapy-like responses.

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

## Conflicts Identified

### 1. Emotion Diagnosis Fields (promptBuilder.js:137)

**Current**: `"emotion": {"currentEmotion": "neutral|frustrated|defensive", "stressLevel": 0-100}`
**Problem**: Asks AI to diagnose emotions, violating Principle I
**Fix**: Remove emotion field entirely - we don't need to track emotions

### 2. Validation Instructions (promptBuilder.js:139)

**Current**: "Show deep understanding of their SPECIFIC situation — name the child, reference the concrete details, connect to their context. Make them feel truly seen and understood. Attuned, contextual, empathetic."
**Problem**: "Make them feel truly seen and understood" + "Attuned, contextual, empathetic" encourages therapy-like emotional attunement
**Fix**: Focus on acknowledging the situation and context, not emotional validation

### 3. Refocus Questions (fewShotExamples.js:90)

**Current**: "What are you feeling underneath the anger - hurt, scared, or disrespected?"
**Problem**: Asks about emotions, violating Principle I
**Fix**: Focus on needs, intentions, or communication mechanics

### 4. Human Understanding Module (humanUnderstanding.js:74)

**Current**: "What emotional or cognitive state led to this phrasing?"
**Problem**: Asks about emotional states
**Fix**: Ask about communication patterns, needs, or context factors instead

## Proposed Solutions

### Validation Should:

- Acknowledge the **situation** is difficult (not that they ARE feeling something)
- Reference **specific context** (child names, events, concrete details)
- Explain why the **phrasing** won't work (mechanics, not emotions)
- Normalize the **reaction** to the situation (not the emotional state)

### Refocus Questions Should:

- Probe **needs** ("What do you need - X or Y?")
- Challenge **assumptions** ("Could this be about their situation, not you?")
- Focus on **intentions** ("What outcome would help here?")
- Test **communication mechanics** ("Would this phrasing achieve your goal?")
- Explore **context** ("What else might be true here?")

### Human Understanding Should:

- Focus on **communication patterns** (not emotional states)
- Identify **underlying needs** (not feelings)
- Understand **context factors** (not cognitive/emotional states)
- Explain **communication breakdown** in terms of language mechanics

## Examples of Corrected Language

### Validation Examples:

**Before** (therapy-like):

> "I understand you're feeling hurt and frustrated. This situation is triggering your need for respect."

**After** (constitution-compliant):

> "When plans change without consultation, it disrupts your expectations and makes planning difficult. Name-calling shuts down any chance of being heard, so your actual concerns won't get addressed."

### Refocus Question Examples:

**Before** (emotion-focused):

> "What are you feeling underneath the anger - hurt, scared, or disrespected?"

**After** (need/mechanic-focused):

> "What do you really need - an apology, better communication, or just to be included in decisions?"

**Before** (emotion-focused):

> "Is this more about being hurt or being scared?"

**After** (intention/outcome-focused):

> "What outcome would actually help here - acknowledgment of the issue or a concrete solution?"

## Implementation Plan

1. Remove `emotion` field from promptBuilder.js JSON schema
2. Reframe validation instructions to focus on situation/context
3. Update refocusQuestions examples in fewShotExamples.js
4. Fix humanUnderstanding.js to avoid emotional state questions
5. Update prompt instructions to clarify constitution compliance
