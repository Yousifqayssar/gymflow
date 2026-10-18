import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';

// The only place that talks to Google Gemini. Tests replace this file with a fake,
// so they never need a key or the internet.

let client = null;

export function isGeminiConfigured() {
  return Boolean(env.GEMINI_API_KEY);
}

// The shape of the answer we ask Gemini for (JSON Schema). Gemini then answers with exactly
// this JSON instead of free text, which our code can check and use.
const NUTRITION_SCHEMA = {
  type: 'object',
  properties: {
    isFood: { type: 'boolean', description: 'false if the photo does not show food or a drink' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Short English name, e.g. "Grilled chicken breast"' },
          portionGrams: { type: 'number', description: 'Estimated weight of this portion in grams' },
          calories: { type: 'number', description: 'kcal for this portion' },
          proteinG: { type: 'number' },
          carbsG: { type: 'number' },
          fatG: { type: 'number' },
        },
        required: ['name', 'portionGrams', 'calories', 'proteinG', 'carbsG', 'fatG'],
      },
    },
    note: { type: 'string', description: 'One short sentence, e.g. what was hard to estimate' },
  },
  required: ['isFood', 'items'],
};

const INSTRUCTIONS = `You are a nutrition assistant in a gym app. Look at the photo of a meal.
List every food and drink you can see as a separate item. Estimate the portion size in grams from
the plate and objects around it, and give realistic values for calories (kcal), protein, carbohydrates
and fat for that portion. If the photo does not show food or a drink, set isFood to false and return no items.
Answer in English.`;

// Sends one photo to Gemini and returns its JSON answer as an object (not yet checked).
export async function askGeminiForNutrition({ mimeType, base64 }) {
  client ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const response = await client.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ inlineData: { mimeType, data: base64 } }, { text: INSTRUCTIONS }] }],
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: NUTRITION_SCHEMA,
      temperature: 0.2, // stable estimates: the same photo should give (almost) the same numbers
    },
  });
  return JSON.parse(response.text);
}
