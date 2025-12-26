import './index.css';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatRoom from './ChatRoom.jsx';
import { AcceptInvitationPage, InviteCoParentPage } from './features/invitations';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { PWAUpdateBanner } from './features/pwa/components/PWAUpdateBanner.jsx';
import { usePWA } from './hooks/pwa/usePWA.js';
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
// Quizzes
import { QuizzesPage } from './features/quizzes/QuizzesPage.jsx';
import { CoParentingStanceQuiz } from './features/quizzes/CoParentingStanceQuiz.jsx';
// Blog articles
import { WhyArgumentsRepeat } from './features/blog/WhyArgumentsRepeat.jsx';
import { EmotionalTriggers } from './features/blog/EmotionalTriggers.jsx';
import { EmotionalRegulation } from './features/blog/EmotionalRegulation.jsx';
import { ReactionVsResponse } from './features/blog/ReactionVsResponse.jsx';
import { PauseBeforeReacting } from './features/blog/PauseBeforeReacting.jsx';
import { DefensivenessStrategies } from './features/blog/DefensivenessStrategies.jsx';
import { WhyItFeelsImpossible } from './features/blog/WhyItFeelsImpossible.jsx';
import { DeEscalationTechniques } from './features/blog/DeEscalationTechniques.jsx';
import { GaslightingGuiltBlame } from './features/blog/GaslightingGuiltBlame.jsx';
import { MentalHealthProtection } from './features/blog/MentalHealthProtection.jsx';
import { EveryConversationFight } from './features/blog/EveryConversationFight.jsx';
import { LongTermEffects } from './features/blog/LongTermEffects.jsx';
import { WhatKidsNeed } from './features/blog/WhatKidsNeed.jsx';
import { StabilityStress } from './features/blog/StabilityStress.jsx';
import { ModelingCommunication } from './features/blog/ModelingCommunication.jsx';
import { BlogPillarPage } from './features/blog/BlogPillarPage.jsx';
import { AiGuidedMediation } from './features/blog/AiGuidedMediation.jsx';
import { EscalationPrevention } from './features/blog/EscalationPrevention.jsx';
import { CalmCommunication } from './features/blog/CalmCommunication.jsx';
import { AiSafety } from './features/blog/AiSafety.jsx';
import { AiVsImpulse } from './features/blog/AiVsImpulse.jsx';

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
    console.log('[App] PWA initialized');
  }, [pwa]);

  // Show update banner when update is available
  React.useEffect(() => {
    if (pwa.updateAvailable) {
      setShowUpdateBanner(true);
    }
  }, [pwa.updateAvailable]);

  // Auto-subscribe to push notifications when user logs in
  React.useEffect(() => {
    const PUSH_SUBSCRIPTION_DELAY = 2000; // 2 seconds - wait for service worker to register

    if (isAuthenticated && pwa.subscribeToPush && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        console.log('[App] User authenticated, attempting to subscribe to push notifications...');
        pwa.subscribeToPush().catch(error => {
          console.warn('[App] Could not subscribe to push notifications:', error);
        });
      }, PUSH_SUBSCRIPTION_DELAY);

      return () => clearTimeout(timer);
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
  console.log('[App] Component rendering...');

  React.useEffect(() => {
    console.log('[App] App component mounted');
    return () => {
      console.log('[App] App component unmounting');
    };
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
                  {/* Privacy Policy Page */}
                  <Route path="/privacy" element={<PrivacyPage />} />
                  {/* Terms of Service Page */}
                  <Route path="/terms" element={<TermsPage />} />
                  {/* Catch-all route for typos - redirect to signin */}
                  <Route path="/siginin" element={<LoginSignup />} />
                  <Route path="/sign-in" element={<LoginSignup />} />
                  {/* Catch-all for unknown routes */}
                  <Route path="*" element={<ChatRoom />} />
                  {/* Blog Routes */}
                  {/* Pillar 1: Communication */}
                  <Route
                    path="/co-parenting-communication"
                    element={<BlogPillarPage categoryId="communication" />}
                  />
                  <Route
                    path="/break-co-parenting-argument-cycle-game-theory"
                    element={<WhyArgumentsRepeat />}
                  />
                  <Route
                    path="/co-parenting-communication/why-arguments-repeat"
                    element={<WhyArgumentsRepeat />}
                  />{' '}
                  {/* Legacy URL redirect */}
                  <Route
                    path="/co-parenting-communication/emotional-triggers"
                    element={<EmotionalTriggers />}
                  />
                  <Route
                    path="/co-parenting-communication/emotional-regulation"
                    element={<EmotionalRegulation />}
                  />
                  <Route
                    path="/co-parenting-communication/reaction-vs-response"
                    element={<ReactionVsResponse />}
                  />
                  <Route
                    path="/co-parenting-communication/pause-before-reacting"
                    element={<PauseBeforeReacting />}
                  />
                  <Route
                    path="/co-parenting-communication/defensiveness-strategies"
                    element={<DefensivenessStrategies />}
                  />
                  {/* Pillar 2: High Conflict */}
                  <Route
                    path="/high-conflict-co-parenting"
                    element={<BlogPillarPage categoryId="high-conflict" />}
                  />
                  <Route
                    path="/high-conflict/why-it-feels-impossible"
                    element={<WhyItFeelsImpossible />}
                  />
                  <Route
                    path="/high-conflict/de-escalation-techniques"
                    element={<DeEscalationTechniques />}
                  />
                  <Route
                    path="/high-conflict/gaslighting-guilt-blame"
                    element={<GaslightingGuiltBlame />}
                  />
                  <Route
                    path="/high-conflict/mental-health-protection"
                    element={<MentalHealthProtection />}
                  />
                  <Route
                    path="/high-conflict/every-conversation-fight"
                    element={<EveryConversationFight />}
                  />
                  {/* Pillar 3: Child Centered */}
                  <Route
                    path="/child-centered-co-parenting"
                    element={<BlogPillarPage categoryId="child-centered" />}
                  />
                  <Route path="/child-impact/long-term-effects" element={<LongTermEffects />} />
                  <Route path="/child-impact/what-kids-need" element={<WhatKidsNeed />} />
                  <Route path="/child-impact/stability-stress" element={<StabilityStress />} />
                  <Route
                    path="/child-impact/modeling-communication"
                    element={<ModelingCommunication />}
                  />
                  {/* Pillar 4: AI Tools */}
                  <Route
                    path="/liaizen-ai-co-parenting"
                    element={<BlogPillarPage categoryId="liaizen-ai" />}
                  />
                  <Route path="/liaizen/how-ai-mediation-works" element={<AiGuidedMediation />} />
                  <Route path="/liaizen/escalation-prevention" element={<EscalationPrevention />} />
                  <Route path="/liaizen/calm-communication-ai" element={<CalmCommunication />} />
                  <Route path="/liaizen/ai-safety-for-parents" element={<AiSafety />} />
                  <Route path="/liaizen/ai-vs-impulse" element={<AiVsImpulse />} />
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
