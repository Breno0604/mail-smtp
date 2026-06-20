import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';
import { saveDraft, getRecord, getAllRecords, deleteRecord } from '../scripts/db.js';
import { applyRecord } from '../scripts/restore.js';
import { resetForm } from '../scripts/reset.js';
import { renderIniciais } from '../scripts/iniciais.js';
import { renderRetorno, setRetornoData } from '../scripts/retornos.js';
import { renderEquipamentos } from '../scripts/equipment.js';
import { collectIniciais, collectRetorno } from '../scripts/collectors.js';

/**
 * Teste de integração — fluxo completo do usuário:
 * 1. Criar registro → preencher campos → salvar
 * 2. Editar o registro → verificar que dados estão corretos
 * 3. Excluir o registro → verificar que form foi resetado
 */
describe('integration: full record lifecycle', () => {
  beforeEach(() => {
    // Setup DOM completo
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

    // Reset state
    state.iniciais = {};
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
    state.lastTipoOrdem = '';
    state.iniciaisValido = false;
    state.currentUUID = '';
    state.retorno = {};
    state._createdAt = null;

    localStorage.clear();
  });

  afterEach(async () => {
    // Clean all records between tests
    const all = await getAllRecords();
    for (const r of all) {
      await deleteRecord(r.uuid);
    }
  });

  it('should create, save, edit, and delete a record correctly', async () => {
    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: Create and save a record
    // ═══════════════════════════════════════════════════════════════════════

    // Render form fields
    renderIniciais();

    // Fill iniciais fields
    const ucInput = document.getElementById('uc');
    const osInput = document.getElementById('os');
    const liderInput = document.getElementById('lider');
    const municipioInput = document.getElementById('municipio');

    ucInput.value = '99999';
    osInput.value = '88888';
    liderInput.value = 'ANDRE DE SOUSA CARVALHO';
    municipioInput.value = 'FORTALEZA';

    // Set tipo-ordem
    DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';

    // Render retorno fields
    renderRetorno();

    // Fill retorno field
    const situacaoCorte = document.getElementById('situacao_corte');
    expect(situacaoCorte).toBeTruthy();
    situacaoCorte.value = 'CLIENTE CORTADO';

    // Add equipment
    state.equipamentos.instaladoEquip = 'SIM';
    state.equipamentos.retiradoEquip = 'SIM';
    state.equipamentos.instalados = { medidor: '12345', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' };
    state.equipamentos.retirados = { medidor: '', conjunto: '', display: '67890', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' };
    state.equipamentos.checkboxes.instalados.medidor = true;
    state.equipamentos.checkboxes.retirados.display = true;
    renderEquipamentos();

    // Create record and save
    const record = {
      uuid: 'integration-test-uuid',
      status: 'draft',
      createdAt: '2024-03-15T10:00:00.000Z',
      updatedAt: '2024-03-15T10:00:00.000Z',
      iniciais: collectIniciais(),
      retorno: collectRetorno(),
      tipoOrdem: DOM.tipoOrdem.value,
      equipamentos: state.equipamentos,
      attachmentCount: 0,
      sentData: null,
    };

    await saveDraft(record);

    // Verify record was saved
    const savedRecord = await getRecord('integration-test-uuid');
    expect(savedRecord).toBeTruthy();
    expect(savedRecord.iniciais.uc).toBe('99999');
    expect(savedRecord.iniciais.os).toBe('88888');
    expect(savedRecord.retorno.situacao_corte).toBe('CLIENTE CORTADO');
    expect(savedRecord.equipamentos.instaladoEquip).toBe('SIM');
    expect(savedRecord.equipamentos.instalados.medidor).toBe('12345');

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: Edit the record — restore and verify data
    // ═══════════════════════════════════════════════════════════════════════

    // Restore the record
    await applyRecord(savedRecord);

    // Verify state was synchronized
    expect(state.currentUUID).toBe('integration-test-uuid');
    expect(state.iniciaisValido).toBe(true);
    expect(state.lastTipoOrdem).toBe('CORTE POR FALTA DE PAGAMENTO');
    expect(state.iniciais.uc).toBe('99999');
    expect(state.iniciais.os).toBe('88888');
    expect(state.retorno.situacao_corte).toBe('CLIENTE CORTADO');
    expect(state.equipamentos.instaladoEquip).toBe('SIM');
    expect(state.equipamentos.instalados.medidor).toBe('12345');

    // Verify DOM was populated correctly
    expect(document.getElementById('uc').value).toBe('99999');
    expect(document.getElementById('os').value).toBe('88888');
    expect(DOM.tipoOrdem.value).toBe('CORTE POR FALTA DE PAGAMENTO');
    expect(document.getElementById('situacao_corte').value).toBe('CLIENTE CORTADO');

    // Verify equipment was rendered
    const instaladoInput = document.querySelector('#campos-instalados input');
    const retiradoInput = document.querySelector('#campos-retirados input');
    expect(instaladoInput.value).toBe('12345');
    expect(retiradoInput.value).toBe('67890');

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: Delete the record and verify form is reset
    // ═══════════════════════════════════════════════════════════════════════

    // Delete the record from DB
    await deleteRecord('integration-test-uuid');

    // Verify record was deleted
    const deletedRecord = await getRecord('integration-test-uuid');
    expect(deletedRecord).toBeNull();

    // Reset form (simulating what sidebar does when deleting current record)
    resetForm();

    // Verify state was reset (updateLivePreview syncs state with DOM via collectAllData)
    expect(state.currentUUID).toBe('');
    expect(state.iniciaisValido).toBe(false);
    expect(state.iniciais).not.toEqual({});
    expect(state.iniciais.uc).toBe('');
    expect(state.iniciais.os).toBe('');
    expect(state.retorno).toEqual({});
    expect(state.equipamentos.instaladoEquip).toBe('NAO');
    expect(state.equipamentos.retiradoEquip).toBe('NAO');
    expect(state.equipamentos.instalados.medidor).toBe('');
    expect(state.attachments).toEqual([]);
    expect(state.lastTipoOrdem).toBe('');
    expect(state._createdAt).toBeNull();

    // Verify DOM was cleared
    expect(document.getElementById('uc').value).toBe('');
    expect(document.getElementById('os').value).toBe('');
    expect(DOM.tipoOrdem.value).toBe('');
    expect(document.querySelector('#campos-instalados input')).toBeNull();
  });

  it('should not leak data between records when editing', async () => {
    // ═══════════════════════════════════════════════════════════════════════
    // Create Record A
    // ═══════════════════════════════════════════════════════════════════════

    renderIniciais();
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    DOM.tipoOrdem.value = 'VISTORIA DA UC';
    renderRetorno();
    document.getElementById('resultado').value = 'Regular';

    const recordA = {
      uuid: 'record-a-uuid',
      status: 'draft',
      createdAt: '2024-03-15T10:00:00.000Z',
      updatedAt: '2024-03-15T10:00:00.000Z',
      iniciais: collectIniciais(),
      retorno: collectRetorno(),
      tipoOrdem: 'VISTORIA DA UC',
      equipamentos: {
        instaladoEquip: 'SIM',
        retiradoEquip: 'NAO',
        instalados: { medidor: '111', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
        retirados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
        checkboxes: {
          instalados: { medidor: true, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false },
          retirados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false }
        }
      },

      attachmentCount: 0,
      sentData: null,
    };
    await saveDraft(recordA);

    // ═══════════════════════════════════════════════════════════════════════
    // Create Record B (different tipo-ordem)
    // ═══════════════════════════════════════════════════════════════════════

    renderIniciais();
    document.getElementById('uc').value = '33333';
    document.getElementById('os').value = '44444';
    DOM.tipoOrdem.value = 'CORTE POR FALTA DE PAGAMENTO';
    renderRetorno();
    document.getElementById('situacao_corte').value = 'CLIENTE CORTADO';

    const recordB = {
      uuid: 'record-b-uuid',
      status: 'draft',
      createdAt: '2024-03-16T10:00:00.000Z',
      updatedAt: '2024-03-16T10:00:00.000Z',
      iniciais: collectIniciais(),
      retorno: collectRetorno(),
      tipoOrdem: 'CORTE POR FALTA DE PAGAMENTO',
      equipamentos: {
        instaladoEquip: 'NAO',
        retiradoEquip: 'SIM',
        instalados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
        retirados: { medidor: '', conjunto: '', display: '222', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
        checkboxes: {
          instalados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false },
          retirados: { medidor: false, conjunto: false, display: true, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false }
        }
      },

      attachmentCount: 0,
      sentData: null,
    };
    await saveDraft(recordB);

    // ═══════════════════════════════════════════════════════════════════════
    // Edit Record A — verify no data from Record B leaks
    // ═══════════════════════════════════════════════════════════════════════

    const restoredA = await getRecord('record-a-uuid');
    await applyRecord(restoredA);

    // Verify Record A data is correct
    expect(state.iniciais.uc).toBe('11111');
    expect(state.iniciais.os).toBe('22222');
    expect(state.lastTipoOrdem).toBe('VISTORIA DA UC');
    expect(state.retorno.resultado).toBe('Regular');
    expect(state.equipamentos.instalados.medidor).toBe('111');

    // Verify DOM matches Record A (no Record B data)
    expect(document.getElementById('uc').value).toBe('11111');
    expect(document.getElementById('os').value).toBe('22222');
    expect(DOM.tipoOrdem.value).toBe('VISTORIA DA UC');
    expect(document.getElementById('resultado').value).toBe('Regular');
    const instaladoInputA = document.querySelector('#campos-instalados input');
    expect(instaladoInputA.value).toBe('111');

    // Verify Record B specific field is NOT present
    expect(document.getElementById('situacao_corte')).toBeNull();

    // ═══════════════════════════════════════════════════════════════════════
    // Edit Record B — verify no data from Record A leaks
    // ═══════════════════════════════════════════════════════════════════════

    const restoredB = await getRecord('record-b-uuid');
    await applyRecord(restoredB);

    // Verify Record B data is correct
    expect(state.iniciais.uc).toBe('33333');
    expect(state.iniciais.os).toBe('44444');
    expect(state.lastTipoOrdem).toBe('CORTE POR FALTA DE PAGAMENTO');
    expect(state.retorno.situacao_corte).toBe('CLIENTE CORTADO');
    expect(state.equipamentos.retirados.display).toBe('222');

    // Verify DOM matches Record B (no Record A data)
    expect(document.getElementById('uc').value).toBe('33333');
    expect(document.getElementById('os').value).toBe('44444');
    expect(DOM.tipoOrdem.value).toBe('CORTE POR FALTA DE PAGAMENTO');
    expect(document.getElementById('situacao_corte').value).toBe('CLIENTE CORTADO');
    const retiradoInputB = document.querySelector('#campos-retirados input');
    expect(retiradoInputB.value).toBe('222');

    // Verify Record A specific field is NOT present
    expect(document.getElementById('resultado')).toBeNull();
  });
});
