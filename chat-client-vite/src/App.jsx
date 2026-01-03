import './index.css';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatRoom from './ChatRoom.jsx';
import { AcceptInvitationPage, InviteCoParentPage } from './features/invitations';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { PWAUpdateBanner, usePWA } from './features/pwa';
import { MediatorProvider } from './context/MediatorContext.jsx';
import { AuthProvider, useAuthContext } from './context/AuthContext.jsx';
import { InvitationProvider } from './context/InvitationContext.jsx';
// Auth features
import { LoginSignup } from './features/auth/components/LoginSignup.jsx';
import { GoogleOAuthCallback } from './features/auth/components/GoogleOAuthCallback.jsx';
import { ForgotPassword } from './features/auth/components/ForgotPassword.jsx';
import { ResetPassword } from './features/auth/components/ResetPassword.jsx';
// Legal pages
import { PrivacyPage } from './features/legal/PrivacyPage.jsx';
import { TermsPage } from './features/legal/TermsPage.jsx';
// Showcase
import { UIShowcase } from './features/showcase/UIShowcase.jsx';
// Debug
import SocketDiagnostic from './SocketDiagnostic.jsx';
import { SocketTestV2 } from './features/chat/test/SocketTest.v2.jsx';
// Quizzes
import { QuizzesPage } from './features/quizzes/QuizzesPage.jsx';
import { CoParentingStanceQuiz } from './features/quizzes/CoParentingStanceQuiz.jsx';
// Blog articles - MOVED TO MARKETING SITE (www.coparentliaizen.com)

/**
 * AppContent Component
 *
 * Inner component that has access to AuthProvider context.
 * Handles PWA initialization, push notification subscription, and update management.
 *
 * Responsibilities:
 * - Initialize PWA and make it globally available
 * - Auto-subscribe to push notifications when user logs in
 * - Check for service worker updates periodically
 * - Display update banner when updates are available
 */
function AppContent() {
  // Initialize PWA - registers Service Worker and enables push notifications
  const pwa = usePWA();
  const { isAuthenticated } = useAuthContext();
  const [showUpdateBanner, setShowUpdateBanner] = React.useState(false);

  // Make PWA API available globally for components that need it
  React.useEffect(() => {
    window.liaizenPWA = pwa;
  }, [pwa]);

  // Listen for navigation messages from service worker (when notification is clicked)
  // Single Responsibility: Handle service worker messages and update URL
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = event => {
        if (event.data && event.data.type === 'NAVIGATE') {
          console.log('[App] Received NAVIGATE message from service worker:', event.data.url);

          // Parse the URL to extract view parameter
          try {
            const url = new URL(event.data.url, window.location.origin);
            const viewParam = url.searchParams.get('view');

            // Update the URL (this will trigger ChatRoom's URL parameter check)
            window.history.pushState({}, '', event.data.url);

            // Trigger a custom event for immediate navigation
            if (viewParam) {
              console.log('[App] Dispatching navigate-to-view event with view:', viewParam);
              window.dispatchEvent(
                new CustomEvent('navigate-to-view', { detail: { view: viewParam } })
              );
            } else {
              // If no view param, navigate to root
              console.log('[App] No view param, navigating to root');
              window.location.href = event.data.url;
            }
          } catch (error) {
            console.error('[App] Error parsing navigation URL:', error);
            // Fallback: direct navigation
            window.location.href = event.data.url;
          }
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  // Show update banner when update is available
  React.useEffect(() => {
    if (pwa.updateAvailable) {
      setShowUpdateBanner(true);
    }
  }, [pwa.updateAvailable]);

  // Auto-subscribe to push notifications when user logs in (only if permission already granted)
  // NOTE: We cannot request permission automatically - it requires a user gesture
  // If permission is already granted, we can subscribe automatically
  React.useEffect(() => {
    const PUSH_SUBSCRIPTION_DELAY = 2000; // 2 seconds - wait for service worker to register

    if (isAuthenticated && pwa.subscribeToPush && typeof window !== 'undefined') {
      // Only auto-subscribe if permission is already granted
      // Don't request permission automatically (requires user gesture)
      const currentPermission =
        typeof Notification !== 'undefined' ? Notification.permission : 'denied';

      if (currentPermission === 'granted') {
        const timer = setTimeout(() => {
          pwa.subscribeToPush().catch(() => {
            // Silently ignore subscription errors
          });
        }, PUSH_SUBSCRIPTION_DELAY);

        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, pwa.subscribeToPush]);

  // Check for updates on mount and periodically
  React.useEffect(() => {
    const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

    // Check immediately
    if (pwa.checkForUpdates) {
      pwa.checkForUpdates();
    }

    // Check periodically
    const interval = setInterval(() => {
      if (pwa.checkForUpdates) {
        pwa.checkForUpdates();
      }
    }, UPDATE_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [pwa.checkForUpdates]);

  return (
    <>
      {showUpdateBanner && (
        <PWAUpdateBanner
          onUpdate={() => {
            if (pwa.applyUpdate) {
              pwa.applyUpdate();
            }
          }}
          onDismiss={() => {
            setShowUpdateBanner(false);
            // Auto-show again after 1 hour
            setTimeout(
              () => {
                if (pwa.updateAvailable) {
                  setShowUpdateBanner(true);
                }
              },
              60 * 60 * 1000
            );
          }}
        />
      )}
    </>
  );
}

function App() {
  React.useEffect(() => {
    // Component lifecycle tracking removed for production
  }, []);

  return (
    <ErrorBoundary>
      <div
        style={{
          minHeight: '100dvh',
          height: '100%',
          backgroundColor: '#ffffff',
          width: '100%',
          maxWidth: '100vw',
          overflowX: 'hidden',
        }}
      >
        <AuthProvider>
          <AppContent />
          <InvitationProvider>
            <MediatorProvider>
              <BrowserRouter>
                <Routes>
                  {/* Root route - shows landing or dashboard based on auth */}
                  <Route path="/" element={<ChatRoom />} />
                  {/* Sign in route - dedicated login/signup page */}
                  <Route path="/signin" element={<LoginSignup />} />
                  {/* Accept invitation route - for users accepting co-parent invitations */}
                  <Route path="/accept-invite" element={<AcceptInvitationPage />} />
                  {/* Invite co-parent route - shown after signup */}
                  <Route path="/invite-coparent" element={<InviteCoParentPage />} />
                  {/* Google OAuth callback route */}
                  <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
                  {/* Password reset routes */}
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  {/* UI Component Showcase - Design System Documentation */}
                  <Route path="/ui-showcase" element={<UIShowcase />} />
                  {/* Socket Debug Page - TEMPORARY */}
                  <Route path="/socket-diagnostic" element={<SocketDiagnostic />} />
                  {/* Socket Test v2 - New Simplified System */}
                  <Route path="/socket-test-v2" element={<SocketTestV2 />} />
                  {/* Privacy Policy Page */}
                  <Route path="/privacy" element={<PrivacyPage />} />
                  {/* Terms of Service Page */}
                  <Route path="/terms" element={<TermsPage />} />
                  {/* Catch-all route for typos - redirect to signin */}
                  <Route path="/siginin" element={<LoginSignup />} />
                  <Route path="/sign-in" element={<LoginSignup />} />
                  {/* Catch-all for unknown routes */}
                  <Route path="*" element={<ChatRoom />} />
                  {/* Blog routes moved to marketing site (www.coparentliaizen.com) */}
                  {/* Quizzes */}
                  <Route path="/quizzes" element={<QuizzesPage />} />
                  <Route path="/quizzes/co-parenting-stance" element={<CoParentingStanceQuiz />} />
                </Routes>
              </BrowserRouter>
            </MediatorProvider>
          </InvitationProvider>
        </AuthProvider>
      </div>
    </ErrorBoundary>
  );
}

export default App;
