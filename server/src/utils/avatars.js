// The avatars users can choose from. The pictures themselves live in the client
// (client/src/utils/avatars.js); the server only stores the id and accepts nothing else.
// Keep both lists the same when adding avatars.

// Character drawings (DiceBear "Notionists" and "Lorelei" styles, public domain CC0), one per seed.
export const CHARACTER_SEEDS = ['felix', 'aneka', 'leo', 'mia', 'omar', 'sara', 'kaan', 'zeynep', 'toby', 'nala', 'emre', 'jade'];
export const CHARACTER_STYLES = ['notionists', 'lorelei'];

// Sport badges: a GymFlow icon on a coloured background.
export const BADGE_NAMES = ['dumbbell', 'bike', 'flame', 'zap', 'trophy', 'heart', 'mountain', 'medal'];

export const AVATAR_IDS = [
  ...CHARACTER_STYLES.flatMap((style) => CHARACTER_SEEDS.map((seed) => `${style}-${seed}`)),
  ...BADGE_NAMES.map((name) => `badge-${name}`),
];
