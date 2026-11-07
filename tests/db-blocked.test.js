import { describe, it, expect, vi } from 'vitest';

describe('P8 — openDB bloqueado por outra aba', () => {
  it('rejeita com mensagem clara quando o upgrade é bloqueado', async () => {
    const request = {};
    vi.stubGlobal('indexedDB', { open: vi.fn(() => request) });

    const { getRecord } = await import('../scripts/db.js');
    const promise = getRecord('qualquer');

    await Promise.resolve();
    expect(typeof request.onblocked).toBe('function');

    request.onblocked();
    await expect(promise).rejects.toThrow(/outra aba/i);

    vi.unstubAllGlobals();
  });
});
