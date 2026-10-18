import { findAvatar } from '../../utils/avatars.js';

// A person's picture: the avatar they chose (a character drawing or a sport badge),
// otherwise a coloured circle with their initials, e.g. "EY" for Elif Yilmaz.
// The initials colour is picked from the name, so the same person always gets the same colour.
//   <Avatar firstName="Elif" lastName="Yilmaz" avatar="notionists-mia" size="lg" />
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

// Icon size inside a sport badge, per avatar size.
const BADGE_ICON_SIZES = { sm: 'size-4', md: 'size-5', lg: 'size-7', xl: 'size-10', '2xl': 'size-14' };

function colorFor(name) {
  let sum = 0;
  for (const char of name) sum += char.charCodeAt(0);
  return COLORS[sum % COLORS.length];
}

function Avatar({ firstName = '', lastName = '', avatar = null, size = 'md' }) {
  const chosen = findAvatar(avatar);
  const base = `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${SIZES[size]}`;

  // Decorative: the name is always written next to the avatar, so screen readers skip the picture.
  if (chosen?.kind === 'character') {
    return <img src={chosen.url} alt="" aria-hidden="true" loading="lazy" className={`${base} bg-surface-3 object-cover`} />;
  }
  if (chosen?.kind === 'badge') {
    const Icon = chosen.icon;
    return (
      <span aria-hidden="true" className={`${base} bg-gradient-to-br text-white ${chosen.gradient}`}>
        <Icon className={BADGE_ICON_SIZES[size]} strokeWidth={2.25} />
      </span>
    );
  }

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  return (
    <span aria-hidden="true" className={`${base} font-semibold ${colorFor(firstName + lastName)}`}>
      {initials}
    </span>
  );
}

export default Avatar;
