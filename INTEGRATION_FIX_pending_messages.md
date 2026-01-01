# Integration Fix: Pending Messages State Sync

## Problem Identified

**Critical Issue**: `draftCoachingHandlers` uses legacy setters (`setPendingMessages`, `setMessageStatuses`) while pending messages are now managed by `useMessageUI` hook. This creates a state desync:

1. `useMessageSending` creates pending messages via `useMessageUI`
2. Sync effect updates legacy `setPendingMessages` (one-way sync)
3. Backend sends `draft_coaching` event blocking message
4. `draftCoachingHandlers` removes from legacy `setPendingMessages`
5. But `useMessageUI` still has it internally
6. Sync effect will re-add it on next render!

**Impact**: Blocked messages may reappear in UI after being removed.

## Solution

Pass `removePendingMessage` from `useMessageSending` to handlers so they can properly remove pending messages from `useMessageUI` state.

## Implementation Plan

1. Expose `removePendingMessage` from `useMessageSending` (already done)
2. Pass it through `ChatContext` to `useChatSocket`
3. Add to handlers object passed to `setupSocketEventHandlers`
4. Update `draftCoachingHandlers` to use `removePendingMessage` instead of legacy setters
5. Update `messageHandlers` to use `markMessageSent` instead of legacy setters

## Benefits

- ✅ Proper state management through `useMessageUI`
- ✅ No state desync issues
- ✅ Single source of truth for pending messages
- ✅ Cleaner architecture

