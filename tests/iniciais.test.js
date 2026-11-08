import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderIniciais } from '../scripts/iniciais.js';
import { iniciaisFields } from '../scripts/fields.js';
import { createTestDOM } from './helpers/dom-fixture.js';
import { DOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';
import { collectIniciais } from '../scripts/collectors.js';

const flushPromises = () => new Promise(r => setTimeout(r, 0));

describe('iniciais', () => {
  beforeEach(() => {
    createTestDOM();
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

    it('should create an editable input for coordenadas', () => {
      renderIniciais();
      const coordenadas = document.getElementById('coordenadas');
      expect(coordenadas).toBeTruthy();
      expect(coordenadas.readOnly).toBe(false);
      expect(coordenadas.className).not.toContain('cursor-not-allowed');
    });

    it('should open the numeric keyboard on the coordenadas field', () => {
      renderIniciais();
      const coordenadas = document.getElementById('coordenadas');
      expect(coordenadas.inputMode).toBe('decimal');
      expect(coordenadas.placeholder).toBe('-3.1245,-38.4156');
      expect(coordenadas.hasAttribute('data-required')).toBe(true);
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

  describe('coordenadas — preenchimento manual', () => {
    it('deve permitir digitar e apagar o valor, que vai para o estado', () => {
      renderIniciais();
      const input = document.getElementById('coordenadas');

      input.value = '-3.1245,-38.4156';
      expect(collectIniciais().coordenadas).toBe('-3.1245,-38.4156');

      input.value = '';
      expect(collectIniciais().coordenadas).toBe('');
    });
  });

  describe('coordenadas — sem preenchimento automático', () => {
    const coordInput = () => document.getElementById('coordenadas');

    const digitar = valor => {
      const input = coordInput();
      input.value = valor;
      input.dispatchEvent(new Event('input'));
    };

    it('não insere o sinal negativo nem o ponto decimal ao digitar', () => {
      renderIniciais();

      digitar('3');
      expect(coordInput().value).toBe('3');

      digitar('-3');
      expect(coordInput().value).toBe('-3');

      digitar('-3.');
      expect(coordInput().value).toBe('-3.');

      digitar('3.1245,38.4156');
      expect(coordInput().value).toBe('3.1245,38.4156');
    });

    it('não completa a longitude ao digitar os algarismos', () => {
      renderIniciais();

      digitar('-3.1245,-38');
      expect(coordInput().value).toBe('-3.1245,-38');
    });

    it('não reposiciona o cursor', () => {
      renderIniciais();
      const input = coordInput();
      input.value = '-3';
      input.setSelectionRange(1, 1);
      input.dispatchEvent(new Event('input'));

      expect(input.value).toBe('-3');
      expect(input.selectionStart).toBe(1);
    });

    it('preserva a edição e a exclusão exatamente como digitadas', () => {
      renderIniciais();

      digitar('-3.1245,-38.4156');
      digitar('-3.1245,-38.41');
      expect(coordInput().value).toBe('-3.1245,-38.41');

      digitar('-3.1245,-38.');
      expect(coordInput().value).toBe('-3.1245,-38.');

      digitar('-3.1245,');
      expect(coordInput().value).toBe('-3.1245,');
    });

    it('remove o destaque de erro assim que o usuário digita', () => {
      renderIniciais();
      const input = coordInput();
      const errorSpan = document.querySelector('.coord-wrapper .field-error');
      input.classList.add('error');
      errorSpan.textContent = 'Formato inválido';
      errorSpan.classList.add('show');

      digitar('-3.1245,-38.4156');

      expect(input.classList.contains('error')).toBe(false);
      expect(errorSpan.classList.contains('show')).toBe(false);
    });
  });

  describe('coordenadas — aviso ao sair do campo', () => {
    const coordInput = () => document.getElementById('coordenadas');
    const coordError = () => document.querySelector('.coord-wrapper .field-error');

    const digitar = valor => {
      const input = coordInput();
      input.value = valor;
      input.dispatchEvent(new Event('input'));
    };

    it('não mostra erro enquanto o usuário digita', () => {
      renderIniciais();
      ['a', '-3', '-3.', '-3.1,-3', '-3.1,-38.'].forEach(valor => {
        digitar(valor);
        expect(coordInput().classList.contains('error')).toBe(false);
        expect(coordError().textContent).toBe('');
      });
    });

    it('mostra a mensagem curta ao sair do campo com valor inválido', () => {
      renderIniciais();
      const input = coordInput();
      input.value = '123';
      input.dispatchEvent(new Event('blur'));

      expect(input.classList.contains('error')).toBe(true);
      expect(coordError().textContent).toBe('Formato inválido. Use -3.12345678,-38.41567890');
      expect(coordError().classList.contains('show')).toBe(true);
    });

    it('não mostra erro ao sair do campo com valor válido', () => {
      renderIniciais();
      const input = coordInput();
      input.value = '-3.12345678,-38.41567890';
      input.dispatchEvent(new Event('blur'));

      expect(input.classList.contains('error')).toBe(false);
      expect(coordError().textContent).toBe('');
    });

    it('limpa o aviso assim que o usuário volta a digitar', () => {
      renderIniciais();
      const input = coordInput();
      input.value = '123';
      input.dispatchEvent(new Event('blur'));
      expect(input.classList.contains('error')).toBe(true);

      digitar('-3.1');

      expect(input.classList.contains('error')).toBe(false);
      expect(coordError().textContent).toBe('');
    });

    it('acusa campo obrigatório ao sair do campo vazio', () => {
      renderIniciais();
      const input = coordInput();
      input.dispatchEvent(new Event('blur'));

      expect(input.classList.contains('error')).toBe(true);
      expect(coordError().textContent).toBe('Campo obrigatório');
    });
  });

  describe('coordenadas — botão de localização', () => {
    function mockGeolocation(impl) {
      const getCurrentPosition = vi.fn(impl);
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: { getCurrentPosition },
      });
      return getCurrentPosition;
    }

    afterEach(() => {
      delete navigator.geolocation;
    });

    it('preenche direto quando o campo está vazio, sem pedir confirmação', async () => {
      renderIniciais();
      const input = document.getElementById('coordenadas');
      const btn = document.querySelector('.coord-refresh');
      const getCurrentPosition = mockGeolocation(success =>
        success({ coords: { latitude: -3.1, longitude: -38.4 } })
      );

      btn.click();
      await vi.waitFor(() => expect(input.value).toBe('-3.1000,-38.4000'));

      expect(getCurrentPosition).toHaveBeenCalledOnce();
      expect(DOM.confirmModal.classList.contains('hidden')).toBe(true);
    });

    it('pede confirmação antes de substituir coordenadas preenchidas', async () => {
      renderIniciais();
      const input = document.getElementById('coordenadas');
      input.value = '-1.0000, -2.0000';
      const btn = document.querySelector('.coord-refresh');
      const getCurrentPosition = mockGeolocation(success =>
        success({ coords: { latitude: -3.1, longitude: -38.4 } })
      );

      btn.click();
      await flushPromises();

      expect(getCurrentPosition).not.toHaveBeenCalled();
      expect(DOM.confirmModal.classList.contains('hidden')).toBe(false);
      DOM.confirmModalOk.click();
      await vi.waitFor(() => expect(input.value).toBe('-3.1000,-38.4000'));
      expect(getCurrentPosition).toHaveBeenCalledOnce();
    });

    it('mantém o valor existente e avisa quando a localização falha', async () => {
      renderIniciais();
      const input = document.getElementById('coordenadas');
      input.value = '-1.0000, -2.0000';
      mockGeolocation((_success, error) => error(new Error('permission denied')));

      document.querySelector('.coord-refresh').click();
      await flushPromises();
      DOM.confirmModalOk.click();

      await vi.waitFor(() =>
        expect(DOM.toast.textContent).toContain('Não foi possível obter a localização')
      );
      expect(input.value).toBe('-1.0000, -2.0000');
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
