/**
 * Global Error Handler for LiaiZen
 * Integrates with analytics to track errors and exceptions
 */

import { trackError, trackAPIError, trackConnectionError, trackFormError } from './analyticsEnhancements.js';

// Global error handler for unhandled errors
export function setupGlobalErrorHandler() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    trackError(error, 'unhandled_promise_rejection', false);
    console.error('Unhandled promise rejection:', error);
  });

  // Handle JavaScript errors
  window.addEventListener('error', (event) => {
    const error = event.error || new Error(event.message);
    trackError(error, 'javascript_error', true);
    console.error('JavaScript error:', error);
  });
}

// Wrapper for API calls with error tracking
export async function trackAPIRequest(endpoint, requestFn) {
  try {
    const response = await requestFn();
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      trackAPIError(endpoint, response.status, errorData.error || response.statusText);
    }
    
    return response;
  } catch (error) {
    trackAPIError(endpoint, 0, error.message || 'Network error');
    throw error;
  }
}

// Wrapper for WebSocket errors
export function trackWebSocketError(error, errorType = 'websocket_error') {
  trackConnectionError(errorType, error.message || String(error));
  console.error('WebSocket error:', error);
}

// Wrapper for form validation errors
export function trackFormValidationError(formName, fieldName, errorType) {
  trackFormError(formName, fieldName, errorType);
}

// React Error Boundary component
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Track React component errors
    trackError(error, 'react_component_error', true);
    console.error('React Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-red-600">Please refresh the page or contact support if the problem persists.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

