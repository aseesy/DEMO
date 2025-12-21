# Analytics Setup Guide

This guide explains how to set up and use analytics tracking for LiaiZen to monitor conversion rates by section.

## Overview

The analytics system tracks:

- **CTA clicks** by section (hero, navigation, final CTA, etc.)
- **Section views** (when users scroll to different sections)
- **Conversions** (sign-ups) attributed to specific sources
- **Form submissions** (newsletter, exit intent, etc.)
- **User engagement** (scroll depth, time on page, FAQ interactions)

## Setup Instructions

### 1. Get Google Analytics Measurement ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new property or use an existing one
3. Get your **Measurement ID** (format: `G-XXXXXXXXXX`)

### 2. Add Measurement ID to Environment Variables

Create or update `.env` file in `chat-client-vite/`:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**For Production:**

- Add this to your Vercel/Railway environment variables
- Variable name: `VITE_GA_MEASUREMENT_ID`
- Value: Your GA4 Measurement ID

### 3. Verify Setup

1. Start your dev server: `npm run dev`
2. Open browser console
3. You should see: `Analytics initialized: G-XXXXXXXXXX`
4. Click CTAs and check console for tracking logs

## Tracked Events

### CTA Clicks

Tracks when users click "Get Started" or "Sign Up" buttons:

```javascript
trackCTAClick(section, ctaText, ctaPosition);
```

**Sections tracked:**

- `hero` - Main hero CTA
- `navigation` - Header "Get Started" button
- `final_cta` - Bottom CTA section
- `product_preview` - CTA in product preview section

**Example events:**

- `cta_click` with `section: "hero"`, `cta_text: "Start Free Beta Access"`
- `cta_click` with `section: "final_cta"`, `cta_text: "Start Free Beta Access Now"`

### Section Views

Tracks when users scroll to different sections:

```javascript
trackSectionView(sectionName);
```

**Sections tracked:**

- `value_proposition` - "Why LiaiZen?" section
- `social_proof` - Beta stats section
- `testimonials` - User testimonials
- `product_preview` - Product demo section
- `final_cta` - Final call-to-action

### Conversions

Tracks successful sign-ups:

```javascript
trackConversion(source, method);
```

**Sources tracked:**

- `hero` - Signed up from hero CTA
- `navigation` - Signed up from header CTA
- `final_cta` - Signed up from bottom CTA
- `sign_in_modal` - Signed up via sign-in modal
- `exit_intent_modal` - Signed up via exit intent popup
- `signup_form` - Signed up via main signup form

**Methods:**

- `signup` - New account creation
- `login` - Existing user login
- `email` - Email waitlist signup

### Form Submissions

Tracks form interactions:

```javascript
trackFormSubmit(formName, formType);
```

**Forms tracked:**

- `newsletter` - Newsletter signup form
- `exit_intent` - Exit intent email capture

### User Engagement

- **Scroll Depth**: Tracks 25%, 50%, 75%, 90% scroll milestones
- **FAQ Expands**: Tracks which FAQ questions users open
- **Exit Intent**: Tracks when users try to leave the page
- **Sign-In Modal**: Tracks when sign-in modal is opened

## Viewing Analytics Data

### Google Analytics 4 Dashboard

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property
3. Navigate to **Reports** → **Engagement** → **Events**

### Key Metrics to Monitor

#### Conversion Rate by Section

**Path:** Reports → Engagement → Events → `cta_click`

Filter by `section` parameter to see:

- Which sections drive the most clicks
- Conversion rate: `conversion` events / `cta_click` events per section

#### Section Engagement

**Path:** Reports → Engagement → Events → `section_view`

See which sections users view most:

- `value_proposition`
- `social_proof`
- `testimonials`
- `product_preview`
- `final_cta`

#### Conversion Funnel

**Path:** Explore → Funnel exploration

Create funnel:

1. `section_view` (hero)
2. `cta_click` (hero)
3. `conversion` (any source)

#### Scroll Depth Analysis

**Path:** Reports → Engagement → Events → `scroll`

See how far users scroll:

- 25% - Early drop-off
- 50% - Mid-page engagement
- 75% - High engagement
- 90% - Near completion

## Custom Reports

### Conversion Rate by Section

Create a custom report in GA4:

1. Go to **Explore** → **Free form**
2. Add dimensions:
   - `Event name` (filter: `cta_click`)
   - `Section` (custom parameter)
3. Add metrics:
   - `Event count` (for clicks)
   - `Conversions` (for sign-ups)
4. Calculate: `Conversions / Event count = Conversion Rate`

### Section Performance Dashboard

1. Go to **Explore** → **Free form**
2. Dimensions:
   - `Section` (from `section_view` events)
   - `Event name`
3. Metrics:
   - `Event count`
   - `Users`
   - `Average session duration`

## Testing

### Test in Development

1. Open browser console
2. Click CTAs - should see: `Analytics: CTA clicked`
3. Scroll to sections - should see: `Analytics: Section viewed`
4. Submit forms - should see: `Analytics: Form submitted`

### Verify in GA4

1. Go to GA4 → **Reports** → **Realtime**
2. Perform actions on your site
3. Events should appear within seconds

## Troubleshooting

### Analytics Not Working

1. **Check environment variable:**

   ```bash
   echo $VITE_GA_MEASUREMENT_ID
   ```

2. **Check browser console:**
   - Should see: `Analytics initialized: G-XXXXXXXXXX`
   - If not, check `.env` file

3. **Check GA4 setup:**
   - Verify Measurement ID is correct
   - Check GA4 property is active

### Events Not Showing in GA4

1. **Wait 24-48 hours** for standard reports (realtime shows immediately)
2. **Check Realtime report** to verify events are firing
3. **Verify event parameters** are being sent correctly
4. **Check ad blockers** - they may block GA scripts

## Privacy Considerations

- Analytics respects user privacy
- No personally identifiable information (PII) is tracked
- IP addresses are anonymized by default in GA4
- Users can opt-out via browser settings

## Next Steps

1. **Set up conversion goals** in GA4:
   - Go to **Admin** → **Events**
   - Mark `sign_up` as conversion event

2. **Create custom dashboards** for:
   - Conversion rate by section
   - User journey analysis
   - Scroll depth analysis

3. **Set up alerts** for:
   - Conversion rate drops
   - Traffic spikes
   - Error rate increases

4. **A/B Testing** (future):
   - Test different CTA copy
   - Test different hero headlines
   - Test different layouts

## Example Queries

### Find Best Converting Section

```sql
-- In GA4 BigQuery (if enabled)
SELECT
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'section') as section,
  COUNTIF(event_name = 'conversion') as conversions,
  COUNTIF(event_name = 'cta_click') as clicks,
  COUNTIF(event_name = 'conversion') / COUNTIF(event_name = 'cta_click') as conversion_rate
FROM `your-project.analytics_XXXXXX.events_*`
WHERE event_name IN ('cta_click', 'conversion')
GROUP BY section
ORDER BY conversion_rate DESC
```

### Section Engagement Analysis

```sql
SELECT
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'section_name') as section,
  COUNT(DISTINCT user_pseudo_id) as unique_viewers,
  AVG((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'time_spent')) as avg_time_seconds
FROM `your-project.analytics_XXXXXX.events_*`
WHERE event_name = 'section_view'
GROUP BY section
ORDER BY unique_viewers DESC
```

## Support

For issues or questions:

1. Check browser console for errors
2. Verify GA4 Measurement ID is correct
3. Check GA4 Realtime report to verify events
4. Review this documentation
