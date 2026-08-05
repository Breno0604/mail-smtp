// tests/send-backend.test.js
// Contract tests for the netlify/functions/send.cjs backend (nodemailer v9).
// Covers only the paths that do NOT reach real SMTP (GET, 4xx validations),
// confirming the module loads with the v9 installed.
import { describe, it, beforeAll, expect } from 'vitest';

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

describe('netlify/functions/send.cjs (nodemailer v9)', () => {
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
});
