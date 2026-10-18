import { z } from 'zod';

// A photo as a data URL, e.g. "data:image/jpeg;base64,/9j/4AAQ…".
// The app shrinks photos before sending them, so ~3 million characters (about 2 MB) is plenty.
const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+=*)$/;
export const MAX_IMAGE_LENGTH = 3_000_000;

// Body of POST /api/nutrition/analyze → { mimeType, base64 }
export const analyzeMealSchema = z.object({
  image: z
    .string({ error: 'Choose a photo of your meal' })
    .max(MAX_IMAGE_LENGTH, 'The photo is too large')
    .regex(DATA_URL, 'Use a JPEG, PNG or WebP photo')
    .transform((dataUrl) => {
      const [, mimeType, base64] = DATA_URL.exec(dataUrl);
      return { mimeType, base64 };
    }),
});

// What we accept back from Gemini. AI answers are checked like any other outside input.
const amount = (max) => z.number().min(0).max(max);
export const geminiNutritionSchema = z.object({
  isFood: z.boolean(),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        portionGrams: amount(5000),
        calories: amount(10000),
        proteinG: amount(1000),
        carbsG: amount(1000),
        fatG: amount(1000),
      }),
    )
    .max(20),
  note: z.string().trim().max(300).optional(),
});
