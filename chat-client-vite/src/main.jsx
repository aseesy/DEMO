import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Unregister any existing service workers (from legacy app)
// This fixes Safari issues with service workers intercepting navigation
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('Service worker unregistered');
        }
      }).catch((err) => {
        console.error('Error unregistering service worker:', err);
      });
    }
  }).catch((err) => {
    console.error('Error getting service worker registrations:', err);
  });
  
  // Also try to unregister by scope
  navigator.serviceWorker.ready.then((registration) => {
    registration.unregister().catch(() => {
      // Ignore errors if already unregistered
    });
  }).catch(() => {
    // Ignore if no service worker is registered
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
