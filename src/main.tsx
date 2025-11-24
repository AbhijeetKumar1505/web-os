// Main Entry Point

import React from 'react';
import ReactDOM from 'react-dom/client';
import { WebOSShell } from './components/WebOSShell';
import './styles/globals.css';

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.warn('SW registration failed (this is normal in development): ', registrationError);
      });
  });
}

// Initialize WebOS
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WebOSShell 
      enableHandTracking={true}
      showGestureHints={true}
      showCameraFeed={true}
    />
  </React.StrictMode>,
);
