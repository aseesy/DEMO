# PWA Layout Fix - Horizontal Overflow

## Problem

Messages and content were being cut off on the right side of the screen in the PWA on mobile devices.

## Root Cause

**Flex containers were missing `min-w-0` (min-width: 0)**, causing them to expand beyond the viewport width.

### Technical Explanation

Flex items have a default `min-width: auto`, which means they won't shrink below their content size. When you have nested flex containers, this can cause overflow because:

1. A flex item with `flex: 1` tries to grow to fill available space
2. But if its content is wider than the container, `min-width: auto` prevents it from shrinking
3. This causes the flex item to expand beyond its parent's width
4. Result: horizontal overflow and content being cut off

## Solution

Added `min-w-0` (which sets `min-width: 0`) to all flex containers that need to respect width constraints, along with explicit width/maxWidth constraints.

## Changes Made

### 1. ChatPage.jsx

- Added `min-w-0` to the main flex container (`flex flex-1 min-h-0`)
- Added `min-w-0` to the "Main Chat Area" flex container
- Added explicit `width: '100%'`, `maxWidth: '100%'`, and `overflowX: 'hidden'` to all flex containers

### 2. ChatHeader.jsx

- Added `min-w-0` to the search bar container (`flex-1 relative`)
- Added width constraints to prevent overflow

### 3. MessagesContainer.jsx

- Enhanced text wrapping with `wordBreak: 'break-word'` and `overflowWrap: 'break-word'`
- Added `maxWidth: '100%'` to message text paragraphs

### 4. MessageInput.jsx

- Added width constraints to the input container
- Added `boxSizing: 'border-box'` to ensure padding is included in width calculations

## Testing

Created comprehensive tests in:

- `src/__tests__/pwa-layout.test.js` - Unit tests for layout constraints
- `src/__tests__/pwa-layout-integration.test.jsx` - Integration tests for React components

All 8 tests pass ✅

## Key CSS Rules Applied

```css
/* Critical for flex items to respect width constraints */
.flex-item {
  min-width: 0; /* Allows flex items to shrink below content size */
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box; /* Include padding in width calculations */
}
```

## Prevention

When creating new flex containers, always:

1. Add `min-w-0` to flex items that need to respect width constraints
2. Set explicit `width: '100%'` and `maxWidth: '100%'` on containers
3. Add `overflowX: 'hidden'` to prevent horizontal scrolling
4. Use `box-sizing: 'border-box'` when padding is involved

## Related Files

- `chat-client-vite/src/features/chat/ChatPage.jsx`
- `chat-client-vite/src/features/chat/components/ChatHeader.jsx`
- `chat-client-vite/src/features/chat/components/MessagesContainer.jsx`
- `chat-client-vite/src/features/chat/components/MessageInput.jsx`
- `chat-client-vite/src/__tests__/pwa-layout.test.js`
- `chat-client-vite/src/__tests__/pwa-layout-integration.test.jsx`
