import { describe, it, expect, beforeEach } from 'vitest';
import { renderEquipamentos, toggleSectionVisibility, toggleFieldVisibility, updateFieldValue } from '../scripts/equipment.js';
import { cacheDOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';

describe('equipment', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="instalado-equip"><option value="NAO">NAO</option><option value="SIM">SIM</option></select>
      <select id="retirado-equip"><option value="NAO">NAO</option><option value="SIM">SIM</option></select>
      <div id="sec-equip-instalados" class="hidden"></div>
      <div id="sec-equip-retirados" class="hidden"></div>
      <div id="checkboxes-instalados"></div>
      <div id="checkboxes-retirados"></div>
      <div id="campos-instalados"></div>
      <div id="campos-retirados"></div>
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
    state.equipamentos = {
      instaladoEquip: 'NAO',
      retiradoEquip: 'NAO',
      instalados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
      retirados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
      checkboxes: {
        instalados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false },
        retirados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false }
      }
    };
    state.attachments = [];
  });

  describe('renderEquipamentos', () => {
    it('should render checkboxes for instalados section', () => {
      renderEquipamentos();
      const checkboxes = document.querySelectorAll('#checkboxes-instalados .equip-checkbox');
      expect(checkboxes.length).toBe(9);
    });

    it('should render checkboxes for retirados section', () => {
      renderEquipamentos();
      const checkboxes = document.querySelectorAll('#checkboxes-retirados .equip-checkbox');
      expect(checkboxes.length).toBe(9);
    });

    it('should label each checkbox correctly', () => {
      renderEquipamentos();
      const labels = document.querySelectorAll('#checkboxes-instalados label span');
      expect(labels[0].textContent).toBe('MEDIDOR');
      expect(labels[1].textContent).toBe('CONJUNTO');
      expect(labels[2].textContent).toBe('DISPLAY');
    });

    it('should restore checked state from state', () => {
      state.equipamentos.checkboxes.instalados.medidor = true;
      state.equipamentos.instalados.medidor = '123';
      renderEquipamentos();
      const checkbox = document.querySelector('[data-tipo="instalados"][data-equip="medidor"]');
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('toggleSectionVisibility', () => {
    it('should show section when select value is SIM', () => {
      document.getElementById('instalado-equip').value = 'SIM';
      toggleSectionVisibility('instalados');
      const section = document.getElementById('sec-equip-instalados');
      expect(section.classList.contains('hidden')).toBe(false);
    });

    it('should hide section when select value is NAO', () => {
      document.getElementById('instalado-equip').value = 'SIM';
      toggleSectionVisibility('instalados');
      document.getElementById('instalado-equip').value = 'NAO';
      toggleSectionVisibility('instalados');
      const section = document.getElementById('sec-equip-instalados');
      expect(section.classList.contains('hidden')).toBe(true);
    });

    it('should update state.instaladoEquip when toggling', () => {
      document.getElementById('instalado-equip').value = 'SIM';
      toggleSectionVisibility('instalados');
      expect(state.equipamentos.instaladoEquip).toBe('SIM');

      document.getElementById('instalado-equip').value = 'NAO';
      toggleSectionVisibility('instalados');
      expect(state.equipamentos.instaladoEquip).toBe('NAO');
    });
  });

  describe('toggleFieldVisibility', () => {
    it('should show field input when checkbox is checked', () => {
      renderEquipamentos();
      toggleFieldVisibility('instalados', 'medidor', true);
      const field = document.querySelector('#campos-instalados [data-equip="medidor"]');
      expect(field).toBeTruthy();
    });

    it('should hide field input when checkbox is unchecked', () => {
      renderEquipamentos();
      toggleFieldVisibility('instalados', 'medidor', true);
      toggleFieldVisibility('instalados', 'medidor', false);
      const field = document.querySelector('#campos-instalados [data-equip="medidor"]');
      expect(field).toBeNull();
    });

    it('should update checkbox state on toggle', () => {
      renderEquipamentos();
      toggleFieldVisibility('instalados', 'medidor', true);
      expect(state.equipamentos.checkboxes.instalados.medidor).toBe(true);
      toggleFieldVisibility('instalados', 'medidor', false);
      expect(state.equipamentos.checkboxes.instalados.medidor).toBe(false);
    });

    it('should clear field value when unchecking', () => {
      state.equipamentos.instalados.medidor = '123';
      renderEquipamentos();
      toggleFieldVisibility('instalados', 'medidor', true);
      toggleFieldVisibility('instalados', 'medidor', false);
      expect(state.equipamentos.instalados.medidor).toBe('');
    });
  });

  describe('updateFieldValue', () => {
    it('should update state when field value changes', () => {
      updateFieldValue('instalados', 'medidor', '555');
      expect(state.equipamentos.instalados.medidor).toBe('555');
    });

    it('should update retirados field values', () => {
      updateFieldValue('retirados', 'display', '999');
      expect(state.equipamentos.retirados.display).toBe('999');
    });
  });

  describe('full render and restore cycle', () => {
    it('should restore field values from state after render', () => {
      state.equipamentos.instaladoEquip = 'SIM';
      state.equipamentos.checkboxes.instalados.medidor = true;
      state.equipamentos.checkboxes.instalados.conjunto = true;
      state.equipamentos.instalados.medidor = '111';
      state.equipamentos.instalados.conjunto = '222';

      renderEquipamentos();

      const instaladoCheckbox = document.querySelector('[data-tipo="instalados"][data-equip="medidor"]');
      expect(instaladoCheckbox.checked).toBe(true);

      const conjInput = document.querySelector('#campos-instalados [data-equip="conjunto"] input');
      expect(conjInput.value).toBe('222');
    });
  });

  describe('clearSection on hide', () => {
    it('should clear all fields when hiding section', () => {
      state.equipamentos.instaladoEquip = 'SIM';
      state.equipamentos.checkboxes.instalados.medidor = true;
      state.equipamentos.checkboxes.instalados.display = true;
      state.equipamentos.instalados.medidor = '111';
      state.equipamentos.instalados.display = '222';
      renderEquipamentos();

      // Hide section
      document.getElementById('instalado-equip').value = 'NAO';
      toggleSectionVisibility('instalados');

      // State should be cleared
      expect(state.equipamentos.instalados.medidor).toBe('');
      expect(state.equipamentos.instalados.display).toBe('');
      expect(state.equipamentos.checkboxes.instalados.medidor).toBe(false);
      expect(state.equipamentos.checkboxes.instalados.display).toBe(false);

      // DOM fields should be removed
      const campos = document.getElementById('campos-instalados');
      expect(campos.innerHTML).toBe('');
    });
  });
});
