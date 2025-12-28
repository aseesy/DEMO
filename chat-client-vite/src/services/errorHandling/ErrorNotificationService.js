/**
 * Error Notification Service
 * 
 * Displays user notifications for error handling scenarios.
 */

export class ErrorNotificationService {
  /**
   * Show a warning notification
   * 
   * @param {string} message - Warning message to display
   * @param {number} duration - Display duration in milliseconds (default: 5000)
   */
  static showWarning(message, duration = 5000) {
    if (typeof window === 'undefined') {
      return; // SSR guard
    }

    const banner = document.createElement('div');
    banner.className = 'error-notification warning';
    banner.textContent = message;
    banner.setAttribute('role', 'alert');
    banner.setAttribute('aria-live', 'polite');
    
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f59e0b;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      max-width: 400px;
      font-size: 14px;
      line-height: 1.5;
      animation: slideIn 0.3s ease-out;
    `;

    // Add animation styles if not already present
    if (!document.getElementById('error-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'error-notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(banner);

    setTimeout(() => {
      banner.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (banner.parentNode) {
          banner.remove();
        }
      }, 300);
    }, duration);
  }

  /**
   * Show an error notification
   * 
   * @param {string} message - Error message to display
   * @param {number} duration - Display duration in milliseconds (default: 7000)
   */
  static showError(message, duration = 7000) {
    if (typeof window === 'undefined') {
      return; // SSR guard
    }

    const banner = document.createElement('div');
    banner.className = 'error-notification error';
    banner.textContent = message;
    banner.setAttribute('role', 'alert');
    banner.setAttribute('aria-live', 'assertive');
    
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      max-width: 400px;
      font-size: 14px;
      line-height: 1.5;
      animation: slideIn 0.3s ease-out;
    `;

    // Add animation styles if not already present
    if (!document.getElementById('error-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'error-notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(banner);

    setTimeout(() => {
      banner.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (banner.parentNode) {
          banner.remove();
        }
      }, 300);
    }, duration);
  }
}

