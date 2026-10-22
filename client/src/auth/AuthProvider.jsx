import { useEffect, useState } from 'react';
import { AuthContext } from './AuthContext.js';
import { SESSION_EXPIRED_EVENT, TOKEN_KEY, tokenStorage } from '../api/client.js';
import { getCurrentUser, loginRequest, registerRequest } from '../api/auth.js';

// Keeps track of the logged-in user and makes it available to every page.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // If a token was saved earlier, we must first ask the API who it belongs to.
  const [isLoading, setIsLoading] = useState(() => tokenStorage.get() !== null);
  // True after a saved login stopped working: the login page then explains why the user is there.
  const [sessionExpired, setSessionExpired] = useState(false);

  // On page load: turn a saved token back into a logged-in user.
  useEffect(() => {
    if (!tokenStorage.get()) return;

    let ignore = false;
    getCurrentUser()
      .then((data) => {
        if (!ignore) setUser(data.user);
      })
      .catch(() => {
        // Token expired, invalid, or the user was deleted: forget it.
        tokenStorage.clear();
        if (!ignore) setSessionExpired(true);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // A request was refused because the saved login no longer works (see api/client.js): log out.
  // The protected page then sends the user to the login page, which brings them back afterwards.
  useEffect(() => {
    function handleExpired() {
      setUser(null);
      setSessionExpired(true);
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  // All tabs of the browser share one saved token. When another tab logs in (maybe as someone else)
  // or logs out, follow it here too – otherwise this tab would show one person but send requests as another.
  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== null && event.key !== TOKEN_KEY) return;
      if (!tokenStorage.get()) {
        setUser(null);
        return;
      }
      getCurrentUser()
        .then((data) => setUser(data.user))
        .catch(() => setUser(null));
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Both login and register answer with { user, token }.
  function startSession({ user: loggedInUser, token }) {
    tokenStorage.set(token);
    setSessionExpired(false);
    setUser(loggedInUser);
  }

  async function login(credentials) {
    startSession(await loginRequest(credentials));
  }

  async function register(details) {
    startSession(await registerRequest(details));
  }

  function logout() {
    tokenStorage.clear();
    setSessionExpired(false);
    setUser(null);
  }

  // After the user changed their own account (e.g. a new avatar): show the new data everywhere.
  function updateCurrentUser(updatedUser) {
    setUser(updatedUser);
  }

  const value = { user, isLoading, sessionExpired, login, register, logout, updateCurrentUser };
  return <AuthContext value={value}>{children}</AuthContext>;
}
