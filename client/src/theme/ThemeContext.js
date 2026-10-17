import { createContext } from 'react';

// The current colour theme ('light' or 'dark') and a function to switch it.
// The value is provided by <ThemeProvider> and read with useTheme().
export const ThemeContext = createContext(null);
