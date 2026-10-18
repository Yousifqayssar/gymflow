import { z } from 'zod';
import { AVATAR_IDS } from '../utils/avatars.js';

// Body of PUT /api/account/avatar: one of our avatar ids, or null for "show my initials".
export const avatarSchema = z.object({
  avatar: z.enum(AVATAR_IDS, { error: 'Choose one of the GymFlow avatars' }).nullable(),
});
