import { describe, it, expect, beforeEach } from 'vitest';
import { validateSection, addBlurValidation, collectSectionData, _resetValidationCache } from '../scripts/validation.js';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';
import { renderIniciais } from '../scripts/iniciais.js';
import { renderRetorno } from '../scripts/retornos.js';

describe('validation', () => {
  function setupDOM() {
    document.body.innerHTML = `
      <div id="error-msg" style="display:none"></div>
      <div id="iniciais-campos"></div>
      <div id="equipamentos-list"></div>
      <div id="retorno-campos"></div>
      <div id="retorno-placeholder"></div>
      <div id="retorno-desc"></div>
      <div id="preview-grid"></div>
      <div id="file-count">0 / 12</div>
      <div id="complemento-corpo"></div>
      <div id="file-upload-area"></div>
      <input type="file" id="file-input">
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
  }

  function fillAllRequiredFields() {
    // renderIniciais creates all the fields
    renderIniciais();
    // Now get the tipo-ordem select and set DOM reference
    DOM.tipoOrdem = document.getElementById('tipo-ordem');
    
    document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
    document.getElementById('parceiro').value = 'ANTONIO MAURIELLTON DE ARAUJO MARTINS';
    document.getElementById('municipio').value = 'FORTALEZA';
    document.getElementById('uc').value = '12345';
    document.getElementById('os').value = '67890';
    document.getElementById('notificado').value = 'SIM';
    document.getElementById('placa').value = 'RHS6G02';
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
    state.equipamentos = [];
    _resetValidationCache();
  });

  describe('validateSection(1) - Iniciais', () => {
    it('should return false when all required fields are empty', () => {
      renderIniciais();
      DOM.tipoOrdem = document.getElementById('tipo-ordem');
      const result = validateSection(1);
      expect(result).toBe(false);
    });

    it('should hide global error when required fields are empty (per-field shown)', () => {
      renderIniciais();
      DOM.tipoOrdem = document.getElementById('tipo-ordem');
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
      DOM.tipoOrdem = document.getElementById('tipo-ordem');
      validateSection(1);
      const fieldsWithRequired = ['lider', 'parceiro', 'municipio', 'uc', 'os', 'notificado', 'placa', 'data', 'hora_inicio', 'hora_fim', 'tipo-ordem'];
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

    it('should return false if hora_fim <= hora_inicio', () => {
      fillAllRequiredFields();
      document.getElementById('hora_inicio').value = '10:00';
      document.getElementById('hora_fim').value = '09:00';
      const result = validateSection(1);
      expect(result).toBe(false);
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
      DOM.tipoOrdem = document.getElementById('tipo-ordem');
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

    it('should show "Hora fim" inline error when hora_fim <= hora_inicio', () => {
      fillAllRequiredFields();
      document.getElementById('hora_inicio').value = '10:00';
      document.getElementById('hora_fim').value = '09:00';
      validateSection(1);
      const horaFim = document.getElementById('hora_fim');
      const errorSpan = horaFim.nextElementSibling;
      expect(errorSpan.textContent).toContain('Hora fim');
    });

    it('should handle coordinates field (readonly, not required)', () => {
      renderIniciais();
      DOM.tipoOrdem = document.getElementById('tipo-ordem');
      // Fill all required fields except coordinates (which is not required)
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      document.getElementById('parceiro').value = 'ANTONIO MAURIELLTON DE ARAUJO MARTINS';
      document.getElementById('municipio').value = 'FORTALEZA';
      document.getElementById('uc').value = '12345';
      document.getElementById('os').value = '67890';
      document.getElementById('notificado').value = 'SIM';
      document.getElementById('placa').value = 'RHS6G02';
      document.getElementById('tipo-ordem').value = 'ADEQUACAO SMF';
      document.getElementById('data').value = '2024-03-15';
      document.getElementById('hora_inicio').value = '08:00';
      document.getElementById('hora_fim').value = '17:00';
      const result = validateSection(1);
      expect(result).toBe(true);
    });
  });

  describe('validateSection(2) - Equipamentos', () => {
    function addEquipmentRow(status, categoria, numero) {
      const row = document.createElement('div');
      row.className = 'equip-row';
      row.innerHTML = `
        <select class="equip-tipo">
          <option value="">Selecione...</option>
          <option value="Instalado" ${status === 'Instalado' ? 'selected' : ''}>Instalado</option>
          <option value="Retirado" ${status === 'Retirado' ? 'selected' : ''}>Retirado</option>
        </select>
        <select class="equip-categoria">
          <option value="">Selecione...</option>
          <option value="Medidor" ${categoria === 'Medidor' ? 'selected' : ''}>Medidor</option>
          <option value="Display" ${categoria === 'Display' ? 'selected' : ''}>Display</option>
        </select>
        <input class="equip-numero" value="${numero || ''}">
      `;
      DOM.equipList.appendChild(row);
    }

    it('should return true when there are no equipment rows (skip allowed)', () => {
      DOM.equipList.innerHTML = '';
      const result = validateSection(2);
      expect(result).toBe(true);
    });

    it('should return false when a row has empty tipo', () => {
      addEquipmentRow('', 'Medidor', '12345');
      const result = validateSection(2);
      expect(result).toBe(false);
    });

    it('should return false when a row has empty categoria', () => {
      addEquipmentRow('Instalado', '', '12345');
      const result = validateSection(2);
      expect(result).toBe(false);
    });

    it('should return false when a row has empty numero', () => {
      addEquipmentRow('Instalado', 'Medidor', '');
      const result = validateSection(2);
      expect(result).toBe(false);
    });

    it('should return false when there are duplicate equipment numbers', () => {
      addEquipmentRow('Instalado', 'Medidor', '12345');
      addEquipmentRow('Retirado', 'Display', '12345');
      const result = validateSection(2);
      expect(result).toBe(false);
    });

    it('should hide global error on duplicate (per-field error shown)', () => {
      addEquipmentRow('Instalado', 'Medidor', '12345');
      addEquipmentRow('Retirado', 'Display', '12345');
      validateSection(2);
      const errorMsg = document.getElementById('error-msg');
      expect(errorMsg.style.display).toBe('none');
      expect(errorMsg.textContent).toBe('');
    });

    it('should return true for valid equipment rows', () => {
      addEquipmentRow('Instalado', 'Medidor', '12345');
      addEquipmentRow('Retirado', 'Display', '67890');
      const result = validateSection(2);
      expect(result).toBe(true);
    });

    it('should add error class to empty fields in equipment row', () => {
      addEquipmentRow('', '', '');
      validateSection(2);
      const tipo = DOM.equipList.querySelector('.equip-tipo');
      const categoria = DOM.equipList.querySelector('.equip-categoria');
      const numero = DOM.equipList.querySelector('.equip-numero');
      expect(tipo.classList.contains('error')).toBe(true);
      expect(categoria.classList.contains('error')).toBe(true);
      expect(numero.classList.contains('error')).toBe(true);
    });

    it('should add error class to empty tipo (no global message)', () => {
      addEquipmentRow('', 'Medidor', '123');
      validateSection(2);
      const tipo = DOM.equipList.querySelector('.equip-tipo');
      expect(tipo.classList.contains('error')).toBe(true);
      const errorMsg = document.getElementById('error-msg');
      expect(errorMsg.style.display).toBe('none');
    });

    it('should add error class to duplicated input (no global message)', () => {
      addEquipmentRow('Instalado', 'Medidor', '111');
      addEquipmentRow('Retirado', 'Display', '111');
      validateSection(2);
      const inputs = DOM.equipList.querySelectorAll('.equip-numero');
      expect(inputs[1].classList.contains('error')).toBe(true);
      const errorMsg = document.getElementById('error-msg');
      expect(errorMsg.style.display).toBe('none');
    });
  });

  describe('validateSection(3) - Retorno', () => {
    beforeEach(() => {
      const select = document.createElement('select');
      select.id = 'tipo-ordem';
      select.innerHTML = '<option value="">Selecione</option><option value="ADEQUACAO SMF">ADEQUACAO SMF</option>';
      document.body.appendChild(select);
      DOM.tipoOrdem = select;
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
      DOM.tipoOrdem = document.getElementById('tipo-ordem');
      validateSection(1);
      expect(state.iniciais.lider).toBeUndefined();
    });

    it('should populate state.equipamentos after valid section 2', () => {
      const row1 = document.createElement('div');
      row1.className = 'equip-row';
      row1.innerHTML = '<select class="equip-tipo"><option value="Instalado">Instalado</option></select><select class="equip-categoria"><option value="Medidor">Medidor</option></select><input class="equip-numero" value="111">';
      DOM.equipList.appendChild(row1);
      const row2 = document.createElement('div');
      row2.className = 'equip-row';
      row2.innerHTML = '<select class="equip-tipo"><option value="Retirado">Retirado</option></select><select class="equip-categoria"><option value="Display">Display</option></select><input class="equip-numero" value="222">';
      DOM.equipList.appendChild(row2);
      validateSection(2);
      expect(state.equipamentos).toHaveLength(2);
      expect(state.equipamentos[0].status).toBe('Instalado');
      expect(state.equipamentos[0].categoria).toBe('Medidor');
      expect(state.equipamentos[0].numero).toBe('111');
    });

    it('should populate state.retorno after valid section 3', () => {
      const select = document.createElement('select');
      select.id = 'tipo-ordem';
      select.innerHTML = '<option value="">Selecione</option><option value="ADEQUACAO SMF">ADEQUACAO SMF</option>';
      document.body.appendChild(select);
      DOM.tipoOrdem = select;
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      const textarea = document.getElementById('descricao');
      textarea.value = 'descricao valida';
      validateSection(3);
      expect(state.retorno.descricao).toBe('descricao valida');
    });

    it('should not populate state.retorno when section 3 validation fails', () => {
      const select = document.createElement('select');
      select.id = 'tipo-ordem';
      select.innerHTML = '<option value="">Selecione</option><option value="ADEQUACAO SMF">ADEQUACAO SMF</option>';
      document.body.appendChild(select);
      DOM.tipoOrdem = select;
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      renderRetorno();
      validateSection(3);
      expect(state.retorno.descricao).toBeUndefined();
    });
  });

  describe('collectSectionData', () => {
    it('should collect iniciais data for section 1', () => {
      renderIniciais();
      DOM.tipoOrdem = document.getElementById('tipo-ordem');
      const lider = document.getElementById('lider');
      if (lider) lider.value = 'ANDRE DE SOUSA CARVALHO';
      const uc = document.getElementById('uc');
      if (uc) uc.value = '12345';
      collectSectionData(1);
      expect(state.iniciais.lider).toBe('ANDRE DE SOUSA CARVALHO');
      expect(state.iniciais.uc).toBe('12345');
    });

    it('should collect equipamentos data for section 2', () => {
      const row = document.createElement('div');
      row.className = 'equip-row';
      row.innerHTML = `
        <select class="equip-tipo"><option value="Instalado">Instalado</option></select>
        <select class="equip-categoria"><option value="Medidor">Medidor</option></select>
        <input class="equip-numero" value="12345">
      `;
      DOM.equipList.appendChild(row);
      collectSectionData(2);
      expect(state.equipamentos).toHaveLength(1);
      expect(state.equipamentos[0].status).toBe('Instalado');
      expect(state.equipamentos[0].categoria).toBe('Medidor');
      expect(state.equipamentos[0].numero).toBe('12345');
    });

    it('should collect retorno data for section 3', () => {
      const select = document.createElement('select');
      select.id = 'tipo-ordem';
      select.innerHTML = '<option value="">Selecione</option><option value="ADEQUACAO SMF">ADEQUACAO SMF</option>';
      document.body.appendChild(select);
      DOM.tipoOrdem = select;
      DOM.tipoOrdem.value = 'ADEQUACAO SMF';
      
      renderRetorno();
      const textarea = document.getElementById('descricao');
      textarea.value = 'test description';
      collectSectionData(3);
      expect(state.retorno.descricao).toBe('test description');
    });

    it('should clear equipamentos list when no rows exist', () => {
      state.equipamentos = [{ status: 'Instalado', categoria: 'Medidor', numero: '123' }];
      DOM.equipList.innerHTML = '';
      collectSectionData(2);
      expect(state.equipamentos).toEqual([]);
    });
  });
});
