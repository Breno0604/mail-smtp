import { describe, it, expect, beforeEach } from 'vitest';
import { addEquip, showEmptyEquip, hideEmptyEquip, renderEquipamentos } from '../scripts/equipment.js';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';

describe('equipment', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="equipamentos-list"></div>
      <button id="btn-add-equip">+ Adicionar equipamento</button>
      <div id="error-msg" style="display:none"></div>
      <div id="iniciais-campos"></div>
      <div id="retorno-campos"></div>
      <div id="retorno-desc"></div>
      <select id="tipo-ordem"><option value="">Selecione</option></select>
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
    state.equipamentos = [];
    state.attachments = [];
  });

  describe('addEquip', () => {
    it('should create an equipment row with default values', () => {
      addEquip();
      const rows = DOM.equipList.querySelectorAll('.equip-row');
      expect(rows.length).toBe(1);
    });

    it('should create select elements for tipo and categoria', () => {
      addEquip();
      const tipo = DOM.equipList.querySelector('.equip-tipo');
      const categoria = DOM.equipList.querySelector('.equip-categoria');
      expect(tipo).toBeTruthy();
      expect(tipo.tagName).toBe('SELECT');
      expect(categoria).toBeTruthy();
      expect(categoria.tagName).toBe('SELECT');
    });

    it('should create an input for numero', () => {
      addEquip();
      const numero = DOM.equipList.querySelector('.equip-numero');
      expect(numero).toBeTruthy();
      expect(numero.tagName).toBe('INPUT');
      expect(numero.type).toBe('number');
    });

    it('should create a remove button', () => {
      addEquip();
      const removeBtn = DOM.equipList.querySelector('.btn-remove');
      expect(removeBtn).toBeTruthy();
    });

    it('should pre-fill values when data is provided', () => {
      const data = { status: 'Instalado', categoria: 'Medidor', numero: '12345' };
      addEquip(data);
      const tipo = DOM.equipList.querySelector('.equip-tipo');
      const categoria = DOM.equipList.querySelector('.equip-categoria');
      const numero = DOM.equipList.querySelector('.equip-numero');
      expect(tipo.value).toBe('Instalado');
      expect(categoria.value).toBe('Medidor');
      expect(numero.value).toBe('12345');
    });

    it('should add equipment data to state', () => {
      addEquip({ status: 'Retirado', categoria: 'Display', numero: '67890' });
      expect(state.equipamentos).toHaveLength(1);
      expect(state.equipamentos[0].status).toBe('Retirado');
      expect(state.equipamentos[0].categoria).toBe('Display');
      expect(state.equipamentos[0].numero).toBe('67890');
    });

    it('should remove row when remove button is clicked', () => {
      addEquip({ status: 'Instalado', categoria: 'Medidor', numero: '12345' });
      const removeBtn = DOM.equipList.querySelector('.btn-remove');
      removeBtn.click();
      const rows = DOM.equipList.querySelectorAll('.equip-row');
      expect(rows.length).toBe(0);
    });

    it('should show empty message when last row is removed', () => {
      addEquip({ status: 'Instalado', categoria: 'Medidor', numero: '12345' });
      const removeBtn = DOM.equipList.querySelector('.btn-remove');
      removeBtn.click();
      const emptyMsg = DOM.equipList.querySelector('.empty-msg');
      expect(emptyMsg).toBeTruthy();
    });
  });

  describe('showEmptyEquip', () => {
    it('should show empty message when no equipment rows exist', () => {
      DOM.equipList.innerHTML = '';
      showEmptyEquip();
      const msg = DOM.equipList.querySelector('.empty-msg');
      expect(msg).toBeTruthy();
      expect(msg.textContent).toBe('Nenhum equipamento adicionado.');
    });

    it('should not duplicate empty message if already present', () => {
      showEmptyEquip();
      showEmptyEquip();
      const msgs = DOM.equipList.querySelectorAll('.empty-msg');
      expect(msgs.length).toBe(1);
    });
  });

  describe('hideEmptyEquip', () => {
    it('should remove the empty message', () => {
      showEmptyEquip();
      hideEmptyEquip();
      const msg = DOM.equipList.querySelector('.empty-msg');
      expect(msg).toBeNull();
    });

    it('should not throw if no empty message exists', () => {
      DOM.equipList.innerHTML = '';
      expect(() => hideEmptyEquip()).not.toThrow();
    });
  });

  describe('renderEquipamentos', () => {
    it('should show empty message when state.equipamentos is empty', () => {
      state.equipamentos = [];
      renderEquipamentos();
      const emptyMsg = DOM.equipList.querySelector('.empty-msg');
      expect(emptyMsg).toBeTruthy();
    });

    it('should render rows from state.equipamentos', () => {
      state.equipamentos = [
        { status: 'Instalado', categoria: 'Medidor', numero: '111' },
        { status: 'Retirado', categoria: 'Display', numero: '222' },
      ];
      renderEquipamentos();
      const rows = DOM.equipList.querySelectorAll('.equip-row');
      expect(rows.length).toBe(2);
    });

    it('should pre-fill values from state', () => {
      state.equipamentos = [
        { status: 'Instalado', categoria: 'TC', numero: '333' },
      ];
      renderEquipamentos();
      const tipo = DOM.equipList.querySelector('.equip-tipo');
      const categoria = DOM.equipList.querySelector('.equip-categoria');
      const numero = DOM.equipList.querySelector('.equip-numero');
      expect(tipo.value).toBe('Instalado');
      expect(categoria.value).toBe('TC');
      expect(numero.value).toBe('333');
    });

    it('should clear existing rows before rendering', () => {
      // Start with one row via DOM directly
      const existingRow = document.createElement('div');
      existingRow.className = 'equip-row';
      existingRow.innerHTML = '<select class="equip-tipo"><option value="Instalado">Instalado</option></select><select class="equip-categoria"><option value="Medidor">Medidor</option></select><input class="equip-numero" value="old">';
      DOM.equipList.appendChild(existingRow);
      
      state.equipamentos = [{ status: 'Retirado', categoria: 'Display', numero: '42' }];
      renderEquipamentos();
      const rows = DOM.equipList.querySelectorAll('.equip-row');
      expect(rows.length).toBe(1);
      expect(rows[0].querySelector('.equip-numero').value).toBe('42');
    });
  });

  describe('addEquip silent mode', () => {
    it('should accept a silent parameter to skip saveState', () => {
      // silent=true should still create DOM and update state, just skip save
      expect(() => addEquip({ status: 'Instalado', categoria: 'Medidor', numero: '111' }, true)).not.toThrow();
      const rows = DOM.equipList.querySelectorAll('.equip-row');
      expect(rows.length).toBe(1);
      expect(state.equipamentos.length).toBeGreaterThanOrEqual(1);
    });

    it('should default to non-silent (backward compatible)', () => {
      // Without silent param, should work as before
      expect(() => addEquip({ status: 'Retirado', categoria: 'Display', numero: '222' })).not.toThrow();
      const rows = DOM.equipList.querySelectorAll('.equip-row');
      expect(rows.length).toBe(1);
    });
  });

  describe('renderEquipamentos silent behavior', () => {
    it('should render multiple equipment items correctly', () => {
      state.equipamentos = [
        { status: 'Instalado', categoria: 'Medidor', numero: '111' },
        { status: 'Retirado', categoria: 'Display', numero: '222' },
        { status: 'Instalado', categoria: 'TC', numero: '333' },
      ];
      renderEquipamentos();
      const rows = DOM.equipList.querySelectorAll('.equip-row');
      expect(rows.length).toBe(3);
    });

    it('should correctly populate all values when rendering multiple items', () => {
      state.equipamentos = [
        { status: 'Instalado', categoria: 'Medidor', numero: '111' },
        { status: 'Retirado', categoria: 'Display', numero: '222' },
      ];
      renderEquipamentos();
      const rows = DOM.equipList.querySelectorAll('.equip-row');
      expect(rows[0].querySelector('.equip-tipo').value).toBe('Instalado');
      expect(rows[0].querySelector('.equip-categoria').value).toBe('Medidor');
      expect(rows[0].querySelector('.equip-numero').value).toBe('111');
      expect(rows[1].querySelector('.equip-tipo').value).toBe('Retirado');
      expect(rows[1].querySelector('.equip-categoria').value).toBe('Display');
      expect(rows[1].querySelector('.equip-numero').value).toBe('222');
    });
  });
});
