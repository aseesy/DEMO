# Invite Components Analysis

**Date**: 2025-01-07
**Purpose**: Analyze duplication between InviteCoParentPage and InviteTaskModal

## Current State

### InviteCoParentPage (`/invite-coparent` route)

**Location**: `chat-client-vite/src/features/invitations/InviteCoParentPage.jsx`

**Usage**:
- Full page route in App.jsx: `/invite-coparent`
- Used after signup (redirect from useAuthRedirect)
- Standalone page with header/logo
- Navigates to `/dashboard` after code generation
- Navigates to `/chat` after accepting code

**Features**:
- Full-page layout with gradient background
- Logo/header at top
- Pre-fills code from URL params or storage
- Handles navigation (not just closing)

### InviteTaskModal (Modal Component)

**Location**: `chat-client-vite/src/features/invitations/components/InviteTaskModal.jsx`

**Usage**:
- Modal overlay rendered in GlobalModals.jsx
- Used from within app (dashboard banner, task prompts)
- Closes modal after actions (no navigation)
- Called from `setShowInviteModal(true)`

**Features**:
- Modal overlay (no full page layout)
- No navigation - just closes with callbacks
- Resets state when modal closes

## Duplication Analysis

### ✅ Same Logic (Duplicated)
- API call: `/api/invitations/generate-code`
- API call: `/api/invitations/accept-code`
- State management: `generatedCode`, `enteredCode`, `error`, `isLoading`, `copied`
- UI structure: Generate/Enter code sections

### ⚠️ Different Copy Messages (Inconsistency!)

**InviteTaskModal** (line 50):
```javascript
const message = `Simplify co-parenting with me on app.coparentliaizen.com After signing up, enter "${generatedCode}" to connect with me.`;
```

**InviteCoParentPage** (line 54):
```javascript
const message = `Simplify co-parenting with me on app.coparentliaizen.com After signing up, enter "${generatedCode}" to connect with me.`;
```

**BUT** - The user asked about a different message:
```javascript
`I'd like us to use LiaiZen to communicate better as co-parents. Click here to sign up and connect with me: ${inviteLink}`
```

**Issue**: This message was found in the search but appears to be outdated. Both files now use the "Simplify co-parenting" message, but it's still duplicated.

### ✅ Different Behavior (Appropriate)
- **InviteCoParentPage**: Full page, navigates after actions
- **InviteTaskModal**: Modal, closes after actions

## Recommendations

### Option 1: Extract Shared Logic to Hook (Recommended)

1. Create `useInviteCode.js` hook with shared logic
2. Both components use the hook
3. Components only differ in presentation (page vs modal)
4. Single source of truth for API calls and state

**Benefits**:
- Eliminates duplication
- Easier to maintain
- Single place to update copy message
- Consistent behavior

### Option 2: Component Composition

1. Extract shared UI to `InviteCodeForm` component
2. InviteCoParentPage wraps it in full-page layout
3. InviteTaskModal wraps it in Modal component

**Benefits**:
- Shared UI code
- Different layouts for different contexts
- Still need separate components for navigation vs callbacks

### Option 3: Unified Component with Variants

1. Single `InviteCode` component with `variant="page" | "modal"`
2. Renders different layouts based on variant
3. Accepts `onSuccess` and `onClose` callbacks

**Benefits**:
- Single component to maintain
- Clear separation of concerns
- Flexible usage

## Recommended Approach

**Extract to hook + keep separate components:**

1. Create `hooks/useInviteCode.js`:
   - State management
   - API calls
   - Copy message logic
   - Returns state and handlers

2. Update both components:
   - Use the hook
   - Keep their specific presentation/navigation logic
   - Both use same copy message constant

3. Extract copy message to constant:
   - Single source of truth
   - Easy to update

## Copy Message Issue

**Current**: Both use "Simplify co-parenting with me on app.coparentliaizen.com..."

**User asked about**: "I'd like us to use LiaiZen to communicate better as co-parents..."

**Action**: Determine which message is correct, then consolidate.

