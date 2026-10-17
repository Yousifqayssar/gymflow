import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../theme/useTheme.js';

// Sun/moon button that switches between light and dark mode.
// `withLabel` shows the text next to the icon (used in the phone menu).
function ThemeToggle({ withLabel = false, className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  const Icon = isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={withLabel ? undefined : label}
      className={`flex items-center gap-2 rounded-lg p-2 text-muted transition-colors hover:bg-surface-3 hover:text-ink ${className}`}
    >
      <Icon className="size-5" aria-hidden="true" />
      {withLabel && <span className="text-sm font-medium">{isDark ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
}

export default ThemeToggle;
