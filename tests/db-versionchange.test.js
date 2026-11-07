import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { getRecord } from '../scripts/db.js';

describe('P8 — versão do IndexedDB', () => {
  it('fecha a conexão quando outra aba pede upgrade, sem bloquear', async () => {
    // Abre e mantém a conexão v3 em cache dentro de db.js
    await getRecord('inexistente');

    const upgraded = await new Promise((resolve, reject) => {
      const req = indexedDB.open('mail-mvp', 4);
      req.onupgradeneeded = () => {
        req.result.createObjectStore('probe');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('blocked: conexão antiga não fechou'));
    });

    upgraded.close();
    expect(upgraded.version).toBe(4);
  });
});
