import './index.css';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatRoom from './ChatRoom.jsx';
import { LoginSignup } from './components/LoginSignup.jsx';
import { GoogleOAuthCallback } from './components/GoogleOAuthCallback.jsx';
import { UIShowcase } from './components/UIShowcase.jsx'; // Design system showcase
import { PrivacyPage } from './components/PrivacyPage.jsx';
import { usePWA } from './hooks/usePWA.js';
import { MediatorProvider } from './context/MediatorContext.jsx';

function App() {
  // Initialize PWA - registers Service Worker and enables push notifications
  const pwa = usePWA();

  // Make PWA API available globally for components that need it
  React.useEffect(() => {
    window.liaizenPWA = pwa;
  }, [pwa]);

  return (
    <MediatorProvider>
      <BrowserRouter>
        <Routes>
          {/* Root route - shows landing or dashboard based on auth */}
          <Route path="/" element={<ChatRoom />} />

          {/* Sign in route - dedicated login/signup page */}
          <Route path="/signin" element={<LoginSignup />} />

          {/* Google OAuth callback route */}
          <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />

          {/* UI Component Showcase - Design System Documentation */}
          <Route path="/ui-showcase" element={<UIShowcase />} />

          {/* Privacy Policy Page */}
          <Route path="/privacy" element={<PrivacyPage />} />
        </Routes>
      </BrowserRouter>
    </MediatorProvider>
  );
}

export default App;
