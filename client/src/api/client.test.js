import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest, SESSION_EXPIRED_EVENT, TOKEN_KEY } from './client.js';

// A fetch stand-in that answers with the given status and JSON body.
const answer = (status, body) => vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body), { status }));

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('apiRequest – a saved login that stopped working', () => {
  it('forgets the token, tells the app and gives a polite message', async () => {
    localStorage.setItem(TOKEN_KEY, 'old-token-of-a-deleted-demo-account');
    answer(401, { error: { message: 'Invalid or expired token' } });
    const onExpired = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);

    await expect(apiRequest('/classes')).rejects.toMatchObject({ status: 401, code: 'SESSION_EXPIRED', message: 'Your session has ended. Please log in again.' });

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(onExpired).toHaveBeenCalledTimes(1);
    window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  });

  it('a wrong password on the login page stays a normal error (no "session ended")', async () => {
    localStorage.setItem(TOKEN_KEY, 'some-token');
    answer(401, { error: { message: 'Invalid email or password' } });

    await expect(apiRequest('/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({ message: 'Invalid email or password' });
    expect(localStorage.getItem(TOKEN_KEY)).toBe('some-token');
  });
});
