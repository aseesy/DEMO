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

  // Get existing Service Worker registration on mount
  // NOTE: Registration happens in main.jsx - we just get the existing one
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      getServiceWorkerRegistration();
    } else {
      console.warn('[usePWA] Service Worker not supported in this browser');
    }

    // Detect if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      console.log('[usePWA] App is installed (standalone mode)');
    }
  }, []);

  // Listen for install prompt event
  React.useEffect(() => {
    const handleBeforeInstallPrompt = e => {
      console.log('[usePWA] Install prompt available');
      e.preventDefault(); // Prevent automatic prompt
      setInstallPromptEvent(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('[usePWA] App installed successfully');
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
      console.log('[usePWA] Skipping Service Worker in development mode');
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
      console.log('[usePWA] Safari detected (not installed as PWA) - service worker disabled');
      return null;
    }

    try {
      // Wait for service worker to be ready (gets registration from main.jsx)
      const registration = await navigator.serviceWorker.ready;

      if (!registration) {
        console.warn('[usePWA] No service worker registration found');
        return null;
      }

      console.log('[usePWA] Got existing Service Worker registration');
      setSwRegistration(registration);

      // Set up periodic update checks
      setupUpdateChecks(registration);

      // Listen for updates
      setupUpdateListener(registration);

      return registration;
    } catch (error) {
      console.error('[usePWA] Error getting service worker registration:', error);
      return null;
    }
  }, []);

  // Set up periodic update checks
  const setupUpdateChecks = registration => {
    if (registration && typeof registration.update === 'function') {
      const updateInterval = setInterval(() => {
        try {
          if (registration && typeof registration.update === 'function') {
            registration.update().catch(error => {
              if (error.name !== 'InvalidStateError') {
                console.debug('[usePWA] Service Worker update check failed:', error);
              }
            });
          } else {
            clearInterval(updateInterval);
          }
        } catch (error) {
          if (error.name !== 'InvalidStateError') {
            console.debug('[usePWA] Service Worker update check failed:', error);
          }
        }
      }, 60000); // Check every minute
    }
  };

  // Set up update listener
  const setupUpdateListener = registration => {
    try {
      registration.addEventListener('updatefound', () => {
        try {
          let newWorker = null;
          try {
            newWorker = registration.installing || registration.waiting;
          } catch (error) {
            console.debug('[usePWA] Error accessing registration.installing/waiting:', error);
            return;
          }

          if (!newWorker) {
            console.warn('[usePWA] No new worker found in registration');
            return;
          }

          console.log('[usePWA] New Service Worker found, installing...');

          try {
            newWorker.addEventListener('statechange', () => {
              try {
                if (
                  newWorker &&
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  console.log('[usePWA] ✅ New Service Worker installed, update available');
                  setUpdateAvailable(true);
                  setWaitingWorker(newWorker);
                } else if (newWorker && newWorker.state === 'activated') {
                  console.log('[usePWA] ✅ New Service Worker activated');
                  window.location.reload();
                }
              } catch (error) {
                console.debug('[usePWA] Error in statechange handler:', error);
              }
            });
          } catch (error) {
            console.debug('[usePWA] Error adding statechange listener:', error);
          }
        } catch (error) {
          console.debug('[usePWA] Error in updatefound handler:', error);
        }
      });
    } catch (error) {
      console.debug('[usePWA] Error adding updatefound listener:', error);
    }
  };

  // Show install prompt
  const showInstallPrompt = React.useCallback(async () => {
    if (!installPromptEvent) {
      console.warn('[usePWA] Install prompt not available');
      return false;
    }

    try {
      console.log('[usePWA] Showing install prompt');
      installPromptEvent.prompt();

      const { outcome } = await installPromptEvent.userChoice;
      console.log('[usePWA] Install prompt outcome:', outcome);

      if (outcome === 'accepted') {
        setIsInstallable(false);
        setInstallPromptEvent(null);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[usePWA] Install prompt error:', error);
      return false;
    }
  }, [installPromptEvent]);

  // Subscribe to push notifications
  // NOTE: Notification.requestPermission() can ONLY be called from a user gesture (click, tap)
  const subscribeToPush = React.useCallback(async () => {
    if (import.meta.env.DEV) {
      console.log('[usePWA] Skipping push subscription in development mode');
      return null;
    }

    try {
      console.log('[usePWA] Subscribing to push notifications...');

      const registration = await navigator.serviceWorker.ready;

      if (!registration) {
        console.warn('[usePWA] Service Worker not ready');
        return null;
      }

      // Check current permission status
      let permission = Notification.permission;

      if (permission === 'default') {
        try {
          permission = await Notification.requestPermission();
        } catch (error) {
          console.warn('[usePWA] Cannot request permission without user gesture:', error);
          return null;
        }
      }

      if (permission !== 'granted') {
        console.warn('[usePWA] Notification permission not granted:', permission);
        return null;
      }

      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('[usePWA] Already subscribed to push notifications');
        setPushSubscription(existingSubscription);

        // Sync to server
        try {
          const subscriptionData = existingSubscription.toJSON();
          const response = await apiPost('/api/push/subscribe', {
            subscription: subscriptionData,
            userAgent: navigator.userAgent,
          });
          if (response.ok) {
            const result = await response.json();
            console.log('[usePWA] ✅ Existing subscription synced to server:', result);
          }
        } catch (error) {
          console.warn('[usePWA] ⚠️ Error syncing existing subscription:', error);
        }

        return existingSubscription;
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'BNnD6XTZ6cpMVf3t6kq5Gjx2hJhx0FpR8BxPNxEwje3XuiVQNtIc6UnyFtGdWxQjiiPfRQ5QUkCxGPp5uG91gqs'
        ),
      });

      console.log('[usePWA] Push subscription created:', subscription);
      setPushSubscription(subscription);

      // Send subscription to server
      try {
        const subscriptionData = subscription.toJSON();
        const response = await apiPost('/api/push/subscribe', {
          subscription: subscriptionData,
          userAgent: navigator.userAgent,
        });

        if (response.ok) {
          const result = await response.json();
          console.log('[usePWA] ✅ Push subscription saved to server:', result);
        } else {
          const errorText = await response.text();
          console.error('[usePWA] ❌ Failed to save subscription to server:', {
            status: response.status,
            error: errorText,
          });
        }
      } catch (error) {
        console.error('[usePWA] ❌ Error saving subscription to server:', error.message);
      }

      return subscription;
    } catch (error) {
      console.warn('[usePWA] Push subscription failed:', error.name);
      return null;
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = React.useCallback(async () => {
    if (!pushSubscription) {
      console.warn('[usePWA] No active push subscription');
      return false;
    }

    try {
      console.log('[usePWA] Unsubscribing from push notifications...');
      await pushSubscription.unsubscribe();
      setPushSubscription(null);
      console.log('[usePWA] Push subscription removed');
      return true;
    } catch (error) {
      console.error('[usePWA] Unsubscribe failed:', error);
      return false;
    }
  }, [pushSubscription]);

  // Send message to Service Worker
  const sendMessageToSW = React.useCallback(
    message => {
      if (!swRegistration || !swRegistration.active) {
        console.warn('[usePWA] Service Worker not active');
        return;
      }

      swRegistration.active.postMessage(message);
    },
    [swRegistration]
  );

  // Apply update - skip waiting and reload
  const applyUpdate = React.useCallback(() => {
    if (waitingWorker) {
      console.log('[usePWA] Applying update...');
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      setWaitingWorker(null);
      window.location.reload();
    }
  }, [waitingWorker]);

  // Check for updates manually
  const checkForUpdates = React.useCallback(async () => {
    if (swRegistration) {
      try {
        await swRegistration.update();
        console.log('[usePWA] Update check completed');
      } catch (error) {
        console.warn('[usePWA] Error checking for updates:', error);
      }
    }
  }, [swRegistration]);

  // Listen for controller change (when new service worker takes control)
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleControllerChange = () => {
        console.log('[usePWA] Service Worker controller changed, reloading...');
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
