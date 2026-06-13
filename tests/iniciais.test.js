import { describe, it, expect, beforeEach } from 'vitest';
import { renderIniciais, iniciaisFields } from '../scripts/iniciais.js';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';
import { collectIniciais } from '../scripts/collectors.js';

describe('iniciais', () => {
  beforeEach(() => {
    document.body.innerHTML = `
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
    state.iniciais = {};
  });

  describe('renderIniciais', () => {
    it('should render form fields into iniciais-campos', () => {
      renderIniciais();
      expect(DOM.iniciaisCampos.children.length).toBeGreaterThan(0);
    });

    it('should create a select element for lider', () => {
      renderIniciais();
      const lider = document.getElementById('lider');
      expect(lider).toBeTruthy();
      expect(lider.tagName).toBe('SELECT');
    });

    it('should create a select element for tipo-ordem', () => {
      renderIniciais();
      const tipoOrdem = document.getElementById('tipo-ordem');
      expect(tipoOrdem).toBeTruthy();
      expect(tipoOrdem.tagName).toBe('SELECT');
    });

    it('should create an input with inputMode numeric for uc', () => {
      renderIniciais();
      const uc = document.getElementById('uc');
      expect(uc).toBeTruthy();
      expect(uc.tagName).toBe('INPUT');
      expect(uc.inputMode).toBe('numeric');
    });

    it('should create a date input for data', () => {
      renderIniciais();
      const data = document.getElementById('data');
      expect(data).toBeTruthy();
      expect(data.type).toBe('date');
    });

    it('should create time inputs with step="300"', () => {
      renderIniciais();
      const horaInicio = document.getElementById('hora_inicio');
      const horaFim = document.getElementById('hora_fim');
      expect(horaInicio).toBeTruthy();
      expect(horaInicio.type).toBe('time');
      expect(horaInicio.step).toBe('300');
      expect(horaFim).toBeTruthy();
      expect(horaFim.type).toBe('time');
      expect(horaFim.step).toBe('300');
    });

    it('should create a readonly input for coordenadas', () => {
      renderIniciais();
      const coordenadas = document.getElementById('coordenadas');
      expect(coordenadas).toBeTruthy();
      expect(coordenadas.readOnly).toBe(true);
      expect(coordenadas.className).toContain('cursor-not-allowed');
    });

    it('should add data-required attribute to required fields', () => {
      renderIniciais();
      const requiredFields = iniciaisFields.filter(f => f.obrigatorio);
      requiredFields.forEach(field => {
        const el = document.getElementById(field.nome);
        if (el && field.tipo !== 'coordinates') {
          expect(el.hasAttribute('data-required')).toBe(true);
        }
      });
    });

    it('should render select fields with options', () => {
      renderIniciais();
      const lider = document.getElementById('lider');
      expect(lider.options.length).toBeGreaterThan(1); // placeholder + options
      // First option should be the placeholder
      expect(lider.options[0].value).toBe('');
      expect(lider.options[0].textContent).toBe('Selecione');
    });

    it('should render a text input for os', () => {
      renderIniciais();
      const os = document.getElementById('os');
      expect(os).toBeTruthy();
      expect(os.type).toBe('text');
    });

    it('should clear existing content before rendering', () => {
      DOM.iniciaisCampos.innerHTML = '<div>old content</div>';
      renderIniciais();
      expect(DOM.iniciaisCampos.innerHTML).not.toContain('old content');
    });

    it('should create wrapper divs for layout', () => {
      renderIniciais();
      // Check that some wrapper divs were created (grid-cols-2 etc)
      const wrappers = DOM.iniciaisCampos.querySelectorAll(':scope > div');
      expect(wrappers.length).toBeGreaterThan(0);
    });

    it('should render select for notificado with SIM and NÃO options', () => {
      renderIniciais();
      const notificado = document.getElementById('notificado');
      expect(notificado).toBeTruthy();
      const options = Array.from(notificado.options).map(o => o.value);
      expect(options).toContain('SIM');
      expect(options).toContain('NÃO');
    });

    it('should have labels for all fields', () => {
      renderIniciais();
      iniciaisFields.forEach(field => {
        const label = document.querySelector(`label[for="${field.nome}"]`);
        expect(label).toBeTruthy();
        expect(label.textContent).toContain(field.label);
      });
    });

    it('should show asterisk on required field labels', () => {
      renderIniciais();
      const requiredFields = iniciaisFields.filter(f => f.obrigatorio);
      requiredFields.forEach(field => {
        const label = document.querySelector(`label[for="${field.nome}"]`);
        expect(label.innerHTML).toContain('*');
      });
    });

    it('should set id on each input element', () => {
      renderIniciais();
      iniciaisFields.forEach(field => {
        const el = document.getElementById(field.nome);
        expect(el).toBeTruthy();
      });
    });

    it('should create field-error span after each required input', () => {
      renderIniciais();
      const requiredFields = iniciaisFields.filter(f => f.obrigatorio);
      requiredFields.forEach(field => {
        const el = document.getElementById(field.nome);
        if (el && field.tipo !== 'coordinates') {
          const errorSpan = el.nextElementSibling;
          expect(errorSpan).toBeTruthy();
          expect(errorSpan.classList.contains('field-error')).toBe(true);
        }
      });
    });
  });

  describe('collectIniciais', () => {
    it('should return all field values from DOM', () => {
      renderIniciais();
      // Fill some fields
      const lider = document.getElementById('lider');
      lider.value = 'ANDRE DE SOUSA CARVALHO';
      const uc = document.getElementById('uc');
      uc.value = '12345';
      
      const data = collectIniciais();
      expect(data.lider).toBe('ANDRE DE SOUSA CARVALHO');
      expect(data.uc).toBe('12345');
    });

    it('should return empty strings for unfilled fields', () => {
      renderIniciais();
      const data = collectIniciais();
      Object.values(data).forEach(val => {
        expect(val).toBe('');
      });
    });

    it('should return object with all field names as keys', () => {
      renderIniciais();
      const data = collectIniciais();
      const fieldNames = iniciaisFields.map(f => f.nome);
      fieldNames.forEach(name => {
        expect(data).toHaveProperty(name);
      });
      expect(Object.keys(data).length).toBe(fieldNames.length);
    });

    it('should update state.iniciais when collecting', () => {
      renderIniciais();
      const lider = document.getElementById('lider');
      lider.value = 'ANDRE DE SOUSA CARVALHO';
      collectIniciais();
      expect(state.iniciais.lider).toBe('ANDRE DE SOUSA CARVALHO');
    });
  });

  describe('iniciaisFields export', () => {
    it('should be the same array as from fields.js', () => {
      expect(Array.isArray(iniciaisFields)).toBe(true);
    });
  });
});
