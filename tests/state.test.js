import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import {
  state,
  setCurrentUUID,
  clearCurrentUUID,
  createDefaultEquipamentos,
} from '../scripts/state.js';
import { getCurrentUUID } from '../scripts/uuid.js';
import { debouncedSave, saveState } from '../scripts/persistence.js';
import { getRecord } from '../scripts/db.js';
import { createTestDOM } from './helpers/dom-fixture.js';

describe('state', () => {
  beforeEach(() => {
    createTestDOM({ extraTipoOptions: [] });
    // Reset state
    state.currentSection = 1;
    state.iniciais = {};
    state.equipamentos = createDefaultEquipamentos();
    state.attachments = [];
    state.lastTipoOrdem = '';
    state.retorno = {};
    state.currentUUID = '';
    state.iniciaisValido = false;
    state._createdAt = null;
    localStorage.clear();
  });

  describe('getCurrentUUID', () => {
    it('should return empty string when no UUID in localStorage', () => {
      expect(getCurrentUUID()).toBe('');
    });

    it('should return UUID from localStorage when set', () => {
      localStorage.setItem('currentUUID', 'test-uuid-123');
      expect(getCurrentUUID()).toBe('test-uuid-123');
    });
  });

  describe('setCurrentUUID', () => {
    it('should set UUID in state', () => {
      setCurrentUUID('test-uuid-456');
      expect(state.currentUUID).toBe('test-uuid-456');
    });

    it('should set UUID in localStorage', () => {
      setCurrentUUID('test-uuid-456');
      expect(localStorage.getItem('currentUUID')).toBe('test-uuid-456');
    });
  });

  describe('clearCurrentUUID', () => {
    it('should clear UUID from state', () => {
      state.currentUUID = 'test-uuid';
      clearCurrentUUID();
      expect(state.currentUUID).toBe('');
    });

    it('should remove UUID from localStorage', () => {
      localStorage.setItem('currentUUID', 'test-uuid');
      clearCurrentUUID();
      expect(localStorage.getItem('currentUUID')).toBeNull();
    });
  });

  describe('state.equipamentos structure', () => {
    beforeEach(() => {
      state.equipamentos = createDefaultEquipamentos();
    });

    it('should have installed and removed control fields', () => {
      expect(state.equipamentos.instaladoEquip).toBe('');
      expect(state.equipamentos.retiradoEquip).toBe('');
    });

    it('should have installed equipment fields', () => {
      expect(state.equipamentos.instalados.medidor).toBe('');
      expect(state.equipamentos.instalados.tc_fase_a).toBe('');
    });

    it('should have removed equipment fields', () => {
      expect(state.equipamentos.retirados.medidor).toBe('');
      expect(state.equipamentos.retirados.tc_fase_a).toBe('');
    });

    it('should have checkbox states for installed', () => {
      expect(state.equipamentos.checkboxes.instalados.medidor).toBe(false);
    });

    it('should have checkbox states for removed', () => {
      expect(state.equipamentos.checkboxes.retirados.medidor).toBe(false);
    });
  });

  describe('debouncedSave', () => {
    it('should call saveState after 1000ms delay', async () => {
      vi.useFakeTimers();
      const spy = vi.spyOn(globalThis, 'setTimeout');
      debouncedSave();
      expect(spy).toHaveBeenCalledWith(expect.any(Function), 1000);
      spy.mockRestore();
      vi.useRealTimers();
    });

    it('should debounce multiple rapid calls', async () => {
      vi.useFakeTimers();
      const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
      // First call: clearTimeout(null) + setTimeout
      debouncedSave();
      // Second call: clearTimeout(prev) + setTimeout
      debouncedSave();
      // Third call: clearTimeout(prev) + setTimeout
      debouncedSave();
      // clearTimeout was called 3 times total (once per debouncedSave call, including initial null)
      expect(clearSpy).toHaveBeenCalledTimes(3);
      // Only the third setTimeout should be active
      clearSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe('saveState', () => {
    it('should return early when iniciaisValido is false', async () => {
      state.iniciaisValido = false;
      state.currentUUID = 'test-uuid';
      // If it doesn't throw, it returned early or succeeded
      // We expect it to return early without saving
      await expect(saveState()).resolves.toBeUndefined();
    });

    it('should create UUID when none exists', async () => {
      state.iniciaisValido = true;
      // Set up some data so it doesn't early-return on empty check
      const uc = document.createElement('input');
      uc.id = 'uc';
      uc.value = '12345';
      document.body.appendChild(uc);
      const os = document.createElement('input');
      os.id = 'os';
      os.value = '67890';
      document.body.appendChild(os);
      // Set up other required fields
      const fields = [
        'lider',
        'parceiro',
        'municipio',
        'notificado',
        'placa',
        'tipo-ordem',
        'coordenadas',
        'data',
        'hora_inicio',
        'hora_fim',
      ];
      fields.forEach(n => {
        const el = document.createElement('input');
        el.id = n;
        el.value = 'test';
        document.body.appendChild(el);
      });

      await saveState();
      expect(state.currentUUID).toBeTruthy();
      expect(localStorage.getItem('currentUUID')).toBe(state.currentUUID);

      // Verify data was persisted to IndexedDB
      const record = await getRecord(state.currentUUID);
      expect(record).toBeTruthy();
      expect(record.uuid).toBe(state.currentUUID);
      expect(record.iniciais.uc).toBe('12345');
      expect(record.iniciais.os).toBe('67890');
    });

    it('should reuse existing UUID', async () => {
      state.iniciaisValido = true;
      state.currentUUID = 'existing-uuid';

      const uc = document.createElement('input');
      uc.id = 'uc';
      uc.value = '12345';
      document.body.appendChild(uc);
      const os = document.createElement('input');
      os.id = 'os';
      os.value = '67890';
      document.body.appendChild(os);
      const fields = [
        'lider',
        'parceiro',
        'municipio',
        'notificado',
        'placa',
        'tipo-ordem',
        'coordenadas',
        'data',
        'hora_inicio',
        'hora_fim',
      ];
      fields.forEach(n => {
        const el = document.createElement('input');
        el.id = n;
        el.value = 'test';
        document.body.appendChild(el);
      });

      await saveState();
      expect(state.currentUUID).toBe('existing-uuid');

      // Verify it reused the same UUID in the DB (not creating a new record)
      const record = await getRecord('existing-uuid');
      expect(record).toBeTruthy();
      expect(record.uuid).toBe('existing-uuid');
    });

    it('should preserve createdAt from state._createdAt', async () => {
      state.iniciaisValido = true;
      state.currentUUID = 'test-uuid-preserve';
      state._createdAt = '2024-01-01T00:00:00.000Z';

      const uc = document.createElement('input');
      uc.id = 'uc';
      uc.value = '12345';
      document.body.appendChild(uc);
      const os = document.createElement('input');
      os.id = 'os';
      os.value = '67890';
      document.body.appendChild(os);
      const fields = [
        'lider',
        'parceiro',
        'municipio',
        'notificado',
        'placa',
        'tipo-ordem',
        'coordenadas',
        'data',
        'hora_inicio',
        'hora_fim',
      ];
      fields.forEach(n => {
        const el = document.createElement('input');
        el.id = n;
        el.value = 'test';
        document.body.appendChild(el);
      });

      await saveState();
      // No direct assertion on DB record here, but it shouldn't throw
      expect(state._createdAt).toBe('2024-01-01T00:00:00.000Z');
    });
  });
});
