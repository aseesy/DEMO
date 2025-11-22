import './index.css';
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatRoom from './ChatRoom.jsx';
import { LoginSignup } from './components/LoginSignup.jsx';
import { GoogleOAuthCallback } from './components/GoogleOAuthCallback.jsx';
// import { UIShowcase } from './components/UIShowcase.jsx'; // Dev only - disabled in production
import { usePWA } from './hooks/usePWA.js';

function App() {
  // Initialize PWA - registers Service Worker and enables push notifications
  const pwa = usePWA();

  // Make PWA API available globally for components that need it
  React.useEffect(() => {
    window.liaizenPWA = pwa;
  }, [pwa]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Root route - shows landing or dashboard based on auth */}
        <Route path="/" element={<ChatRoom />} />

        {/* Sign in route - dedicated login/signup page */}
        <Route path="/signin" element={<LoginSignup />} />

        {/* Google OAuth callback route */}
        <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />

        {/* UI Component Showcase - Design System Documentation */}
        {/* <Route path="/ui-showcase" element={<UIShowcase />} /> */} {/* Dev only - disabled in production */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
