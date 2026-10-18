import { askGeminiForNutrition, isGeminiConfigured } from '../lib/gemini.js';
import { AppError } from '../utils/AppError.js';
import { geminiNutritionSchema } from '../validation/nutrition.schemas.js';

// Each analysis uses the gym's Gemini quota, so one person can do at most this many per hour.
export const ANALYSES_PER_HOUR = 20;
const HOUR_MS = 60 * 60 * 1000;
const recentAnalyses = new Map(); // userId → times (ms) of their analyses in the last hour

// Kept in memory: fine for one server; it starts empty again after a restart.
function checkRateLimit(userId, now) {
  const times = (recentAnalyses.get(userId) ?? []).filter((time) => now - time < HOUR_MS);
  if (times.length >= ANALYSES_PER_HOUR) {
    throw new AppError(429, `You can analyse ${ANALYSES_PER_HOUR} photos per hour. Please try again a bit later.`);
  }
  recentAnalyses.set(userId, [...times, now]);
}

// For tests: start every test with no earlier analyses.
export function resetRateLimit() {
  recentAnalyses.clear();
}

const round = (value) => Math.round(value);
const round1 = (value) => Math.round(value * 10) / 10;

// POST /api/nutrition/analyze – estimates the nutrition of the meal in a photo.
// The totals are added up here, not by the AI, so they always match the items.
export async function analyzeMeal(userId, image, now = Date.now()) {
  if (!isGeminiConfigured()) {
    throw new AppError(503, 'The food scanner is not set up yet (missing Gemini API key).');
  }
  checkRateLimit(userId, now);

  let answer;
  try {
    answer = await askGeminiForNutrition(image);
  } catch (error) {
    console.error('Gemini request failed:', error.message);
    throw new AppError(502, 'The food scanner is not available right now. Please try again in a moment.');
  }

  const parsed = geminiNutritionSchema.safeParse(answer);
  if (!parsed.success) {
    console.error('Unexpected Gemini answer:', JSON.stringify(answer).slice(0, 500));
    throw new AppError(502, 'The food scanner could not read this photo. Please try another one.');
  }

  const { isFood, note } = parsed.data;
  const items = isFood
    ? parsed.data.items.map((item) => ({
        name: item.name,
        portionGrams: round(item.portionGrams),
        calories: round(item.calories),
        proteinG: round1(item.proteinG),
        carbsG: round1(item.carbsG),
        fatG: round1(item.fatG),
      }))
    : [];

  const sum = (key) => items.reduce((total, item) => total + item[key], 0);
  return {
    isFood: isFood && items.length > 0,
    items,
    totals: { calories: round(sum('calories')), proteinG: round1(sum('proteinG')), carbsG: round1(sum('carbsG')), fatG: round1(sum('fatG')) },
    note: note ?? null,
  };
}
