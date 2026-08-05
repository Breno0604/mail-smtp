// tests/send.test.js
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestDOM } from './helpers/dom-fixture.js';
import { DOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';

// Usar vi.hoisted() para criar referências compartilhadas entre o factory
// do vi.mock e o escopo do teste, garantindo isolation de mocks.
const {
  showSendModalMock,
  showConfirmMock,
  validateAllMock,
  checkDuplicateMock,
  compressMock,
  updateStatusMock,
  collectAllDataMock,
  composeEmailMock,
} = vi.hoisted(() => ({
  showSendModalMock: vi.fn(),
  showConfirmMock: vi.fn(() => Promise.resolve(true)),
  validateAllMock: vi.fn(() => true),
  checkDuplicateMock: vi.fn(() => Promise.resolve(true)),
  compressMock: vi.fn(() => Promise.resolve([])),
  updateStatusMock: vi.fn(() => Promise.resolve()),
  collectAllDataMock: vi.fn(() => ({
    iniciais: { uc: '12345', os: '67890', 'tipo-ordem': 'CORTE POR FALTA DE PAGAMENTO' },
    retorno: {},
    equipamentos: [],
    attachments: [],
    tipoOrdem: 'CORTE POR FALTA DE PAGAMENTO',
  })),
  composeEmailMock: vi.fn(() => 'UC: 12345\nOS: 67890'),
}));

vi.mock('../scripts/validation.js', () => ({
  validateAll: validateAllMock,
}));

vi.mock('../scripts/duplicate.js', () => ({
  checkDuplicate: checkDuplicateMock,
}));

vi.mock('../scripts/compress.js', () => ({
  compressAttachments: compressMock,
}));

vi.mock('../scripts/ui.js', () => ({
  showSendModal: showSendModalMock,
  showConfirm: showConfirmMock,
}));

vi.mock('../scripts/db.js', () => ({
  updateRecordStatus: updateStatusMock,
}));

vi.mock('../scripts/collectors.js', () => ({
  collectAllData: collectAllDataMock,
}));

vi.mock('../scripts/email.js', () => ({
  composeEmail: composeEmailMock,
}));

import { sendEmail } from '../scripts/send.js';

describe('sendEmail', () => {
  beforeEach(() => {
    // Reset global fetch antes de cada teste
    vi.stubGlobal('fetch', vi.fn());

    createTestDOM();

    // Configurar state
    state.iniciais = {
      uc: '12345',
      os: '67890',
      'tipo-ordem': 'CORTE POR FALTA DE PAGAMENTO',
    };
    state.attachments = [];
    state.currentUUID = 'test-uuid-123';
    state.status = 'draft';

    DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';

    // No vitest 4.x, clearAllMocks também reseta implementações (mockReset).
    // Reaplicamos as implementações padrão após o clear.
    vi.clearAllMocks();
    validateAllMock.mockImplementation(() => true);
    checkDuplicateMock.mockImplementation(() => Promise.resolve(true));
    compressMock.mockImplementation(() => Promise.resolve([]));
    updateStatusMock.mockImplementation(() => Promise.resolve());
    collectAllDataMock.mockImplementation(() => ({
      iniciais: { uc: '12345', os: '67890', 'tipo-ordem': 'CORTE POR FALTA DE PAGAMENTO' },
      retorno: {},
      equipamentos: [],
      attachments: [],
      tipoOrdem: 'CORTE POR FALTA DE PAGAMENTO',
    }));
    composeEmailMock.mockImplementation(() => 'UC: 12345\nOS: 67890');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // ── CENÁRIO 1: Envio bem-sucedido ─────────────────────────────────────

  it('should return true on successful send', async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true, to: 'test@example.com' }),
    });

    const result = await sendEmail();
    expect(result).toBe(true);
  });

  it('should call fetch with correct URL and method', async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true, to: 'test@example.com' }),
    });

    await sendEmail();
    expect(fetch).toHaveBeenCalledWith(
      '/api/send',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('should build correct subject from state', async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true, to: 'test@example.com' }),
    });

    await sendEmail();
    const callBody = JSON.parse(fetch.mock.calls[0][1].body);
    expect(callBody.subject).toContain('RETORNO DE ORDEM UC 12345 OS 67890');
    expect(callBody.subject).toContain('CORTE POR FALTA DE PAGAMENTO');
  });

  it('should build body from composeEmail', async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true, to: 'test@example.com' }),
    });

    await sendEmail();
    const callBody = JSON.parse(fetch.mock.calls[0][1].body);
    expect(callBody.text).toContain('UC: 12345');
    expect(composeEmailMock).toHaveBeenCalled();
    expect(collectAllDataMock).toHaveBeenCalled();
  });

  it('should compress attachments before sending', async () => {
    state.attachments = [new File(['a'], 'a.jpg', { type: 'image/jpeg' })];
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true, to: 'test@example.com' }),
    });

    await sendEmail();
    expect(compressMock).toHaveBeenCalledWith(state.attachments);
  });

  it('should update record status on success', async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true }),
    });

    await sendEmail();
    expect(updateStatusMock).toHaveBeenCalledWith(
      'test-uuid-123',
      expect.objectContaining({ subject: expect.any(String) }),
      'sent'
    );
  });

  it('should still return true and log warning when persisting sent status fails', async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true }),
    });
    updateStatusMock.mockRejectedValue(new Error('IDB quota'));

    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await sendEmail();
    expect(result).toBe(true);
    expect(console.warn).toHaveBeenCalled();
    expect(console.warn.mock.calls[0][0]).toContain('Falha ao persistir status sent');
  });

  it('should disable button while sending and re-enable after', async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true, to: 'test@example.com' }),
    });

    const btn = DOM.btnEnviar;
    expect(btn.disabled).toBe(false);

    await sendEmail();

    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toBe('📨 Enviar');
  });

  // ── CENÁRIO 2: Falha na validação ─────────────────────────────────────

  it('should return false when validateAll returns false', async () => {
    validateAllMock.mockReturnValue(false);

    const result = await sendEmail();
    expect(result).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  // ── CENÁRIO 2B: Confirmação para registro alterado ──────────────────

  it('should prompt confirmation when status is changed and proceed on confirm', async () => {
    state.status = 'changed';
    showConfirmMock.mockResolvedValue(true);
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true, to: 'test@example.com' }),
    });

    const result = await sendEmail();
    expect(showConfirmMock).toHaveBeenCalledWith(
      'Este registro já foi enviado anteriormente e sofreu alterações após o envio. Deseja reenviá-lo?'
    );
    expect(result).toBe(true);
  });

  it('should return false when user declines confirmation', async () => {
    state.status = 'changed';
    showConfirmMock.mockResolvedValue(false);

    const result = await sendEmail();
    expect(result).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should NOT prompt confirmation when status is draft', async () => {
    state.status = 'draft';
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true, to: 'test@example.com' }),
    });

    await sendEmail();
    expect(showConfirmMock).not.toHaveBeenCalled();
  });

  it('should NOT prompt confirmation when status is sent', async () => {
    state.status = 'sent';
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true, to: 'test@example.com' }),
    });

    await sendEmail();
    expect(showConfirmMock).not.toHaveBeenCalled();
  });

  // ── CENÁRIO 3: Duplicata detectada ────────────────────────────────────

  it('should return false when checkDuplicate returns false', async () => {
    checkDuplicateMock.mockResolvedValue(false);

    const result = await sendEmail();
    expect(result).toBe(false);
  });

  // ── CENÁRIO 4: Erro HTTP ──────────────────────────────────────────────

  it('should return false when server returns error', async () => {
    fetch.mockResolvedValue({
      ok: false,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: false, error: 'SMTP error' }),
    });

    const result = await sendEmail();
    expect(result).toBe(false);
    expect(showSendModalMock).toHaveBeenCalledWith('SMTP error', false);
  });

  // ── CENÁRIO 5: Erro de rede ───────────────────────────────────────────

  it('should return false on network error and show connection error toast', async () => {
    fetch.mockRejectedValue(new Error('Network failure'));

    const result = await sendEmail();
    expect(result).toBe(false);
    expect(showSendModalMock).toHaveBeenCalledWith(
      'Erro de conexão com o servidor. Tente novamente.',
      false
    );
  });

  // ── CENÁRIO 6: Body without complemento ───────────────────────────────────

  it('should send body from composeEmail', async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ success: true, to: 'test@example.com' }),
    });

    await sendEmail();
    const callBody = JSON.parse(fetch.mock.calls[0][1].body);
    expect(callBody.text).not.toContain('\n\n');
    expect(callBody.text).toBe('UC: 12345\nOS: 67890');
  });
});
