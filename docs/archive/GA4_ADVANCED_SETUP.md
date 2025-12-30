# Google Analytics 4 Advanced Setup Guide

## 🎯 Overview

This guide covers advanced GA4 configurations that will provide deeper insights into user behavior, conversion optimization, and product performance for LiaiZen.

---

## 1. ✅ Mark Key Events as Conversions

**Why**: Track your most important user actions as conversions to measure success.

### Steps:

1. Go to **Admin** → **Data Streams** → Select your stream
2. Click **Events** tab
3. Toggle "Mark as conversion" for these events:

**Recommended Conversions:**

- ✅ `sign_up` - User registration
- ✅ `conversion` - General conversions (already tracked)
- ✅ `message_sent` - First message sent (engagement milestone)
- ✅ `task_completed` - Task completion (productivity metric)
- ✅ `contact_added` - Contact added (engagement metric)
- ✅ `rewrite_used` - AI rewrite accepted (AI feature adoption)

### How to Set Up:

1. Find each event in the Events list
2. Toggle the switch to mark as conversion
3. Optionally add a value (e.g., `message_sent` = $1 engagement value)

**Impact**: You'll see conversion rates, conversion funnels, and can optimize for these key actions.

---

## 2. 📊 Create Custom Dimensions

**Why**: Segment data by user characteristics, behavior, or app state.

### Recommended Custom Dimensions:

#### User-Scoped Dimensions:

1. **User Type** (`user_type`)
   - Values: `new_user`, `returning_user`, `active_user`, `inactive_user`
   - Use: Segment users by engagement level

2. **Account Status** (`account_status`)
   - Values: `trial`, `beta`, `active`, `inactive`
   - Use: Track user lifecycle stages

3. **Has Co-Parent** (`has_coparent`)
   - Values: `true`, `false`
   - Use: Compare behavior of users with/without co-parent connected

4. **Room Status** (`room_status`)
   - Values: `single_user`, `multi_user`, `active_room`
   - Use: Understand multi-user vs single-user behavior

#### Event-Scoped Dimensions:

5. **Message Sentiment** (`message_sentiment`)
   - Values: `positive`, `neutral`, `negative`, `flagged`
   - Use: Track communication quality

6. **AI Intervention Type** (`intervention_type`)
   - Values: `tone`, `clarity`, `safety`, `legal`, `other`
   - Use: Understand which interventions are most common

7. **Task Priority** (`task_priority`)
   - Values: `low`, `medium`, `high`, `urgent`
   - Use: Analyze task management patterns

### How to Set Up:

1. Go to **Admin** → **Custom Definitions** → **Custom Dimensions**
2. Click **Create custom dimension**
3. Choose scope (User or Event)
4. Enter dimension name and description
5. Save

**Note**: You'll need to update your tracking code to send these dimensions. See "Implementation" section below.

---

## 3. 👤 Set User Properties

**Why**: Track user characteristics that persist across sessions.

### Recommended User Properties:

1. **User Engagement Level**

   ```javascript
   window.gtag('set', 'user_properties', {
     engagement_level: 'high', // high, medium, low
     days_since_signup: 30,
     total_messages: 150,
     has_completed_onboarding: true,
   });
   ```

2. **Product Usage**

   ```javascript
   window.gtag('set', 'user_properties', {
     features_used: ['chat', 'tasks', 'contacts'],
     ai_interventions_accepted: 5,
     tasks_completed: 12,
     contacts_count: 3,
   });
   ```

3. **Relationship Status**
   ```javascript
   window.gtag('set', 'user_properties', {
     has_coparent_connected: true,
     room_member_count: 2,
     relationship_duration_days: 180,
   });
   ```

### How to Set Up:

Add to your analytics code when user logs in or profile updates:

```javascript
// In your login/authentication handler
export function setUserProperties(properties) {
  if (!window.gtag) return;

  window.gtag('set', 'user_properties', properties);
}
```

---

## 4. 🎯 Create Audiences (User Segments)

**Why**: Build reusable user segments for analysis and remarketing.

### Recommended Audiences:

1. **High-Value Users**
   - Condition: `message_sent` events > 50 AND `task_completed` > 10
   - Use: Identify power users for case studies

2. **AI Feature Adopters**
   - Condition: `rewrite_used` events > 5
   - Use: Target users who engage with AI features

3. **At-Risk Users**
   - Condition: Last `message_sent` > 30 days ago
   - Use: Re-engagement campaigns

4. **New Users (First 7 Days)**
   - Condition: `days_since_signup` < 7
   - Use: Onboarding optimization

5. **Co-Parent Connected**
   - Condition: `has_coparent` = true
   - Use: Compare multi-user vs single-user behavior

6. **Task Managers**
   - Condition: `task_created` > 5
   - Use: Feature usage analysis

### How to Set Up:

1. Go to **Admin** → **Audiences**
2. Click **New Audience**
3. Choose **Create a custom audience**
4. Define conditions using events and user properties
5. Save

**Impact**: You can analyze these segments separately, create custom reports, and use for remarketing (if you add Google Ads).

---

## 5. 📈 Create Custom Reports & Dashboards

**Why**: Build focused views of your most important metrics.

### Recommended Reports:

#### 1. **User Engagement Dashboard**

**Metrics:**

- Messages sent per user
- Sessions per user
- Average session duration
- Feature usage (chat, tasks, contacts)

**Dimensions:**

- User type (new vs returning)
- Days since signup
- Has co-parent connected

#### 2. **AI Feature Performance**

**Metrics:**

- AI interventions triggered
- Rewrite acceptance rate
- Intervention override rate
- Most common intervention types

**Dimensions:**

- Intervention type
- Risk level
- User engagement level

#### 3. **Conversion Funnel**

**Steps:**

1. Landing page view
2. CTA click
3. Sign-up
4. First message sent
5. Co-parent connected
6. Task created
7. Task completed

**Use**: Identify drop-off points in user journey

#### 4. **Task Management Analytics**

**Metrics:**

- Tasks created
- Tasks completed
- Completion rate by priority
- Average time to complete

**Dimensions:**

- Task type
- Priority
- User segment

### How to Set Up:

1. Go to **Explore** → **Blank** (or use template)
2. Add dimensions and metrics
3. Configure visualization
4. Save as report
5. Add to dashboard

---

## 6. 🔍 Enhanced Measurement

**Why**: Automatically track common web interactions.

### Enable in GA4:

1. Go to **Admin** → **Data Streams** → Select stream
2. Click **Enhanced measurement**
3. Enable:
   - ✅ **Scrolls** - Track scroll depth (already have custom, but this is automatic)
   - ✅ **Outbound clicks** - Track external link clicks
   - ✅ **Site search** - Track search queries (if you add search)
   - ✅ **Video engagement** - Track video plays (if you add videos)
   - ✅ **File downloads** - Track PDF/document downloads

**Impact**: Automatic tracking without code changes.

---

## 7. 🐛 Set Up DebugView

**Why**: Test and verify tracking in real-time during development.

### How to Set Up:

1. Install **Google Analytics Debugger** Chrome extension
2. Or add debug mode to your code:
   ```javascript
   gtag('config', GA_MEASUREMENT_ID, {
     debug_mode: true,
   });
   ```
3. Go to **Admin** → **DebugView**
4. See events in real-time with full parameter details

**Use**: Verify events are firing correctly before deploying.

---

## 8. 🔗 Attribution Settings

**Why**: Understand which touchpoints drive conversions.

### Recommended Settings:

1. Go to **Admin** → **Attribution Settings**
2. Choose **Data-driven attribution** (default)
3. Set lookback windows:
   - Acquisition: 30 days
   - Engagement: 7 days

**Impact**: See which marketing channels, pages, or features drive conversions.

---

## 9. 👥 User ID Tracking

**Why**: Track users across devices and sessions accurately.

### How to Set Up:

1. Go to **Admin** → **Data Streams** → Select stream
2. Enable **User ID**
3. Update your tracking code:
   ```javascript
   // When user logs in
   window.gtag('config', GA_MEASUREMENT_ID, {
     user_id: username, // or user ID from your database
   });
   ```

**Impact**: More accurate user counts, cross-device tracking, better user journey analysis.

**Privacy Note**: Ensure you comply with privacy regulations when using User ID.

---

## 10. ⚠️ Error & Exception Tracking

**Why**: Monitor app errors and issues.

### Recommended Events:

- `exception` - JavaScript errors
- `api_error` - Failed API calls
- `form_error` - Form validation errors
- `connection_error` - WebSocket/connection issues

### Implementation:

Add to your error handlers:

```javascript
export function trackError(error, errorType = 'exception') {
  if (!window.gtag) return;

  window.gtag('event', 'exception', {
    description: error.message,
    fatal: false,
    error_type: errorType,
    error_stack: error.stack?.substring(0, 500), // Truncate for privacy
  });
}
```

---

## 11. ⚡ Performance Monitoring

**Why**: Track page load times and performance metrics.

### Recommended Metrics:

- Page load time
- Time to interactive
- API response time
- Component render time

### Implementation:

```javascript
// Track page load performance
export function trackPagePerformance() {
  if (!window.gtag || !window.performance) return;

  const perfData = window.performance.timing;
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

  window.gtag('event', 'page_load_time', {
    value: Math.round(pageLoadTime),
    event_category: 'performance',
  });
}

// Track API response time
export function trackAPIResponseTime(endpoint, duration) {
  if (!window.gtag) return;

  window.gtag('event', 'api_response_time', {
    endpoint: endpoint,
    duration: duration,
    event_category: 'performance',
  });
}
```

---

## 12. 📱 Enhanced Ecommerce (If Applicable)

**Why**: Track subscription signups, upgrades, or purchases.

### If You Add Paid Plans:

1. Go to **Admin** → **Data Streams** → Select stream
2. Enable **Enhanced ecommerce**
3. Track purchase events:
   ```javascript
   window.gtag('event', 'purchase', {
     transaction_id: 'T12345',
     value: 29.99,
     currency: 'USD',
     items: [
       {
         item_id: 'premium_monthly',
         item_name: 'Premium Monthly',
         price: 29.99,
         quantity: 1,
       },
     ],
   });
   ```

---

## 13. 🔔 Set Up Alerts

**Why**: Get notified of significant changes or issues.

### Recommended Alerts:

1. **Conversion Rate Drop**
   - Condition: Conversion rate drops > 20% vs previous week
   - Notification: Email

2. **Error Spike**
   - Condition: Exception events > 10 in 1 hour
   - Notification: Email

3. **Traffic Drop**
   - Condition: Sessions drop > 30% vs previous day
   - Notification: Email

4. **New User Signups**
   - Condition: `sign_up` events > 5 in 1 hour
   - Notification: Email (good news!)

### How to Set Up:

1. Go to **Admin** → **Custom Alerts**
2. Click **Create Alert**
3. Define condition
4. Set notification method
5. Save

---

## 14. 📊 Data Studio / Looker Studio Integration

**Why**: Create beautiful, shareable dashboards.

### Steps:

1. Go to [Looker Studio](https://lookerstudio.google.com/)
2. Create new report
3. Connect Google Analytics 4 data source
4. Build custom visualizations
5. Share with team

**Benefits**:

- Professional dashboards
- Automated reports
- Easy sharing
- Custom branding

---

## 15. 🎨 Custom Event Parameters

**Why**: Add more context to existing events.

### Enhance Existing Events:

#### `message_sent`:

```javascript
trackMessageSent(messageLength, isPreApprovedRewrite, {
  has_attachment: false,
  message_type: 'text', // text, image, file
  thread_id: threadId || null,
  reply_to: replyToMessageId || null,
});
```

#### `ai_intervention`:

```javascript
trackAIIntervention(interventionType, confidence, riskLevel, {
  message_sentiment: 'negative',
  intervention_category: 'tone',
  user_response: 'accepted', // accepted, overridden, ignored
});
```

#### `task_created`:

```javascript
trackTaskCreated(taskType, priority, {
  assigned_to: 'self', // self, coparent, both
  has_due_date: true,
  related_people_count: 2,
});
```

---

## 🚀 Implementation Priority

### Phase 1 (Immediate - High Impact):

1. ✅ Mark key events as conversions
2. ✅ Create conversion funnels
3. ✅ Set up DebugView
4. ✅ Create basic custom reports

### Phase 2 (Short-term - Medium Impact):

5. ✅ Set user properties
6. ✅ Create audiences
7. ✅ Add custom dimensions
8. ✅ Set up alerts

### Phase 3 (Long-term - Advanced):

9. ✅ User ID tracking
10. ✅ Error tracking
11. ✅ Performance monitoring
12. ✅ Data Studio dashboards

---

## 📝 Quick Implementation Checklist

- [ ] Mark `sign_up`, `message_sent`, `task_completed` as conversions
- [ ] Create "High-Value Users" audience
- [ ] Set user properties on login
- [ ] Create "User Engagement" custom report
- [ ] Set up DebugView for testing
- [ ] Create conversion funnel (landing → signup → first message)
- [ ] Add error tracking
- [ ] Set up alerts for conversion drops
- [ ] Enable User ID tracking (if privacy-compliant)
- [ ] Create Data Studio dashboard

---

## 🔒 Privacy Considerations

- ✅ **User ID**: Only use if you have user consent and privacy policy
- ✅ **PII**: Never send personally identifiable information (names, emails, addresses)
- ✅ **IP Anonymization**: Already enabled by default in GA4
- ✅ **Data Retention**: Set to 14 months (default) or adjust in Admin → Data Settings
- ✅ **Consent Mode**: Consider implementing if required by regulations (GDPR, CCPA)

---

## 📚 Additional Resources

- [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [GA4 Events Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- [Custom Dimensions Guide](https://support.google.com/analytics/answer/10075209)
- [Audiences Guide](https://support.google.com/analytics/answer/9267572)

---

**Next Steps**: Start with Phase 1 items, then gradually implement Phase 2 and 3 based on your analytics needs!
