# GA4 Advanced Features Implementation Plan

**Project:** LiaiZen Co-Parenting Platform (coparentliaizen.com)  
**Date:** January 2025  
**Estimated Effort:** 12-16 hours (~2 days)  
**Priority:** 🟡 HIGH - Enhanced analytics for data-driven decisions

---

## 📋 Table of Contents

1. [Technical Context from MCP](#technical-context-from-mcp)
2. [Requirements Analysis](#requirements-analysis)
3. [Implementation Phases](#implementation-phases)
4. [File Changes Required](#file-changes-required)
5. [Design System Compliance](#design-system-compliance)
6. [Validation Checklist](#validation-checklist)

---

## 📊 Technical Context from MCP

### Architecture (from Codebase Context MCP)

**Frontend:**
- **Path**: `chat-client-vite/`
- **Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS v4
- **Language**: JavaScript (JSX)
- **Port**: 5173 (dev)
- **Deployment**: Vercel (coparentliaizen.com)

**Component Organization** (from Codebase Context MCP):
```
chat-client-vite/src/
├── components/              # React components
│   ├── modals/             # Modal components
│   └── *.jsx               # Page/feature components
├── hooks/                  # Custom React hooks
│   ├── useAuth.js          # Authentication hook
│   ├── useChat.js          # Chat functionality
│   ├── useTasks.js         # Task management
│   └── useContacts.js      # Contact management
├── utils/                  # Utility functions
│   ├── analytics.js        # Existing analytics (✅ already implemented)
│   └── analyticsEnhancements.js  # New enhancement functions (✅ already created)
├── apiClient.js            # API client
├── config.js               # Configuration
├── ChatRoom.jsx            # Main app container
└── main.jsx                # App entry point
```

**Backend:**
- **Path**: `chat-server/`
- **Framework**: Node.js 18+ with Express.js
- **Database**: SQLite (with PostgreSQL migration path)
- **Real-time**: Socket.io
- **Deployment**: Railway

### Design System (from Design Tokens MCP)

**Colors** (`.design-tokens-mcp/tokens.json`):
- Primary: `#275559` (teal-dark)
- Secondary: `#4DA8B0` (teal-medium)
- Background: `#FFFFFF` (white)
- Text: `#111827` (gray-900)

**Spacing** (from Design Tokens MCP):
- Base unit: 8px (0.5rem)
- Standard scale: xs (4px), sm (8px), md (16px), lg (24px), xl (32px), 2xl (48px), 3xl (64px)

**Patterns** (from Codebase Context MCP):
- Components: Functional components with hooks
- Exports: Named exports preferred
- Modals: Fixed overlay with centered modal, z-index 100
- Navigation: Desktop top sticky (40px), mobile bottom fixed (48px)

### Existing Analytics Setup

**Current Files:**
- ✅ `chat-client-vite/src/utils/analytics.js` - Core tracking functions (395 lines)
- ✅ `chat-client-vite/src/utils/analyticsEnhancements.js` - Enhanced functions (232 lines)
- ✅ `chat-client-vite/src/ChatRoom.jsx` - Integrated tracking for chat events
- ✅ `chat-client-vite/src/components/LandingPage.jsx` - Landing page tracking

**Current Tracking:**
- Landing page events (CTA clicks, section views, conversions)
- Chat room events (messages, AI interventions, tasks, contacts)
- Navigation tracking
- Form submissions

---

## 🎯 Requirements Analysis

### Feature Requirements (from GA4_ADVANCED_SETUP.md)

**Phase 1 - Immediate (High Impact):**
1. Mark key events as conversions in GA4 UI
2. Create conversion funnels
3. Set up DebugView
4. Create basic custom reports

**Phase 2 - Short-term (Medium Impact):**
5. Set user properties on login/profile update
6. Create audiences (user segments)
7. Add custom dimensions (code + GA4 UI)
8. Set up alerts

**Phase 3 - Long-term (Advanced):**
9. User ID tracking
10. Error tracking integration
11. Performance monitoring
12. Data Studio dashboards

### Implementation Scope

**Code Changes Required:**
- Integrate user properties tracking
- Add User ID tracking
- Integrate error tracking
- Add performance monitoring
- Enhance existing events with custom dimensions

**GA4 UI Configuration:**
- Mark events as conversions
- Create custom dimensions
- Create audiences
- Set up alerts
- Configure DebugView

**No Design Changes Required:**
- All tracking is invisible to users
- No UI components needed
- No design tokens needed (backend tracking only)

---

## 🚀 Implementation Phases

### Phase 1: Foundation & Conversions (2-3 hours)

#### Step 1.1: Mark Events as Conversions (GA4 UI - 15 min)
**Location**: Google Analytics Admin Panel
- Navigate to **Admin** → **Data Streams** → Select stream → **Events**
- Mark as conversions:
  - ✅ `sign_up`
  - ✅ `message_sent` (first message = engagement milestone)
  - ✅ `task_completed`
  - ✅ `rewrite_used` (AI feature adoption)
  - ✅ `contact_added`

**Deliverable**: 5 events marked as conversions

#### Step 1.2: Create Conversion Funnel (GA4 UI - 30 min)
**Location**: Google Analytics Explore → Funnel exploration
- Create funnel: Landing → Sign-up → First Message → Co-parent Connected
- Steps:
  1. `section_view` (hero)
  2. `cta_click` (hero)
  3. `sign_up`
  4. `message_sent` (first message)
  5. `contact_added` (co-parent connected)

**Deliverable**: Conversion funnel report

#### Step 1.3: Set Up DebugView (GA4 UI - 15 min)
**Location**: Google Analytics Admin → DebugView
- Install Google Analytics Debugger Chrome extension
- Or add debug mode to code (see Step 2.3)

**Deliverable**: DebugView accessible for testing

#### Step 1.4: Create Basic Custom Report (GA4 UI - 30 min)
**Location**: Google Analytics Explore → Blank
- **User Engagement Dashboard**:
  - Metrics: Messages sent, Sessions, Avg session duration
  - Dimensions: User type, Days since signup
  - Visualization: Table + Line chart

**Deliverable**: Custom report saved

---

### Phase 2: User Properties & Segments (4-5 hours)

#### Step 2.1: Integrate User Properties Tracking (Code - 1 hour)

**File**: `chat-client-vite/src/hooks/useAuth.js`
**Pattern**: Per Codebase Context MCP, hooks are in `hooks/` directory
**Implementation**:
- Import `setUserProperties` from `utils/analyticsEnhancements.js`
- Call on successful login/signup
- Set properties: engagement_level, days_since_signup, has_coparent_connected

**Code Location**: After successful authentication
```javascript
// After login/signup success
import { setUserProperties } from '../utils/analyticsEnhancements.js';

// Calculate user properties
const userProperties = {
  engagement_level: calculateEngagementLevel(user),
  days_since_signup: calculateDaysSinceSignup(user.created_at),
  has_coparent_connected: hasCoParent,
  features_used: getFeaturesUsed(user),
};
setUserProperties(userProperties);
```

**Files to Modify**:
- `chat-client-vite/src/hooks/useAuth.js` - Add user properties on login
- `chat-client-vite/src/ChatRoom.jsx` - Update user properties when co-parent connects

**Deliverable**: User properties set on login and profile updates

#### Step 2.2: Add User ID Tracking (Code - 30 min)

**File**: `chat-client-vite/src/hooks/useAuth.js`
**Implementation**:
- Import `setUserID` from `utils/analyticsEnhancements.js`
- Call on successful login with username/user ID
- Ensure privacy compliance (only if user consents)

**Code Location**: After successful authentication
```javascript
import { setUserID } from '../utils/analyticsEnhancements.js';

// After login success
if (user && user.username) {
  setUserID(user.username); // or user.id if available
}
```

**Files to Modify**:
- `chat-client-vite/src/hooks/useAuth.js` - Set User ID on login

**Deliverable**: User ID tracking enabled

#### Step 2.3: Create Custom Dimensions (GA4 UI + Code - 1 hour)

**GA4 UI Configuration** (30 min):
1. Go to **Admin** → **Custom Definitions** → **Custom Dimensions**
2. Create dimensions:
   - `user_type` (User-scoped): new_user, returning_user, active_user, inactive_user
   - `has_coparent` (User-scoped): true, false
   - `intervention_type` (Event-scoped): tone, clarity, safety, legal, other
   - `task_priority` (Event-scoped): low, medium, high, urgent

**Code Integration** (30 min):
- Update existing tracking calls to include custom dimensions
- Modify `trackAIIntervention` to send `intervention_type` dimension
- Modify `trackTaskCreated` to send `task_priority` dimension

**Files to Modify**:
- `chat-client-vite/src/utils/analytics.js` - Add dimension parameters
- `chat-client-vite/src/ChatRoom.jsx` - Pass dimensions in tracking calls

**Deliverable**: 4 custom dimensions created and integrated

#### Step 2.4: Create Audiences (GA4 UI - 1 hour)

**Location**: Google Analytics Admin → Audiences
**Create Audiences**:
1. **High-Value Users**
   - Condition: `message_sent` events > 50 AND `task_completed` > 10
2. **AI Feature Adopters**
   - Condition: `rewrite_used` events > 5
3. **At-Risk Users**
   - Condition: Last `message_sent` > 30 days ago
4. **New Users (First 7 Days)**
   - Condition: `days_since_signup` < 7
5. **Co-Parent Connected**
   - Condition: `has_coparent` = true

**Deliverable**: 5 audiences created

#### Step 2.5: Set Up Alerts (GA4 UI - 30 min)

**Location**: Google Analytics Admin → Custom Alerts
**Create Alerts**:
1. **Conversion Rate Drop**
   - Condition: Conversion rate drops > 20% vs previous week
2. **Error Spike**
   - Condition: Exception events > 10 in 1 hour
3. **Traffic Drop**
   - Condition: Sessions drop > 30% vs previous day
4. **New User Signups**
   - Condition: `sign_up` events > 5 in 1 hour

**Deliverable**: 4 alerts configured

---

### Phase 3: Error Tracking & Performance (3-4 hours)

#### Step 3.1: Integrate Error Tracking (Code - 1.5 hours)

**File**: `chat-client-vite/src/utils/errorHandler.js` (NEW)
**Pattern**: Per Codebase Context MCP, utilities in `utils/` directory
**Implementation**:
- Create global error handler
- Wrap API calls with error tracking
- Track WebSocket connection errors

**Files to Create**:
- `chat-client-vite/src/utils/errorHandler.js` - Global error handler

**Files to Modify**:
- `chat-client-vite/src/apiClient.js` - Add error tracking to API calls
- `chat-client-vite/src/hooks/useChat.js` - Track WebSocket errors
- `chat-client-vite/src/main.jsx` - Add global error boundary

**Code Example**:
```javascript
// In apiClient.js
import { trackAPIError } from './utils/analyticsEnhancements.js';

try {
  const response = await fetch(url, options);
  if (!response.ok) {
    trackAPIError(endpoint, response.status, response.statusText);
  }
} catch (error) {
  trackAPIError(endpoint, 0, error.message);
  throw error;
}
```

**Deliverable**: Error tracking integrated across app

#### Step 3.2: Add Performance Monitoring (Code - 1 hour)

**File**: `chat-client-vite/src/main.jsx`
**Implementation**:
- Track page load performance on app initialization
- Track API response times in apiClient
- Track component render times (optional, advanced)

**Files to Modify**:
- `chat-client-vite/src/main.jsx` - Add page load tracking
- `chat-client-vite/src/apiClient.js` - Add API response time tracking

**Code Example**:
```javascript
// In main.jsx
import { trackPagePerformance } from './utils/analyticsEnhancements.js';

// After app mounts
React.useEffect(() => {
  trackPagePerformance();
}, []);

// In apiClient.js
import { trackAPIResponseTime } from './utils/analyticsEnhancements.js';

const startTime = performance.now();
const response = await fetch(url, options);
const duration = performance.now() - startTime;
trackAPIResponseTime(endpoint, duration);
```

**Deliverable**: Performance tracking active

#### Step 3.3: Enhanced Event Tracking (Code - 1 hour)

**Files to Modify**:
- `chat-client-vite/src/ChatRoom.jsx` - Use enhanced tracking functions
- `chat-client-vite/src/utils/analytics.js` - Update to include custom dimensions

**Implementation**:
- Replace `trackMessageSent` with `trackMessageSentEnhanced` where applicable
- Add engagement milestone tracking
- Track feature discovery

**Code Example**:
```javascript
// In ChatRoom.jsx
import { trackMessageSentEnhanced, trackEngagementMilestone } from './utils/analyticsEnhancements.js';

// Track first message milestone
if (isFirstMessage) {
  trackEngagementMilestone('first_message', 1);
}

// Enhanced message tracking
trackMessageSentEnhanced(messageLength, isPreApprovedRewrite, {
  has_attachment: false,
  message_type: 'text',
  thread_id: threadId,
});
```

**Deliverable**: Enhanced tracking with custom dimensions

---

### Phase 4: Documentation & Testing (1-2 hours)

#### Step 4.1: Update Documentation (30 min)

**Files to Update**:
- `ANALYTICS_STATUS.md` - Add new tracking capabilities
- `CHAT_TRACKING_ADDED.md` - Update with new features
- Create `GA4_IMPLEMENTATION_STATUS.md` - Track implementation progress

**Deliverable**: Documentation updated

#### Step 4.2: Testing & Validation (1 hour)

**Test Checklist**:
- [ ] User properties set on login
- [ ] User ID tracking works
- [ ] Error tracking captures API errors
- [ ] Performance tracking logs page load times
- [ ] Custom dimensions appear in GA4
- [ ] Audiences populate correctly
- [ ] Alerts trigger appropriately
- [ ] DebugView shows all events

**Files to Test**:
- All modified files in Phases 1-3
- GA4 UI configurations

**Deliverable**: All features tested and validated

---

## 📁 File Changes Required

### Files to Create

1. **`chat-client-vite/src/utils/errorHandler.js`** (NEW)
   - Global error handler
   - Integrates with analytics error tracking
   - ~100 lines

### Files to Modify

1. **`chat-client-vite/src/hooks/useAuth.js`**
   - Add user properties tracking on login
   - Add User ID tracking
   - ~20 lines added

2. **`chat-client-vite/src/ChatRoom.jsx`**
   - Update user properties when co-parent connects
   - Use enhanced tracking functions
   - ~30 lines modified

3. **`chat-client-vite/src/utils/analytics.js`**
   - Add custom dimension parameters to existing functions
   - ~50 lines modified

4. **`chat-client-vite/src/apiClient.js`**
   - Add error tracking to API calls
   - Add performance tracking
   - ~40 lines added

5. **`chat-client-vite/src/hooks/useChat.js`**
   - Add WebSocket error tracking
   - ~20 lines added

6. **`chat-client-vite/src/main.jsx`**
   - Add page load performance tracking
   - Add global error boundary
   - ~30 lines added

### Documentation Files to Update

1. **`ANALYTICS_STATUS.md`**
   - Add new tracking capabilities section
   - Update current status

2. **`CHAT_TRACKING_ADDED.md`**
   - Add Phase 2-3 features

3. **`GA4_IMPLEMENTATION_STATUS.md`** (NEW)
   - Track implementation progress
   - Checklist of completed items

---

## 🎨 Design System Compliance

### No Design Changes Required

**Rationale**: All analytics tracking is:
- ✅ Backend/invisible to users
- ✅ No UI components needed
- ✅ No visual design changes
- ✅ No design tokens needed

**Compliance Notes**:
- ✅ Follows Codebase Context MCP patterns (utilities in `utils/`, hooks in `hooks/`)
- ✅ Uses existing file structure
- ✅ No new components needed
- ✅ No design system violations (no UI changes)

---

## ✅ Validation Checklist

### Code Quality
- [ ] All functions follow existing patterns from Codebase Context MCP
- [ ] Named exports used (per Codebase Context MCP)
- [ ] Error handling implemented
- [ ] No console errors in browser
- [ ] TypeScript/ESLint passes (if configured)

### Analytics Implementation
- [ ] User properties set on login
- [ ] User ID tracking enabled
- [ ] Error tracking captures all error types
- [ ] Performance tracking logs metrics
- [ ] Custom dimensions appear in GA4
- [ ] Events marked as conversions in GA4
- [ ] Audiences populate correctly
- [ ] Alerts configured and tested

### Testing
- [ ] Test login flow - verify user properties set
- [ ] Test error scenarios - verify error tracking
- [ ] Test performance - verify page load tracking
- [ ] Test in DebugView - verify all events fire
- [ ] Test in GA4 Realtime - verify events appear
- [ ] Test custom dimensions - verify data appears
- [ ] Test audiences - verify segments populate

### Documentation
- [ ] ANALYTICS_STATUS.md updated
- [ ] CHAT_TRACKING_ADDED.md updated
- [ ] GA4_IMPLEMENTATION_STATUS.md created
- [ ] Code comments added where needed

### Privacy & Compliance
- [ ] User ID only set with consent
- [ ] No PII tracked
- [ ] Error stack traces truncated (500 chars)
- [ ] Privacy policy updated (if needed)

---

## 📊 Success Criteria

### Phase 1 Complete When:
- ✅ 5 events marked as conversions in GA4
- ✅ Conversion funnel created and visible
- ✅ DebugView accessible
- ✅ Custom report created

### Phase 2 Complete When:
- ✅ User properties set on login (visible in GA4)
- ✅ User ID tracking enabled
- ✅ 4 custom dimensions created and populated
- ✅ 5 audiences created
- ✅ 4 alerts configured

### Phase 3 Complete When:
- ✅ Error tracking captures API errors
- ✅ Performance tracking logs page load times
- ✅ Enhanced events include custom dimensions

### Overall Success:
- ✅ All tracking data visible in GA4
- ✅ Custom reports show meaningful insights
- ✅ Alerts notify of important changes
- ✅ No performance degradation
- ✅ No user-facing errors

---

## 🚀 Quick Start Guide

### Immediate Actions (Today):
1. **Mark conversions** (15 min) - GA4 UI
2. **Create funnel** (30 min) - GA4 UI
3. **Set up DebugView** (15 min) - GA4 UI

### This Week:
4. **Integrate user properties** (1 hour) - Code
5. **Add User ID tracking** (30 min) - Code
6. **Create custom dimensions** (1 hour) - GA4 UI + Code

### Next Week:
7. **Error tracking** (1.5 hours) - Code
8. **Performance monitoring** (1 hour) - Code
9. **Create audiences** (1 hour) - GA4 UI
10. **Set up alerts** (30 min) - GA4 UI

---

## 📝 Notes

### Dependencies
- ✅ `analyticsEnhancements.js` already created
- ✅ `analytics.js` already has base functions
- ✅ No new npm packages needed
- ✅ No backend changes required

### Risks & Mitigation
- **Risk**: User ID tracking may require privacy policy update
  - **Mitigation**: Only enable if privacy-compliant, make optional
- **Risk**: Error tracking may capture sensitive data
  - **Mitigation**: Truncate stack traces, sanitize error messages
- **Risk**: Performance tracking may impact performance
  - **Mitigation**: Use async tracking, minimal overhead

### Future Enhancements
- Data Studio/Looker Studio dashboards
- Advanced attribution models
- Cohort analysis
- A/B testing integration

---

**Status**: 📋 Ready for Implementation  
**Next Step**: Begin Phase 1 - Mark events as conversions in GA4 UI

