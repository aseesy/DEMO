# New Developer Confusion Report

## Overview
As a new developer joining this project, here are the confusing aspects I've identified that would slow down onboarding and development.

---

## 🔴 Critical Confusion: Multiple Implementations of the Same Thing

### Problem: Which `useSendMessage` Should I Use?

There are **at least 4 different implementations** of message sending logic:

1. **`model/useSendMessage.js`** - Original implementation (still exported from `index.js`)
2. **`model/useSendMessage.refactored.js`** - Refactored version using services
3. **`hooks/useSendMessageComposed.js`** - Composed version using 3 separate hooks
4. **`hooks/useMessageSending.js`** - Another hook (used in ChatContext)

**Questions I have:**
- Which one is actually being used in production?
- Why are there so many versions?
- Should I use the original or the refactored one?
- What's the difference between `.refactored.js` and `Composed.js`?

**Impact:** I can't confidently modify message sending logic without understanding which version is canonical.

---

## 🟡 Confusion: Services vs Hooks - What's the Pattern?

### Problem: Two Different Architectures for the Same Feature

There are **services** (`MessageTransportService`, `MessageValidationService`, `MessageQueueService`) and **hooks** (`useMessageTransport`, `useMessageMediation`, `useMessageUI`) that seem to do similar things.

**Questions:**
- Are services the "old way" and hooks the "new way"?
- Or are they meant to be used together?
- The refactoring guide talks about services, but the actual code uses hooks
- Which pattern should I follow for new features?

**Files involved:**
- `services/message/MessageTransportService.js` (service)
- `hooks/useMessageTransport.js` (hook)
- `model/useSendMessage.refactored.js` (uses services)
- `hooks/useSendMessageComposed.js` (uses hooks)

**Impact:** Unclear architectural direction makes it hard to know how to build new features.

---

## 🟡 Confusion: File Organization Inconsistencies

### Problem: Hooks Are Scattered Across Directories

Hooks exist in multiple locations with no clear pattern:

- `features/chat/model/` - Contains hooks like `useSendMessage.js`, `useMessages.js`, `useChatSocket.js`
- `features/chat/hooks/` - Contains hooks like `useMessageUI.js`, `useMessageTransport.js`, `useMessageMediation.js`
- `features/chat/hooks/useMessageSending.js` - Used in ChatContext but not exported from index.js

**Questions:**
- What's the difference between `model/` and `hooks/`?
- Should new hooks go in `model/` or `hooks/`?
- Why are some hooks exported from `index.js` and others not?

**Impact:** Hard to find existing hooks and know where to put new ones.

---

## 🟡 Confusion: Documentation vs Reality Mismatch

### Problem: Refactoring Guide Doesn't Match Implementation

The `USESENDMESSAGE_REFACTORING.md` guide describes:
- Using `MessageTransportService`, `MessageValidationService`, `MessageQueueService`
- Migration steps showing how to use services
- Architecture diagrams showing service-based approach

But the actual implementation:
- `useSendMessage.refactored.js` uses services (matches docs)
- `useSendMessageComposed.js` uses hooks (doesn't match docs)
- `ChatContext.jsx` uses `useMessageSending` hook (not mentioned in docs)

**Questions:**
- Is the refactoring guide outdated?
- Which approach is actually being used?
- Should I follow the guide or the code?

**Impact:** Following documentation leads to wrong implementation.

---

## 🟡 Confusion: Unclear Migration Status

### Problem: Can't Tell What's Old vs New

Multiple files suggest an ongoing migration:
- `useSendMessage.js` - Original (still exported)
- `useSendMessage.refactored.js` - Refactored version
- `USESENDMESSAGE_REFACTORING.md` - Migration guide
- `REFACTORING_SUMMARY.md` - Another doc about refactoring

**Questions:**
- Is the migration complete?
- Can I delete the old `useSendMessage.js`?
- Why is the old version still exported from `index.js`?
- What's blocking the migration?

**Impact:** Afraid to touch code because I don't know what's deprecated.

---

## 🟡 Confusion: Context Usage Pattern

### Problem: ChatContext Uses Different Hook Than Expected

`ChatContext.jsx` uses:
- `useMessageSending` hook (from `hooks/useMessageSending.js`)
- Not `useSendMessage` (from `model/useSendMessage.js`)
- Not `useSendMessage.refactored.js`
- Not `useSendMessageComposed.js`

**Questions:**
- Why does ChatContext use a different hook?
- What's the relationship between `useMessageSending` and `useSendMessage`?
- Should I use `useMessageSending` or `useSendMessage`?

**Impact:** Unclear which hook to use when building new features.

---

## 🟢 Minor Confusion: Naming Conventions

### Problem: Inconsistent Naming Patterns

- `useSendMessage.refactored.js` - Uses `.refactored` suffix
- `useSendMessageComposed.js` - Uses `Composed` suffix
- `useMessageSending.js` - Different name entirely
- `useMessageHandlers.js` - Plural vs singular inconsistency

**Questions:**
- What's the naming convention for refactored files?
- Should I use `.refactored` suffix or create a new file?
- Why `useMessageSending` vs `useSendMessage`?

**Impact:** Harder to discover related files.

---

## 🟢 Minor Confusion: Export Patterns

### Problem: Some Hooks Exported, Others Not

From `features/chat/index.js`:
- ✅ Exports `useSendMessage` (original)
- ❌ Doesn't export `useSendMessage.refactored.js`
- ❌ Doesn't export `useSendMessageComposed.js`
- ❌ Doesn't export `useMessageSending.js`
- ❌ Doesn't export `useMessageUI`, `useMessageTransport`, `useMessageMediation`

**Questions:**
- Why are some hooks exported and others not?
- Should I export new hooks from `index.js`?
- What's the criteria for exporting?

**Impact:** Unclear API surface for the feature.

---

## 🟢 Minor Confusion: Backend vs Frontend Analysis

### Problem: Unclear Where Message Analysis Happens

Looking at `useSendMessage.js`:
- Comment says "backend handles all AI analysis"
- Sends message via WebSocket
- Backend emits `draft_coaching` if intervention needed

But `useMessageMediation.js`:
- Calls `analyzeMessage` function
- Does frontend validation
- Has error handling logic

**Questions:**
- Does analysis happen on frontend or backend?
- Why does `useMessageMediation` exist if backend handles it?
- Are there two analysis paths?

**Impact:** Unclear where to add new validation logic.

---

## 📋 Recommendations

### Immediate Actions Needed:

1. **Consolidate useSendMessage implementations**
   - Decide which version is canonical
   - Remove or clearly mark deprecated versions
   - Update exports in `index.js`

2. **Clarify Services vs Hooks pattern**
   - Document which pattern to use for new features
   - Update refactoring guide to match reality
   - Or complete migration to one pattern

3. **Standardize file organization**
   - Document when to use `model/` vs `hooks/`
   - Create clear directory structure guidelines
   - Move files to match the pattern

4. **Update documentation**
   - Mark deprecated code clearly
   - Update refactoring guide to match implementation
   - Add migration status to README

5. **Add architecture decision records**
   - Document why multiple implementations exist
   - Explain the migration plan
   - Clarify the end state

### Quick Wins:

- Add comments to deprecated files: `// DEPRECATED: Use useSendMessageComposed instead`
- Update `index.js` exports to only export canonical version
- Add a `MIGRATION_STATUS.md` file explaining current state
- Create a `HOOKS_GUIDE.md` explaining when to use which hook

---

## Summary

The main confusion comes from:
1. **Multiple implementations** without clear guidance on which to use
2. **Documentation mismatch** with actual code
3. **Unclear migration status** - can't tell what's old vs new
4. **Inconsistent patterns** - services vs hooks, model vs hooks directories

These issues make it hard to:
- Understand the codebase architecture
- Know which code to modify
- Follow existing patterns for new features
- Trust that documentation is accurate

**Estimated onboarding time impact:** +2-3 days to understand these patterns vs. a clean codebase.

