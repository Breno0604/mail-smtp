import { describe, it, expect, beforeEach } from 'vitest';
import { resetForm } from '../scripts/reset.js';
import { createTestDOM } from './helpers/dom-fixture.js';
import { DOM } from '../scripts/dom.js';
import { state, createDefaultEquipamentos } from '../scripts/state.js';

describe('reset', () => {
  beforeEach(() => {
    createTestDOM();

    // Set up populated state
    state.iniciais = { uc: '12345', os: '67890' };
    state.equipamentos = createDefaultEquipamentos();
    state.equipamentos.instaladoEquip = 'SIM';
    state.equipamentos.instalados.medidor = '1';
    state.equipamentos.checkboxes.instalados.medidor = true;
    state.attachments = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
    state.lastTipoOrdem = 'ADEQUACAO SMF';
    state.currentUUID = 'test-uuid-123';
    state.iniciaisValido = true;
    state._createdAt = '2024-01-01T00:00:00.000Z';
    state.retorno = { descricao: 'some description' };

    // Populate some DOM elements
    DOM.retornoCampos.innerHTML = '<p>retorno content</p>';
    DOM.previewGrid.innerHTML = '<div class="preview-item">preview</div>';
    DOM.errorMsg.style.display = 'block';
    DOM.errorMsg.textContent = 'Some error';
    localStorage.setItem('currentUUID', 'test-uuid-123');
  });

  describe('resetForm', () => {
    it('should populate state.iniciais with all field keys (empty values)', () => {
      resetForm();
      // updateLivePreview() now syncs state with DOM via collectAllData()
      // After reset, state.iniciais has all field keys with empty/placeholder values
      expect(state.iniciais).not.toEqual({});
      expect(state.iniciais.uc).toBe('');
      expect(state.iniciais.os).toBe('');
      expect(state.iniciais.lider).toBe('');
      expect(state.iniciais['tipo-ordem']).toBe('');
    });

    it('should clear state.equipamentos', () => {
      resetForm();
      expect(state.equipamentos.instaladoEquip).toBe('');
      expect(state.equipamentos.retiradoEquip).toBe('');
      expect(state.equipamentos.instalados.medidor).toBe('');
      expect(state.equipamentos.checkboxes.instalados.medidor).toBe(false);
    });

    it('should clear state.attachments', () => {
      resetForm();
      expect(state.attachments).toEqual([]);
    });

    it('should clear state.lastTipoOrdem', () => {
      resetForm();
      expect(state.lastTipoOrdem).toBe('');
    });

    it('should clear state.currentUUID', () => {
      resetForm();
      expect(state.currentUUID).toBe('');
    });

    it('should clear state._createdAt', () => {
      resetForm();
      expect(state._createdAt).toBeNull();
    });

    it('should reset iniciaisValido to false', () => {
      resetForm();
      expect(state.iniciaisValido).toBe(false);
    });

    it('should clear retorno campos DOM', () => {
      resetForm();
      expect(DOM.retornoCampos.innerHTML).toBe('');
    });

    it('should clear equipamentos list DOM', () => {
      resetForm();
      // Checkboxes should be rendered (empty state)
      expect(DOM.checkboxesInstalados.children.length).toBeGreaterThan(0);
      expect(DOM.camposInstalados.innerHTML).toBe('');
      expect(DOM.camposRetirados.innerHTML).toBe('');
    });

    it('should clear preview grid', () => {
      resetForm();
      expect(DOM.previewGrid.innerHTML).toBe('');
    });

    it('should update file count to 0', () => {
      resetForm();
      expect(DOM.fileCount.textContent).toBe('0 / 12');
    });

    it('should hide error message', () => {
      resetForm();
      expect(DOM.errorMsg.style.display).toBe('none');
    });

    it('should remove currentUUID from localStorage', () => {
      resetForm();
      expect(localStorage.getItem('currentUUID')).toBeNull();
    });
  });
});
