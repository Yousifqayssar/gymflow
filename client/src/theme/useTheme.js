import { useContext } from 'react';
import { ThemeContext } from './ThemeContext.js';

// Gives any component access to: theme ('light' | 'dark'), toggleTheme.
// Example: const { theme, toggleTheme } = useTheme();
export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return value;
}
