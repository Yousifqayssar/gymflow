import { useEffect, useState } from 'react';
import { ThemeContext } from './ThemeContext.js';

// The same key is read by the small script in index.html, which sets the theme before React starts
// (otherwise a dark-mode user would see a white flash on every page load).
const THEME_KEY = 'gymflow_theme';
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

// The user's own choice ('light' | 'dark'), or null when they never chose: then the system setting decides.
function readChoice() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null; // storage blocked (e.g. some private windows): just follow the system
  }
}

function saveChoice(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Not saved: the choice only lasts until the page is reloaded.
  }
}

// Light or dark mode for the whole app. CSS reads it from <html data-theme="…"> (see index.css).
export function ThemeProvider({ children }) {
  const [choice, setChoice] = useState(readChoice);
  const [systemIsDark, setSystemIsDark] = useState(darkQuery.matches);
  const theme = choice ?? (systemIsDark ? 'dark' : 'light');

  // Follow the system setting live (e.g. Windows switching to dark mode in the evening).
  useEffect(() => {
    const handleChange = (event) => setSystemIsDark(event.matches);
    darkQuery.addEventListener('change', handleChange);
    return () => darkQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    saveChoice(next);
    setChoice(next);
  }

  return <ThemeContext value={{ theme, toggleTheme }}>{children}</ThemeContext>;
}
