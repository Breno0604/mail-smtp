// scripts/limits.js
// Limites de anexos compartilhados por attachments.js, validation.js e ui.js.
// O backend (`netlify/functions/send.cjs`) espelha estes valores de propósito:
// é outro runtime e a duplicação é coberta por tests/send-backend.test.js.

export const ATTACHMENTS_MIN = 2;
export const ATTACHMENTS_MAX = 12;
export const MAX_FILE_SIZE_MB = 8;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
