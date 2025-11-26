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

            {/* UI Component Showcase - Design System Documentation */}
            <Route path="/ui-showcase" element={<UIShowcase />} />

            {/* Privacy Policy Page */}
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Terms of Service Page */}
            <Route path="/terms" element={<TermsPage />} />
          </Routes>
        </BrowserRouter>
      </MediatorProvider>
      </InvitationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
