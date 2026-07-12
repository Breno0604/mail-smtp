// tests/collectors.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import {
  collectAllData,
  collectIniciais,
  collectRetorno,
  collectEquipamentos,
} from '../scripts/collectors.js';
import { createTestDOM } from './helpers/dom-fixture.js';
import { state, createDefaultEquipamentos } from '../scripts/state.js';

describe('collectors', () => {
  beforeEach(() => {
    createTestDOM();

    // Reset state
    state.iniciais = {};
    state.retorno = {};
    state.equipamentos = createDefaultEquipamentos();
    state.equipamentos.instaladoEquip = 'NAO';
    state.equipamentos.retiradoEquip = 'NAO';
    state.attachments = [];
  });

  describe('collectIniciais', () => {
    it('should collect initial fields from DOM and update state', () => {
      // Setup DOM with fields
      const container = document.getElementById('iniciais-campos');
      container.innerHTML = `
        <input id="uc" value="12345">
        <input id="os" value="67890">
        <input id="lider" value="ANDRE DE SOUSA CARVALHO">
      `;

      const result = collectIniciais();

      expect(result.uc).toBe('12345');
      expect(result.os).toBe('67890');
      expect(result.lider).toBe('ANDRE DE SOUSA CARVALHO');
      expect(state.iniciais.uc).toBe('12345');
    });
  });

  describe('collectRetorno', () => {
    it('should collect retorno fields from DOM and update state', () => {
      document.getElementById('tipo-ordem').value = 'CORTE POR FALTA DE PAGAMENTO';

      const container = document.getElementById('retorno-campos');
      container.innerHTML = `
        <div data-field-nome="situacao_corte" style="display: block;">
          <select id="situacao_corte">
            <option value="CLIENTE CORTADO">CLIENTE CORTADO</option>
          </select>
        </div>
      `;
      document.getElementById('situacao_corte').value = 'CLIENTE CORTADO';

      const result = collectRetorno();

      expect(result.situacao_corte).toBe('CLIENTE CORTADO');
      expect(state.retorno.situacao_corte).toBe('CLIENTE CORTADO');
    });

    it('should return empty object when no tipo-ordem is selected', () => {
      document.getElementById('tipo-ordem').value = '';

      const result = collectRetorno();

      expect(result).toEqual({});
    });
  });

  describe('collectEquipamentos', () => {
    it('should collect equipment fields from DOM and update state', () => {
      // Set up control selects
      document.getElementById('instalado-equip').value = 'SIM';

      // Set up a field input in campos-instalados
      const camposInstalados = document.getElementById('campos-instalados');
      const fieldDiv = document.createElement('div');
      fieldDiv.setAttribute('data-equip', 'medidor');
      fieldDiv.innerHTML =
        '<input type="number" data-tipo="instalados" data-equip="medidor" value="12345">';
      camposInstalados.appendChild(fieldDiv);

      const result = collectEquipamentos();

      expect(result.instaladoEquip).toBe('SIM');
      expect(result.instalados.medidor).toBe('12345');
    });
  });

  describe('collectAllData', () => {
    it('should return all data from state (single source of truth)', () => {
      // Setup state directly (state is the single source of truth)
      state.iniciais = { uc: '12345', os: '67890' };
      state.equipamentos = createDefaultEquipamentos();
      state.equipamentos.instaladoEquip = 'SIM';
      state.equipamentos.retiradoEquip = 'NAO';
      state.equipamentos.instalados.medidor = '12345';
      state.equipamentos.checkboxes.instalados.medidor = true;
      state.retorno = { situacao_corte: 'CLIENTE CORTADO' };
      state.attachments = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
      state.iniciais['tipo-ordem'] = 'CORTE POR FALTA DE PAGAMENTO';

      const result = collectAllData();

      expect(result.iniciais.uc).toBe('12345');
      expect(result.iniciais.os).toBe('67890');
      expect(result.equipamentos.instaladoEquip).toBe('SIM');
      expect(result.equipamentos.instalados.medidor).toBe('12345');
      expect(result.attachments).toHaveLength(1);
      expect(result.tipoOrdem).toBe('CORTE POR FALTA DE PAGAMENTO');
      // Verify state is unchanged (collectAllData reads, doesn't write)
      expect(state.iniciais.uc).toBe('12345');
      expect(state.equipamentos.instaladoEquip).toBe('SIM');
    });
  });
});
