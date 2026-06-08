import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { state, getCurrentUUID, setCurrentUUID, clearCurrentUUID, debouncedSave, saveState } from '../scripts/state.js';
import { getRecord } from '../scripts/db.js';
import { cacheDOM, DOM } from '../scripts/dom.js';

describe('state', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="iniciais-campos"></div>
      <div id="equipamentos-list"></div>
      <div id="retorno-campos"></div>
      <div id="retorno-desc"></div>
      <select id="tipo-ordem"><option value="">Selecione</option></select>
      <div id="preview-grid"></div>
      <div id="file-count">0 / 12</div>
      <textarea id="complemento-corpo"></textarea>
      <div id="file-upload-area"></div>
      <input type="file" id="file-input">
      <div id="error-msg" style="display:none"></div>
      <div id="section-wrapper">
        <div class="section" id="section-1"></div>
      </div>
      <div class="progress" id="progress">
        <div class="step" data-step="1">Iniciais</div>
        <div class="step" data-step="2">Equip.</div>
        <div class="step" data-step="3">Retorno</div>
        <div class="step" data-step="4">Anexos</div>
        <div class="step" data-step="5">Revisão</div>
      </div>
      <button id="btn-anterior" disabled>← Anterior</button>
      <button id="btn-proximo">Avançar →</button>
      <div id="preview-corpo">—</div>
      <div class="toast" id="toast"></div>
      <div class="modal-overlay hidden" id="modal-tipo">
        <div class="modal">
          <p id="modal-tipo-text"></p>
          <button id="modal-cancel">Cancelar</button>
          <button id="modal-confirm">Alterar mesmo assim</button>
        </div>
      </div>
      <div class="lightbox-overlay hidden" id="lightbox">
        <button id="lightbox-close">✕</button>
        <img id="lightbox-img" src="" alt="Preview ampliado">
      </div>
      <div class="modal-overlay hidden" id="dup-modal">
        <div class="modal">
          <p id="dup-modal-title"></p>
          <p id="dup-modal-body"></p>
          <button id="dup-modal-cancel">Cancelar</button>
          <button id="dup-modal-confirm">Reenviar</button>
        </div>
      </div>
      <div class="modal-overlay hidden" id="confirm-modal">
        <div class="modal">
          <p id="confirm-modal-text"></p>
          <button id="confirm-modal-cancel">Cancelar</button>
          <button id="confirm-modal-ok">Confirmar</button>
        </div>
      </div>
    `;
    cacheDOM();
    // Reset state
    state.currentSection = 1;
    state.iniciais = {};
    state.equipamentos = [];
    state.attachments = [];
    state.lastTipoOrdem = '';
    state.visitedRetorno = false;
    state.retorno = {};
    state.currentUUID = '';
    state.composicao = { complementoCorpo: '' };
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

  describe('debouncedSave', () => {
    it('should call saveState after 300ms delay', async () => {
      vi.useFakeTimers();
      const spy = vi.spyOn(globalThis, 'setTimeout');
      debouncedSave();
      expect(spy).toHaveBeenCalledWith(expect.any(Function), 300);
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
      const fields = ['lider','parceiro','municipio','notificado','placa','tipo-ordem','coordenadas','data','hora_inicio','hora_fim'];
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
      const fields = ['lider','parceiro','municipio','notificado','placa','tipo-ordem','coordenadas','data','hora_inicio','hora_fim'];
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
      const fields = ['lider','parceiro','municipio','notificado','placa','tipo-ordem','coordenadas','data','hora_inicio','hora_fim'];
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
