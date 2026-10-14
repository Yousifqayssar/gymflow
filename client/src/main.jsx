import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter: lets the app show different pages for different URLs */}
    <BrowserRouter>
      {/* AuthProvider: makes the logged-in user available everywhere */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
