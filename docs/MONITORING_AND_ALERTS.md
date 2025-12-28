# Monitoring and Alerts Setup

This document describes how to set up monitoring and alerts for fail-open rate tracking.

## Overview

The application now includes:

- **Error Logging Service**: Centralized error logging with Sentry integration
- **Fail-Open Metrics**: Automatic tracking of fail-open events
- **Alert System**: Configurable alerts for high fail-open rates

## Setup Instructions

### 1. Sentry Integration (Recommended)

Sentry provides error tracking, performance monitoring, and alerting.

#### Step 1: Create Sentry Account

1. Go to https://sentry.io
2. Create a free account (5,000 events/month free tier)
3. Create a new project (React)
4. Copy your DSN

#### Step 2: Install Sentry

```bash
cd chat-client-vite
npm install @sentry/react
```

#### Step 3: Configure Environment Variable

Add to `.env` or Vercel environment variables:

```bash
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

#### Step 4: Deploy

Sentry will automatically initialize on production builds.

### 2. Custom Logging Endpoint (Optional)

If you have a custom logging service, configure it:

```javascript
// In your app initialization
window.ENV = {
  LOG_ENDPOINT: 'https://your-logging-service.com/api/logs',
  ALERT_ENDPOINT: 'https://your-alerting-service.com/api/alerts',
};
```

### 3. Alert Configuration

#### Fail-Open Rate Thresholds

The system automatically tracks fail-open rates and alerts when thresholds are exceeded:

- **Warning Threshold**: 5% fail-open rate
- **Critical Threshold**: 10% fail-open rate (can be configured)

#### Alert Triggers

Alerts are triggered when:

1. Fail-open rate exceeds 5% over a 5-minute window
2. Multiple fail-open events occur in rapid succession
3. Critical errors cause fail-open scenarios

#### Alert Destinations

Configure alerts to send to:

- **Email**: Sentry email notifications
- **Slack**: Sentry Slack integration
- **PagerDuty**: For critical alerts
- **Custom Webhook**: Your alerting service

### 4. Sentry Alert Rules

Set up alerts in Sentry dashboard:

1. Go to **Alerts** → **Create Alert Rule**
2. Configure:
   - **Trigger**: When issue count > threshold
   - **Conditions**:
     - Tags: `failOpen: true`
     - Environment: `production`
   - **Actions**: Email, Slack, PagerDuty

#### Example Alert Rule

```
Name: High Fail-Open Rate
Trigger: When issue count > 10 in 5 minutes
Conditions:
  - Tag: failOpen = true
  - Environment: production
Actions:
  - Send email to team@example.com
  - Post to Slack #alerts channel
```

### 5. Metrics Dashboard

#### View Fail-Open Metrics

Access metrics in browser console:

```javascript
import { getFailOpenMetrics } from './services/errorHandling/ErrorLoggingService.js';
const metrics = getFailOpenMetrics();
console.log('Fail-open count:', metrics.count);
console.log('Recent errors:', metrics.errors);
```

#### Sentry Dashboard

View metrics in Sentry:

1. Go to **Issues** → Filter by tag `failOpen: true`
2. Go to **Performance** → View error rates
3. Go to **Releases** → Track error trends

### 6. Monitoring Checklist

- [ ] Sentry account created and DSN configured
- [ ] Sentry package installed (`@sentry/react`)
- [ ] Environment variable set (`VITE_SENTRY_DSN`)
- [ ] Alert rules configured in Sentry
- [ ] Email/Slack notifications tested
- [ ] Fail-open metrics visible in Sentry dashboard
- [ ] Custom logging endpoint configured (if applicable)
- [ ] Alert endpoint configured (if applicable)

## Alert Response Procedures

### When Alert Triggers

1. **Check Sentry Dashboard**
   - Review error details
   - Check error frequency
   - Identify error patterns

2. **Investigate Root Cause**
   - Check API endpoint status
   - Verify network connectivity
   - Review recent deployments

3. **Take Action**
   - If API issue: Contact backend team
   - If network issue: Check CDN/Infrastructure
   - If code issue: Review recent changes

4. **Document**
   - Log incident in Sentry
   - Update runbook
   - Post-mortem if critical

## Metrics to Monitor

### Key Metrics

1. **Fail-Open Rate**: Percentage of messages sent without analysis
   - Target: < 1%
   - Warning: > 5%
   - Critical: > 10%

2. **Error Categories**:
   - Network errors (retryable)
   - Rate limit errors (retryable)
   - System errors (fail-open)
   - Critical errors (fail-closed)

3. **Retry Success Rate**: Percentage of retries that succeed
   - Target: > 80%

4. **Response Times**: API response times
   - Target: < 2s (p95)
   - Warning: > 5s (p95)

### Dashboard Queries

#### Sentry Query Language (Sentry Query Builder)

```
tags.failOpen:true
environment:production
timestamp:[now-1h TO now]
```

#### Custom Metrics Query

```javascript
// Get fail-open rate for last hour
const metrics = getFailOpenMetrics();
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
const recentErrors = metrics.errors.filter(err => new Date(err.timestamp) > oneHourAgo);
const failOpenRate = recentErrors.length / 100; // Approximate
```

## Troubleshooting

### Sentry Not Initializing

1. Check `VITE_SENTRY_DSN` is set
2. Verify `@sentry/react` is installed
3. Check browser console for errors
4. Verify production build (Sentry only loads in production)

### Alerts Not Firing

1. Check Sentry alert rules are configured
2. Verify alert actions (email, Slack) are set up
3. Test alert with manual trigger
4. Check alert thresholds are appropriate

### Metrics Not Tracking

1. Check `ErrorLoggingService` is imported
2. Verify `logErrorToService` is called
3. Check browser console for errors
4. Verify sessionStorage is available

## Production Deployment

### Pre-Deployment Checklist

- [ ] Sentry DSN configured in Vercel
- [ ] Alert rules configured
- [ ] Notification channels tested
- [ ] Monitoring dashboard accessible
- [ ] Runbook updated with alert procedures

### Post-Deployment Verification

1. **Verify Sentry Integration**

   ```bash
   # Trigger a test error
   # Check Sentry dashboard for event
   ```

2. **Test Alert System**

   ```bash
   # Manually trigger fail-open scenario
   # Verify alert is sent
   ```

3. **Monitor Metrics**
   ```bash
   # Check Sentry dashboard
   # Verify fail-open rate is tracked
   ```

## Support

For issues or questions:

- Check Sentry documentation: https://docs.sentry.io
- Review error logs in Sentry dashboard
- Contact team lead for critical issues
