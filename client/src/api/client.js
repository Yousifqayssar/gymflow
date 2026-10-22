// One place for all requests to our API.
// It adds the login token, sends/reads JSON, and turns error responses into ApiError.

export const TOKEN_KEY = 'gymflow_token';

// Sent on window when a saved login stops working (expired, or the account was deleted – e.g. demo
// accounts after the demo data was refreshed). AuthProvider then logs the user out politely.
export const SESSION_EXPIRED_EVENT = 'gymflow:session-expired';
export const SESSION_EXPIRED_MESSAGE = 'Your session has ended. Please log in again.';

// Saves the login token in the browser, so the user stays logged in after a page reload.
// localStorage can be blocked (e.g. some private windows), so every access is guarded.
export const tokenStorage = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Not saved: the user will simply need to log in again after a reload.
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Nothing to clear.
    }
  },
};

// An error answer from the API, e.g. 401 "Invalid email or password".
// `details` holds per-field validation errors: [{ field, message }].
// `code` is set for some errors the pages handle specially, e.g. 'MEMBERSHIP_NOT_ACTIVE'.
export class ApiError extends Error {
  constructor(status, message, details = [], code = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

// Sends a request to /api/<path> and returns the JSON body.
// Example: await apiRequest('/auth/login', { method: 'POST', body: { email, password } })
//   timeoutMs: give up after this long (ApiError with code 'TIMEOUT')
//   signal:    lets the page cancel the request (ApiError with code 'CANCELLED')
export async function apiRequest(path, { method = 'GET', body, timeoutMs, signal } = {}) {
  const headers = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = tokenStorage.get();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const timeout = timeoutMs ? AbortSignal.timeout(timeoutMs) : null;
  const signals = [signal, timeout].filter(Boolean);

  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signals.length ? AbortSignal.any(signals) : undefined,
    });
  } catch {
    if (timeout?.aborted) throw new ApiError(0, 'This is taking too long. Please try again.', [], 'TIMEOUT');
    if (signal?.aborted) throw new ApiError(0, 'Cancelled', [], 'CANCELLED');
    // Otherwise fetch only throws when there is no answer at all (server down, no network).
    throw new ApiError(0, 'Cannot reach the server. Please try again later.');
  }

  // Some answers may have no JSON body; treat them as empty.
  const data = await response.json().catch(() => null);

  // We sent a login token and the server no longer accepts it: forget it and tell the app.
  // (A 401 without a token is a normal answer, e.g. a wrong password on the login page.)
  const isLoginRequest = path === '/auth/login' || path === '/auth/register';
  if (response.status === 401 && token && !isLoginRequest) {
    tokenStorage.clear();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    throw new ApiError(401, SESSION_EXPIRED_MESSAGE, [], 'SESSION_EXPIRED');
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error?.message ?? 'Something went wrong. Please try again.',
      data?.error?.details,
      data?.error?.code,
    );
  }

  return data;
}
