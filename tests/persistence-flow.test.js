import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DOM } from '../scripts/dom.js';
import { createTestDOM } from './helpers/dom-fixture.js';
import {
  state,
  clearCurrentUUID,
  setCurrentUUID,
  createDefaultEquipamentos,
} from '../scripts/state.js';
import { saveState, debouncedSave } from '../scripts/persistence.js';
import { getRecord, getAllRecords, deleteRecord } from '../scripts/db.js';
import { applyRecord } from '../scripts/restore.js';
import { resetForm } from '../scripts/reset.js';
import { renderIniciais } from '../scripts/iniciais.js';
import { renderRetorno, setRetornoData, handleTipoChange } from '../scripts/retornos.js';
import { renderEquipamentos } from '../scripts/equipment.js';
import { collectEquipamentos } from '../scripts/collectors.js';

/**
 * Testes de fluxo de persistência — cenários realistas e adversários
 *
 * Estes testes simulam o comportamento real do usuário:
 * - Preenchimento progressivo com auto-save
 * - Troca entre registros
 * - Abandono e retorno
 * - Campos condicionais
 * - Equipamentos dinâmicos
 */
describe('persistence flow: real-world scenarios', () => {
  beforeEach(() => {
    createTestDOM();

    // Reset state
    state.iniciais = {};
    state.equipamentos = createDefaultEquipamentos();
    state.attachments = [];
    state.lastTipoOrdem = '';
    state.iniciaisValido = false;
    state.currentUUID = '';
    state.retorno = {};
    state._createdAt = null;

    localStorage.clear();
  });

  afterEach(async () => {
    const all = await getAllRecords();
    for (const r of all) {
      await deleteRecord(r.uuid);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CENÁRIO 1: Auto-save progressivo
  // Usuário começa a preencher, registro é criado, continua preenchendo
  // ═══════════════════════════════════════════════════════════════════════

  describe('progressive auto-save', () => {
    it('should create record when UC+OS are filled, then update as user continues filling', async () => {
      // Step 1: Render form and fill UC+OS (triggers initial save)
      renderIniciais();
      document.getElementById('uc').value = '11111';
      document.getElementById('os').value = '22222';
      state.iniciaisValido = true;

      // First save — should create record with UUID
      await saveState();
      expect(state.currentUUID).toBeTruthy();
      const uuid1 = state.currentUUID;

      let record = await getRecord(uuid1);
      expect(record).toBeTruthy();
      expect(record.iniciais.uc).toBe('11111');
      expect(record.iniciais.os).toBe('22222');

      // Step 2: User continues filling more fields
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      document.getElementById('municipio').value = 'FORTALEZA';

      await saveState();

      // Same UUID should be used
      expect(state.currentUUID).toBe(uuid1);
      record = await getRecord(uuid1);
      expect(record.iniciais.lider).toBe('ANDRE DE SOUSA CARVALHO');
      expect(record.iniciais.municipio).toBe('FORTALEZA');
      // Previous fields still there
      expect(record.iniciais.uc).toBe('11111');

      // Step 3: User adds tipo-ordem and retorno
      DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';
      renderRetorno();
      document.getElementById('situacao_corte').value = 'CLIENTE CORTADO';

      await saveState();

      record = await getRecord(uuid1);
      expect(record.tipoOrdem).toBe('CORTE POR FALTA DE PAGAMENTO');
      expect(record.retorno.situacao_corte).toBe('CLIENTE CORTADO');
    });

    it('should NOT save when iniciaisValido is false even if equipment data exists', async () => {
      renderIniciais();
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      // UC and OS are empty — iniciaisValido is false

      // Add equipment data - both state and DOM
      DOM.instaladoEquip.value = 'SIM';
      state.equipamentos.instaladoEquip = 'SIM';
      state.equipamentos.instalados.medidor = '12345';

      // Create the equipment input in DOM (simulating checkbox checked)
      const camposInstalados = document.getElementById('campos-instalados');
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-equip', 'medidor');
      const input = document.createElement('input');
      input.type = 'number';
      input.setAttribute('data-tipo', 'instalados');
      input.setAttribute('data-equip', 'medidor');
      input.value = '12345';
      wrapper.appendChild(input);
      camposInstalados.appendChild(wrapper);

      state.iniciaisValido = false;
      await saveState();

      // No record should be created — UC/OS not filled yet
      expect(state.currentUUID).toBe('');
      const records = await getAllRecords();
      expect(records).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CENÁRIO 2: Troca entre registros
  // Usuário edita A, vai pra B, volta pra A
  // ═══════════════════════════════════════════════════════════════════════

  describe('switching between records', () => {
    it('should preserve data when switching between records multiple times', async () => {
      // Create Record A
      renderIniciais();
      document.getElementById('uc').value = '11111';
      document.getElementById('os').value = '22222';
      DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';
      renderRetorno();
      document.getElementById('situacao_corte').value = 'CLIENTE CORTADO';
      state.iniciaisValido = true;
      await saveState();
      const uuidA = state.currentUUID;

      // Create Record B
      resetForm();
      renderIniciais();
      document.getElementById('uc').value = '33333';
      document.getElementById('os').value = '44444';
      DOM.tipoOrdem.value = 'LIGACAO NOVA MEDIA TENSAO';
      renderRetorno();
      document.getElementById('retorno_ligacao').value = 'VISTORIA';
      document.getElementById('retorno_ligacao').dispatchEvent(new Event('change'));
      state.iniciaisValido = true;
      await saveState();
      const uuidB = state.currentUUID;

      // Edit Record A
      const recordA = await getRecord(uuidA);
      await applyRecord(recordA);
      expect(state.iniciais.uc).toBe('11111');
      expect(state.retorno.situacao_corte).toBe('CLIENTE CORTADO');

      // Switch to Record B
      const recordB = await getRecord(uuidB);
      await applyRecord(recordB);
      expect(state.iniciais.uc).toBe('33333');
      expect(state.retorno.retorno_ligacao).toBe('VISTORIA');

      // Switch back to Record A
      const recordA2 = await getRecord(uuidA);
      await applyRecord(recordA2);
      expect(state.iniciais.uc).toBe('11111');
      expect(state.retorno.situacao_corte).toBe('CLIENTE CORTADO');
      expect(document.getElementById('uc').value).toBe('11111');

      // Switch back to Record B
      const recordB2 = await getRecord(uuidB);
      await applyRecord(recordB2);
      expect(state.iniciais.uc).toBe('33333');
      expect(state.retorno.retorno_ligacao).toBe('VISTORIA');
      expect(document.getElementById('uc').value).toBe('33333');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CENÁRIO 3: Novo registro após edição
  // Usuário edita A, clica "Novo", form limpo, A está salvo
  // ═══════════════════════════════════════════════════════════════════════

  describe('new record after editing', () => {
    it('should preserve edited record when creating new one', async () => {
      // Create and save Record A
      renderIniciais();
      document.getElementById('uc').value = '11111';
      document.getElementById('os').value = '22222';
      state.iniciaisValido = true;
      await saveState();
      const uuidA = state.currentUUID;

      // Edit Record A
      const recordA = await getRecord(uuidA);
      await applyRecord(recordA);
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      await saveState();

      // User clicks "Novo" — resetForm
      resetForm();

      // Verify form is clean
      expect(state.currentUUID).toBe('');
      expect(state.iniciaisValido).toBe(false);
      expect(document.getElementById('uc').value).toBe('');

      // Verify Record A is still saved with all data
      const savedA = await getRecord(uuidA);
      expect(savedA.iniciais.uc).toBe('11111');
      expect(savedA.iniciais.lider).toBe('ANDRE DE SOUSA CARVALHO');

      // Create Record B
      renderIniciais();
      document.getElementById('uc').value = '99999';
      document.getElementById('os').value = '88888';
      state.iniciaisValido = true;
      await saveState();
      const uuidB = state.currentUUID;

      // Verify A and B are different records
      expect(uuidB).not.toBe(uuidA);
      const savedB = await getRecord(uuidB);
      expect(savedB.iniciais.uc).toBe('99999');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CENÁRIO 4: Troca de tipo-ordem limpa retorno
  // ═══════════════════════════════════════════════════════════════════════

  describe('tipo-ordem change clears retorno', () => {
    it('should not leak retorno data when changing tipo-ordem', async () => {
      // Start with CORTE POR FALTA DE PAGAMENTO
      renderIniciais();
      document.getElementById('uc').value = '11111';
      document.getElementById('os').value = '22222';
      DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';
      renderRetorno();
      document.getElementById('situacao_corte').value = 'CLIENTE CORTADO';
      state.iniciaisValido = true;
      await saveState();
      const uuid = state.currentUUID;

      // Verify retorno was saved
      let record = await getRecord(uuid);
      expect(record.retorno.situacao_corte).toBe('CLIENTE CORTADO');

      // Change tipo-ordem to LIGACAO NOVA MEDIA TENSAO
      DOM.tipoOrdem.value = 'LIGACAO NOVA MEDIA TENSAO';
      handleTipoChange();
      document.getElementById('retorno_ligacao').value = 'VISTORIA';
      document.getElementById('retorno_ligacao').dispatchEvent(new Event('change'));
      await saveState();

      // Verify old retorno field is NOT in saved data
      record = await getRecord(uuid);
      expect(record.retorno.retorno_ligacao).toBe('VISTORIA');
      expect(record.retorno.situacao_corte).toBeUndefined();

      // Restore and verify
      await applyRecord(record);
      expect(state.retorno.retorno_ligacao).toBe('VISTORIA');
      expect(state.retorno.situacao_corte).toBeUndefined();
      expect(document.getElementById('situacao_corte')).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CENÁRIO 5: Restore + edição parcial
  // ═══════════════════════════════════════════════════════════════════════

  describe('restore and partial edit', () => {
    it('should preserve unmodified fields when editing after restore', async () => {
      // Create complete record
      renderIniciais();
      document.getElementById('uc').value = '11111';
      document.getElementById('os').value = '22222';
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      document.getElementById('municipio').value = 'FORTALEZA';
      DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';
      renderRetorno();
      document.getElementById('situacao_corte').value = 'CLIENTE CORTADO';
      state.iniciaisValido = true;
      await saveState();
      const uuid = state.currentUUID;

      // Restore
      const record = await getRecord(uuid);
      await applyRecord(record);

      // Edit only UC
      document.getElementById('uc').value = '99999';
      await saveState();

      // Restore again and verify
      const updated = await getRecord(uuid);
      expect(updated.iniciais.uc).toBe('99999');
      expect(updated.iniciais.os).toBe('22222');
      expect(updated.iniciais.lider).toBe('ANDRE DE SOUSA CARVALHO');
      expect(updated.iniciais.municipio).toBe('FORTALEZA');
      expect(updated.retorno.situacao_corte).toBe('CLIENTE CORTADO');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CENÁRIO 6: Equipamentos — adicionar, remover, persistir
  // ═══════════════════════════════════════════════════════════════════════

  describe('equipment persistence', () => {
    it('should persist equipment changes correctly', async () => {
      // Create record with equipment
      renderIniciais();
      document.getElementById('uc').value = '11111';
      document.getElementById('os').value = '22222';
      state.iniciaisValido = true;

      state.equipamentos = {
        instaladoEquip: 'SIM',
        retiradoEquip: 'SIM',
        instalados: {
          medidor: '111',
          conjunto: '',
          display: '222',
          tc_fase_a: '',
          tc_fase_b: '',
          tc_fase_c: '',
          tp_fase_a: '',
          tp_fase_b: '',
          tp_fase_c: '',
        },
        retirados: {
          medidor: '',
          conjunto: '',
          display: '',
          tc_fase_a: '',
          tc_fase_b: '',
          tc_fase_c: '',
          tp_fase_a: '',
          tp_fase_b: '',
          tp_fase_c: '',
        },
        checkboxes: {
          instalados: {
            medidor: true,
            conjunto: false,
            display: true,
            tc_fase_a: false,
            tc_fase_b: false,
            tc_fase_c: false,
            tp_fase_a: false,
            tp_fase_b: false,
            tp_fase_c: false,
          },
          retirados: {
            medidor: false,
            conjunto: false,
            display: false,
            tc_fase_a: false,
            tc_fase_b: false,
            tc_fase_c: false,
            tp_fase_a: false,
            tp_fase_b: false,
            tp_fase_c: false,
          },
        },
      };
      renderEquipamentos();
      document.getElementById('instalado-equip').value = 'SIM';
      document.getElementById('retirado-equip').value = 'NAO';
      await saveState();
      const uuid = state.currentUUID;

      // Restore and verify
      let record = await getRecord(uuid);
      expect(record.equipamentos.instaladoEquip).toBe('SIM');
      expect(record.equipamentos.instalados.medidor).toBe('111');
      expect(record.equipamentos.instalados.display).toBe('222');

      // Remove one equipment (clear display value)
      await applyRecord(record);
      state.equipamentos.instalados.display = '';
      state.equipamentos.checkboxes.instalados.display = false;
      // Re-render to reflect state changes
      renderEquipamentos();
      collectEquipamentos();
      await saveState();

      // Verify
      record = await getRecord(uuid);
      expect(record.equipamentos.instalados.medidor).toBe('111');
      expect(record.equipamentos.instalados.display).toBe('');

      // Add new equipment (add TC to retirados)
      state.equipamentos.retiradoEquip = 'SIM';
      state.equipamentos.retirados.tc_fase_a = '444';
      state.equipamentos.checkboxes.retirados.tc_fase_a = true;
      renderEquipamentos();
      collectEquipamentos();
      await saveState();

      record = await getRecord(uuid);
      expect(record.equipamentos.retirados.tc_fase_a).toBe('444');
      expect(record.equipamentos.instalados.medidor).toBe('111');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CENÁRIO 7: createdAt preservado entre saves
  // ═══════════════════════════════════════════════════════════════════════

  describe('createdAt preservation', () => {
    it('should preserve createdAt across multiple saves', async () => {
      renderIniciais();
      document.getElementById('uc').value = '11111';
      document.getElementById('os').value = '22222';
      state.iniciaisValido = true;
      await saveState();
      const uuid = state.currentUUID;

      const firstRecord = await getRecord(uuid);
      const originalCreatedAt = firstRecord.createdAt;

      // Wait a bit to ensure timestamps would differ
      await new Promise(r => setTimeout(r, 50));

      // Edit and save multiple times
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      await saveState();

      document.getElementById('municipio').value = 'FORTALEZA';
      await saveState();

      // Restore and save again
      const record = await getRecord(uuid);
      await applyRecord(record);
      document.getElementById('parceiro').value = 'JOSE DOGIVAN DA SILVA';
      await saveState();

      // createdAt should be unchanged
      const finalRecord = await getRecord(uuid);
      expect(finalRecord.createdAt).toBe(originalCreatedAt);
      expect(finalRecord.updatedAt).not.toBe(originalCreatedAt);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CENÁRIO 8: Múltiplos registros independentes
  // ═══════════════════════════════════════════════════════════════════════

  describe('multiple independent records', () => {
    it('should maintain 5 independent records without data leakage', async () => {
      const uuids = [];

      // Create 5 records
      for (let i = 1; i <= 5; i++) {
        resetForm();
        renderIniciais();
        document.getElementById('uc').value = `${i}${i}${i}${i}${i}`;
        document.getElementById('os').value = `OS-${i}`;
        DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';
        renderRetorno();
        document.getElementById('situacao_corte').value = 'CLIENTE CORTADO';
        // Set equipment in state and render to DOM
        state.equipamentos = {
          instaladoEquip: 'SIM',
          retiradoEquip: 'NAO',
          instalados: {
            medidor: `${i}11`,
            conjunto: '',
            display: '',
            tc_fase_a: '',
            tc_fase_b: '',
            tc_fase_c: '',
            tp_fase_a: '',
            tp_fase_b: '',
            tp_fase_c: '',
          },
          retirados: {
            medidor: '',
            conjunto: '',
            display: '',
            tc_fase_a: '',
            tc_fase_b: '',
            tc_fase_c: '',
            tp_fase_a: '',
            tp_fase_b: '',
            tp_fase_c: '',
          },
          checkboxes: {
            instalados: {
              medidor: true,
              conjunto: false,
              display: false,
              tc_fase_a: false,
              tc_fase_b: false,
              tc_fase_c: false,
              tp_fase_a: false,
              tp_fase_b: false,
              tp_fase_c: false,
            },
            retirados: {
              medidor: false,
              conjunto: false,
              display: false,
              tc_fase_a: false,
              tc_fase_b: false,
              tc_fase_c: false,
              tp_fase_a: false,
              tp_fase_b: false,
              tp_fase_c: false,
            },
          },
        };
        renderEquipamentos();
        state.iniciaisValido = true;
        await saveState();
        uuids.push(state.currentUUID);
      }

      // Verify all 5 records exist and are independent
      expect(uuids.length).toBe(5);
      const uniqueUuids = new Set(uuids);
      expect(uniqueUuids.size).toBe(5);

      // Verify each record has correct data
      for (let i = 0; i < 5; i++) {
        const record = await getRecord(uuids[i]);
        expect(record.iniciais.uc).toBe(`${i + 1}${i + 1}${i + 1}${i + 1}${i + 1}`);
        expect(record.iniciais.os).toBe(`OS-${i + 1}`);
        expect(record.equipamentos.instalados.medidor).toBe(`${i + 1}11`);
      }

      // Edit record 3 and verify others unchanged
      const record3 = await getRecord(uuids[2]);
      await applyRecord(record3);
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      await saveState();

      // Verify record 3 updated
      const updated3 = await getRecord(uuids[2]);
      expect(updated3.iniciais.lider).toBe('ANDRE DE SOUSA CARVALHO');

      // Verify record 1 and 5 unchanged
      const record1 = await getRecord(uuids[0]);
      expect(record1.iniciais.lider).toBe('');
      const record5 = await getRecord(uuids[4]);
      expect(record5.iniciais.lider).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CENÁRIO 9: Campos condicionais — visibilidade e persistência
  // ═══════════════════════════════════════════════════════════════════════

  describe('conditional fields persistence', () => {
    it('should save conditional field only when visible', async () => {
      renderIniciais();
      document.getElementById('uc').value = '11111';
      document.getElementById('os').value = '22222';
      DOM.tipoOrdem.value = 'LIGACAO NOVA MEDIA TENSAO';
      renderRetorno();
      state.iniciaisValido = true;

      // Fill descricao (always visible)
      document.getElementById('descricao').value = 'Ligacao executada';

      // Select retorno_ligacao = "VISTORIA + LIGAÇÃO" — shows conditional fields
      document.getElementById('retorno_ligacao').value = 'VISTORIA + LIGAÇÃO';
      document.getElementById('retorno_ligacao').dispatchEvent(new Event('change'));

      // Fill conditional fields
      document.getElementById('obra').value = 'CONCLUIDA';
      document.getElementById('ligacao').value = 'CONCLUIDA';

      await saveState();
      const uuid = state.currentUUID;

      let record = await getRecord(uuid);
      expect(record.retorno.descricao).toBe('Ligacao executada');
      expect(record.retorno.obra).toBe('CONCLUIDA');
      expect(record.retorno.ligacao).toBe('CONCLUIDA');

      // Now change retorno_ligacao to "LIGAÇÃO" — hides obra, shows ligacao
      document.getElementById('retorno_ligacao').value = 'LIGAÇÃO';
      document.getElementById('retorno_ligacao').dispatchEvent(new Event('change'));

      // Conditional field should be hidden
      const obraGroup = DOM.retornoCampos.querySelector('[data-field-nome="obra"]');
      expect(obraGroup.style.display).toBe('none');

      await saveState();
      record = await getRecord(uuid);
      // obra should NOT be in retorno (hidden fields excluded)
      expect(record.retorno.obra).toBeUndefined();
      // ligacao should still be there
      expect(record.retorno.ligacao).toBe('CONCLUIDA');
    });

    it('should restore conditional fields with correct visibility', async () => {
      renderIniciais();
      document.getElementById('uc').value = '11111';
      document.getElementById('os').value = '22222';
      DOM.tipoOrdem.value = 'LIGACAO NOVA MEDIA TENSAO';
      renderRetorno();
      state.iniciaisValido = true;

      document.getElementById('retorno_ligacao').value = 'VISTORIA + LIGAÇÃO';
      document.getElementById('retorno_ligacao').dispatchEvent(new Event('change'));
      document.getElementById('obra').value = 'CONCLUIDA';
      document.getElementById('ligacao').value = 'CONCLUIDA';

      await saveState();
      const uuid = state.currentUUID;

      // Restore
      const record = await getRecord(uuid);
      await applyRecord(record);

      // Verify conditional fields are visible and populated
      const obraGroup = DOM.retornoCampos.querySelector('[data-field-nome="obra"]');
      expect(obraGroup.style.display).not.toBe('none');
      expect(document.getElementById('obra').value).toBe('CONCLUIDA');
      expect(document.getElementById('ligacao').value).toBe('CONCLUIDA');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CENÁRIO 10: Delete e criação de novo registro
  // ═══════════════════════════════════════════════════════════════════════

  describe('delete and recreate', () => {
    it('should create a new independent record after deleting current', async () => {
      // Create Record A
      renderIniciais();
      document.getElementById('uc').value = '11111';
      document.getElementById('os').value = '22222';
      state.iniciaisValido = true;
      await saveState();
      const uuidA = state.currentUUID;

      // Delete Record A
      await deleteRecord(uuidA);
      resetForm();

      // Verify form is clean
      expect(state.currentUUID).toBe('');
      expect(state.iniciaisValido).toBe(false);

      // Create Record B
      renderIniciais();
      document.getElementById('uc').value = '99999';
      document.getElementById('os').value = '88888';
      state.iniciaisValido = true;
      await saveState();
      const uuidB = state.currentUUID;

      // Verify B is different from A
      expect(uuidB).not.toBe(uuidA);

      // Verify A is gone
      const deletedA = await getRecord(uuidA);
      expect(deletedA).toBeNull();

      // Verify B exists
      const recordB = await getRecord(uuidB);
      expect(recordB.iniciais.uc).toBe('99999');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CENÁRIO 11: UUID persistência entre saves
  // ═══════════════════════════════════════════════════════════════════════

  describe('UUID persistence', () => {
    it('should use same UUID across multiple saves', async () => {
      renderIniciais();
      document.getElementById('uc').value = '11111';
      document.getElementById('os').value = '22222';
      state.iniciaisValido = true;

      await saveState();
      const uuid1 = state.currentUUID;
      expect(uuid1).toBeTruthy();

      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      await saveState();
      expect(state.currentUUID).toBe(uuid1);

      document.getElementById('municipio').value = 'FORTALEZA';
      await saveState();
      expect(state.currentUUID).toBe(uuid1);

      // Verify only one record exists
      const allRecords = await getAllRecords();
      expect(allRecords.length).toBe(1);
      expect(allRecords[0].uuid).toBe(uuid1);
    });

    it('should generate new UUID after clearCurrentUUID', async () => {
      renderIniciais();
      document.getElementById('uc').value = '11111';
      document.getElementById('os').value = '22222';
      state.iniciaisValido = true;

      await saveState();
      const uuid1 = state.currentUUID;

      clearCurrentUUID();
      expect(state.currentUUID).toBe('');

      // New save should create new UUID
      await saveState();
      const uuid2 = state.currentUUID;
      expect(uuid2).toBeTruthy();
      expect(uuid2).not.toBe(uuid1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CENÁRIO 12: Restore de registro completo
  // ═══════════════════════════════════════════════════════════════════════

  describe('full record restore', () => {
    it('should restore all fields correctly from a complete record', async () => {
      // Create a complete record
      renderIniciais();
      document.getElementById('uc').value = '11111';
      document.getElementById('os').value = '22222';
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      document.getElementById('parceiro').value = 'JOSE DOGIVAN DA SILVA';
      document.getElementById('municipio').value = 'FORTALEZA';
      document.getElementById('notificado').value = 'SIM';
      document.getElementById('placa').value = 'RIE0D84';
      document.getElementById('data').value = '2024-03-15';
      document.getElementById('hora_inicio').value = '08:00';
      document.getElementById('hora_fim').value = '17:00';
      DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';
      renderRetorno();
      document.getElementById('situacao_corte').value = 'CLIENTE CORTADO';
      state.equipamentos = {
        instaladoEquip: 'SIM',
        retiradoEquip: 'SIM',
        instalados: {
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
        retirados: {
          medidor: '',
          conjunto: '',
          display: '222',
          tc_fase_a: '',
          tc_fase_b: '',
          tc_fase_c: '',
          tp_fase_a: '',
          tp_fase_b: '',
          tp_fase_c: '',
        },
        checkboxes: {
          instalados: {
            medidor: true,
            conjunto: false,
            display: false,
            tc_fase_a: false,
            tc_fase_b: false,
            tc_fase_c: false,
            tp_fase_a: false,
            tp_fase_b: false,
            tp_fase_c: false,
          },
          retirados: {
            medidor: false,
            conjunto: false,
            display: true,
            tc_fase_a: false,
            tc_fase_b: false,
            tc_fase_c: false,
            tp_fase_a: false,
            tp_fase_b: false,
            tp_fase_c: false,
          },
        },
      };
      renderEquipamentos();
      state.iniciaisValido = true;
      await saveState();
      const uuid = state.currentUUID;

      // Reset and restore
      resetForm();
      const record = await getRecord(uuid);
      await applyRecord(record);

      // Verify all iniciais fields
      expect(document.getElementById('uc').value).toBe('11111');
      expect(document.getElementById('os').value).toBe('22222');
      expect(document.getElementById('lider').value).toBe('ANDRE DE SOUSA CARVALHO');
      expect(document.getElementById('parceiro').value).toBe('JOSE DOGIVAN DA SILVA');
      expect(document.getElementById('municipio').value).toBe('FORTALEZA');
      expect(document.getElementById('notificado').value).toBe('SIM');
      expect(document.getElementById('placa').value).toBe('RIE0D84');
      expect(document.getElementById('data').value).toBe('2024-03-15');
      expect(document.getElementById('hora_inicio').value).toBe('08:00');
      expect(document.getElementById('hora_fim').value).toBe('17:00');

      // Verify tipo-ordem and retorno
      expect(DOM.tipoOrdem.value).toBe('CORTE POR FALTA DE PAGAMENTO');
      expect(document.getElementById('situacao_corte').value).toBe('CLIENTE CORTADO');

      // Verify equipment
      const instaladoInput = document.querySelector('#campos-instalados input');
      const retiradoInput = document.querySelector('#campos-retirados input');
      expect(instaladoInput.value).toBe('111');
      expect(retiradoInput.value).toBe('222');

      // Verify state
      expect(state.currentUUID).toBe(uuid);
      expect(state.iniciaisValido).toBe(true);
      expect(state.lastTipoOrdem).toBe('CORTE POR FALTA DE PAGAMENTO');
    });
  });
});
