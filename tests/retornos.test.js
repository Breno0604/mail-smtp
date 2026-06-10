import { describe, it, expect, beforeEach } from 'vitest';
import { renderRetorno, getRetornoData, setRetornoData, handleTipoChange } from '../scripts/retornos.js';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';

describe('retornos', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="retorno-campos"></div>
      <div id="retorno-placeholder"></div>
      <div id="retorno-desc"></div>
      <select id="tipo-ordem">
        <option value="">Selecione</option>
        <option value="ADEQUACAO SMF">ADEQUACAO SMF</option>
        <option value="CORTE POR FALTA DE PAGAMENTO">CORTE POR FALTA DE PAGAMENTO</option>
      </select>
      <div id="iniciais-campos"></div>
      <div id="equipamentos-list"></div>
      <div id="preview-grid"></div>
      <div id="file-count">0 / 12</div>
      <div id="complemento-corpo"></div>
      <div id="file-upload-area"></div>
      <input type="file" id="file-input">
      <div id="error-msg" style="display:none"></div>
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
    state.lastTipoOrdem = '';
    state.retorno = {};
  });

  describe('renderRetorno', () => {
    it('should create a textarea with id descricao', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      const textarea = document.getElementById('descricao');
      expect(textarea).toBeTruthy();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('should set data-required attribute on textarea', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      const textarea = document.getElementById('descricao');
      expect(textarea.hasAttribute('data-required')).toBe(true);
    });

    it('should clear existing content before rendering', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      DOM.retornoCampos.innerHTML = '<div>old content</div>';
      renderRetorno();
      expect(DOM.retornoCampos.children.length).toBe(1); // just the new field
    });

    it('should update retorno-desc with the current tipo label', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      expect(DOM.retornoDesc.innerHTML).toContain('ADEQUACAO SMF');
    });

    it('should show the selected option text when no tipo is selected (shows "Selecione")', () => {
      DOM.tipoOrdem.value = '';
      renderRetorno();
      expect(DOM.retornoDesc.innerHTML).toContain('Selecione');
    });

    it('should create a label for the textarea', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      const label = document.querySelector('label[for="descricao"]');
      expect(label).toBeTruthy();
      expect(label.textContent).toContain('Descrição');
    });

    it('should show required indicator on label', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      const input = document.getElementById('descricao');
      expect(input.hasAttribute('data-required')).toBe(true);
    });
  });

  describe('getRetornoData', () => {
    it('should return empty object when no tipo is selected', () => {
      DOM.retornoCampos.innerHTML = '';
      const data = getRetornoData();
      expect(data).toEqual({});
    });

    it('should return descricao from textarea', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      const textarea = document.getElementById('descricao');
      textarea.value = 'Test description';
      const data = getRetornoData();
      expect(data.descricao).toBe('Test description');
    });

    it('should return empty string when textarea is empty', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      const data = getRetornoData();
      expect(data.descricao).toBe('');
    });
  });

  describe('setRetornoData', () => {
    it('should set descricao value on textarea', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      setRetornoData({ descricao: 'Restored description' });
      const textarea = document.getElementById('descricao');
      expect(textarea.value).toBe('Restored description');
    });

    it('should not throw when data is null', () => {
      renderRetorno();
      expect(() => setRetornoData(null)).not.toThrow();
    });

    it('should not throw when data is undefined', () => {
      renderRetorno();
      expect(() => setRetornoData(undefined)).not.toThrow();
    });

    it('should set value to empty string when descricao is empty', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      const textarea = document.getElementById('descricao');
      textarea.value = 'existing';
      setRetornoData({ descricao: '' });
      expect(textarea.value).toBe('');
    });
  });

  describe('handleTipoChange', () => {
    it('should update lastTipoOrdem when tipo changes', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      handleTipoChange();
      expect(state.lastTipoOrdem).toBe('ADEQUACAO SMF');
    });

    it('should clear retorno when tipo changes', () => {
      state.retorno = { descricao: 'old' };
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      handleTipoChange();
      expect(state.retorno).toEqual({});
    });

    it('should not change when tipo matches lastTipoOrdem', () => {
      state.lastTipoOrdem = 'ADEQUACAO SMF';
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      handleTipoChange();
      expect(state.lastTipoOrdem).toBe('ADEQUACAO SMF');
    });
  });
});
