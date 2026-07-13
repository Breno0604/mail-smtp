import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateSection, validateAll, addBlurValidation } from '../scripts/validation.js';
import { DOM } from '../scripts/dom.js';
import { createTestDOM } from './helpers/dom-fixture.js';
import { state, createDefaultEquipamentos } from '../scripts/state.js';
import { renderIniciais } from '../scripts/iniciais.js';
import { renderRetorno } from '../scripts/retornos.js';

describe('validation', () => {
  function setupDOM() {
    createTestDOM();
  }

  function setupEquipmentDOM(instaladoValue, retiradoValue, instaladosData, retiradosData) {
    // Set select values in DOM
    DOM.instaladoEquip.value = instaladoValue || '';
    DOM.retiradoEquip.value = retiradoValue || '';

    // Set state
    state.equipamentos.instaladoEquip = instaladoValue || 'NAO';
    state.equipamentos.retiradoEquip = retiradoValue || 'NAO';
    state.equipamentos.instalados = instaladosData || {
      medidor: '',
      conjunto: '',
      display: '',
      tc_fase_a: '',
      tc_fase_b: '',
      tc_fase_c: '',
      tp_fase_a: '',
      tp_fase_b: '',
      tp_fase_c: '',
    };
    state.equipamentos.retirados = retiradosData || {
      medidor: '',
      conjunto: '',
      display: '',
      tc_fase_a: '',
      tc_fase_b: '',
      tc_fase_c: '',
      tp_fase_a: '',
      tp_fase_b: '',
      tp_fase_c: '',
    };

    // Create input fields in DOM for checked checkboxes
    const camposInstalados = document.getElementById('campos-instalados');
    const camposRetirados = document.getElementById('campos-retirados');
    camposInstalados.innerHTML = '';
    camposRetirados.innerHTML = '';

    // Simulate checkbox states based on what has values
    if (instaladoValue === 'SIM') {
      Object.entries(state.equipamentos.instalados).forEach(([key, val]) => {
        if (val && val.trim() !== '') {
          const wrapper = document.createElement('div');
          wrapper.setAttribute('data-equip', key);
          const input = document.createElement('input');
          input.type = 'number';
          input.setAttribute('data-tipo', 'instalados');
          input.setAttribute('data-equip', key);
          input.value = val;
          wrapper.appendChild(input);
          camposInstalados.appendChild(wrapper);
        }
      });
    }

    if (retiradoValue === 'SIM') {
      Object.entries(state.equipamentos.retirados).forEach(([key, val]) => {
        if (val && val.trim() !== '') {
          const wrapper = document.createElement('div');
          wrapper.setAttribute('data-equip', key);
          const input = document.createElement('input');
          input.type = 'number';
          input.setAttribute('data-tipo', 'retirados');
          input.setAttribute('data-equip', key);
          input.value = val;
          wrapper.appendChild(input);
          camposRetirados.appendChild(wrapper);
        }
      });
    }
  }

  function fillAllRequiredFields() {
    // renderIniciais creates all the fields
    renderIniciais();
    // DOM.tipoOrdem now has a getter that queries the DOM live.
    // No reassignment needed – the getter finds the element automatically.

    document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
    document.getElementById('parceiro').value = 'ANTONIO MAURIELLTON DE ARAUJO MARTINS';
    document.getElementById('municipio').value = 'FORTALEZA';
    document.getElementById('uc').value = '12345';
    document.getElementById('os').value = '67890';
    document.getElementById('notificado').value = 'SIM';
    document.getElementById('placa').value = 'RIE0D84';
    document.getElementById('tipo-ordem').value = 'ADEQUACAO SMF';
    document.getElementById('data').value = '2024-03-15';
    document.getElementById('hora_inicio').value = '08:00';
    document.getElementById('hora_fim').value = '17:00';
  }

  beforeEach(() => {
    setupDOM();
    state.iniciais = {};
    state.iniciaisValido = false;
    state.retorno = {};
    state.equipamentos = createDefaultEquipamentos();
    state.equipamentos.instaladoEquip = 'NAO';
    state.equipamentos.retiradoEquip = 'NAO';
  });

  describe('validateSection(1) - Iniciais', () => {
    it('should return false when all required fields are empty', () => {
      renderIniciais();
      const result = validateSection(1);
      expect(result).toBe(false);
    });

    it('should hide global error when required fields are empty (per-field shown)', () => {
      renderIniciais();
      validateSection(1);
      const errorMsg = document.getElementById('error-msg');
      expect(errorMsg.style.display).toBe('none');
      expect(errorMsg.textContent).toBe('');
    });

    it('should return true when all required fields are filled with valid data', () => {
      fillAllRequiredFields();
      const result = validateSection(1);
      expect(result).toBe(true);
    });

    it('should hide error when validation passes', () => {
      fillAllRequiredFields();
      validateSection(1);
      const errorMsg = document.getElementById('error-msg');
      expect(errorMsg.style.display).toBe('none');
    });

    it('should add error class to empty required fields', () => {
      renderIniciais();
      validateSection(1);
      const fieldsWithRequired = [
        'lider',
        'parceiro',
        'municipio',
        'uc',
        'os',
        'notificado',
        'placa',
        'data',
        'hora_inicio',
        'hora_fim',
        'tipo-ordem',
      ];
      fieldsWithRequired.forEach(name => {
        const el = document.getElementById(name);
        if (el) {
          expect(el.classList.contains('error')).toBe(true);
        }
      });
    });

    it('should remove error class from filled fields', () => {
      fillAllRequiredFields();
      validateSection(1);
      document.querySelectorAll('.error').forEach(el => {
        expect(el.classList.contains('error')).toBe(false);
      });
    });

    it('should return false if data is a future date', () => {
      fillAllRequiredFields();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const year = futureDate.getFullYear();
      const month = String(futureDate.getMonth() + 1).padStart(2, '0');
      const day = String(futureDate.getDate()).padStart(2, '0');
      document.getElementById('data').value = `${year}-${month}-${day}`;
      const result = validateSection(1);
      expect(result).toBe(false);
    });

    it('should return true if hora_fim < hora_inicio (overnight)', () => {
      fillAllRequiredFields();
      document.getElementById('hora_inicio').value = '23:00';
      document.getElementById('hora_fim').value = '01:00';
      const result = validateSection(1);
      expect(result).toBe(true);
    });

    it('should return false if hora_fim equals hora_inicio', () => {
      fillAllRequiredFields();
      document.getElementById('hora_inicio').value = '10:00';
      document.getElementById('hora_fim').value = '10:00';
      const result = validateSection(1);
      expect(result).toBe(false);
    });

    it('should pass when hora_fim is greater than hora_inicio', () => {
      fillAllRequiredFields();
      document.getElementById('hora_inicio').value = '08:00';
      document.getElementById('hora_fim').value = '17:00';
      document.getElementById('data').value = '2024-03-15';
      const result = validateSection(1);
      expect(result).toBe(true);
    });

    it('should show inline error span on empty required field', () => {
      renderIniciais();
      validateSection(1);
      const lider = document.getElementById('lider');
      const errorSpan = lider.nextElementSibling;
      expect(errorSpan.classList.contains('field-error')).toBe(true);
      expect(errorSpan.classList.contains('show')).toBe(true);
      expect(errorSpan.textContent).toBe('Campo obrigatório');
    });

    it('should hide inline error span on filled field', () => {
      fillAllRequiredFields();
      validateSection(1);
      const lider = document.getElementById('lider');
      const errorSpan = lider.nextElementSibling;
      expect(errorSpan.classList.contains('show')).toBe(false);
    });

    it('should show "Data não pode ser futura" inline on future date', () => {
      fillAllRequiredFields();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const year = futureDate.getFullYear();
      const month = String(futureDate.getMonth() + 1).padStart(2, '0');
      const day = String(futureDate.getDate()).padStart(2, '0');
      document.getElementById('data').value = `${year}-${month}-${day}`;
      validateSection(1);
      const dataEl = document.getElementById('data');
      const errorSpan = dataEl.nextElementSibling;
      expect(errorSpan.textContent).toContain('futura');
    });

    it('should show "Hora fim" inline error when hora_fim equals hora_inicio', () => {
      fillAllRequiredFields();
      document.getElementById('hora_inicio').value = '10:00';
      document.getElementById('hora_fim').value = '10:00';
      validateSection(1);
      const horaFim = document.getElementById('hora_fim');
      const errorSpan = horaFim.nextElementSibling;
      expect(errorSpan.textContent).toContain('Hora fim');
    });

    it('should not show error when hora_fim < hora_inicio (overnight)', () => {
      fillAllRequiredFields();
      document.getElementById('hora_inicio').value = '23:00';
      document.getElementById('hora_fim').value = '01:00';
      validateSection(1);
      const horaFim = document.getElementById('hora_fim');
      const errorSpan = horaFim.nextElementSibling;
      expect(errorSpan.textContent).toBe('');
    });

    // ── Validação de UC (5 a 10 dígitos, apenas números) ──

    it('should reject UC with non-numeric characters', () => {
      renderIniciais();
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      document.getElementById('parceiro').value = 'ANTONIO MAURIELLTON DE ARAUJO MARTINS';
      document.getElementById('municipio').value = 'FORTALEZA';
      document.getElementById('uc').value = 'ABC12';
      document.getElementById('os').value = '67890';
      document.getElementById('notificado').value = 'SIM';
      document.getElementById('placa').value = 'RIE0D84';
      document.getElementById('tipo-ordem').value = 'ADEQUACAO SMF';
      document.getElementById('data').value = '2024-03-15';
      document.getElementById('hora_inicio').value = '08:00';
      document.getElementById('hora_fim').value = '17:00';
      const result = validateSection(1);
      expect(result).toBe(false);
      const ucEl = document.getElementById('uc');
      const errorSpan = ucEl.nextElementSibling;
      expect(errorSpan.textContent).toContain('apenas números');
    });

    it('should reject UC with fewer than 5 digits', () => {
      renderIniciais();
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      document.getElementById('parceiro').value = 'ANTONIO MAURIELLTON DE ARAUJO MARTINS';
      document.getElementById('municipio').value = 'FORTALEZA';
      document.getElementById('uc').value = '1234';
      document.getElementById('os').value = '67890';
      document.getElementById('notificado').value = 'SIM';
      document.getElementById('placa').value = 'RIE0D84';
      document.getElementById('tipo-ordem').value = 'ADEQUACAO SMF';
      document.getElementById('data').value = '2024-03-15';
      document.getElementById('hora_inicio').value = '08:00';
      document.getElementById('hora_fim').value = '17:00';
      const result = validateSection(1);
      expect(result).toBe(false);
      const ucEl = document.getElementById('uc');
      const errorSpan = ucEl.nextElementSibling;
      expect(errorSpan.textContent).toContain('entre 5 e 10');
    });

    it('should reject UC with more than 10 digits', () => {
      renderIniciais();
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      document.getElementById('parceiro').value = 'ANTONIO MAURIELLTON DE ARAUJO MARTINS';
      document.getElementById('municipio').value = 'FORTALEZA';
      document.getElementById('uc').value = '12345678901';
      document.getElementById('os').value = '67890';
      document.getElementById('notificado').value = 'SIM';
      document.getElementById('placa').value = 'RIE0D84';
      document.getElementById('tipo-ordem').value = 'ADEQUACAO SMF';
      document.getElementById('data').value = '2024-03-15';
      document.getElementById('hora_inicio').value = '08:00';
      document.getElementById('hora_fim').value = '17:00';
      const result = validateSection(1);
      expect(result).toBe(false);
      const ucEl = document.getElementById('uc');
      const errorSpan = ucEl.nextElementSibling;
      expect(errorSpan.textContent).toContain('entre 5 e 10');
    });

    it('should accept UC with exactly 5 digits', () => {
      renderIniciais();
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      document.getElementById('parceiro').value = 'ANTONIO MAURIELLTON DE ARAUJO MARTINS';
      document.getElementById('municipio').value = 'FORTALEZA';
      document.getElementById('uc').value = '12345';
      document.getElementById('os').value = '67890';
      document.getElementById('notificado').value = 'SIM';
      document.getElementById('placa').value = 'RIE0D84';
      document.getElementById('tipo-ordem').value = 'ADEQUACAO SMF';
      document.getElementById('data').value = '2024-03-15';
      document.getElementById('hora_inicio').value = '08:00';
      document.getElementById('hora_fim').value = '17:00';
      const result = validateSection(1);
      expect(result).toBe(true);
      expect(document.getElementById('uc').classList.contains('error')).toBe(false);
    });

    it('should accept UC with exactly 10 digits', () => {
      renderIniciais();
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      document.getElementById('parceiro').value = 'ANTONIO MAURIELLTON DE ARAUJO MARTINS';
      document.getElementById('municipio').value = 'FORTALEZA';
      document.getElementById('uc').value = '1234567890';
      document.getElementById('os').value = '67890';
      document.getElementById('notificado').value = 'SIM';
      document.getElementById('placa').value = 'RIE0D84';
      document.getElementById('tipo-ordem').value = 'ADEQUACAO SMF';
      document.getElementById('data').value = '2024-03-15';
      document.getElementById('hora_inicio').value = '08:00';
      document.getElementById('hora_fim').value = '17:00';
      const result = validateSection(1);
      expect(result).toBe(true);
    });

    // ── Validação de OS (5 a 10 caracteres, números e A no início) ──

    it('should reject OS with non-numeric non-A characters', () => {
      renderIniciais();
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      document.getElementById('parceiro').value = 'ANTONIO MAURIELLTON DE ARAUJO MARTINS';
      document.getElementById('municipio').value = 'FORTALEZA';
      document.getElementById('uc').value = '12345';
      document.getElementById('os').value = '6789B';
      document.getElementById('notificado').value = 'SIM';
      document.getElementById('placa').value = 'RIE0D84';
      document.getElementById('tipo-ordem').value = 'ADEQUACAO SMF';
      document.getElementById('data').value = '2024-03-15';
      document.getElementById('hora_inicio').value = '08:00';
      document.getElementById('hora_fim').value = '17:00';
      const result = validateSection(1);
      expect(result).toBe(false);
      const osEl = document.getElementById('os');
      const errorSpan = osEl.nextElementSibling;
      expect(errorSpan.textContent).toContain('apenas números');
    });

    it('should reject OS with A not at the start', () => {
      renderIniciais();
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      document.getElementById('parceiro').value = 'ANTONIO MAURIELLTON DE ARAUJO MARTINS';
      document.getElementById('municipio').value = 'FORTALEZA';
      document.getElementById('uc').value = '12345';
      document.getElementById('os').value = '1234A';
      document.getElementById('notificado').value = 'SIM';
      document.getElementById('placa').value = 'RIE0D84';
      document.getElementById('tipo-ordem').value = 'ADEQUACAO SMF';
      document.getElementById('data').value = '2024-03-15';
      document.getElementById('hora_inicio').value = '08:00';
      document.getElementById('hora_fim').value = '17:00';
      const result = validateSection(1);
      expect(result).toBe(false);
      const osEl = document.getElementById('os');
      const errorSpan = osEl.nextElementSibling;
      expect(errorSpan.textContent).toContain('apenas números');
    });

    it('should reject OS with fewer than 5 characters', () => {
      renderIniciais();
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      document.getElementById('parceiro').value = 'ANTONIO MAURIELLTON DE ARAUJO MARTINS';
      document.getElementById('municipio').value = 'FORTALEZA';
      document.getElementById('uc').value = '12345';
      document.getElementById('os').value = '1234';
      document.getElementById('notificado').value = 'SIM';
      document.getElementById('placa').value = 'RIE0D84';
      document.getElementById('tipo-ordem').value = 'ADEQUACAO SMF';
      document.getElementById('data').value = '2024-03-15';
      document.getElementById('hora_inicio').value = '08:00';
      document.getElementById('hora_fim').value = '17:00';
      const result = validateSection(1);
      expect(result).toBe(false);
      const osEl = document.getElementById('os');
      const errorSpan = osEl.nextElementSibling;
      expect(errorSpan.textContent).toContain('entre 5 e 10');
    });

    it('should reject OS with more than 10 characters', () => {
      renderIniciais();
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      document.getElementById('parceiro').value = 'ANTONIO MAURIELLTON DE ARAUJO MARTINS';
      document.getElementById('municipio').value = 'FORTALEZA';
      document.getElementById('uc').value = '12345';
      document.getElementById('os').value = '12345678901';
      document.getElementById('notificado').value = 'SIM';
      document.getElementById('placa').value = 'RIE0D84';
      document.getElementById('tipo-ordem').value = 'ADEQUACAO SMF';
      document.getElementById('data').value = '2024-03-15';
      document.getElementById('hora_inicio').value = '08:00';
      document.getElementById('hora_fim').value = '17:00';
      const result = validateSection(1);
      expect(result).toBe(false);
      const osEl = document.getElementById('os');
      const errorSpan = osEl.nextElementSibling;
      expect(errorSpan.textContent).toContain('entre 5 e 10');
    });

    it('should accept OS starting with A followed by numbers (5-10 total)', () => {
      renderIniciais();
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      document.getElementById('parceiro').value = 'ANTONIO MAURIELLTON DE ARAUJO MARTINS';
      document.getElementById('municipio').value = 'FORTALEZA';
      document.getElementById('uc').value = '12345';
      document.getElementById('os').value = 'A1234';
      document.getElementById('notificado').value = 'SIM';
      document.getElementById('placa').value = 'RIE0D84';
      document.getElementById('tipo-ordem').value = 'ADEQUACAO SMF';
      document.getElementById('data').value = '2024-03-15';
      document.getElementById('hora_inicio').value = '08:00';
      document.getElementById('hora_fim').value = '17:00';
      const result = validateSection(1);
      expect(result).toBe(true);
    });

    it('should accept OS with only numbers (5-10 dígitos)', () => {
      renderIniciais();
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      document.getElementById('parceiro').value = 'ANTONIO MAURIELLTON DE ARAUJO MARTINS';
      document.getElementById('municipio').value = 'FORTALEZA';
      document.getElementById('uc').value = '12345';
      document.getElementById('os').value = '67890';
      document.getElementById('notificado').value = 'SIM';
      document.getElementById('placa').value = 'RIE0D84';
      document.getElementById('tipo-ordem').value = 'ADEQUACAO SMF';
      document.getElementById('data').value = '2024-03-15';
      document.getElementById('hora_inicio').value = '08:00';
      document.getElementById('hora_fim').value = '17:00';
      const result = validateSection(1);
      expect(result).toBe(true);
    });

    it('should handle coordinates field (readonly, not required)', () => {
      renderIniciais();
      // Fill all required fields except coordinates (which is not required)
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      document.getElementById('parceiro').value = 'ANTONIO MAURIELLTON DE ARAUJO MARTINS';
      document.getElementById('municipio').value = 'FORTALEZA';
      document.getElementById('uc').value = '12345';
      document.getElementById('os').value = '67890';
      document.getElementById('notificado').value = 'SIM';
      document.getElementById('placa').value = 'RIE0D84';
      document.getElementById('tipo-ordem').value = 'ADEQUACAO SMF';
      document.getElementById('data').value = '2024-03-15';
      document.getElementById('hora_inicio').value = '08:00';
      document.getElementById('hora_fim').value = '17:00';
      const result = validateSection(1);
      expect(result).toBe(true);
    });
  });

  describe('validateSection(2) - Equipamentos', () => {
    it('should return true when both control fields are NAO', () => {
      setupEquipmentDOM('NAO', 'NAO');
      const result = validateSection(2);
      expect(result).toBe(true);
    });

    it('should return false when instalado select is empty', () => {
      setupEquipmentDOM('', 'NAO');
      const result = validateSection(2);
      expect(result).toBe(false);
    });

    it('should return false when retirado select is empty', () => {
      setupEquipmentDOM('NAO', '');
      const result = validateSection(2);
      expect(result).toBe(false);
    });

    it('should return false when instalado is SIM but no equipment fields filled', () => {
      setupEquipmentDOM('SIM', 'NAO', {
        medidor: '',
        conjunto: '',
        display: '',
        tc_fase_a: '',
        tc_fase_b: '',
        tc_fase_c: '',
        tp_fase_a: '',
        tp_fase_b: '',
        tp_fase_c: '',
      });
      const result = validateSection(2);
      expect(result).toBe(false);
    });

    it('should return true when instalado is SIM with at least one value', () => {
      setupEquipmentDOM('SIM', 'NAO', {
        medidor: '12345',
        conjunto: '',
        display: '',
        tc_fase_a: '',
        tc_fase_b: '',
        tc_fase_c: '',
        tp_fase_a: '',
        tp_fase_b: '',
        tp_fase_c: '',
      });
      const result = validateSection(2);
      expect(result).toBe(true);
    });

    it('should return false when retirado is SIM but no equipment fields filled', () => {
      setupEquipmentDOM('NAO', 'SIM', undefined, {
        medidor: '',
        conjunto: '',
        display: '',
        tc_fase_a: '',
        tc_fase_b: '',
        tc_fase_c: '',
        tp_fase_a: '',
        tp_fase_b: '',
        tp_fase_c: '',
      });
      const result = validateSection(2);
      expect(result).toBe(false);
    });

    it('should return true when retirado is SIM with at least one value', () => {
      setupEquipmentDOM('NAO', 'SIM', undefined, {
        display: '67890',
        medidor: '',
        conjunto: '',
        tc_fase_a: '',
        tc_fase_b: '',
        tc_fase_c: '',
        tp_fase_a: '',
        tp_fase_b: '',
        tp_fase_c: '',
      });
      const result = validateSection(2);
      expect(result).toBe(true);
    });

    it('should hide global error when validation finds empty fields', () => {
      setupEquipmentDOM('SIM', 'NAO', {
        medidor: '',
        conjunto: '',
        display: '',
        tc_fase_a: '',
        tc_fase_b: '',
        tc_fase_c: '',
        tp_fase_a: '',
        tp_fase_b: '',
        tp_fase_c: '',
      });
      validateSection(2);
      const errorMsg = document.getElementById('error-msg');
      expect(errorMsg.style.display).toBe('none');
      expect(errorMsg.textContent).toBe('');
    });

    it('should return true for valid equipment with both instalado and retirado', () => {
      setupEquipmentDOM(
        'SIM',
        'SIM',
        {
          medidor: '111',
          conjunto: '',
          display: '',
          tc_fase_a: '',
          tc_fase_b: '',
          tc_fase_c: '',
          tp_fase_a: '',
          tp_fase_b: '',
          tp_fase_c: '',
        },
        {
          display: '222',
          medidor: '',
          conjunto: '',
          tc_fase_a: '',
          tc_fase_b: '',
          tc_fase_c: '',
          tp_fase_a: '',
          tp_fase_b: '',
          tp_fase_c: '',
        }
      );
      const result = validateSection(2);
      expect(result).toBe(true);
    });
  });

  describe('validateSection(3) - Retorno', () => {
    beforeEach(() => {
      // tipo-ordem already exists from createTestDOM()
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
    });

    it('should return false when textarea with data-required is empty', () => {
      renderRetorno();
      const result = validateSection(3);
      expect(result).toBe(false);
    });

    it('should return true when textarea with data-required is filled', () => {
      renderRetorno();
      const textarea = document.getElementById('descricao');
      textarea.value = 'Some description text';
      const result = validateSection(3);
      expect(result).toBe(true);
    });

    it('should hide global error when retorno field is empty (per-field shown)', () => {
      renderRetorno();
      validateSection(3);
      const errorMsg = document.getElementById('error-msg');
      expect(errorMsg.style.display).toBe('none');
      expect(errorMsg.textContent).toBe('');
    });

    it('should add error class to empty textarea', () => {
      renderRetorno();
      validateSection(3);
      const textarea = document.getElementById('descricao');
      expect(textarea.classList.contains('error')).toBe(true);
    });

    it('should remove error class when value is present', () => {
      renderRetorno();
      const textarea = document.getElementById('descricao');
      textarea.value = 'filled';
      validateSection(3);
      expect(textarea.classList.contains('error')).toBe(false);
    });

    it('should show inline error "Campo obrigatório" on empty retorno', () => {
      renderRetorno();
      validateSection(3);
      const textarea = document.getElementById('descricao');
      const errorSpan = textarea.nextElementSibling;
      expect(errorSpan.classList.contains('field-error')).toBe(true);
      expect(errorSpan.classList.contains('show')).toBe(true);
      expect(errorSpan.textContent).toBe('Campo obrigatório');
    });

    // ── Validação de tamanho da Descrição do Serviço ──

    it('should reject descricao with fewer than 5 characters', () => {
      renderRetorno();
      const textarea = document.getElementById('descricao');
      textarea.value = 'abcd';
      const result = validateSection(3);
      expect(result).toBe(false);
      const errorSpan = textarea.nextElementSibling;
      expect(errorSpan.textContent).toContain('no mínimo 5');
    });

    it('should reject descricao with more than 2000 characters', () => {
      renderRetorno();
      const textarea = document.getElementById('descricao');
      textarea.value = 'x'.repeat(2001);
      const result = validateSection(3);
      expect(result).toBe(false);
      const errorSpan = textarea.nextElementSibling;
      expect(errorSpan.textContent).toContain('no máximo 2000');
    });

    it('should accept descricao with exactly 5 characters', () => {
      renderRetorno();
      const textarea = document.getElementById('descricao');
      textarea.value = 'abcde';
      const result = validateSection(3);
      expect(result).toBe(true);
      expect(textarea.classList.contains('error')).toBe(false);
    });

    it('should accept descricao with exactly 2000 characters', () => {
      renderRetorno();
      const textarea = document.getElementById('descricao');
      textarea.value = 'x'.repeat(2000);
      const result = validateSection(3);
      expect(result).toBe(true);
      expect(textarea.classList.contains('error')).toBe(false);
    });

    it('should reject descricao with only spaces (caught by required check before min)', () => {
      renderRetorno();
      const textarea = document.getElementById('descricao');
      textarea.value = '   ';
      const result = validateSection(3);
      expect(result).toBe(false);
      const errorSpan = textarea.nextElementSibling;
      expect(errorSpan.textContent).toContain('Campo obrigatório');
    });
  });

  describe('validateSection(4) - Anexos', () => {
    it('should return true when there are no attachments', () => {
      state.attachments = [];
      const result = validateSection(4);
      expect(result).toBe(true);
    });

    it('should return true when attachments are within limits', () => {
      state.attachments = [
        new File(['x'.repeat(100)], 'img1.jpg', { type: 'image/jpeg' }),
        new File(['x'.repeat(200)], 'img2.jpg', { type: 'image/jpeg' }),
      ];
      const result = validateSection(4);
      expect(result).toBe(true);
    });

    it('should return false when there are more than 12 attachments', () => {
      state.attachments = [];
      for (let i = 0; i < 13; i++) {
        state.attachments.push(new File(['x'], `f-${i}.jpg`, { type: 'image/jpeg' }));
      }
      const result = validateSection(4);
      expect(result).toBe(false);
    });

    it('should show error message when more than 12 attachments', () => {
      state.attachments = [];
      for (let i = 0; i < 13; i++) {
        state.attachments.push(new File(['x'], `f-${i}.jpg`, { type: 'image/jpeg' }));
      }
      validateSection(4);
      const errorMsg = document.getElementById('error-msg');
      expect(errorMsg.style.display).not.toBe('none');
      expect(errorMsg.textContent).toContain('12');
    });

    it('should return false when an attachment exceeds 8 MB', () => {
      state.attachments = [
        new File(['x'.repeat(9 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' }),
      ];
      const result = validateSection(4);
      expect(result).toBe(false);
    });

    it('should show error with oversized file name', () => {
      state.attachments = [
        new File(['x'.repeat(9 * 1024 * 1024)], 'huge-photo.jpg', { type: 'image/jpeg' }),
      ];
      validateSection(4);
      const errorMsg = document.getElementById('error-msg');
      expect(errorMsg.textContent).toContain('huge-photo.jpg');
    });
  });

  describe('validateSection(5) - Revis\u00E3o', () => {
    it('should always return true', () => {
      const result = validateSection(5);
      expect(result).toBe(true);
    });
  });

  describe('validateAll', () => {
    beforeEach(() => {
      state.attachments = [];
    });

    function setupAllSections() {
      // Sections already exist from createTestDOM()
      renderIniciais();

      // tipo-ordem already exists from createTestDOM()
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
    }

    it('should return false when section 1 has empty required fields', () => {
      setupAllSections();
      const result = validateAll();
      expect(result).toBe(false);
    });

    it('should return false when equipment control selects are empty', () => {
      setupAllSections();
      fillAllRequiredFields();
      // Make equipment controls explicitly empty (default first-option is 'NAO')
      DOM.instaladoEquip.value = '';
      DOM.retiradoEquip.value = '';
      state.equipamentos.instaladoEquip = '';
      state.equipamentos.retiradoEquip = '';
      const result = validateAll();
      expect(result).toBe(false);
    });

    it('should return true when all sections pass', () => {
      setupAllSections();
      fillAllRequiredFields();
      // Fill equipment controls
      DOM.instaladoEquip.value = 'NAO';
      DOM.retiradoEquip.value = 'NAO';
      state.equipamentos.instaladoEquip = 'NAO';
      state.equipamentos.retiradoEquip = 'NAO';
      const result = validateAll();
      expect(result).toBe(true);
    });

    it('should hide global error before validation', () => {
      setupAllSections();
      DOM.errorMsg.textContent = 'Previous error';
      DOM.errorMsg.style.display = 'block';
      expect(DOM.errorMsg.style.display).toBe('block');
      validateAll();
      expect(DOM.errorMsg.style.display).toBe('none');
    });
  });

  describe('validateAll - first error only', () => {
    beforeEach(() => {
      state.attachments = [];
    });

    function setupAllSections() {
      renderIniciais();
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
    }

    it('should only mark the first empty required field with .error class', () => {
      setupAllSections();
      // Fill all fields except the first required (lider)
      document.getElementById('parceiro').value = 'ANTONIO MAURIELLTON DE ARAUJO MARTINS';
      document.getElementById('municipio').value = 'FORTALEZA';
      document.getElementById('uc').value = '12345';
      document.getElementById('os').value = '67890';
      document.getElementById('notificado').value = 'SIM';
      document.getElementById('placa').value = 'RIE0D84';
      document.getElementById('data').value = '2024-03-15';
      document.getElementById('hora_inicio').value = '08:00';
      document.getElementById('hora_fim').value = '17:00';

      validateAll();

      const lider = document.getElementById('lider');
      expect(lider.classList.contains('error')).toBe(true);

      const otherRequired = [
        'parceiro',
        'municipio',
        'uc',
        'os',
        'notificado',
        'placa',
        'data',
        'hora_inicio',
        'hora_fim',
      ];
      otherRequired.forEach(name => {
        const el = document.getElementById(name);
        if (el) {
          expect(el.classList.contains('error')).toBe(false);
        }
      });
    });

    it('should not mark subsequent empty fields with .error', () => {
      setupAllSections();
      // Leave lider, parceiro, municipio empty — fill the rest
      document.getElementById('uc').value = '12345';
      document.getElementById('os').value = '67890';
      document.getElementById('notificado').value = 'SIM';
      document.getElementById('placa').value = 'RIE0D84';
      document.getElementById('data').value = '2024-03-15';
      document.getElementById('hora_inicio').value = '08:00';
      document.getElementById('hora_fim').value = '17:00';

      validateAll();

      // First empty field should have error
      const lider = document.getElementById('lider');
      expect(lider.classList.contains('error')).toBe(true);

      // Subsequent empty fields should NOT have error
      const parceiro = document.getElementById('parceiro');
      expect(parceiro.classList.contains('error')).toBe(false);

      const municipio = document.getElementById('municipio');
      expect(municipio.classList.contains('error')).toBe(false);
    });

    it('should focus on the first invalid field', () => {
      setupAllSections();
      validateAll();

      const lider = document.getElementById('lider');
      expect(document.activeElement).toBe(lider);
    });

    it('should show error span only on the first field', () => {
      setupAllSections();
      validateAll();

      const visibleErrors = document.querySelectorAll('.field-error.show');
      expect(visibleErrors.length).toBe(1);
    });

    it('should show the next error when the first is corrected and re-validated', () => {
      setupAllSections();
      // Both lider and parceiro empty
      validateAll();

      const lider = document.getElementById('lider');
      expect(lider.classList.contains('error')).toBe(true);

      // Fill lider and re-validate
      lider.value = 'ANDRE DE SOUSA CARVALHO';
      validateAll();

      // lider should no longer have error
      expect(lider.classList.contains('error')).toBe(false);

      // parceiro should now be the first error
      const parceiro = document.getElementById('parceiro');
      expect(parceiro.classList.contains('error')).toBe(true);
    });

    it('should maintain scrollIntoView behavior on the first error', () => {
      setupAllSections();

      const scrollSpy = vi
        .spyOn(HTMLElement.prototype, 'scrollIntoView')
        .mockImplementation(() => {});

      validateAll();

      expect(scrollSpy).toHaveBeenCalledTimes(1);
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });

      scrollSpy.mockRestore();
    });
  });

  describe('addBlurValidation', () => {
    it('should add error class on blur when field is empty and required', () => {
      const input = document.createElement('input');
      input.setAttribute('required', '');
      document.body.appendChild(input);
      addBlurValidation(input);
      input.focus();
      input.blur();
      expect(input.classList.contains('error')).toBe(true);
    });

    it('should not add error class on blur when field has value', () => {
      const input = document.createElement('input');
      input.setAttribute('required', '');
      input.value = 'test value';
      document.body.appendChild(input);
      addBlurValidation(input);
      input.focus();
      input.blur();
      expect(input.classList.contains('error')).toBe(false);
    });

    it('should remove error class on input', () => {
      const input = document.createElement('input');
      input.setAttribute('required', '');
      input.classList.add('error');
      document.body.appendChild(input);
      addBlurValidation(input);
      input.dispatchEvent(new Event('input'));
      expect(input.classList.contains('error')).toBe(false);
    });

    it('should remove error class on change when value is filled', () => {
      const input = document.createElement('input');
      input.setAttribute('required', '');
      input.classList.add('error');
      input.value = 'new value';
      document.body.appendChild(input);
      addBlurValidation(input);
      input.dispatchEvent(new Event('change'));
      expect(input.classList.contains('error')).toBe(false);
    });

    it('should handle data-required attribute', () => {
      const input = document.createElement('input');
      input.setAttribute('data-required', '');
      document.body.appendChild(input);
      addBlurValidation(input);
      input.focus();
      input.blur();
      expect(input.classList.contains('error')).toBe(true);
    });

    it('should show inline error span on blur when field has field-error sibling', () => {
      const input = document.createElement('input');
      input.setAttribute('required', '');
      document.body.appendChild(input);
      const errorSpan = document.createElement('span');
      errorSpan.className = 'field-error';
      input.insertAdjacentElement('afterend', errorSpan);
      addBlurValidation(input);
      input.focus();
      input.blur();
      expect(errorSpan.classList.contains('show')).toBe(true);
      expect(errorSpan.textContent).toBe('Campo obrigatório');
    });

    it('should hide inline error span on input', () => {
      const input = document.createElement('input');
      input.setAttribute('required', '');
      document.body.appendChild(input);
      const errorSpan = document.createElement('span');
      errorSpan.className = 'field-error';
      errorSpan.classList.add('show');
      errorSpan.textContent = 'Campo obrigatório';
      input.insertAdjacentElement('afterend', errorSpan);
      addBlurValidation(input);
      input.value = 'filled';
      input.dispatchEvent(new Event('input'));
      expect(errorSpan.classList.contains('show')).toBe(false);
      expect(errorSpan.textContent).toBe('');
    });

    it('should hide inline error span on change when value is filled', () => {
      const input = document.createElement('input');
      input.setAttribute('required', '');
      document.body.appendChild(input);
      const errorSpan = document.createElement('span');
      errorSpan.className = 'field-error';
      errorSpan.classList.add('show');
      errorSpan.textContent = 'Campo obrigatório';
      input.insertAdjacentElement('afterend', errorSpan);
      addBlurValidation(input);
      input.value = 'new value';
      input.dispatchEvent(new Event('change'));
      expect(errorSpan.classList.contains('show')).toBe(false);
      expect(errorSpan.textContent).toBe('');
    });
  });

  describe('validateSection populates state', () => {
    it('should populate state.iniciais after valid section 1', () => {
      fillAllRequiredFields();
      validateSection(1);
      expect(state.iniciais.lider).toBe('ANDRE DE SOUSA CARVALHO');
      expect(state.iniciais.uc).toBe('12345');
      expect(state.iniciais.os).toBe('67890');
      expect(state.iniciais.coordenadas).toBeDefined();
    });

    it('should not populate state.iniciais when section 1 validation fails', () => {
      renderIniciais();
      validateSection(1);
      expect(state.iniciais.lider).toBeUndefined();
    });

    it('should validate section 2 with valid installed equipment', () => {
      setupEquipmentDOM('SIM', 'NAO', {
        medidor: '111',
        conjunto: '',
        display: '',
        tc_fase_a: '',
        tc_fase_b: '',
        tc_fase_c: '',
        tp_fase_a: '',
        tp_fase_b: '',
        tp_fase_c: '',
      });
      const result = validateSection(2);
      expect(result).toBe(true);
    });

    it('should populate state.retorno after valid section 3', () => {
      // tipo-ordem already exists from createTestDOM()
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      const textarea = document.getElementById('descricao');
      textarea.value = 'descricao valida';
      validateSection(3);
      expect(state.retorno.descricao).toBe('descricao valida');
    });

    it('should not populate state.retorno when section 3 validation fails', () => {
      // tipo-ordem already exists from createTestDOM()
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      validateSection(3);
      expect(state.retorno.descricao).toBeUndefined();
    });
  });
});
