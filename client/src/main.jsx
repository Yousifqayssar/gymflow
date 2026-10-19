import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { LazyMotion, MotionConfig } from 'motion/react';
import '@fontsource-variable/inter'; // the Inter font, bundled with the app (no external request)
import '@fontsource/barlow-condensed/600.css'; // sporty display font for titles and numbers
import '@fontsource/barlow-condensed/700.css';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthProvider.jsx';
import { ToastProvider } from './components/ui/ToastProvider.jsx';
import { ThemeProvider } from './theme/ThemeProvider.jsx';

// Animation features are downloaded separately (see utils/motionFeatures.js).
const loadMotionFeatures = () => import('./utils/motionFeatures.js').then((module) => module.default);

// Installable app (PWA): register the service worker (public/sw.js). Only in the built app –
// in development it could get in the way of Vite's live reloading.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* LazyMotion: loads only the animation features we use (smaller download).
        MotionConfig: animations are switched off for people who ask their system for less motion. */}
    <LazyMotion features={loadMotionFeatures} strict>
    <MotionConfig reducedMotion="user">
    {/* ThemeProvider: light or dark mode */}
    <ThemeProvider>
    {/* BrowserRouter: lets the app show different pages for different URLs */}
    <BrowserRouter>
      {/* AuthProvider: makes the logged-in user available everywhere */}
      <AuthProvider>
        {/* ToastProvider: lets any page show a short success message */}
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
    </MotionConfig>
    </LazyMotion>
  </StrictMode>,
);
