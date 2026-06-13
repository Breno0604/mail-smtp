import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetForm } from '../scripts/reset.js';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';

// Mock the coordinate capture function
vi.mock('../scripts/app.js', () => ({
  captureCoordinates: vi.fn(),
}));

describe('reset', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="iniciais-campos"></div>
      <div id="equipamentos-list"></div>
      <div id="retorno-campos"></div>
      <div id="retorno-placeholder"></div>
      <div id="retorno-desc"></div>
      <div id="preview-corpo">—</div>
      <select id="tipo-ordem"><option value="">Selecione</option></select>
      <div id="preview-grid"></div>
      <div id="file-count">0 / 12</div>
      <textarea id="complemento-corpo"></textarea>
      <div id="file-upload-area"></div>
      <input type="file" id="file-input">
      <div id="error-msg" style="display:none">Some error</div>
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
    
    // Set up populated state
    state.iniciais = { uc: '12345', os: '67890' };
    state.equipamentos = [{ status: 'Instalado', categoria: 'Medidor', numero: '1' }];
    state.attachments = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
    state.lastTipoOrdem = 'ADEQUACAO SMF';
    state.currentUUID = 'test-uuid-123';
    state.iniciaisValido = true;
    state._createdAt = '2024-01-01T00:00:00.000Z';
    state.retorno = { descricao: 'some description' };

    // Populate some DOM elements
    DOM.retornoCampos.innerHTML = '<p>retorno content</p>';
    DOM.equipList.innerHTML = '<div class="equip-row">some equipment</div>';
    DOM.complementoCorpo.value = 'Some complement';
    DOM.previewGrid.innerHTML = '<div class="preview-item">preview</div>';
    DOM.errorMsg.style.display = 'block';
    DOM.errorMsg.textContent = 'Some error';
    localStorage.setItem('currentUUID', 'test-uuid-123');
  });

  describe('resetForm', () => {
    it('should populate state.iniciais with all field keys (empty values)', () => {
      resetForm();
      // updateLivePreview() now syncs state with DOM via collectAllData()
      // After reset, state.iniciais has all field keys with empty/placeholder values
      expect(state.iniciais).not.toEqual({});
      expect(state.iniciais.uc).toBe('');
      expect(state.iniciais.os).toBe('');
      expect(state.iniciais.lider).toBe('');
      expect(state.iniciais['tipo-ordem']).toBe('');
    });

    it('should clear state.equipamentos', () => {
      resetForm();
      expect(state.equipamentos).toEqual([]);
    });

    it('should clear state.attachments', () => {
      resetForm();
      expect(state.attachments).toEqual([]);
    });

    it('should clear state.lastTipoOrdem', () => {
      resetForm();
      expect(state.lastTipoOrdem).toBe('');
    });

    it('should clear state.currentUUID', () => {
      resetForm();
      expect(state.currentUUID).toBe('');
    });

    it('should clear state._createdAt', () => {
      resetForm();
      expect(state._createdAt).toBeNull();
    });

    it('should reset iniciaisValido to false', () => {
      resetForm();
      expect(state.iniciaisValido).toBe(false);
    });

    it('should clear retorno campos DOM', () => {
      resetForm();
      expect(DOM.retornoCampos.innerHTML).toBe('');
    });

    it('should clear equipamentos list DOM', () => {
      resetForm();
      expect(DOM.equipList.innerHTML).not.toBe('');
      // Should have empty-msg
      expect(DOM.equipList.querySelector('.empty-msg')).toBeTruthy();
    });

    it('should clear complementoCorpo value', () => {
      resetForm();
      expect(DOM.complementoCorpo.value).toBe('');
    });

    it('should clear preview grid', () => {
      resetForm();
      expect(DOM.previewGrid.innerHTML).toBe('');
    });

    it('should update file count to 0', () => {
      resetForm();
      expect(DOM.fileCount.textContent).toBe('0 / 12');
    });

    it('should hide error message', () => {
      resetForm();
      expect(DOM.errorMsg.style.display).toBe('none');
    });

    it('should remove currentUUID from localStorage', () => {
      resetForm();
      expect(localStorage.getItem('currentUUID')).toBeNull();
    });
  });
});
