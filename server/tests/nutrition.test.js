import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

// A fake Gemini: the tests decide what it answers. No key, no internet, no costs.
vi.mock('../src/lib/gemini.js', () => ({
  isGeminiConfigured: vi.fn(() => true),
  askGeminiForNutrition: vi.fn(),
}));

const { app } = await import('../src/app.js');
const { prisma } = await import('../src/lib/prisma.js');
const gemini = await import('../src/lib/gemini.js');
const { ANALYSES_PER_HOUR, SCANNER_TIMES, resetRateLimit } = await import('../src/services/nutrition.service.js');
const { resetDatabase } = await import('./helpers/database.js');
const { createUser, bearer } = await import('./helpers/users.js');

// A tiny valid JPEG header is enough: the fake does not look at the picture.
const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD';

const MEAL = {
  isFood: true,
  items: [
    { name: 'Grilled chicken breast', portionGrams: 150.4, calories: 247.6, proteinG: 46.44, carbsG: 0, fatG: 5.36 },
    { name: 'White rice', portionGrams: 180, calories: 234, proteinG: 4.3, carbsG: 51.2, fatG: 0.5 },
  ],
  note: 'Portion sizes are estimated from the plate.',
};

let member;
const analyze = (body, token = member.token) => request(app).post('/api/nutrition/analyze').set('Authorization', bearer(token)).send(body);

beforeEach(async () => {
  await resetDatabase();
  resetRateLimit();
  SCANNER_TIMES.retryPauseMs = 20; // the real pause is 2 s; the tests do not need to wait
  vi.mocked(gemini.isGeminiConfigured).mockReturnValue(true);
  vi.mocked(gemini.askGeminiForNutrition).mockReset().mockResolvedValue(MEAL);
  member = await createUser({ role: 'MEMBER' });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/nutrition/analyze', () => {
  it('returns the foods with rounded values and adds up the totals itself', async () => {
    const response = await analyze({ image: PHOTO });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      isFood: true,
      items: [
        { name: 'Grilled chicken breast', portionGrams: 150, calories: 248, proteinG: 46.4, carbsG: 0, fatG: 5.4 },
        { name: 'White rice', portionGrams: 180, calories: 234, proteinG: 4.3, carbsG: 51.2, fatG: 0.5 },
      ],
      totals: { calories: 482, proteinG: 50.7, carbsG: 51.2, fatG: 5.9 },
      note: 'Portion sizes are estimated from the plate.',
    });
    // The photo is sent to Gemini without the "data:…;base64," prefix.
    expect(gemini.askGeminiForNutrition).toHaveBeenCalledWith(
      { mimeType: 'image/jpeg', base64: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD' },
      { model: 'gemini-flash-latest', signal: expect.any(AbortSignal) },
    );
  });

  it('says so when the photo shows no food', async () => {
    vi.mocked(gemini.askGeminiForNutrition).mockResolvedValue({ isFood: false, items: [{ name: 'Shoe', portionGrams: 1, calories: 1, proteinG: 0, carbsG: 0, fatG: 0 }] });

    const response = await analyze({ image: PHOTO });

    expect(response.body).toMatchObject({ isFood: false, items: [], totals: { calories: 0 } });
  });

  it.each([
    [{}, 'no photo'],
    [{ image: 'data:image/gif;base64,R0lGOD' }, 'a GIF'],
    [{ image: 'https://example.com/meal.jpg' }, 'a link instead of a photo'],
    [{ image: `data:image/jpeg;base64,${'A'.repeat(3_000_001)}` }, 'a photo that is too large'],
  ])('rejects %o (%s) with 400 or 413', async (body) => {
    const response = await analyze(body);

    expect([400, 413]).toContain(response.status);
    expect(gemini.askGeminiForNutrition).not.toHaveBeenCalled();
  });

  it('explains that the scanner is not set up when there is no API key (503)', async () => {
    vi.mocked(gemini.isGeminiConfigured).mockReturnValue(false);

    const response = await analyze({ image: PHOTO });

    expect(response.status).toBe(503);
    expect(response.body.error.message).toMatch(/not set up/);
  });

  it('answers 502 when Gemini fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(gemini.askGeminiForNutrition).mockRejectedValue(new Error('quota exceeded'));

    expect((await analyze({ image: PHOTO })).status).toBe(502);
  });

  it('switches to the faster fallback model when the main model is busy', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(gemini.askGeminiForNutrition)
      .mockRejectedValueOnce(Object.assign(new Error('This model is currently experiencing high demand'), { name: 'ApiError' }))
      .mockResolvedValueOnce(MEAL);

    const response = await analyze({ image: PHOTO });

    expect(response.status).toBe(200);
    expect(gemini.askGeminiForNutrition).toHaveBeenCalledTimes(2);
    expect(vi.mocked(gemini.askGeminiForNutrition).mock.calls.map(([, options]) => options.model)).toEqual(['gemini-flash-latest', 'gemini-flash-lite-latest']);
  });

  it('asks the fallback model a second time when Google refuses quickly ("high demand")', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const busy = Object.assign(new Error('This model is currently experiencing high demand'), { name: 'ApiError' });
    vi.mocked(gemini.askGeminiForNutrition).mockRejectedValueOnce(busy).mockRejectedValueOnce(busy).mockResolvedValueOnce(MEAL);

    const response = await analyze({ image: PHOTO });

    expect(response.status).toBe(200);
    expect(gemini.askGeminiForNutrition).toHaveBeenCalledTimes(3);
  });

  it('explains clearly when Google stays overloaded (502 SCANNER_UNAVAILABLE)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(gemini.askGeminiForNutrition).mockRejectedValue(new Error('high demand'));

    const response = await analyze({ image: PHOTO });

    expect(response.status).toBe(502);
    expect(response.body.error).toMatchObject({ code: 'SCANNER_UNAVAILABLE', message: expect.stringContaining('very busy') });
  });

  describe('time limit', () => {
    // The real limit is 30 s; here it is shortened so the test runs quickly.
    const real = { ...SCANNER_TIMES };
    beforeEach(() => Object.assign(SCANNER_TIMES, { totalMs: 2000, mainModelMs: 400, minAttemptMs: 200 }));
    afterAll(() => Object.assign(SCANNER_TIMES, real));

    // A Gemini that never answers: it only stops when the time limit aborts it.
    const neverAnswers = (image, { signal }) =>
      new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(signal.reason)));

    it('gives up after the time limit with a clear 504 instead of waiting for minutes', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(gemini.askGeminiForNutrition).mockImplementation(neverAnswers);

      const started = Date.now();
      const response = await analyze({ image: PHOTO });

      expect(Date.now() - started).toBeLessThan(3500);
      expect(response.status).toBe(504);
      expect(response.body.error).toMatchObject({ code: 'SCANNER_TIMEOUT', message: expect.stringContaining('took too long') });
    });

    it('gives the main model only part of the time, so the fallback can still answer', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(gemini.askGeminiForNutrition).mockImplementationOnce(neverAnswers).mockResolvedValueOnce(MEAL);

      const response = await analyze({ image: PHOTO });

      expect(response.status).toBe(200);
      expect(response.body.totals.calories).toBeGreaterThan(0);
    });
  });

  it('answers 502 when Gemini returns nonsense (checked like any outside input)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(gemini.askGeminiForNutrition).mockResolvedValue({ isFood: true, items: [{ name: 'Pizza', calories: -500 }] });

    expect((await analyze({ image: PHOTO })).status).toBe(502);
  });

  it(`allows ${ANALYSES_PER_HOUR} photos per hour per person, then 429`, async () => {
    for (let i = 0; i < ANALYSES_PER_HOUR; i++) {
      expect((await analyze({ image: PHOTO })).status).toBe(200);
    }
    expect((await analyze({ image: PHOTO })).status).toBe(429);

    // Another person is not affected.
    const other = await createUser({ role: 'MEMBER' });
    expect((await analyze({ image: PHOTO }, other.token)).status).toBe(200);
  });

  it.each(['TRAINER', 'ADMIN'])('works for a %s too', async (role) => {
    const { token } = await createUser({ role });
    expect((await analyze({ image: PHOTO }, token)).status).toBe(200);
  });

  it('needs a login (401)', async () => {
    expect((await request(app).post('/api/nutrition/analyze').send({ image: PHOTO })).status).toBe(401);
  });
});
