/**
 * Enhanced Analytics Functions for GA4 Advanced Features
 * These functions support custom dimensions, user properties, and advanced tracking
 */

import { createLogger } from './logger.js';

const logger = createLogger('[Analytics]');

// Set user properties (persists across sessions)
export function setUserProperties(properties) {
  if (!window.gtag) {
    // Silently return - gtag not initialized in development
    return;
  }

  window.gtag('set', 'user_properties', properties);
}

// Set user ID for cross-device tracking
export function setUserID(userId) {
  if (!window.gtag) {
    // Silently return - gtag not initialized in development
    return;
  }

  window.gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID || '', {
    user_id: userId,
  });
}

// Track errors and exceptions
export function trackError(error, errorType = 'exception', fatal = false) {
  if (!window.gtag) {
    logger.debug('trackError - gtag not initialized');
    return;
  }

  window.gtag('event', 'exception', {
    description: error.message || String(error),
    fatal: fatal,
    error_type: errorType,
    // Truncate stack trace for privacy (first 500 chars)
    error_stack: error.stack?.substring(0, 500) || '',
  });

  logger.debug('Error tracked', { errorType, fatal, message: error.message });
}

// Track API errors
export function trackAPIError(endpoint, statusCode, errorMessage) {
  if (!window.gtag) {
    return;
  }

  window.gtag('event', 'api_error', {
    endpoint: endpoint,
    status_code: statusCode,
    error_message: errorMessage,
    event_category: 'errors',
  });

  logger.debug('API error tracked', { endpoint, statusCode });
}

// Track page load performance
export function trackPagePerformance() {
  if (!window.gtag || !window.performance || !window.performance.timing) {
    return;
  }

  const perfData = window.performance.timing;
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
  const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.navigationStart;
  const timeToInteractive = perfData.domInteractive - perfData.navigationStart;

  window.gtag('event', 'page_load_time', {
    value: Math.round(pageLoadTime),
    dom_content_loaded: Math.round(domContentLoaded),
    time_to_interactive: Math.round(timeToInteractive),
    event_category: 'performance',
  });

  logger.debug('Page performance tracked', {
    pageLoadTime: Math.round(pageLoadTime),
    domContentLoaded: Math.round(domContentLoaded),
  });
}

// Track API response time
export function trackAPIResponseTime(endpoint, duration) {
  if (!window.gtag) {
    return;
  }

  window.gtag('event', 'api_response_time', {
    endpoint: endpoint,
    duration: Math.round(duration),
    event_category: 'performance',
  });
}

// Track form validation errors
export function trackFormError(formName, fieldName, errorType) {
  if (!window.gtag) {
    return;
  }

  window.gtag('event', 'form_error', {
    form_name: formName,
    field_name: fieldName,
    error_type: errorType,
    event_category: 'errors',
  });

  logger.debug('Form error tracked', { formName, fieldName, errorType });
}

// Track connection errors (WebSocket, etc.)
export function trackConnectionError(errorType, errorMessage) {
  if (!window.gtag) {
    return;
  }

  window.gtag('event', 'connection_error', {
    error_type: errorType,
    error_message: errorMessage,
    event_category: 'errors',
  });

  logger.debug('Connection error tracked', { errorType, errorMessage });
}

// Enhanced message sent tracking with additional context
export function trackMessageSentEnhanced(
  messageLength,
  isPreApprovedRewrite,
  additionalParams = {}
) {
  if (!window.gtag) {
    return;
  }

  window.gtag('event', 'message_sent', {
    message_length: messageLength,
    is_rewrite: isPreApprovedRewrite,
    has_attachment: additionalParams.has_attachment || false,
    message_type: additionalParams.message_type || 'text',
    thread_id: additionalParams.thread_id || null,
    reply_to: additionalParams.reply_to || null,
    event_category: 'chat',
  });

  logger.debug('Message sent (enhanced)', {
    messageLength,
    isPreApprovedRewrite,
    ...additionalParams,
  });
}

// Track user engagement milestones
export function trackEngagementMilestone(milestone, value) {
  if (!window.gtag) {
    return;
  }

  window.gtag('event', 'engagement_milestone', {
    milestone: milestone, // e.g., 'first_message', 'tenth_message', 'first_task'
    value: value,
    event_category: 'engagement',
  });

  logger.debug('Engagement milestone', { milestone, value });
}

// Track feature discovery
export function trackFeatureDiscovery(featureName, discoveryMethod) {
  if (!window.gtag) {
    return;
  }

  window.gtag('event', 'feature_discovery', {
    feature_name: featureName,
    discovery_method: discoveryMethod, // 'tooltip', 'modal', 'trial', 'help_doc'
    event_category: 'engagement',
  });

  logger.debug('Feature discovery', { featureName, discoveryMethod });
}

// Track search queries (if you add search functionality)
export function trackSearch(searchTerm, resultsCount) {
  if (!window.gtag) {
    return;
  }

  window.gtag('event', 'search', {
    search_term: searchTerm,
    results_count: resultsCount,
    event_category: 'engagement',
  });

  logger.debug('Search tracked', { searchTerm, resultsCount });
}

// Track file downloads
export function trackFileDownload(fileName, fileType, fileSize) {
  if (!window.gtag) {
    return;
  }

  window.gtag('event', 'file_download', {
    file_name: fileName,
    file_type: fileType,
    file_size: fileSize,
    event_category: 'engagement',
  });

  logger.debug('File download tracked', { fileName, fileType });
}

// Track video engagement (if you add videos)
export function trackVideoEngagement(videoTitle, action, progress) {
  if (!window.gtag) {
    return;
  }

  window.gtag('event', 'video_engagement', {
    video_title: videoTitle,
    action: action, // 'play', 'pause', 'complete', 'progress'
    progress: progress, // percentage watched
    event_category: 'engagement',
  });

  logger.debug('Video engagement', { videoTitle, action, progress });
}
