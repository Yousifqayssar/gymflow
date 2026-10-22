import { askGeminiForNutrition, isGeminiConfigured } from '../lib/gemini.js';
import { env } from '../config/env.js';
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

// Time limit for one analysis: a member waits at most totalMs – never minutes. The main model gets
// mainModelMs of it; if it is busy or slow, the faster fallback model gets the rest.
// An object (not constants) so tests can shorten the times.
export const SCANNER_TIMES = { totalMs: 30_000, mainModelMs: 15_000, retryPauseMs: 2_000, minAttemptMs: 3_000 };

// Asks Gemini within the time limit: first the main model, then – if it fails, is overloaded
// or too slow – the lighter fallback model with the time that is left (twice, see below).
async function askWithTimeLimit(image) {
  const deadline = Date.now() + SCANNER_TIMES.totalMs;
  // When Google is overloaded it often refuses within a second ("high demand"); a moment later it may
  // answer. So the fallback model gets a second chance after a short pause, as long as time is left.
  const attempts = [
    { model: env.GEMINI_MODEL, ms: SCANNER_TIMES.mainModelMs },
    { model: env.GEMINI_FALLBACK_MODEL, ms: null }, // null = all the time that is left
    { model: env.GEMINI_FALLBACK_MODEL, ms: null, pauseMs: SCANNER_TIMES.retryPauseMs },
  ];
  let timedOut = false;

  for (const { model, ms, pauseMs } of attempts) {
    if (pauseMs) await new Promise((resolve) => setTimeout(resolve, pauseMs));
    const left = deadline - Date.now();
    if (left < SCANNER_TIMES.minAttemptMs) break;
    try {
      return await askGeminiForNutrition(image, { model, signal: AbortSignal.timeout(ms ? Math.min(ms, left) : left) });
    } catch (error) {
      timedOut ||= error.name === 'TimeoutError' || error.name === 'AbortError';
      console.error(`Gemini (${model}) failed:`, error.name, String(error.message).slice(0, 200));
    }
  }

  if (timedOut) {
    throw new AppError(504, 'The food scanner took too long (over 30 seconds). It is very busy right now – please try again in a minute.', undefined, 'SCANNER_TIMEOUT');
  }
  throw new AppError(502, 'The food scanner is very busy right now (Google’s AI service is overloaded). Please try again in a minute.', undefined, 'SCANNER_UNAVAILABLE');
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

  const answer = await askWithTimeLimit(image);

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
