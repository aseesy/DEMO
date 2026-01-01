import React from 'react';

/**
 * Error Boundary Component
 * Catches React errors and displays a user-friendly fallback UI
 * instead of a blank screen
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('🚨 Error Boundary caught an error:', error, errorInfo);

    // Store error details in state
    this.state = {
      hasError: true,
      error,
      errorInfo,
    };

    // Send error to monitoring service (if configured)
    if (window.trackError) {
      window.trackError(error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-dvh bg-gradient-to-b from-white via-teal-lightest/30 to-white flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl border-2 border-red-200 p-8 shadow-lg">
              {/* Error Icon */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              {/* Error Message */}
              <h1 className="text-2xl font-bold text-teal-dark mb-2 text-center">
                Something Went Wrong
              </h1>
              <p className="text-gray-600 mb-6 text-center">
                We encountered an unexpected error. This has been logged and we'll look into it.
              </p>

              {/* Error Details (Development Only) */}
              {import.meta.env.DEV && this.state.error && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs font-mono overflow-auto max-h-40">
                  <div className="text-red-600 font-bold mb-2">Error Details:</div>
                  <div className="text-gray-700">{this.state.error.toString()}</div>
                  {this.state.errorInfo && (
                    <div className="mt-2 text-gray-600">{this.state.errorInfo.componentStack}</div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleReload}
                  className="w-full py-3 px-4 bg-teal-medium text-white font-medium rounded-lg hover:bg-teal-dark transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Reload Page
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="w-full py-3 px-4 border-2 border-teal-medium text-teal-medium font-medium rounded-lg hover:bg-teal-lightest transition-all duration-200"
                >
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
