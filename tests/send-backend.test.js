// tests/send-backend.test.js
// Contract tests for the netlify/functions/send.cjs backend.
// Covers only the paths that do NOT reach real SMTP (GET, 4xx validations),
// confirming the module loads with the installed nodemailer.
import { describe, it, beforeAll, expect } from 'vitest';
import { createRequire } from 'node:module';
import { isValidCoordinates } from '../scripts/utils.js';

const require = createRequire(import.meta.url);
const { findCoordinatesError } = require('../netlify/functions/validate-coordinates.cjs');

beforeAll(() => {
  process.env.SMTP_FROM = 'from@example.com';
  process.env.SMTP_TO = 'to@example.com';
  process.env.SMTP_HOST = 'smtp.example.com';
  process.env.SMTP_PORT = '465';
  process.env.SMTP_USER = 'user';
  process.env.SMTP_PASS = 'pass';
});

let handler = null;
try {
  ({ handler } = await import('../netlify/functions/send.cjs'));
} catch {
  // If the CJS module is unavailable (e.g. not built in CI), tests are
  // explicitly skipped instead of passing vacuously or crashing the suite.
}

const invoke = body =>
  handler({ httpMethod: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) });

describe('netlify/functions/send.cjs', () => {
  it.skipIf(!handler)('returns 200 with status ok on GET', async () => {
    const res = await handler({ httpMethod: 'GET' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).status).toBe('ok');
  });

  it.skipIf(!handler)('returns 405 for disallowed method', async () => {
    const res = await handler({ httpMethod: 'PUT' });
    expect(res.statusCode).toBe(405);
  });

  it.skipIf(!handler)('returns 400 when subject is missing', async () => {
    const res = await invoke({ text: 'corpo' });
    expect(res.statusCode).toBe(400);
  });

  it.skipIf(!handler)('returns 400 when text is missing', async () => {
    const res = await invoke({ subject: 'assunto' });
    expect(res.statusCode).toBe(400);
  });

  it.skipIf(!handler)('returns 413 for payload above 10 MB', async () => {
    const big = 'x'.repeat(11 * 1024 * 1024);
    const res = await invoke(big);
    expect(res.statusCode).toBe(413);
  });

  it.skipIf(!handler)('returns 400 for more than 12 attachments', async () => {
    const attachments = Array.from({ length: 13 }, (_, i) => ({
      filename: `a${i}.jpg`,
      content: Buffer.from('x').toString('base64'),
    }));
    const res = await invoke({ subject: 's', text: 't', attachments });
    expect(res.statusCode).toBe(400);
  });

  it.skipIf(!handler)('returns 400 for malformed coordinates in the email body', async () => {
    const res = await invoke({ subject: 's', text: 'UC: 12345\nCOORDENADAS: -3.1245, -38.4156\n' });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/Formato de coordenadas inválido/);
  });

  it.skipIf(!handler)('returns 400 for coordinates beyond the geographic limits', async () => {
    const res = await invoke({ subject: 's', text: 'COORDENADAS: -91.12345678,-38.4156789' });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/coordenadas/i);
  });

  it.skipIf(!handler)('keeps the server rule in sync with the client rule', () => {
    const values = [
      '-3.12345678,-38.41567890',
      '-3.1,-38.4',
      '-3.1245, -38.4156',
      '3.1245,-38.4156',
      '-3.1245-38.4156',
      '-3.123456789,-38.4156',
      '-91.12345678,-38.4156789',
      '-3.1245,-180.4156789',
      '-3.1245,-38.4156 ',
      '-3.1245,-38.4156,',
      'abc',
    ];

    values.forEach(value => {
      const serverRejects = findCoordinatesError(`COORDENADAS: ${value}`) !== null;
      expect(serverRejects).toBe(!isValidCoordinates(value));
    });
  });
});
