import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth/useAuth.js';
import FullPageMessage from './FullPageMessage.jsx';

// Wraps pages that need a logged-in user.
// Not logged in → go to /login, and remember where the user wanted to go.
// With `roles`, only those roles may open the page; others go to the home page.
// (This is only for a nice user experience: the API checks permissions again.)
function ProtectedRoute({ roles }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullPageMessage>Loading…</FullPageMessage>;
  }

  if (!user) {
    // A visitor who lands on the site root sees the public front page, not the login form.
    if (location.pathname === '/') {
      return <Navigate to="/welcome" replace />;
    }
    // Keep the ?query too: a member who scans a class QR while logged out comes back to it with the code.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // <Outlet /> renders the child route, e.g. the home page.
  return <Outlet />;
}

export default ProtectedRoute;
