import './index.css';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatRoom from './ChatRoom.jsx';
import { LoginSignup } from './components/LoginSignup.jsx';
import { AcceptInvitationPage } from './components/AcceptInvitationPage.jsx';
import { InviteCoParentPage } from './components/InviteCoParentPage.jsx';
import { GoogleOAuthCallback } from './components/GoogleOAuthCallback.jsx';
import { UIShowcase } from './components/UIShowcase.jsx'; // Design system showcase
import { PrivacyPage } from './components/PrivacyPage.jsx';
import { TermsPage } from './components/TermsPage.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { usePWA } from './hooks/usePWA.js';
import { MediatorProvider } from './context/MediatorContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { InvitationProvider } from './context/InvitationContext.jsx';
import { WhyArgumentsRepeat } from './components/blog/WhyArgumentsRepeat.jsx';
import { EmotionalTriggers } from './components/blog/EmotionalTriggers.jsx';
import { EmotionalRegulation } from './components/blog/EmotionalRegulation.jsx';
import { ReactionVsResponse } from './components/blog/ReactionVsResponse.jsx';
import { PauseBeforeReacting } from './components/blog/PauseBeforeReacting.jsx';
import { DefensivenessStrategies } from './components/blog/DefensivenessStrategies.jsx';
import { WhyItFeelsImpossible } from './components/blog/WhyItFeelsImpossible.jsx';
import { DeEscalationTechniques } from './components/blog/DeEscalationTechniques.jsx';
import { GaslightingGuiltBlame } from './components/blog/GaslightingGuiltBlame.jsx';
import { MentalHealthProtection } from './components/blog/MentalHealthProtection.jsx';
import { EveryConversationFight } from './components/blog/EveryConversationFight.jsx';
import { LongTermEffects } from './components/blog/LongTermEffects.jsx';
import { WhatKidsNeed } from './components/blog/WhatKidsNeed.jsx';
import { StabilityStress } from './components/blog/StabilityStress.jsx';
import { ModelingCommunication } from './components/blog/ModelingCommunication.jsx';
import { BlogPillarPage } from './components/blog/BlogPillarPage.jsx';
import { AiGuidedMediation } from './components/blog/AiGuidedMediation.jsx';
import { EscalationPrevention } from './components/blog/EscalationPrevention.jsx';
import { CalmCommunication } from './components/blog/CalmCommunication.jsx';
import { AiSafety } from './components/blog/AiSafety.jsx';
import { AiVsImpulse } from './components/blog/AiVsImpulse.jsx';
import { ForgotPassword } from './components/ForgotPassword.jsx';
import { ResetPassword } from './components/ResetPassword.jsx';
import { QuizzesPage } from './components/quizzes/QuizzesPage.jsx';
import { CoParentingStanceQuiz } from './components/quizzes/CoParentingStanceQuiz.jsx';

function App() {
  // Initialize PWA - registers Service Worker and enables push notifications
  const pwa = usePWA();

  // Make PWA API available globally for components that need it
  React.useEffect(() => {
    window.liaizenPWA = pwa;
  }, [pwa]);

  return (
    <ErrorBoundary>
      <AuthProvider>
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

                {/* Blog Routes */}
                {/* Pillar 1: Communication */}
                <Route path="/co-parenting-communication" element={<BlogPillarPage categoryId="communication" />} />
                <Route path="/break-co-parenting-argument-cycle-game-theory" element={<WhyArgumentsRepeat />} />
                <Route path="/co-parenting-communication/why-arguments-repeat" element={<WhyArgumentsRepeat />} /> {/* Legacy URL redirect */}
                <Route path="/co-parenting-communication/emotional-triggers" element={<EmotionalTriggers />} />
                <Route path="/co-parenting-communication/emotional-regulation" element={<EmotionalRegulation />} />
                <Route path="/co-parenting-communication/reaction-vs-response" element={<ReactionVsResponse />} />
                <Route path="/co-parenting-communication/pause-before-reacting" element={<PauseBeforeReacting />} />
                <Route path="/co-parenting-communication/defensiveness-strategies" element={<DefensivenessStrategies />} />

                {/* Pillar 2: High Conflict */}
                <Route path="/high-conflict-co-parenting" element={<BlogPillarPage categoryId="high-conflict" />} />
                <Route path="/high-conflict/why-it-feels-impossible" element={<WhyItFeelsImpossible />} />
                <Route path="/high-conflict/de-escalation-techniques" element={<DeEscalationTechniques />} />
                <Route path="/high-conflict/gaslighting-guilt-blame" element={<GaslightingGuiltBlame />} />
                <Route path="/high-conflict/mental-health-protection" element={<MentalHealthProtection />} />
                <Route path="/high-conflict/every-conversation-fight" element={<EveryConversationFight />} />

                {/* Pillar 3: Child Centered */}
                <Route path="/child-centered-co-parenting" element={<BlogPillarPage categoryId="child-centered" />} />
                <Route path="/child-impact/long-term-effects" element={<LongTermEffects />} />
                <Route path="/child-impact/what-kids-need" element={<WhatKidsNeed />} />
                <Route path="/child-impact/stability-stress" element={<StabilityStress />} />
                <Route path="/child-impact/modeling-communication" element={<ModelingCommunication />} />

                {/* Pillar 4: AI Tools */}
                <Route path="/liaizen-ai-co-parenting" element={<BlogPillarPage categoryId="liaizen-ai" />} />
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
    </ErrorBoundary>
  );
}

export default App;
