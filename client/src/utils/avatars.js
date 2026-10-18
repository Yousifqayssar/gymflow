import { Bike, Dumbbell, Flame, Heart, Medal, Mountain, Trophy, Zap } from 'lucide-react';

// The avatars people can choose. The ids must match server/src/utils/avatars.js, which only accepts these.

// Character drawings, generated once by scripts/generate-avatars.mjs (DiceBear, public domain CC0).
// import.meta.glob gives the URL of every SVG file in the folder; each file is downloaded only when shown.
const CHARACTER_FILES = import.meta.glob('../assets/avatars/*.svg', { eager: true, query: '?url', import: 'default' });

const CHARACTER_SEEDS = ['felix', 'aneka', 'leo', 'mia', 'omar', 'sara', 'kaan', 'zeynep', 'toby', 'nala', 'emre', 'jade'];

export const CHARACTER_GROUPS = [
  { style: 'notionists', label: 'Sketch' },
  { style: 'lorelei', label: 'Portrait' },
].map((group) => ({
  ...group,
  avatars: CHARACTER_SEEDS.map((seed) => {
    const id = `${group.style}-${seed}`;
    return { id, kind: 'character', url: CHARACTER_FILES[`../assets/avatars/${id}.svg`] };
  }),
}));

// Sport badges: a white icon on a gradient in the app's colours.
export const BADGE_AVATARS = [
  { id: 'badge-dumbbell', icon: Dumbbell, gradient: 'from-brand-400 to-brand-700' },
  { id: 'badge-bike', icon: Bike, gradient: 'from-sky-400 to-blue-600' },
  { id: 'badge-flame', icon: Flame, gradient: 'from-orange-400 to-red-600' },
  { id: 'badge-zap', icon: Zap, gradient: 'from-amber-300 to-orange-500' },
  { id: 'badge-trophy', icon: Trophy, gradient: 'from-yellow-300 to-amber-600' },
  { id: 'badge-heart', icon: Heart, gradient: 'from-rose-400 to-pink-600' },
  { id: 'badge-mountain', icon: Mountain, gradient: 'from-teal-400 to-emerald-700' },
  { id: 'badge-medal', icon: Medal, gradient: 'from-violet-400 to-fuchsia-600' },
].map((badge) => ({ ...badge, kind: 'badge' }));

const ALL_AVATARS = new Map(
  [...CHARACTER_GROUPS.flatMap((group) => group.avatars), ...BADGE_AVATARS].map((avatar) => [avatar.id, avatar]),
);

// The avatar for an id, or null (no avatar chosen, or an id this version of the app does not know).
export function findAvatar(id) {
  return (id && ALL_AVATARS.get(id)) || null;
}
