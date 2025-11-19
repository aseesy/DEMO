/**
 * Analytics tracking utility for LiaiZen
 * Supports Google Analytics 4 (GA4) and custom event tracking
 */

// Google Analytics Measurement ID (set via environment variable)
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
const GOOGLE_TAG = import.meta.env.VITE_GOOGLE_TAG || import.meta.env.GOOGLE_TAG || '';

// Initialize Google Analytics
export function initAnalytics() {
  // If GOOGLE_TAG is set, skip dynamic initialization (tag is injected via injectGoogleTag.js)
  if (GOOGLE_TAG) {
    console.log('Analytics: GOOGLE_TAG detected, skipping dynamic initialization');
    // Ensure gtag is available if Google Tag Manager is used
    if (typeof window !== 'undefined' && !window.gtag && window.dataLayer) {
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };
    }
    return;
  }

  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') {
    console.log('Analytics: GA_MEASUREMENT_ID not set or running server-side');
    return;
  }

  // Load gtag script
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: true,
  });

  console.log('Analytics initialized:', GA_MEASUREMENT_ID);
}

// Track page view
export function trackPageView(path, title) {
  if (!window.gtag) {
    console.log('Analytics: trackPageView - gtag not initialized');
    return;
  }

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
  });
}

// Track CTA click by section
export function trackCTAClick(section, ctaText, ctaPosition = 'unknown') {
  if (!window.gtag) {
    console.log('Analytics: trackCTAClick - gtag not initialized');
    return;
  }

  window.gtag('event', 'cta_click', {
    section: section,
    cta_text: ctaText,
    cta_position: ctaPosition,
    event_category: 'engagement',
    event_label: `${section} - ${ctaText}`,
  });

  console.log('Analytics: CTA clicked', { section, ctaText, ctaPosition });
}

// Track section view (when user scrolls to section)
export function trackSectionView(sectionName) {
  if (!window.gtag) {
    console.log('Analytics: trackSectionView - gtag not initialized');
    return;
  }

  window.gtag('event', 'section_view', {
    section_name: sectionName,
    event_category: 'engagement',
  });

  console.log('Analytics: Section viewed', sectionName);
}

// Track conversion (sign-up)
export function trackConversion(source, method = 'signup') {
  if (!window.gtag) {
    console.log('Analytics: trackConversion - gtag not initialized');
    return;
  }

  window.gtag('event', 'conversion', {
    conversion_source: source,
    conversion_method: method,
    event_category: 'conversion',
    value: 1,
  });

  // Also track as sign_up event (GA4 standard event)
  window.gtag('event', 'sign_up', {
    method: method,
    source: source,
  });

  console.log('Analytics: Conversion tracked', { source, method });
}

// Track form submission
export function trackFormSubmit(formName, formType = 'newsletter') {
  if (!window.gtag) {
    console.log('Analytics: trackFormSubmit - gtag not initialized');
    return;
  }

  window.gtag('event', 'form_submit', {
    form_name: formName,
    form_type: formType,
    event_category: 'engagement',
  });

  console.log('Analytics: Form submitted', { formName, formType });
}

// Track exit intent
export function trackExitIntent() {
  if (!window.gtag) {
    console.log('Analytics: trackExitIntent - gtag not initialized');
    return;
  }

  window.gtag('event', 'exit_intent', {
    event_category: 'engagement',
    event_label: 'User attempted to leave page',
  });

  console.log('Analytics: Exit intent detected');
}

// Track sign-in modal open
export function trackSignInModalOpen() {
  if (!window.gtag) {
    console.log('Analytics: trackSignInModalOpen - gtag not initialized');
    return;
  }

  window.gtag('event', 'sign_in_modal_open', {
    event_category: 'engagement',
  });

  console.log('Analytics: Sign-in modal opened');
}

// Track scroll depth
export function trackScrollDepth(depth) {
  if (!window.gtag) {
    return;
  }

  window.gtag('event', 'scroll', {
    scroll_depth: depth,
    event_category: 'engagement',
  });
}

// Track time on page
let timeOnPageStart = Date.now();

export function trackTimeOnPage() {
  if (!window.gtag) {
    return;
  }

  const timeSpent = Math.round((Date.now() - timeOnPageStart) / 1000); // seconds

  window.gtag('event', 'time_on_page', {
    time_spent: timeSpent,
    event_category: 'engagement',
  });
}

// Reset time on page timer
export function resetTimeOnPage() {
  timeOnPageStart = Date.now();
}

// Track FAQ expand
export function trackFAQExpand(question) {
  if (!window.gtag) {
    return;
  }

  window.gtag('event', 'faq_expand', {
    question: question,
    event_category: 'engagement',
  });
}

// Track testimonial view
export function trackTestimonialView(testimonialIndex) {
  if (!window.gtag) {
    return;
  }

  window.gtag('event', 'testimonial_view', {
    testimonial_index: testimonialIndex,
    event_category: 'engagement',
  });
}

// Track product preview interaction
export function trackProductPreviewInteraction(action) {
  if (!window.gtag) {
    return;
  }

  window.gtag('event', 'product_preview_interaction', {
    action: action,
    event_category: 'engagement',
  });
}

