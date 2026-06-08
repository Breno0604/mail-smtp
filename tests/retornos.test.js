import { describe, it, expect, beforeEach } from 'vitest';
import { renderRetorno, getRetornoData, setRetornoData, handleTipoChange, cancelTipoChange, confirmTipoChange } from '../scripts/retornos.js';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';

describe('retornos', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="retorno-campos"></div>
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
    state.visitedRetorno = false;
    state.retorno = {};
  });

  describe('renderRetorno', () => {
    it('should create a textarea with id descricao-retorno', () => {
      renderRetorno();
      const textarea = document.getElementById('descricao-retorno');
      expect(textarea).toBeTruthy();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('should set data-required attribute on textarea', () => {
      renderRetorno();
      const textarea = document.getElementById('descricao-retorno');
      expect(textarea.hasAttribute('data-required')).toBe(true);
    });

    it('should clear existing content before rendering', () => {
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
      // When "Selecione" option is selected, it shows that text
      expect(DOM.retornoDesc.innerHTML).toContain('Selecione');
    });

    it('should create a label for the textarea', () => {
      renderRetorno();
      const label = document.querySelector('label[for="descricao-retorno"]');
      expect(label).toBeTruthy();
      expect(label.textContent).toContain('Descrição');
    });

    it('should show required indicator on label', () => {
      renderRetorno();
      const label = document.querySelector('label[for="descricao-retorno"]');
      expect(label.innerHTML).toContain('*');
    });
  });

  describe('getRetornoData', () => {
    it('should return empty object when textarea does not exist', () => {
      // Ensure textarea not present
      DOM.retornoCampos.innerHTML = '';
      const data = getRetornoData();
      expect(data).toEqual({ descricao: '' });
    });

    it('should return descricao from textarea', () => {
      renderRetorno();
      const textarea = document.getElementById('descricao-retorno');
      textarea.value = 'Test description';
      const data = getRetornoData();
      expect(data.descricao).toBe('Test description');
    });

    it('should return empty string when textarea is empty', () => {
      renderRetorno();
      const data = getRetornoData();
      expect(data.descricao).toBe('');
    });
  });

  describe('setRetornoData', () => {
    it('should set descricao value on textarea', () => {
      renderRetorno();
      setRetornoData({ descricao: 'Restored description' });
      const textarea = document.getElementById('descricao-retorno');
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

    it('should not set value when descricao is empty', () => {
      renderRetorno();
      const textarea = document.getElementById('descricao-retorno');
      textarea.value = 'existing';
      setRetornoData({ descricao: '' });
      expect(textarea.value).toBe('existing');
    });
  });

  describe('handleTipoChange', () => {
    it('should update lastTipoOrdem when visitedRetorno is false', () => {
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      handleTipoChange();
      expect(state.lastTipoOrdem).toBe('ADEQUACAO SMF');
    });

    it('should not show modal when lastTipoOrdem matches current value', () => {
      state.lastTipoOrdem = 'ADEQUACAO SMF';
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      handleTipoChange();
      expect(DOM.modalTipo.classList.contains('hidden')).toBe(true);
    });

    it('should show modal when tipo changes and retorno was visited', () => {
      state.lastTipoOrdem = 'ADEQUACAO SMF';
      state.visitedRetorno = true;
      DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';
      handleTipoChange();
      expect(DOM.modalTipo.classList.contains('hidden')).toBe(false);
    });

    it('should revert select value when modal is shown', () => {
      state.lastTipoOrdem = 'ADEQUACAO SMF';
      state.visitedRetorno = true;
      DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';
      handleTipoChange();
      expect(DOM.tipoOrdem.value).toBe('ADEQUACAO SMF');
    });
  });

  describe('cancelTipoChange', () => {
    it('should hide the modal', () => {
      DOM.modalTipo.classList.remove('hidden');
      cancelTipoChange();
      expect(DOM.modalTipo.classList.contains('hidden')).toBe(true);
    });
  });

  describe('confirmTipoChange', () => {
    it('should hide the modal', () => {
      DOM.modalTipo.classList.remove('hidden');
      confirmTipoChange();
      expect(DOM.modalTipo.classList.contains('hidden')).toBe(true);
    });

    it('should update lastTipoOrdem to pending value', () => {
      state.lastTipoOrdem = 'ADEQUACAO SMF';
      state.visitedRetorno = true;
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      // Set up the pending value by calling handleTipoChange first
      DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';
      handleTipoChange(); // This sets pendingTipoValue
      confirmTipoChange();
      expect(state.lastTipoOrdem).toBe('CORTE POR FALTA DE PAGAMENTO');
    });

    it('should update select value to pending value', () => {
      state.lastTipoOrdem = 'ADEQUACAO SMF';
      state.visitedRetorno = true;
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';
      handleTipoChange();
      confirmTipoChange();
      expect(DOM.tipoOrdem.value).toBe('CORTE POR FALTA DE PAGAMENTO');
    });

    it('should clear retorno campos', () => {
      state.lastTipoOrdem = 'ADEQUACAO SMF';
      state.visitedRetorno = true;
      DOM.retornoCampos.innerHTML = '<p>some content</p>';
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';
      handleTipoChange();
      confirmTipoChange();
      expect(DOM.retornoCampos.innerHTML).toBe('');
    });
  });
});
