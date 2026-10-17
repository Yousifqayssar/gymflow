import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import '@fontsource-variable/inter'; // the Inter font, bundled with the app (no external request)
import '@fontsource/barlow-condensed/600.css'; // sporty display font for titles and numbers
import '@fontsource/barlow-condensed/700.css';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthProvider.jsx';
import { ToastProvider } from './components/ui/ToastProvider.jsx';
import { ThemeProvider } from './theme/ThemeProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
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
  </StrictMode>,
);
