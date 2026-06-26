import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';
import { saveState, clearCurrentUUID } from '../scripts/persistence.js';
import { getRecord, getAllRecords, deleteRecord } from '../scripts/db.js';
import { applyRecord } from '../scripts/restore.js';
import { resetForm } from '../scripts/reset.js';
import { renderIniciais } from '../scripts/iniciais.js';
import { renderRetorno, setRetornoData, handleTipoChange } from '../scripts/retornos.js';
import { renderEquipamentos } from '../scripts/equipment.js';
import { collectEquipamentos, collectIniciais } from '../scripts/collectors.js';
import { createDefaultEquipamentos } from '../scripts/state.js';
import { updateLivePreview } from '../scripts/email.js';

/**
 * Testes de preenchimento completo e persistência
 * Cenários realistas de uso: fechar/reabrir, novo registro abandonado, etc.
 */
describe('complete fill persistence', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="iniciais-campos"></div>
      <select id="instalado-equip"><option value="NAO">NAO</option><option value="SIM">SIM</option></select>
      <select id="retirado-equip"><option value="NAO">NAO</option><option value="SIM">SIM</option></select>
      <div id="sec-equip-instalados" class="hidden"></div>
      <div id="sec-equip-retirados" class="hidden"></div>
      <div id="checkboxes-instalados"></div>
      <div id="checkboxes-retirados"></div>
      <div id="campos-instalados"></div>
      <div id="campos-retirados"></div>
      <div id="retorno-campos"></div>
      <div id="retorno-placeholder"></div>
      <div id="retorno-desc"></div>
      <select id="tipo-ordem">
        <option value="">Selecione</option>
        <option value="ADEQUACAO SMF">ADEQUACAO SMF</option>
        <option value="CORTE POR FALTA DE PAGAMENTO">CORTE POR FALTA DE PAGAMENTO</option>
        <option value="VISTORIA DA UC">VISTORIA DA UC</option>
        <option value="SUBST. MEDIDOR A PEDIDO">SUBST. MEDIDOR A PEDIDO</option>
        <option value="LIGACAO NOVA MEDIA TENSAO">LIGACAO NOVA MEDIA TENSAO</option>
      </select>
      <div id="preview-grid"></div>
      <div id="preview-corpo">—</div>
      <div id="file-count">0 / 12</div>
      <textarea id="complemento-corpo"></textarea>
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
  // CENÁRIO 1: Preencher tudo → fechar → reabrir → alterar → verificar
  // ═══════════════════════════════════════════════════════════════════════

  describe('fill → close → reopen → edit → verify', () => {
    it('should persist all data after complete fill, close, reopen, and edit', async () => {
      // ═══ STEP 1: Complete fill ═══
      renderIniciais();
      document.getElementById('uc').value = '11111';
      document.getElementById('os').value = '22222';
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      document.getElementById('parceiro').value = 'JOSE DOGIVAN DA SILVA';
      document.getElementById('municipio').value = 'FORTALEZA';
      document.getElementById('notificado').value = 'SIM';
      document.getElementById('placa').value = 'RHS6G02';
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
      document.getElementById('instalado-equip').value = 'SIM';
      document.getElementById('retirado-equip').value = 'SIM';

      state.iniciaisValido = true;
      await saveState();
      const uuid = state.currentUUID;

      // ═══ STEP 2: Simulate close (reset form) ═══
      resetForm();
      expect(state.currentUUID).toBe('');
      // updateLivePreview syncs state with DOM via collectAllData
      expect(state.iniciais).not.toEqual({});
      expect(state.iniciais.uc).toBe('');
      expect(state.iniciais.os).toBe('');

      // ═══ STEP 3: Reopen (restore) ═══
      const record = await getRecord(uuid);
      await applyRecord(record);

      // Verify all data restored
      expect(state.iniciais.uc).toBe('11111');
      expect(state.iniciais.os).toBe('22222');
      expect(state.iniciais.lider).toBe('ANDRE DE SOUSA CARVALHO');
      expect(state.retorno.situacao_corte).toBe('CLIENTE CORTADO');
      expect(state.equipamentos.instaladoEquip).toBe('SIM');
      expect(state.equipamentos.instalados.medidor).toBe('111');

      // ═══ STEP 4: Edit some fields ═══
      document.getElementById('uc').value = '99999';
      document.getElementById('lider').value = 'CARLOS CRISTIANO DO NASCIMENTO SILVA';
      document.getElementById('situacao_corte').value = 'CLIENTE VISITADO CONTA PAGA';

      // Add new equipment
      state.equipamentos.instalados.tc_fase_a = '333';
      state.equipamentos.checkboxes.instalados.tc_fase_a = true;
      renderEquipamentos();
      collectEquipamentos();

      await saveState();

      // ═══ STEP 5: Verify changes persisted ═══
      const updatedRecord = await getRecord(uuid);
      expect(updatedRecord.iniciais.uc).toBe('99999');
      expect(updatedRecord.iniciais.os).toBe('22222'); // unchanged
      expect(updatedRecord.iniciais.lider).toBe('CARLOS CRISTIANO DO NASCIMENTO SILVA');
      expect(updatedRecord.retorno.situacao_corte).toBe('CLIENTE VISITADO CONTA PAGA');
      expect(updatedRecord.equipamentos.instalados.medidor).toBe('111');
      expect(updatedRecord.equipamentos.instalados.tc_fase_a).toBe('333');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // CENÁRIO 2: Novo registro → sair sem salvar → reabrir → verificar
  // ═══════════════════════════════════════════════════════════════════════

  describe('new record → abandon → reopen → verify', () => {
    it('should not create ghost record when abandoning new record', async () => {
      // ═══ STEP 1: Create and save Record A ═══
      renderIniciais();
      document.getElementById('uc').value = '11111';
      document.getElementById('os').value = '22222';
      state.iniciaisValido = true;
      await saveState();
      const uuidA = state.currentUUID;

      // ═══ STEP 2: Start new record (click "Novo") ═══
      resetForm();
      renderIniciais();

      // User starts filling but doesn't save
      document.getElementById('uc').value = '99999';
      document.getElementById('os').value = '88888';
      // state.iniciaisValido is false, so saveState won't create record

      // User abandons (closes browser, clicks away, etc.)
      // No saveState called

      // ═══ STEP 3: Verify no ghost record created ═══
      const allRecords = await getAllRecords();
      expect(allRecords.length).toBe(1); // Only Record A exists
      expect(allRecords[0].uuid).toBe(uuidA);

      // ═══ STEP 4: Reopen Record A ═══
      const recordA = await getRecord(uuidA);
      await applyRecord(recordA);

      // Verify Record A is intact
      expect(state.iniciais.uc).toBe('11111');
      expect(state.iniciais.os).toBe('22222');
      expect(state.currentUUID).toBe(uuidA);

      // ═══ STEP 5: Edit Record A ═══
      document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
      await saveState();

      const updatedA = await getRecord(uuidA);
      expect(updatedA.iniciais.lider).toBe('ANDRE DE SOUSA CARVALHO');
      expect(updatedA.iniciais.uc).toBe('11111'); // unchanged
    });
  });
});

/**
 * 20 testes variados de preenchimento completo e persistência
 */
describe('advanced persistence scenarios', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="iniciais-campos"></div>
      <select id="instalado-equip"><option value="NAO">NAO</option><option value="SIM">SIM</option></select>
      <select id="retirado-equip"><option value="NAO">NAO</option><option value="SIM">SIM</option></select>
      <div id="sec-equip-instalados" class="hidden"></div>
      <div id="sec-equip-retirados" class="hidden"></div>
      <div id="checkboxes-instalados"></div>
      <div id="checkboxes-retirados"></div>
      <div id="campos-instalados"></div>
      <div id="campos-retirados"></div>
      <div id="retorno-campos"></div>
      <div id="retorno-placeholder"></div>
      <div id="retorno-desc"></div>
      <select id="tipo-ordem">
        <option value="">Selecione</option>
        <option value="ADEQUACAO SMF">ADEQUACAO SMF</option>
        <option value="CORTE POR FALTA DE PAGAMENTO">CORTE POR FALTA DE PAGAMENTO</option>
        <option value="VISTORIA DA UC">VISTORIA DA UC</option>
        <option value="SUBST. MEDIDOR A PEDIDO">SUBST. MEDIDOR A PEDIDO</option>
        <option value="LIGACAO NOVA MEDIA TENSAO">LIGACAO NOVA MEDIA TENSAO</option>
      </select>
      <div id="preview-grid"></div>
      <div id="preview-corpo">—</div>
      <div id="file-count">0 / 12</div>
      <textarea id="complemento-corpo"></textarea>
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

  // ═══ TESTE 1: Preenchimento mínimo (só UC+OS) ═══
  it('should persist minimal record with only UC and OS', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    resetForm();
    const record = await getRecord(uuid);
    await applyRecord(record);

    expect(state.iniciais.uc).toBe('11111');
    expect(state.iniciais.os).toBe('22222');
    expect(state.equipamentos.instaladoEquip).toBe('NAO');
    expect(state.retorno).toEqual({});
  });

  // ═══ TESTE 2: Todos os campos iniciais preenchidos ═══
  it('should persist all initial fields when completely filled', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
    document.getElementById('parceiro').value = 'JOSE DOGIVAN DA SILVA';
    document.getElementById('municipio').value = 'FORTALEZA';
    document.getElementById('notificado').value = 'SIM';
    document.getElementById('placa').value = 'RHS6G02';
    document.getElementById('data').value = '2024-03-15';
    document.getElementById('hora_inicio').value = '08:00';
    document.getElementById('hora_fim').value = '17:00';
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    resetForm();
    const record = await getRecord(uuid);
    await applyRecord(record);

    expect(state.iniciais.uc).toBe('11111');
    expect(state.iniciais.lider).toBe('ANDRE DE SOUSA CARVALHO');
    expect(state.iniciais.parceiro).toBe('JOSE DOGIVAN DA SILVA');
    expect(state.iniciais.municipio).toBe('FORTALEZA');
    expect(state.iniciais.notificado).toBe('SIM');
    expect(state.iniciais.placa).toBe('RHS6G02');
    expect(state.iniciais.data).toBe('2024-03-15');
    expect(state.iniciais.hora_inicio).toBe('08:00');
    expect(state.iniciais.hora_fim).toBe('17:00');
  });

  // ═══ TESTE 3: Equipamento único ═══
  it('should persist single equipment correctly', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    state.equipamentos = {
      instaladoEquip: 'SIM',
      retiradoEquip: 'NAO',
      instalados: {
        medidor: '12345',
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
    document.getElementById('instalado-equip').value = 'SIM';
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    resetForm();
    const record = await getRecord(uuid);
    await applyRecord(record);

    expect(state.equipamentos.instaladoEquip).toBe('SIM');
    expect(state.equipamentos.instalados.medidor).toBe('12345');
  });

  // ═══ TESTE 4: Múltiplos equipamentos (5) ═══
  it('should persist multiple equipment categories correctly', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    state.equipamentos = {
      instaladoEquip: 'SIM',
      retiradoEquip: 'SIM',
      instalados: {
        medidor: '111',
        conjunto: '555',
        display: '',
        tc_fase_a: '333',
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
        tp_fase_a: '444',
        tp_fase_b: '',
        tp_fase_c: '',
      },
      checkboxes: {
        instalados: {
          medidor: true,
          conjunto: true,
          display: false,
          tc_fase_a: true,
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
          tp_fase_a: true,
          tp_fase_b: false,
          tp_fase_c: false,
        },
      },
    };
    renderEquipamentos();
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    resetForm();
    const record = await getRecord(uuid);
    await applyRecord(record);

    expect(state.equipamentos.instalados.tc_fase_a).toBe('333');
    expect(state.equipamentos.instalados.conjunto).toBe('555');
    expect(state.equipamentos.retirados.display).toBe('222');
  });

  // ═══ TESTE 5: Retorno com campos condicionais visíveis ═══
  it('should persist conditional fields when visible', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    DOM.tipoOrdem.value = 'LIGACAO NOVA MEDIA TENSAO';
    renderRetorno();
    document.getElementById('retorno_ligacao').value = 'VISTORIA + LIGAÇÃO';
    document.getElementById('retorno_ligacao').dispatchEvent(new Event('change'));
    document.getElementById('obra').value = 'CONCLUIDA';
    document.getElementById('ligacao').value = 'CONCLUIDA';
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    resetForm();
    const record = await getRecord(uuid);
    await applyRecord(record);

    expect(state.retorno.retorno_ligacao).toBe('VISTORIA + LIGAÇÃO');
    expect(state.retorno.obra).toBe('CONCLUIDA');
    expect(state.retorno.ligacao).toBe('CONCLUIDA');
  });

  // ═══ TESTE 6: Retorno com campos condicionais ocultos ═══
  it('should not persist hidden conditional fields', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    DOM.tipoOrdem.value = 'LIGACAO NOVA MEDIA TENSAO';
    renderRetorno();
    document.getElementById('retorno_ligacao').value = 'LIGAÇÃO';
    document.getElementById('retorno_ligacao').dispatchEvent(new Event('change'));
    // tipo_medicao, status_medicao, ponto_de_entrega, medidor_bt are hidden when retorno_ligacao = LIGAÇÃO
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    resetForm();
    const record = await getRecord(uuid);
    await applyRecord(record);

    expect(state.retorno.retorno_ligacao).toBe('LIGAÇÃO');
    expect(state.retorno.tipo_medicao).toBeUndefined();
    expect(state.retorno.status_medicao).toBeUndefined();
  });

  // ═══ TESTE 7: Editar campo específico mantém outros ═══
  it('should preserve other fields when editing one field', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
    document.getElementById('municipio').value = 'FORTALEZA';
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    // Restore and edit only UC
    const record = await getRecord(uuid);
    await applyRecord(record);
    document.getElementById('uc').value = '99999';
    await saveState();

    const updated = await getRecord(uuid);
    expect(updated.iniciais.uc).toBe('99999');
    expect(updated.iniciais.os).toBe('22222'); // unchanged
    expect(updated.iniciais.lider).toBe('ANDRE DE SOUSA CARVALHO'); // unchanged
    expect(updated.iniciais.municipio).toBe('FORTALEZA'); // unchanged
  });

  // ═══ TESTE 9: Remover equipamento persiste ═══
  it('should persist equipment field clearance', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    state.equipamentos = {
      instaladoEquip: 'SIM',
      retiradoEquip: 'SIM',
      instalados: {
        medidor: '111',
        conjunto: '',
        display: '',
        tc_fase_a: '333',
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
          tc_fase_a: true,
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
    document.getElementById('instalado-equip').value = 'SIM';
    document.getElementById('retirado-equip').value = 'SIM';
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    // Restore and clear a field
    const record = await getRecord(uuid);
    await applyRecord(record);
    state.equipamentos.instalados.tc_fase_a = '';
    state.equipamentos.checkboxes.instalados.tc_fase_a = false;
    renderEquipamentos();
    collectEquipamentos();
    await saveState();

    const updated = await getRecord(uuid);
    expect(updated.equipamentos.instalados.tc_fase_a).toBe('');
    expect(updated.equipamentos.instalados.medidor).toBe('111');
  });

  // ═══ TESTE 10: Adicionar equipamento persiste ═══
  it('should persist equipment field addition', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
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
    const uuid = state.currentUUID;

    // Restore and add a new equipment field
    const record = await getRecord(uuid);
    await applyRecord(record);
    state.equipamentos.retirados.display = '222';
    state.equipamentos.checkboxes.retirados.display = true;
    renderEquipamentos();
    collectEquipamentos();
    await saveState();

    const updated = await getRecord(uuid);
    expect(updated.equipamentos.instalados.medidor).toBe('111');
    expect(updated.equipamentos.retirados.display).toBe('222');
  });

  // ═══ TESTE 11: Trocar tipo-ordem limpa retorno antigo ═══
  it('should clear old retorno when changing tipo-ordem', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';
    renderRetorno();
    document.getElementById('situacao_corte').value = 'CLIENTE CORTADO';
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    // Restore and change tipo-ordem
    const record = await getRecord(uuid);
    await applyRecord(record);
    DOM.tipoOrdem.value = 'LIGACAO NOVA MEDIA TENSAO';
    handleTipoChange();
    document.getElementById('retorno_ligacao').value = 'VISTORIA';
    document.getElementById('retorno_ligacao').dispatchEvent(new Event('change'));
    document.getElementById('obra').value = 'CONCLUIDA';
    await saveState();

    const updated = await getRecord(uuid);
    expect(updated.tipoOrdem).toBe('LIGACAO NOVA MEDIA TENSAO');
    expect(updated.retorno.retorno_ligacao).toBe('VISTORIA');
    expect(updated.retorno.situacao_corte).toBeUndefined();
  });

  // ═══ TESTE 12: Múltiplos saves mantêm createdAt ═══
  it('should preserve createdAt across multiple saves', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    const first = await getRecord(uuid);
    const originalCreatedAt = first.createdAt;

    // Wait to ensure different timestamp
    await new Promise(r => setTimeout(r, 50));

    // Multiple saves
    document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
    await saveState();
    document.getElementById('municipio').value = 'FORTALEZA';
    await saveState();

    const final = await getRecord(uuid);
    expect(final.createdAt).toBe(originalCreatedAt);
    // updatedAt should be different (or at least >= createdAt)
    expect(new Date(final.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(originalCreatedAt).getTime()
    );
  });

  // ═══ TESTE 13: Registro com todos os tipos de campo ═══
  it('should persist record with all field types', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
    document.getElementById('municipio').value = 'FORTALEZA';
    document.getElementById('data').value = '2024-03-15';
    document.getElementById('hora_inicio').value = '08:00';
    document.getElementById('hora_fim').value = '17:00';
    DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';
    renderRetorno();
    document.getElementById('situacao_corte').value = 'CLIENTE CORTADO';
    state.equipamentos = {
      instaladoEquip: 'SIM',
      retiradoEquip: 'NAO',
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
    const uuid = state.currentUUID;

    resetForm();
    const record = await getRecord(uuid);
    await applyRecord(record);

    expect(state.iniciais.uc).toBe('11111');
    expect(state.iniciais.data).toBe('2024-03-15');
    expect(state.retorno.situacao_corte).toBe('CLIENTE CORTADO');
    expect(state.equipamentos.instalados.medidor).toBe('111');
  });

  // ═══ TESTE 14: Limpar campo preenchido ═══
  it('should persist cleared field', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    // Restore and clear lider
    const record = await getRecord(uuid);
    await applyRecord(record);
    document.getElementById('lider').value = '';
    await saveState();

    const updated = await getRecord(uuid);
    expect(updated.iniciais.lider).toBe('');
    expect(updated.iniciais.uc).toBe('11111'); // unchanged
  });

  // ═══ TESTE 15: Edição rápida (sem restore intermediário) ═══
  it('should persist rapid edits without intermediate restore', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    // Rapid edits
    document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
    await saveState();
    document.getElementById('municipio').value = 'FORTALEZA';
    await saveState();
    document.getElementById('notificado').value = 'SIM';
    await saveState();

    const final = await getRecord(uuid);
    expect(final.iniciais.lider).toBe('ANDRE DE SOUSA CARVALHO');
    expect(final.iniciais.municipio).toBe('FORTALEZA');
    expect(final.iniciais.notificado).toBe('SIM');
  });

  // ═══ TESTE 16: Retorno com textarea ═══
  it('should persist retorno textarea field', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    DOM.tipoOrdem.value = 'VISTORIA DA UC';
    renderRetorno();
    document.getElementById('descricao').value = 'Descrição longa do serviço realizado';
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    resetForm();
    const record = await getRecord(uuid);
    await applyRecord(record);

    expect(state.retorno.descricao).toBe('Descrição longa do serviço realizado');
  });

  // ═══ TESTE 17: Equipamentos com valores vazios ═══
  it('should persist equipment with empty values', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    state.equipamentos = {
      instaladoEquip: 'SIM',
      retiradoEquip: 'NAO',
      instalados: {
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
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    resetForm();
    const record = await getRecord(uuid);
    await applyRecord(record);

    expect(state.equipamentos.instalados.medidor).toBe('');
    expect(state.equipamentos.instaladoEquip).toBe('SIM');
  });

  // ═══ TESTE 18: Campos com caracteres especiais ═══
  it('should persist fields with special characters', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = 'OS-2024/123';
    // Sync state from DOM
    collectIniciais();
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    resetForm();
    const record = await getRecord(uuid);
    await applyRecord(record);

    expect(state.iniciais.os).toBe('OS-2024/123');
  });

  // ═══ TESTE 19: Múltiplas trocas de tipo-ordem ═══
  it('should handle multiple tipo-ordem changes correctly', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    state.iniciaisValido = true;

    // First tipo-ordem
    DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';
    renderRetorno();
    document.getElementById('situacao_corte').value = 'CLIENTE CORTADO';
    await saveState();

    // Second tipo-ordem
    DOM.tipoOrdem.value = 'LIGACAO NOVA MEDIA TENSAO';
    handleTipoChange();
    document.getElementById('retorno_ligacao').value = 'VISTORIA + LIGAÇÃO';
    document.getElementById('retorno_ligacao').dispatchEvent(new Event('change'));
    document.getElementById('obra').value = 'CONCLUIDA';
    await saveState();

    // Third tipo-ordem (default — only descricao)
    DOM.tipoOrdem.value = 'ADEQUACAO SMF';
    handleTipoChange();
    await saveState();

    const uuid = state.currentUUID;
    resetForm();
    const record = await getRecord(uuid);
    await applyRecord(record);

    expect(state.retorno.situacao_corte).toBeUndefined();
    expect(state.retorno.obra).toBeUndefined();
  });

  // ═══ TESTE 20: Preview atualiza após restore ═══
  it('should update preview after restore', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    resetForm();
    const record = await getRecord(uuid);
    await applyRecord(record);

    // Preview should be updated
    expect(DOM.previewCorpo.textContent).toContain('11111');
    expect(DOM.previewCorpo.textContent).toContain('ANDRE DE SOUSA CARVALHO');
  });
});
