import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../auth/useAuth.js';
import FullPageMessage from './FullPageMessage.jsx';

// Wraps the login and register pages: someone who is already logged in
// has no reason to see them, so they go to the home page instead.
function GuestRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageMessage>Loading…</FullPageMessage>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default GuestRoute;
