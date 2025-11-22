# GA4 Advanced Features - Quick Start Guide

**Status:** ✅ Code Implementation Complete | ⏳ GA4 UI Configuration Pending

---

## ✅ What's Already Done (Code)

All code implementation is **100% complete**:

- ✅ User properties tracking (sets on login, updates when co-parent connects)
- ✅ User ID tracking (privacy-compliant)
- ✅ Error tracking (API errors, WebSocket errors, global errors)
- ✅ Performance monitoring (page load, API response times)
- ✅ Custom dimensions support (ready for GA4 UI configuration)
- ✅ Enhanced event tracking

**All tracking is active and sending data to Google Analytics!**

---

## 🚀 Next Steps: GA4 UI Configuration

These are **manual steps** in Google Analytics that take ~2-3 hours total.

### Step 1: Mark Events as Conversions (15 min) ⭐ START HERE

**Why:** Track your most important user actions as conversions.

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property: **G-LXL84X75FM**
3. Navigate to **Admin** → **Data Streams** → Click your stream
4. Click **Events** tab
5. Find these events and toggle "Mark as conversion":
   - ✅ `sign_up`
   - ✅ `message_sent`
   - ✅ `task_completed`
   - ✅ `rewrite_used`
   - ✅ `contact_added`

**Done when:** All 5 events show "Conversion" badge

---

### Step 2: Create Custom Dimensions (30 min)

**Why:** Segment data by user characteristics and behavior.

1. Go to **Admin** → **Custom Definitions** → **Custom Dimensions**
2. Click **Create custom dimension** for each:

#### User-Scoped Dimensions:
- **Name:** `user_type`
  - Scope: User
  - Description: User engagement level (new_user, returning_user, active_user)
  
- **Name:** `has_coparent`
  - Scope: User
  - Description: Whether user has co-parent connected (true/false)

#### Event-Scoped Dimensions:
- **Name:** `intervention_type`
  - Scope: Event
  - Description: Type of AI intervention (tone, clarity, safety, legal, other)
  
- **Name:** `task_priority`
  - Scope: Event
  - Description: Task priority level (low, medium, high, urgent)

**Done when:** 4 custom dimensions created

**Note:** It may take 24-48 hours for data to populate in custom dimensions.

---

### Step 3: Create Audiences (1 hour)

**Why:** Build reusable user segments for analysis.

1. Go to **Admin** → **Audiences**
2. Click **New Audience** → **Create a custom audience**

Create these 5 audiences:

#### 1. High-Value Users
- **Condition:** 
  - `message_sent` events > 50
  - AND `task_completed` > 10
- **Use:** Identify power users

#### 2. AI Feature Adopters
- **Condition:** 
  - `rewrite_used` events > 5
- **Use:** Target users who engage with AI features

#### 3. At-Risk Users
- **Condition:** 
  - Last `message_sent` > 30 days ago
- **Use:** Re-engagement campaigns

#### 4. New Users (First 7 Days)
- **Condition:** 
  - `days_since_signup` < 7
- **Use:** Onboarding optimization

#### 5. Co-Parent Connected
- **Condition:** 
  - `has_coparent` = true
- **Use:** Compare multi-user vs single-user behavior

**Done when:** 5 audiences created (may take 24-48 hours to populate)

---

### Step 4: Set Up Alerts (30 min)

**Why:** Get notified of important changes.

1. Go to **Admin** → **Custom Alerts**
2. Click **Create Alert**

Create these 4 alerts:

#### 1. Conversion Rate Drop
- **Condition:** Conversion rate drops > 20% vs previous week
- **Notification:** Email

#### 2. Error Spike
- **Condition:** Exception events > 10 in 1 hour
- **Notification:** Email

#### 3. Traffic Drop
- **Condition:** Sessions drop > 30% vs previous day
- **Notification:** Email

#### 4. New User Signups
- **Condition:** `sign_up` events > 5 in 1 hour
- **Notification:** Email (good news!)

**Done when:** 4 alerts configured

---

### Step 5: Create Conversion Funnel (30 min)

**Why:** See where users drop off in their journey.

1. Go to **Explore** → **Funnel exploration**
2. Click **Blank** → **Funnel exploration**
3. Add these steps:

**Funnel Steps:**
1. `section_view` (hero) - Landing page viewed
2. `cta_click` (hero) - CTA clicked
3. `sign_up` - User signed up
4. `message_sent` - First message sent
5. `contact_added` - Co-parent connected

4. Save as "User Onboarding Funnel"

**Done when:** Funnel created and showing data

---

### Step 6: Set Up DebugView (15 min)

**Why:** Test and verify tracking in real-time.

**Option 1: Chrome Extension (Recommended)**
1. Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension
2. Enable it
3. Go to **Admin** → **DebugView** in GA4
4. See events in real-time

**Option 2: Code Debug Mode**
Already implemented! Just check browser console for analytics logs.

**Done when:** Can see events in DebugView

---

### Step 7: Create Custom Report (30 min)

**Why:** Build focused views of important metrics.

1. Go to **Explore** → **Blank**
2. Create "User Engagement Dashboard":

**Dimensions:**
- User type
- Days since signup
- Has co-parent

**Metrics:**
- Messages sent
- Sessions
- Average session duration
- Feature usage

3. Save as "User Engagement Dashboard"

**Done when:** Report created and showing data

---

## ✅ Verification Checklist

After completing all steps, verify:

- [ ] 5 events marked as conversions
- [ ] 4 custom dimensions created
- [ ] 5 audiences created (may take 24-48h to populate)
- [ ] 4 alerts configured
- [ ] Conversion funnel created
- [ ] DebugView accessible
- [ ] Custom report created

---

## 🧪 Testing

### Test Code Implementation:

1. **Open browser console** (F12)
2. **Login** - Should see:
   - `Analytics: User ID set`
   - `Analytics: User properties set`
3. **Send a message** - Should see:
   - `Analytics: Message sent`
4. **Check for errors** - Should see:
   - `Analytics: API error tracked` (if any errors occur)
5. **Check performance** - Should see:
   - `Analytics: Page performance tracked`

### Test GA4 UI:

1. **Go to GA4 Realtime** - Should see events appearing
2. **Check DebugView** - Should see all events with parameters
3. **Check Custom Dimensions** - Should see data after 24-48h
4. **Check Audiences** - Should populate after 24-48h

---

## 📊 Expected Results

### After 24-48 Hours:

- Custom dimensions will show data
- Audiences will populate
- Conversion funnels will show drop-off points
- Custom reports will display metrics

### Immediate Results:

- Events appear in Realtime
- DebugView shows all events
- Alerts trigger (if conditions met)
- Conversions tracked

---

## 🆘 Troubleshooting

### Events Not Showing in GA4:
- ✅ Check browser console for analytics logs
- ✅ Verify `VITE_GA_MEASUREMENT_ID` is set in `.env`
- ✅ Check ad blockers (they may block GA)
- ✅ Wait 24-48 hours for standard reports (Realtime shows immediately)

### Custom Dimensions Not Populating:
- ✅ Wait 24-48 hours (normal delay)
- ✅ Verify dimension names match exactly
- ✅ Check that events are firing with dimension values

### Audiences Not Populating:
- ✅ Wait 24-48 hours (normal delay)
- ✅ Verify audience conditions are correct
- ✅ Check that user properties are being set

---

## 📚 Resources

- [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Custom Dimensions Guide](https://support.google.com/analytics/answer/10075209)
- [Audiences Guide](https://support.google.com/analytics/answer/9267572)
- [Implementation Plan](./plan.md) - Full technical details

---

## 🎯 Priority Order

**Do First (High Impact, Low Effort):**
1. ✅ Mark events as conversions (15 min)
2. ✅ Set up DebugView (15 min)
3. ✅ Create conversion funnel (30 min)

**Do Next (Medium Impact, Medium Effort):**
4. ✅ Create custom dimensions (30 min)
5. ✅ Create audiences (1 hour)
6. ✅ Set up alerts (30 min)

**Do Last (Nice to Have):**
7. ✅ Create custom report (30 min)

---

**Total Time:** ~2-3 hours  
**Status:** Ready to start! Begin with Step 1.

