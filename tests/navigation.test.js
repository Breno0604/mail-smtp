import { describe, it, expect, beforeEach, vi } from 'vitest';
import { showSection, prevSection, nextSection } from '../scripts/sectionManager.js';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';
import * as validation from '../scripts/validation.js';

// Spy on validation functions to control return values
vi.spyOn(validation, 'validateSection').mockReturnValue(true);
vi.spyOn(validation, 'collectSectionData').mockImplementation(() => {});

// Mock modules with side effects that are not needed for these tests
vi.mock('../scripts/iniciais.js', () => ({
  renderIniciais: vi.fn(),
  iniciaisFields: [],
  getIniciaisData: vi.fn(() => ({})),
}));

vi.mock('../scripts/retornos.js', () => ({
  renderRetorno: vi.fn(),
  setRetornoData: vi.fn(),
  retornoFields: [],
}));

vi.mock('../scripts/equipment.js', () => ({
  renderEquipamentos: vi.fn(),
}));

vi.mock('../scripts/attachments.js', () => ({
  renderPreviews: vi.fn(),
}));

vi.mock('../scripts/send.js', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('../scripts/email.js', () => ({
  composeEmail: vi.fn(),
}));

describe('navigation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="progress" id="progress">
        <div class="step-label" data-step="1">Inicio</div>
        <div class="step-label" data-step="2">Equip.</div>
        <div class="step-label" data-step="3">Retorno</div>
        <div class="step-label" data-step="4">Anexos</div>
        <div class="step-label" data-step="5">Revisão</div>
      </div>
      <div id="error-msg" style="display:none"></div>
      <div class="section-wrapper" id="section-wrapper">
        <div class="section active" id="section-1">
          <div id="iniciais-campos"></div>
        </div>
        <div class="section" id="section-2">
          <div id="equipamentos-list"></div>
          <button id="btn-add-equip">+ Adicionar equipamento</button>
        </div>
        <div class="section" id="section-3">
          <p id="retorno-desc">Preencha as informações de retorno.</p>
          <div id="retorno-campos"></div>
        </div>
        <div class="section" id="section-4">
          <div id="file-upload-area">Clique para selecionar imagens</div>
          <input type="file" id="file-input" accept="image/*" multiple class="hidden">
          <div class="preview-grid" id="preview-grid"></div>
          <span class="file-count" id="file-count">0 / 12</span>
        </div>
        <div class="section" id="section-5">
          <div class="email-preview">
            <div class="preview-value" id="preview-corpo">—</div>
            <textarea id="complemento-corpo" rows="3"></textarea>
          </div>
        </div>
      </div>
      <div id="nav-buttons">
        <button class="btn btn-primary" id="btn-anterior" disabled>← Anterior</button>
        <span class="step-current-text" id="step-current-text">Inicio</span>
        <button class="btn btn-primary" id="btn-proximo">Avançar →</button>
      </div>
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
    state.totalSections = 5;
    state.animating = false;
    state.iniciaisValido = false;
    state.iniciais = {};
    state.equipamentos = [];
    state.attachments = [];
    state.retorno = {};

    // Reset sections visible state
    document.querySelectorAll('.section').forEach((el, i) => {
      if (i === 0) {
        el.classList.add('active');
        el.style.display = 'block';
      } else {
        el.classList.remove('active');
        el.style.display = 'none';
      }
    });

    // Reset validation spy
    validation.validateSection.mockReturnValue(true);
  });

  describe('showSection', () => {
    it('should change active section', () => {
      showSection(2, 'next', true);
      const sec1 = document.getElementById('section-1');
      const sec2 = document.getElementById('section-2');
      expect(sec1.classList.contains('active')).toBe(false);
      expect(sec2.classList.contains('active')).toBe(true);
    });

    it('should update step indicators for active step', () => {
      showSection(2, 'next', true);
      const steps = document.querySelectorAll('.step-label');
      expect(steps[1].classList.contains('active')).toBe(true);
      expect(steps[0].classList.contains('completed')).toBe(true);
    });

    it('should update step current text', () => {
      showSection(2, 'next', true);
      expect(DOM.stepCurrentText.textContent).toBe('Equip.');
    });

    it('should show "Inicio" on section 1', () => {
      showSection(1, 'next', true);
      expect(DOM.stepCurrentText.textContent).toBe('Inicio');
    });

    it('should disable previous button on section 1', () => {
      showSection(1, 'next', true);
      expect(DOM.btnAnterior.disabled).toBe(true);
    });

    it('should enable previous button on section > 1', () => {
      showSection(2, 'next', true);
      expect(DOM.btnAnterior.disabled).toBe(false);
    });

    it('should show "Enviar" on the last section', () => {
      showSection(5, 'next', true);
      expect(DOM.btnProximo.textContent).toBe('Enviar');
      expect(DOM.btnProximo.className).toContain('btn-success');
    });

    it('should show "Revisar →" on section 4', () => {
      showSection(4, 'next', true);
      expect(DOM.btnProximo.textContent).toBe('Revisar →');
      expect(DOM.btnProximo.className).toContain('btn-primary');
    });

    it('should show "Avançar →" on sections 1-3', () => {
      showSection(3, 'next', true);
      expect(DOM.btnProximo.textContent).toBe('Avançar →');
    });

    it('should update currentSection in state', () => {
      showSection(3, 'next', true);
      expect(state.currentSection).toBe(3);
    });

    it('should hide error message', () => {
      DOM.errorMsg.style.display = 'block';
      showSection(2, 'next', true);
      expect(DOM.errorMsg.style.display).toBe('none');
    });

    it('should scroll wrapper to top', () => {
      DOM.wrapper.scrollTop = 100;
      showSection(2, 'next', true);
      expect(DOM.wrapper.scrollTop).toBe(0);
    });
  });

  describe('prevSection', () => {
    it('should go to previous section', () => {
      state.currentSection = 3;
      prevSection();
      expect(state.currentSection).toBe(2);
    });

    it('should not go below section 1', () => {
      state.currentSection = 1;
      prevSection();
      expect(state.currentSection).toBe(1);
    });
  });

  describe('nextSection', () => {
    it('should advance to next section when validation passes', async () => {
      state.currentSection = 1;
      await nextSection();
      expect(state.currentSection).toBe(2);
    });

    it('should not advance when validation fails', async () => {
      validation.validateSection.mockReturnValue(false);
      state.currentSection = 1;
      await nextSection();
      expect(state.currentSection).toBe(1);
    });

    it('should set iniciaisValido flag on section 1', async () => {
      state.currentSection = 1;
      state.iniciaisValido = false;
      await nextSection();
      expect(state.iniciaisValido).toBe(true);
    });

    it('should not change iniciaisValido on other sections', async () => {
      state.currentSection = 2;
      state.iniciaisValido = false;
      await nextSection();
      expect(state.iniciaisValido).toBe(false);
    });
  });
});
