import { describe, it, expect, beforeEach, vi } from 'vitest';
import { showError, hideError, showToast, showConfirm } from '../scripts/ui.js';
import { cacheDOM, DOM } from '../scripts/dom.js';

describe('ui', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="error-msg" style="display:none"></div>
      <div class="toast" id="toast"></div>
      <div class="modal-overlay hidden" id="confirm-modal">
        <div class="modal">
          <p id="confirm-modal-text"></p>
          <button id="confirm-modal-cancel">Cancelar</button>
          <button id="confirm-modal-ok">Confirmar</button>
        </div>
      </div>
      <div id="iniciais-campos"></div>
      <div id="equipamentos-list"></div>
      <div id="retorno-campos"></div>
      <div id="retorno-desc"></div>
      <select id="tipo-ordem"><option value="">Selecione</option></select>
      <div id="preview-grid"></div>
      <div id="file-count">0 / 12</div>
      <div id="complemento-corpo"></div>
      <div id="file-upload-area"></div>
      <input type="file" id="file-input">
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
    `;
    cacheDOM();
  });

  describe('showError', () => {
    it('should display error message text', () => {
      showError('Something went wrong');
      expect(DOM.errorMsg.textContent).toBe('Something went wrong');
    });

    it('should make error message visible', () => {
      showError('Error!');
      expect(DOM.errorMsg.style.display).toBe('block');
    });

    it('should update existing error text', () => {
      showError('First error');
      showError('Second error');
      expect(DOM.errorMsg.textContent).toBe('Second error');
    });
  });

  describe('hideError', () => {
    it('should hide error message', () => {
      DOM.errorMsg.style.display = 'block';
      hideError();
      expect(DOM.errorMsg.style.display).toBe('none');
    });

    it('should clear error text', () => {
      DOM.errorMsg.textContent = 'Some error';
      hideError();
      expect(DOM.errorMsg.textContent).toBe('');
    });

    it('should not throw if already hidden', () => {
      DOM.errorMsg.style.display = 'none';
      expect(() => hideError()).not.toThrow();
    });
  });

  describe('showToast', () => {
    beforeEach(() => {
      // Clear toast state
      DOM.toast.className = '';
      DOM.toast.textContent = '';
    });

    it('should display toast message', () => {
      showToast('Operation successful', true);
      expect(DOM.toast.textContent).toBe('Operation successful');
    });

    it('should add success class when success is true', () => {
      showToast('Success!', true);
      expect(DOM.toast.classList.contains('success')).toBe(true);
    });

    it('should not add success class when success is false', () => {
      showToast('Error occurred', false);
      expect(DOM.toast.classList.contains('success')).toBe(false);
    });

    it('should add show class to toast', () => {
      showToast('Test message', true);
      expect(DOM.toast.classList.contains('show')).toBe(true);
    });

    it('should remove show class after timeout', async () => {
      vi.useFakeTimers();
      showToast('Timed message', true);
      expect(DOM.toast.classList.contains('show')).toBe(true);
      vi.advanceTimersByTime(3500);
      expect(DOM.toast.classList.contains('show')).toBe(false);
      vi.useRealTimers();
    });

    it('should remove previous success class before adding new one', () => {
      showToast('First', true);
      showToast('Second', false);
      expect(DOM.toast.classList.contains('success')).toBe(false);
    });
  });

  describe('showConfirm', () => {
    it('should show the confirm modal', () => {
      showConfirm('Are you sure?');
      const modal = document.getElementById('confirm-modal');
      expect(modal.classList.contains('hidden')).toBe(false);
    });

    it('should set the confirmation message', () => {
      showConfirm('Delete this item?');
      const text = document.getElementById('confirm-modal-text');
      expect(text.textContent).toBe('Delete this item?');
    });

    it('should resolve true when OK is clicked', async () => {
      const promise = showConfirm('Confirm?');
      const okBtn = document.getElementById('confirm-modal-ok');
      okBtn.click();
      const result = await promise;
      expect(result).toBe(true);
    });

    it('should resolve false when Cancel is clicked', async () => {
      const promise = showConfirm('Confirm?');
      const cancelBtn = document.getElementById('confirm-modal-cancel');
      cancelBtn.click();
      const result = await promise;
      expect(result).toBe(false);
    });

    it('should hide modal after OK is clicked', async () => {
      const promise = showConfirm('Confirm?');
      const okBtn = document.getElementById('confirm-modal-ok');
      okBtn.click();
      await promise;
      const modal = document.getElementById('confirm-modal');
      expect(modal.classList.contains('hidden')).toBe(true);
    });

    it('should hide modal after Cancel is clicked', async () => {
      const promise = showConfirm('Confirm?');
      const cancelBtn = document.getElementById('confirm-modal-cancel');
      cancelBtn.click();
      await promise;
      const modal = document.getElementById('confirm-modal');
      expect(modal.classList.contains('hidden')).toBe(true);
    });

    it('should call cleanup after resolving', async () => {
      const promise = showConfirm('Test');
      const okBtn = document.getElementById('confirm-modal-ok');
      okBtn.click();
      await promise;
      // After resolution, clicking OK again should have no effect
      okBtn.click(); // No handler should remain
      const modal = document.getElementById('confirm-modal');
      expect(modal.classList.contains('hidden')).toBe(true);
    });
  });
});
