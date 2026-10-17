// A small coloured label, e.g. "Active" or "Expired".
const TONES = {
  green: 'bg-green-100 dark:bg-green-500/15 text-green-800 dark:text-green-300',
  amber: 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300',
  red: 'bg-red-100 dark:bg-red-500/15 text-red-800 dark:text-red-300',
  blue: 'bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300',
  gray: 'bg-surface-3 text-ink-3',
};

function Badge({ tone = 'gray', children }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export default Badge;
