import { apiRequest } from './client.js';

// Each function matches one endpoint of the API's /api/auth routes.

export function loginRequest({ email, password }) {
  return apiRequest('/auth/login', { method: 'POST', body: { email, password } });
}

export function registerRequest({ email, password, firstName, lastName }) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: { email, password, firstName, lastName },
  });
}

export function getCurrentUser() {
  return apiRequest('/auth/me');
}
