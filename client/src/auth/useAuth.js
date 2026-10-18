import { useContext } from 'react';
import { AuthContext } from './AuthContext.js';

// Gives any component access to: user, isLoading, login, register, logout, updateCurrentUser.
// Example: const { user, logout } = useAuth();
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return auth;
}
