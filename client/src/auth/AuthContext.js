import { createContext } from 'react';

// Shared "who is logged in" information for the whole app.
// The value is provided by <AuthProvider> and read with useAuth().
export const AuthContext = createContext(null);
