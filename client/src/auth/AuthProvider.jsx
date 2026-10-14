import { useEffect, useState } from 'react';
import { AuthContext } from './AuthContext.js';
import { tokenStorage } from '../api/client.js';
import { getCurrentUser, loginRequest, registerRequest } from '../api/auth.js';

// Keeps track of the logged-in user and makes it available to every page.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // If a token was saved earlier, we must first ask the API who it belongs to.
  const [isLoading, setIsLoading] = useState(() => tokenStorage.get() !== null);

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
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Both login and register answer with { user, token }.
  function startSession({ user: loggedInUser, token }) {
    tokenStorage.set(token);
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
    setUser(null);
  }

  const value = { user, isLoading, login, register, logout };
  return <AuthContext value={value}>{children}</AuthContext>;
}
