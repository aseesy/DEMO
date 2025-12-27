# Push Notification Strategy - LiaiZen

## Current Implementation

### ✅ Custom Web Push (Primary Channel)
**Status**: Fully implemented and branded as LiaiZen

- **Technology**: Web Push API with VAPID keys
- **Branding**: 100% LiaiZen branded (no third-party attribution)
- **Features**:
  - Real-time push notifications for new messages
  - Automatic subscription on login
  - Cross-platform (iOS, Android, Desktop)
  - Fully customizable (icon, title, body, badge)
  - Deep linking to chat

**Implementation Files**:
- `chat-server/services/pushNotificationService.js` - Backend service
- `chat-client-vite/src/hooks/pwa/usePWA.js` - Frontend subscription
- `chat-server/routes/pushNotifications.js` - API endpoints

**Notification Payload**:
```javascript
{
  title: "LiaiZen",  // Fully branded
  body: "You have a new message",
  icon: "/icon-192.png",  // LiaiZen icon
  badge: "/icon-192.png",
  tag: "liaizen-message"
}
```

### ✅ In-App Notifications
**Status**: Implemented via Socket.io + PostgreSQL

- Real-time notifications for invitations, tasks, etc.
- Persistent storage in database
- Socket.io for instant delivery

### ✅ Email Notifications
**Status**: Implemented for invitations

- Used for co-parent invitations
- Email service: `chat-server/emailService.js`
- Templates: `chat-server/emailService/templates.js`

## Third-Party Services

**No third-party push services used** - All push notifications are handled by our custom web-push implementation for full control and branding.

## Additional Channels Evaluation

### 📧 Email Notifications (Recommended)
**Current Status**: Partially implemented (invitations only)

**Recommendation**: Expand to message notifications

**Use Cases**:
- Daily digest of messages (for users who prefer email)
- Important messages (configurable by user)
- Offline notifications (when push fails)
- Backup channel for critical communications

**Implementation Priority**: Medium
- Already have email service infrastructure
- Low cost (Gmail API or SendGrid)
- High deliverability
- User preference option

**Suggested Features**:
- User preference: "Email notifications for messages" (on/off)
- Frequency: Immediate, daily digest, or weekly summary
- Content: Message preview, sender name, link to app

### 📱 SMS Notifications (Not Recommended for MVP)
**Current Status**: Not implemented

**Recommendation**: Defer to post-MVP

**Why Not Now**:
- High cost ($0.01-0.05 per SMS)
- Regulatory complexity (TCPA compliance)
- Lower priority than email
- Push notifications cover mobile use case

**When to Consider**:
- If push notification opt-in rate is low
- For critical alerts (account security, legal notices)
- If users explicitly request SMS option

### 🔔 Browser Notifications (Already Implemented)
**Status**: ✅ Working via `useNotifications.js`

- Native browser notifications for new messages
- Shows even when app is in background
- Fully branded with LiaiZen icon

## Multi-Channel Strategy

### Recommended Approach

1. **Primary**: Web Push (already implemented)
   - Best for real-time notifications
   - Works across all platforms
   - Fully branded

2. **Secondary**: Email (expand current implementation)
   - Daily digest option
   - Backup for push failures
   - User preference setting

3. **Tertiary**: In-App (already implemented)
   - For users actively using app
   - Socket.io real-time delivery

### User Preference Model

```javascript
{
  pushNotifications: {
    enabled: true,
    newMessages: true,
    tasks: true,
    invitations: true
  },
  emailNotifications: {
    enabled: false,  // Expand this
    frequency: "daily",  // immediate, daily, weekly
    newMessages: false,
    tasks: false,
    invitations: true  // Already working
  },
  smsNotifications: {
    enabled: false,  // Future feature
    criticalOnly: true
  }
}
```

## Implementation Plan

### Phase 1: Custom Web Push Implementation ✅
- [x] Custom web-push using Web Push API (VAPID keys)
- [x] Fully branded as LiaiZen (no third-party services)
- [x] Automatic subscription when permission granted
- [x] Deep linking to chat on notification click

### Phase 2: Expand Email Notifications (Recommended)
- [ ] Add email notification preferences to user settings
- [ ] Create email templates for message notifications
- [ ] Implement daily digest functionality
- [ ] Add unsubscribe link (CAN-SPAM compliance)
- [ ] Test email deliverability

### Phase 3: SMS (Future)
- [ ] Evaluate SMS provider (Twilio, AWS SNS)
- [ ] Implement TCPA compliance (opt-in, opt-out)
- [ ] Add SMS to user preferences
- [ ] Cost analysis and budget planning

## Branding Guidelines

All notifications must:
- ✅ Display "LiaiZen" as the sender/app name
- ✅ Use LiaiZen logo/icon
- ✅ Match LiaiZen brand colors (teal palette)
- ✅ Use consistent tone and voice
- ❌ No third-party branding or attribution

## Testing Checklist

- [x] Push notifications work on iOS PWA
- [x] Push notifications work on Android PWA
- [x] Push notifications work on desktop browsers
- [x] Notifications are fully branded as LiaiZen
- [ ] Email notifications work (expand current implementation)
- [ ] User preferences save correctly
- [ ] Unsubscribe links work (email)

## Cost Analysis

### Current Costs
- **Web Push**: $0 (self-hosted, VAPID keys free)
- **Email**: ~$0 (Gmail API free tier: 500/day)
- **In-App**: $0 (Socket.io + PostgreSQL)

### Future Costs (if adding SMS)
- **SMS**: ~$0.01-0.05 per message
- **Estimated monthly**: $50-200 (depending on usage)

## Conclusion

**Current Status**: ✅ Fully branded push notifications working

**Recommendation**: 
1. ✅ Keep custom web-push as primary channel
2. 📧 Expand email notifications for daily digest option
3. 📱 Defer SMS to post-MVP (not needed now)

**No additional channels needed for MVP** - push notifications + email invitations cover the use case.

