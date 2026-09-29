import { callApi } from './api';

// Mirrors the server's checks in handlers/adminHandler.js so most mistakes
// are caught before the round trip. The server remains the authority.
export const MIN_ADMIN_PASSWORD_LENGTH = 12;

export const validateAdminPassword = (password, confirm) => {
  if (!password) return null; // empty = let the server use its ADMIN_PASSWORD
  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_ADMIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.trim() !== password) return 'The password cannot start or end with a space.';
  if (password !== confirm) return 'The two passwords do not match.';
  return null;
};

/**
 * Create (or reset) the shared `admin` login. The password is sent to the
 * server once and never shown back: the server doesn't return it.
 * Resolves to a human-readable success message.
 */
export const provisionAdminLogin = async ({ password = '', setupCode = '' } = {}) => {
  const payload = {};
  if (password) payload.password = password;
  if (setupCode.trim()) payload.setupCode = setupCode.trim();

  const result = await callApi('createAdmin', payload);
  const passwordNote = result?.passwordSource === 'server'
    ? 'the password set on the server (ADMIN_PASSWORD)'
    : 'the password you just entered';
  const promotedNote = result?.callerPromoted
    ? ' Your own account was also promoted to admin.'
    : '';
  return `Admin login ready → username: ${result?.username || 'admin'}, with ${passwordNote}. Anyone signed in with the old password has been signed out.${promotedNote}`;
};
