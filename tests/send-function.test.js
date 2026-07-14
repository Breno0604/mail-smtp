// tests/send-function.test.js
// Tests for the Netlify serverless function netlify/functions/send.js
//
// NOTA: send.js usa CommonJS (require, exports.handler), e o Vitest
// NÃO intercepta chamadas require() via vi.mock (limitação do ecossistema).
// Para contornar isso, usamos Module.prototype.require para interceptar
// o require('nodemailer') antes do módulo ser carregado.
import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Module } from 'module';

// ── Mock do nodemailer ──────────────────────────────────────────
// Criamos o mock fora do beforeAll para ser acessível nos testes
const mockSendMail = vi.fn().mockResolvedValue({ sent: true });
const mockTransporter = { sendMail: mockSendMail };

const mockNodemailer = {
  createTransport: vi.fn(() => mockTransporter),
};

let originalRequire;

// ── Handler (importado dinamicamente após setar o mock do require) ──
let handler;

beforeAll(async () => {
  // Salvar require original para restaurar depois
  originalRequire = Module.prototype.require;

  // Interceptar require('nodemailer') — CJS puro, sem passar pelo vitest
  Module.prototype.require = function (id) {
    if (id === 'nodemailer') {
      return mockNodemailer;
    }
    return originalRequire.apply(this, arguments);
  };

  // Importar send.js DEPOIS do mock do require estar em vigor
  // Usamos import dinâmico porque o import estático seria hoisted
  const mod = await import('../netlify/functions/send.js');
  handler = mod.handler;
});

afterAll(() => {
  // Restaurar require original
  if (originalRequire) {
    Module.prototype.require = originalRequire;
  }
});

// ── Helper ──────────────────────────────────────────────────────

/**
 * Cria um evento HTTP simulado para o handler.
 * @param {object} body - payload da requisição
 * @param {object} headers - headers HTTP
 * @returns {{ httpMethod: string, body: string, headers: object }}
 */
function makeEvent(body, headers = {}) {
  return {
    httpMethod: 'POST',
    body: JSON.stringify(body),
    headers,
  };
}

// ── Testes ──────────────────────────────────────────────────────

describe('send function handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset environment variables para valores conhecidos
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_USER = 'user@test.com';
    process.env.SMTP_PASS = 'pass123';
    process.env.SMTP_FROM = 'from@test.com';
    process.env.SMTP_TO = 'dest1@test.com,dest2@test.com';
    delete process.env.ALLOWED_ORIGIN;
  });

  // ── 1. Método não permitido ─────────────────────────────────

  it('should return 405 when method is not POST', async () => {
    const event = {
      httpMethod: 'GET',
      body: JSON.stringify({ subject: 'ok', text: 'ok' }),
    };
    const res = await handler(event);
    expect(res.statusCode).toBe(405);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Method not allowed');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  // ── 2. Subject ausente ──────────────────────────────────────

  it('should return 400 when subject is missing', async () => {
    const event = makeEvent({ text: 'ok' });
    const res = await handler(event);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toContain('obrigatório');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  // ── 3. Subject muito longo (>200) ───────────────────────────

  it('should return 400 when subject exceeds 200 characters', async () => {
    const event = makeEvent({ subject: 'a'.repeat(201), text: 'ok' });
    const res = await handler(event);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toContain('assunto');
    expect(body.error).toContain('200');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  // ── 4. Text ausente ─────────────────────────────────────────

  it('should return 400 when text is missing', async () => {
    const event = makeEvent({ subject: 'ok' });
    const res = await handler(event);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toContain('text');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  // ── 5. Text não é string ────────────────────────────────────

  it('should return 400 when text is not a string', async () => {
    const event = makeEvent({ subject: 'ok', text: 123 });
    const res = await handler(event);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toContain('text');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  // ── 6. Text muito longo (>50000) ────────────────────────────

  it('should return 400 when text exceeds 50000 characters', async () => {
    const event = makeEvent({ subject: 'ok', text: 'a'.repeat(50001) });
    const res = await handler(event);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toContain('text');
    expect(body.error).toContain('50.000');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  // ── 7. Muitos anexos (>12) ─────────────────────────────────

  it('should return 400 when more than 12 attachments', async () => {
    const attachments = Array.from({ length: 13 }, () => ({
      filename: 'f.txt',
      content: 'dGVzdA==',
    }));
    const event = makeEvent({ subject: 'ok', text: 'ok', attachments });
    const res = await handler(event);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toMatch(/anexos|12/);
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  // ── 8. Anexo sem filename ──────────────────────────────────

  it('should return 400 when attachment has no filename', async () => {
    const event = makeEvent({
      subject: 'ok',
      text: 'ok',
      attachments: [{ content: 'dGVzdA==' }],
    });
    const res = await handler(event);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toContain('nome');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  // ── 9. Anexo com filename não-string ───────────────────────

  it('should return 400 when attachment filename is not a string', async () => {
    const event = makeEvent({
      subject: 'ok',
      text: 'ok',
      attachments: [{ filename: 123, content: 'dGVzdA==' }],
    });
    const res = await handler(event);
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toContain('nome');
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  // ── 10. Envio bem-sucedido ─────────────────────────────────

  it('should return 200 and call sendMail on successful send', async () => {
    const event = makeEvent({ subject: 'ok', text: 'corpo do email' });
    const res = await handler(event);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'ok',
        text: 'corpo do email',
        from: 'from@test.com',
        to: ['dest1@test.com', 'dest2@test.com'],
      })
    );
  });

  // ── 11. Envio com anexo válido ────────────────────────────

  it('should return 200 with a valid attachment', async () => {
    const event = makeEvent({
      subject: 'ok',
      text: 'ok',
      attachments: [{ filename: 'foto.jpg', content: 'dGVzdA==' }],
    });
    const res = await handler(event);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });
});
