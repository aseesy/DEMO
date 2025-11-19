import React from 'react';

/**
 * Toast Notification Component
 * Displays in-app message notifications like WhatsApp/Messenger
 * No browser permissions required - always works
 */
export function Toast({ toast, onDismiss, onClick }) {
  React.useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      onClick={() => onClick(toast)}
      className="toast-notification"
      role="alert"
      aria-live="polite"
    >
      <div className="toast-content">
        <div className="toast-header">
          <div className="toast-avatar">
            <svg className="w-5 h-5 text-[#275559]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="toast-sender">
            {toast.sender}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(toast.id);
            }}
            className="toast-close"
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="toast-message">
          {toast.message}
        </div>
        <div className="toast-timestamp">
          {toast.timestamp}
        </div>
      </div>
    </div>
  );
}

/**
 * Toast Container Component
 * Manages multiple toast notifications
 */
export function ToastContainer({ toasts, onDismiss, onClick }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onClick={onClick}
        />
      ))}
    </div>
  );
}

export default Toast;
