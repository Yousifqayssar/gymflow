import { apiRequest } from './client.js';

// PUT /api/account/avatar (any logged-in user) – avatar id, or null for the initials. Answers { user }.
export function updateMyAvatar(avatar) {
  return apiRequest('/account/avatar', { method: 'PUT', body: { avatar } });
}
