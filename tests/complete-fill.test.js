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
import { renderEquipamentos, addEquip } from '../scripts/equipment.js';
import { collectEquipamentos, collectIniciais } from '../scripts/collectors.js';
import { updateLivePreview } from '../scripts/email.js';

/**
 * Testes de preenchimento completo e persistência
 * Cenários realistas de uso: fechar/reabrir, novo registro abandonado, etc.
 */
describe('complete fill persistence', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="iniciais-campos"></div>
      <div id="equipamentos-list"></div>
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
    state.equipamentos = [];
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
      
      state.equipamentos = [
        { status: 'Instalado', categoria: 'Medidor', numero: '111' },
        { status: 'Retirado', categoria: 'Display', numero: '222' },
      ];
      renderEquipamentos();
      
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
      expect(state.equipamentos).toHaveLength(2);

      // ═══ STEP 4: Edit some fields ═══
      document.getElementById('uc').value = '99999';
      document.getElementById('lider').value = 'CARLOS CRISTIANO DO NASCIMENTO SILVA';
      document.getElementById('situacao_corte').value = 'CLIENTE VISITADO CONTA PAGA';
      
      // Add new equipment
      addEquip({ status: 'Instalado', categoria: 'TC', numero: '333' });
      collectEquipamentos();
      
      await saveState();

      // ═══ STEP 5: Verify changes persisted ═══
      const updatedRecord = await getRecord(uuid);
      expect(updatedRecord.iniciais.uc).toBe('99999');
      expect(updatedRecord.iniciais.os).toBe('22222'); // unchanged
      expect(updatedRecord.iniciais.lider).toBe('CARLOS CRISTIANO DO NASCIMENTO SILVA');
      expect(updatedRecord.retorno.situacao_corte).toBe('CLIENTE VISITADO CONTA PAGA');
      expect(updatedRecord.equipamentos).toHaveLength(3);
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
      <div id="equipamentos-list"></div>
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
    state.equipamentos = [];
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
    expect(state.equipamentos).toHaveLength(0);
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
    state.equipamentos = [{ status: 'Instalado', categoria: 'Medidor', numero: '12345' }];
    renderEquipamentos();
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    resetForm();
    const record = await getRecord(uuid);
    await applyRecord(record);

    expect(state.equipamentos).toHaveLength(1);
    expect(state.equipamentos[0].status).toBe('Instalado');
    expect(state.equipamentos[0].categoria).toBe('Medidor');
    expect(state.equipamentos[0].numero).toBe('12345');
  });

  // ═══ TESTE 4: Múltiplos equipamentos (5) ═══
  it('should persist 5 equipment items correctly', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    state.equipamentos = [
      { status: 'Instalado', categoria: 'Medidor', numero: '111' },
      { status: 'Retirado', categoria: 'Display', numero: '222' },
      { status: 'Instalado', categoria: 'TC', numero: '333' },
      { status: 'Retirado', categoria: 'TP', numero: '444' },
      { status: 'Instalado', categoria: 'Conjunto', numero: '555' },
    ];
    renderEquipamentos();
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    resetForm();
    const record = await getRecord(uuid);
    await applyRecord(record);

    expect(state.equipamentos).toHaveLength(5);
    expect(state.equipamentos[2].categoria).toBe('TC');
    expect(state.equipamentos[4].numero).toBe('555');
  });

  // ═══ TESTE 5: Retorno com campos condicionais visíveis ═══
  it('should persist conditional fields when visible', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    DOM.tipoOrdem.value = 'SUBST. MEDIDOR A PEDIDO';
    renderRetorno();
    document.getElementById('tipo-servico').value = 'Troca de Medidor';
    document.getElementById('tipo-servico').dispatchEvent(new Event('change'));
    document.getElementById('medidor-antigo').value = 'MA-123';
    document.getElementById('medidor-novo').value = 'MN-456';
    document.getElementById('marca-medidor').value = 'Landis+Gyr';
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    resetForm();
    const record = await getRecord(uuid);
    await applyRecord(record);

    expect(state.retorno['tipo-servico']).toBe('Troca de Medidor');
    expect(state.retorno['medidor-antigo']).toBe('MA-123');
    expect(state.retorno['medidor-novo']).toBe('MN-456');
    expect(state.retorno['marca-medidor']).toBe('Landis+Gyr');
  });

  // ═══ TESTE 6: Retorno com campos condicionais ocultos ═══
  it('should not persist hidden conditional fields', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    DOM.tipoOrdem.value = 'SUBST. MEDIDOR A PEDIDO';
    renderRetorno();
    document.getElementById('tipo-servico').value = 'Aferição';
    document.getElementById('tipo-servico').dispatchEvent(new Event('change'));
    // medidor-antigo, medidor-novo, marca-medidor are hidden
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    resetForm();
    const record = await getRecord(uuid);
    await applyRecord(record);

    expect(state.retorno['tipo-servico']).toBe('Aferição');
    expect(state.retorno['medidor-antigo']).toBeUndefined();
    expect(state.retorno['medidor-novo']).toBeUndefined();
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
  it('should persist equipment removal', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    state.equipamentos = [
      { status: 'Instalado', categoria: 'Medidor', numero: '111' },
      { status: 'Retirado', categoria: 'Display', numero: '222' },
      { status: 'Instalado', categoria: 'TC', numero: '333' },
    ];
    renderEquipamentos();
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    // Restore and remove middle equipment
    const record = await getRecord(uuid);
    await applyRecord(record);
    const rows = DOM.equipList.querySelectorAll('.equip-row');
    rows[1].querySelector('.btn-remove').click();
    collectEquipamentos();
    await saveState();

    const updated = await getRecord(uuid);
    expect(updated.equipamentos).toHaveLength(2);
    expect(updated.equipamentos[0].numero).toBe('111');
    expect(updated.equipamentos[1].numero).toBe('333');
  });

  // ═══ TESTE 10: Adicionar equipamento persiste ═══
  it('should persist equipment addition', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    state.equipamentos = [{ status: 'Instalado', categoria: 'Medidor', numero: '111' }];
    renderEquipamentos();
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    // Restore and add equipment
    const record = await getRecord(uuid);
    await applyRecord(record);
    addEquip({ status: 'Retirado', categoria: 'Display', numero: '222' });
    collectEquipamentos();
    await saveState();

    const updated = await getRecord(uuid);
    expect(updated.equipamentos).toHaveLength(2);
    expect(updated.equipamentos[1].numero).toBe('222');
  });

  // ═══ TESTE 11: Trocar tipo-ordem limpa retorno antigo ═══
  it('should clear old retorno when changing tipo-ordem', async () => {
    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    DOM.tipoOrdem.value = 'VISTORIA DA UC';
    renderRetorno();
    document.getElementById('resultado').value = 'Regular';
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    // Restore and change tipo-ordem
    const record = await getRecord(uuid);
    await applyRecord(record);
    DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';
    handleTipoChange();
    document.getElementById('situacao_corte').value = 'CLIENTE CORTADO';
    await saveState();

    const updated = await getRecord(uuid);
    expect(updated.tipoOrdem).toBe('CORTE POR FALTA DE PAGAMENTO');
    expect(updated.retorno.situacao_corte).toBe('CLIENTE CORTADO');
    expect(updated.retorno.resultado).toBeUndefined();
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
    expect(new Date(final.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(originalCreatedAt).getTime());
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
    state.equipamentos = [{ status: 'Instalado', categoria: 'Medidor', numero: '111' }];
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
    expect(state.equipamentos[0].numero).toBe('111');
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
    state.equipamentos = [{ status: '', categoria: '', numero: '' }];
    renderEquipamentos();
    state.iniciaisValido = true;
    await saveState();
    const uuid = state.currentUUID;

    resetForm();
    const record = await getRecord(uuid);
    await applyRecord(record);

    expect(state.equipamentos[0].status).toBe('');
    expect(state.equipamentos[0].categoria).toBe('');
    expect(state.equipamentos[0].numero).toBe('');
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
    DOM.tipoOrdem.value = 'VISTORIA DA UC';
    renderRetorno();
    document.getElementById('resultado').value = 'Regular';
    await saveState();

    // Second tipo-ordem
    DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';
    handleTipoChange();
    document.getElementById('situacao_corte').value = 'CLIENTE CORTADO';
    await saveState();

    // Third tipo-ordem
    DOM.tipoOrdem.value = 'SUBST. MEDIDOR A PEDIDO';
    handleTipoChange();
    document.getElementById('tipo-servico').value = 'Troca de Medidor';
    document.getElementById('tipo-servico').dispatchEvent(new Event('change'));
    document.getElementById('medidor-antigo').value = 'MA-123';
    await saveState();

    const uuid = state.currentUUID;
    resetForm();
    const record = await getRecord(uuid);
    await applyRecord(record);

    expect(state.retorno['tipo-servico']).toBe('Troca de Medidor');
    expect(state.retorno['medidor-antigo']).toBe('MA-123');
    expect(state.retorno.resultado).toBeUndefined();
    expect(state.retorno.situacao_corte).toBeUndefined();
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
