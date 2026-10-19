import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth/useAuth.js';
import FullPageMessage from './FullPageMessage.jsx';

// Wraps the login and register pages: someone who is already logged in
// has no reason to see them, so they go to the home page instead – or, right after logging in,
// back to the page they wanted (the same place LoginPage sends them, so the two do not race).
function GuestRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullPageMessage>Loading…</FullPageMessage>;
  }

  if (user) {
    return <Navigate to={location.state?.from ?? '/'} replace />;
  }

  return <Outlet />;
}

export default GuestRoute;
