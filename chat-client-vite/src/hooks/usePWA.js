import React from 'react';

/**
 * usePWA Hook - Manages PWA installation and Service Worker registration
 *
 * Features:
 * - Registers Service Worker for offline support and push notifications
 * - Detects if app is installable
 * - Provides install prompt functionality
 * - Subscribes to push notifications
 * - Manages PWA state and permissions
 */
export function usePWA() {
  const [isInstallable, setIsInstallable] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [swRegistration, setSwRegistration] = React.useState(null);
  const [pushSubscription, setPushSubscription] = React.useState(null);
  const [installPromptEvent, setInstallPromptEvent] = React.useState(null);

  // Register Service Worker on mount
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    } else {
      console.warn('[usePWA] Service Worker not supported in this browser');
    }

    // Detect if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      console.log('[usePWA] App is installed (standalone mode)');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // registerServiceWorker is stable (useCallback with no deps) but accessed before declaration

  // Listen for install prompt event
  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
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

  // Register Service Worker
  const registerServiceWorker = React.useCallback(async () => {
    // Skip Service Worker registration in development
    // main.jsx explicitly unregisters service workers to fix Safari navigation issues
    if (import.meta.env.DEV) {
      console.log('[usePWA] Skipping Service Worker registration in development mode');
      return null;
    }

    // Detect Safari with multiple methods for reliability
    const isSafari = 
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
      /^((?!chrome|android).)*safari/i.test(navigator.vendor) ||
      (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome'));

    // In Safari, completely skip service worker registration to avoid errors
    // Safari's service worker implementation is buggy and causes InvalidStateError
    if (isSafari) {
      console.log('[usePWA] Safari detected - skipping service worker registration to prevent errors');
      return null;
    }

    try {
      console.log('[usePWA] Registering Service Worker...');
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[usePWA] Service Worker registered successfully:', registration);
      setSwRegistration(registration);

      // For non-Safari browsers: Check for updates periodically
      if (registration && typeof registration.update === 'function') {
        const updateInterval = setInterval(() => {
          try {
            // Only call update if registration is still valid
            if (registration && typeof registration.update === 'function') {
              registration.update().catch((error) => {
                // Catch promise rejections from update()
                if (error.name === 'InvalidStateError') {
                  console.debug('[usePWA] No service worker update available (expected)');
                } else {
                  console.debug('[usePWA] Service Worker update check failed:', error);
                }
              });
            } else {
              clearInterval(updateInterval);
            }
          } catch (error) {
            // Catch synchronous errors
            if (error.name === 'InvalidStateError') {
              console.debug('[usePWA] No service worker update available (expected)');
            } else {
              console.debug('[usePWA] Service Worker update check failed:', error);
            }
          }
        }, 60000); // Check every minute
      }

      // Listen for updates (non-Safari only)
      try {
        registration.addEventListener('updatefound', () => {
          try {
            // Safely access installing/waiting with null checks
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

            // Add statechange listener with error handling
            try {
              newWorker.addEventListener('statechange', () => {
                try {
                  if (newWorker && newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[usePWA] New Service Worker installed, update available');
                    // You can show an update notification here
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

      return registration;
    } catch (error) {
      console.error('[usePWA] Service Worker registration failed:', error);
      return null;
    }
  }, []);

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
  const subscribeToPush = React.useCallback(async () => {
    if (!swRegistration) {
      console.warn('[usePWA] Service Worker not registered yet');
      return null;
    }

    try {
      console.log('[usePWA] Subscribing to push notifications...');

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('[usePWA] Notification permission denied');
        return null;
      }

      // Subscribe to push notifications
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U' // VAPID public key
        ),
      });

      console.log('[usePWA] Push subscription created:', subscription);
      setPushSubscription(subscription);

      return subscription;
    } catch (error) {
      // Only warn in development - this is expected to fail in local dev
      if (import.meta.env.DEV) {
        console.warn('[usePWA] Push subscription failed (expected in dev):', error.name);
      } else {
        console.error('[usePWA] Push subscription failed:', error);
      }
      return null;
    }
  }, [swRegistration]);

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
  const sendMessageToSW = React.useCallback((message) => {
    if (!swRegistration || !swRegistration.active) {
      console.warn('[usePWA] Service Worker not active');
      return;
    }

    swRegistration.active.postMessage(message);
  }, [swRegistration]);

  return {
    isInstallable,
    isInstalled,
    swRegistration,
    pushSubscription,
    showInstallPrompt,
    subscribeToPush,
    unsubscribeFromPush,
    sendMessageToSW,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
