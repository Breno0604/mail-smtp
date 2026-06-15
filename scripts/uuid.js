// scripts/uuid.js
const UUID_KEY = 'currentUUID';

/**
 * Generate a new UUID v4
 * @returns {string} UUID v4
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Get current UUID from localStorage
 * @returns {string} Current UUID or empty string
 */
export function getCurrentUUID() {
  return localStorage.getItem(UUID_KEY) || '';
}

/**
 * Set current UUID in localStorage
 * @param {string} uuid - UUID to set
 * @returns {string} The UUID that was set
 */
export function setCurrentUUID(uuid) {
  localStorage.setItem(UUID_KEY, uuid);
  return uuid;
}

/**
 * Clear current UUID from localStorage
 */
export function clearCurrentUUID() {
  localStorage.removeItem(UUID_KEY);
}
