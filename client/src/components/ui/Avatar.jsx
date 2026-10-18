// A coloured circle with a person's initials, e.g. "EY" for Elif Yilmaz.
// The colour is picked from the name, so the same person always gets the same colour.
const COLORS = [
  'bg-brand-100 dark:bg-brand-500/15 text-brand-800 dark:text-brand-300',
  'bg-sky-100 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300',
  'bg-violet-100 dark:bg-violet-500/15 text-violet-800 dark:text-violet-300',
  'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300',
  'bg-rose-100 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300',
  'bg-teal-100 dark:bg-teal-500/15 text-teal-800 dark:text-teal-300',
];

const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-20 text-2xl',
  '2xl': 'size-28 font-display text-5xl',
};

function colorFor(name) {
  let sum = 0;
  for (const char of name) sum += char.charCodeAt(0);
  return COLORS[sum % COLORS.length];
}

function Avatar({ firstName = '', lastName = '', size = 'md' }) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${SIZES[size]} ${colorFor(firstName + lastName)}`}
    >
      {initials}
    </span>
  );
}

export default Avatar;
