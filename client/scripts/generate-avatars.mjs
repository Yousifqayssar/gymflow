// Generates the character avatars once as SVG files in src/assets/avatars/.
// Run with: npm run avatars:generate   (only needed when the list below changes)
//
// The drawings come from DiceBear (https://www.dicebear.com): styles "Notionists" (by Zoish)
// and "Lorelei" (by Lisa Wischofsky), both public domain (CC0 1.0). The same seed always gives
// the same face, so the files can be generated again at any time.
// The ids must match server/src/utils/avatars.js.
import { mkdirSync, writeFileSync } from 'node:fs';
import { createAvatar } from '@dicebear/core';
import * as lorelei from '@dicebear/lorelei';
import * as notionists from '@dicebear/notionists';

const SEEDS = ['felix', 'aneka', 'leo', 'mia', 'omar', 'sara', 'kaan', 'zeynep', 'toby', 'nala', 'emre', 'jade'];
const STYLES = { notionists, lorelei };
// Soft background colours in the GymFlow palette (emerald, sky, violet, amber, rose, teal).
const BACKGROUNDS = ['d1fae5', 'e0f2fe', 'ede9fe', 'fef3c7', 'ffe4e6', 'ccfbf1'];

const outDir = new URL('../src/assets/avatars/', import.meta.url);
mkdirSync(outDir, { recursive: true });

for (const [styleName, style] of Object.entries(STYLES)) {
  SEEDS.forEach((seed, index) => {
    const svg = createAvatar(style, {
      seed,
      backgroundColor: [BACKGROUNDS[index % BACKGROUNDS.length]],
    }).toString();
    writeFileSync(new URL(`${styleName}-${seed}.svg`, outDir), svg);
  });
}
console.log(`Wrote ${SEEDS.length * Object.keys(STYLES).length} avatars to src/assets/avatars/`);
