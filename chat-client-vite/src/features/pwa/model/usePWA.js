import React from 'react';
import { apiPost } from '../../../apiClient';

/**
 * usePWA Hook - Manages PWA installation and Service Worker state
 *
 * NOTE: Service Worker registration happens in main.jsx (single source of truth).
 * This hook manages the existing registration, install prompts, and push notifications.
 *
 * Features:
 * - Gets existing Service Worker registration from main.jsx
 * - Detects if app is installable
 * - Provides install prompt functionality
 * - Subscribes to push notifications
 * - Manages PWA state and permissions
 * - Detects and applies service worker updates automatically
 *
 * @returns {Object} PWA state and methods
 */
export function usePWA() {
  const [isInstallable, setIsInstallable] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [swRegistration, setSwRegistration] = React.useState(null);
  const [pushSubscription, setPushSubscription] = React.useState(null);
  const [installPromptEvent, setInstallPromptEvent] = React.useState(null);
  const [updateAvailable, setUpdateAvailable] = React.useState(false);
  const [waitingWorker, setWaitingWorker] = React.useState(null);

  // Define helper functions before they're used
  // Set up periodic update checks
  const setupUpdateChecks = React.useCallback(registration => {
    if (registration && typeof registration.update === 'function') {
      const updateInterval = setInterval(() => {
        try {
          if (registration && typeof registration.update === 'function') {
            registration.update().catch(() => {
              // Silently ignore InvalidStateError - service worker may not be ready
            });
          } else {
            clearInterval(updateInterval);
          }
        } catch {
          // Silently ignore errors during update check
        }
      }, 60000); // Check every minute
    }
  }, []);

  // Set up update listener
  const setupUpdateListener = React.useCallback(registration => {
    try {
      registration.addEventListener('updatefound', () => {
        try {
          let newWorker = null;
          try {
            newWorker = registration.installing || registration.waiting;
          } catch {
            return;
          }

          if (!newWorker) {
            return;
          }

          // Track update found
          import('../../../utils/pwaObservability.js')
            .then(({ trackServiceWorkerUpdate }) => {
              trackServiceWorkerUpdate(registration, true, null, 'current', 'new');
            })
            .catch(() => {
              // Silently ignore if module not available
            });

          try {
            newWorker.addEventListener('statechange', () => {
              try {
                if (
                  newWorker &&
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  setUpdateAvailable(true);
                  setWaitingWorker(newWorker);

                  // Track update available
                  import('../../../utils/pwaObservability.js')
                    .then(({ trackServiceWorkerUpdate }) => {
                      trackServiceWorkerUpdate(registration, true, null, 'current', 'new');
                    })
                    .catch(() => {});
                } else if (newWorker && newWorker.state === 'activated') {
                  // Track activation
                  import('../../../utils/pwaObservability.js')
                    .then(({ trackServiceWorkerActivate }) => {
                      trackServiceWorkerActivate(registration, true);
                    })
                    .catch(() => {});

                  window.location.reload();
                }
              } catch {
                // Silently ignore errors in statechange handler
              }
            });
          } catch {
            // Silently ignore errors adding statechange listener
          }
        } catch {
          // Silently ignore errors in updatefound handler
        }
      });
    } catch {
      // Silently ignore errors adding updatefound listener
    }
  }, []);

  // Get existing Service Worker registration on mount
  // NOTE: Registration happens in main.jsx - we just get the existing one
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      getServiceWorkerRegistration();
    }

    // Detect if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
  }, []);

  // Listen for install prompt event
  React.useEffect(() => {
    const handleBeforeInstallPrompt = e => {
      e.preventDefault(); // Prevent automatic prompt
      setInstallPromptEvent(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Get existing Service Worker registration (registered in main.jsx)
  const getServiceWorkerRegistration = React.useCallback(async () => {
    // Skip in development mode
    if (import.meta.env.DEV) {
      return null;
    }

    // Detect Safari and iOS
    const isSafari =
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
      /^((?!chrome|android).)*safari/i.test(navigator.vendor) ||
      (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome'));

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Check if app is installed as PWA (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://');

    // iOS Safari DOES support service workers for PWAs installed to home screen (iOS 11.3+)
    // Only skip service worker for regular Safari (not installed as PWA)
    if (isSafari && !(isIOS && isStandalone)) {
      return null;
    }

    try {
      // Wait for service worker to be ready (gets registration from main.jsx)
      const registration = await navigator.serviceWorker.ready;

      if (!registration) {
        return null;
      }

      setSwRegistration(registration);

      // Set up periodic update checks
      setupUpdateChecks(registration);

      // Listen for updates
      setupUpdateListener(registration);

      return registration;
    } catch {
      return null;
    }
  }, [setupUpdateChecks, setupUpdateListener]);

  // Show install prompt
  const showInstallPrompt = React.useCallback(async () => {
    if (!installPromptEvent) {
      return false;
    }

    try {
      installPromptEvent.prompt();
      const { outcome } = await installPromptEvent.userChoice;

      if (outcome === 'accepted') {
        setIsInstallable(false);
        setInstallPromptEvent(null);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }, [installPromptEvent]);

  // Subscribe to push notifications
  // NOTE: Notification.requestPermission() can ONLY be called from a user gesture (click, tap)
  const subscribeToPush = React.useCallback(async () => {
    // Allow subscription in dev mode for testing (but warn)
    if (import.meta.env.DEV) {
      console.warn(
        '[usePWA] ⚠️ Dev mode: Push subscriptions may not work correctly. Use production build for full testing.'
      );
      // Continue anyway - allows testing in dev
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      if (!registration) {
        return null;
      }

      // Check current permission status
      let permission = Notification.permission;

      if (permission === 'default') {
        try {
          permission = await Notification.requestPermission();
        } catch {
          return null;
        }
      }

      if (permission !== 'granted') {
        return null;
      }

      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setPushSubscription(existingSubscription);

        // Sync to server
        try {
          const subscriptionData = existingSubscription.toJSON();
          console.log('[usePWA] Existing subscription found, syncing to server...', {
            endpoint: subscriptionData.endpoint?.substring(0, 50) + '...',
            hasKeys: !!(subscriptionData.keys?.p256dh && subscriptionData.keys?.auth),
          });
          const result = await apiPost('/api/push/subscribe', {
            subscription: subscriptionData,
            userAgent: navigator.userAgent,
          });
          console.log('[usePWA] ✅ Existing subscription synced to server:', result);
        } catch (error) {
          console.error('[usePWA] ❌ Error syncing existing subscription to server:', error);
          // Don't fail - subscription still works locally, but server won't be able to send push
        }

        return existingSubscription;
      }

      // Subscribe to push notifications
      // Get VAPID public key from environment variable
      const vapidPublicKey =
        import.meta.env.VITE_VAPID_PUBLIC_KEY ||
        'BNnD6XTZ6cpMVf3t6kq5Gjx2hJhx0FpR8BxPNxEwje3XuiVQNtIc6UnyFtGdWxQjiiPfRQ5QUkCxGPp5uG91gqs';

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      setPushSubscription(subscription);

      // Send subscription to server
      try {
        const subscriptionData = subscription.toJSON();
        console.log('[usePWA] Subscribing to push notifications, sending to server...', {
          endpoint: subscriptionData.endpoint?.substring(0, 50) + '...',
          hasKeys: !!(subscriptionData.keys?.p256dh && subscriptionData.keys?.auth),
        });
        const result = await apiPost('/api/push/subscribe', {
          subscription: subscriptionData,
          userAgent: navigator.userAgent,
        });
        console.log('[usePWA] ✅ Push subscription saved to server:', result);
      } catch (error) {
        console.error('[usePWA] ❌ Error saving subscription to server:', error);
        // Don't fail - subscription still works locally, but server won't be able to send push
      }

      return subscription;
    } catch {
      return null;
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = React.useCallback(async () => {
    if (!pushSubscription) {
      return false;
    }

    try {
      await pushSubscription.unsubscribe();
      setPushSubscription(null);
      return true;
    } catch {
      return false;
    }
  }, [pushSubscription]);

  // Send message to Service Worker
  const sendMessageToSW = React.useCallback(
    message => {
      if (swRegistration?.active) {
        swRegistration.active.postMessage(message);
      }
    },
    [swRegistration]
  );

  // Apply update when user clicks "Update Now"
  // With promptUpdate strategy, service worker waits for user action
  // We send SKIP_WAITING message to activate the waiting service worker
  const applyUpdate = React.useCallback(() => {
    if (waitingWorker) {
      // Tell waiting service worker to skip waiting and activate
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      setWaitingWorker(null);

      // Reload page after a short delay to allow service worker to activate
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else if (swRegistration && swRegistration.waiting) {
      // Fallback: if waitingWorker not set, try registration.waiting
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
    // If no waiting worker, there's nothing to update - don't reload
  }, [waitingWorker, swRegistration]);

  // Check for updates manually
  const checkForUpdates = React.useCallback(async () => {
    if (swRegistration) {
      try {
        await swRegistration.update();

        // Track update check success
        import('../../../utils/pwaObservability.js')
          .then(({ trackServiceWorkerEvent }) => {
            trackServiceWorkerEvent('update_check', { success: true });
          })
          .catch(() => {});
      } catch (error) {
        // Track update check failure
        import('../../../utils/pwaObservability.js')
          .then(({ trackServiceWorkerUpdate, trackServiceWorkerEvent }) => {
            trackServiceWorkerUpdate(swRegistration, false, error);
            trackServiceWorkerEvent('update_check', { success: false, error: error.message });
          })
          .catch(() => {});
      }
    }
  }, [swRegistration]);

  // Listen for controller change (when new service worker takes control)
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleControllerChange = () => {
        window.location.reload();
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  return {
    isInstallable,
    isInstalled,
    swRegistration,
    pushSubscription,
    updateAvailable,
    showInstallPrompt,
    subscribeToPush,
    unsubscribeFromPush,
    sendMessageToSW,
    applyUpdate,
    checkForUpdates,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
