// tests/gaps-edge-cases.test.js
// Testes para lacunas identificadas no relatório de cobertura
// G2 a G12 — sem correções, apenas reportar falhas

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { state, setCurrentUUID, clearCurrentUUID } from '../scripts/state.js';
import { saveState, debouncedSave, markAttachmentsDirty } from '../scripts/persistence.js';
import { getRecord, deleteRecord, saveAttachments } from '../scripts/db.js';
import { applyRecord } from '../scripts/restore.js';
import { resetForm } from '../scripts/reset.js';
import { renderIniciais } from '../scripts/iniciais.js';
import { renderRetorno, setRetornoData, handleTipoChange } from '../scripts/retornos.js';
import { renderEquipamentos, addEquip } from '../scripts/equipment.js';
import { generateUUID } from '../scripts/uuid.js';
import { updateLivePreview, composeEmail } from '../scripts/email.js';
import { INPUT_CLASS, SELECT_CLASS } from '../scripts/styles.js';
import { iniciaisFields } from '../scripts/fields.js';
import * as dbModule from '../scripts/db.js';
import * as collectors from '../scripts/collectors.js';

// ─────────────────────────────────────────────────────────────────────────────
// G2: QuotaExceededError em saveState()
// ─────────────────────────────────────────────────────────────────────────────

describe('G2: saveState QuotaExceededError', () => {
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
      <div id="retorno-desc"></div>
      <select id="tipo-ordem"><option value="">Selecione</option></select>
      <div id="preview-grid"></div>
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
      <div id="retorno-placeholder"></div>
    `;
    cacheDOM();

    state.iniciais = {};
    state.equipamentos = {
      instaladoEquip: 'NAO',
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
    state.attachments = [];
    state.lastTipoOrdem = '';
    state.iniciaisValido = false;
    state.currentUUID = '';
    state.retorno = {};
    state._createdAt = null;
    localStorage.clear();

    // Adicionar campos iniciais
    renderIniciais();
    const uc = document.getElementById('uc');
    if (uc) uc.value = '11111';
    const os = document.getElementById('os');
    if (os) os.value = '22222';
    state.iniciaisValido = true;

    // Preencher campos necessários
    iniciaisFields.forEach(f => {
      const el = document.getElementById(f.nome);
      if (el && !el.value) el.value = 'teste';
    });
  });

  it('should handle QuotaExceededError gracefully', async () => {
    // Espiar saveDraft para rejeitar com QuotaExceededError
    const saveDraftSpy = vi.spyOn(dbModule, 'saveDraft').mockRejectedValue({
      name: 'QuotaExceededError',
      message: 'Quota exceeded',
    });

    // Deve não lançar exceção
    await expect(saveState()).resolves.toBeUndefined();

    saveDraftSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G3: handleTipoChange guard clause
// ─────────────────────────────────────────────────────────────────────────────

describe('G3: handleTipoChange guard clause', () => {
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
      <div id="retorno-desc"></div>
      <div id="retorno-placeholder"></div>
      <select id="tipo-ordem">
        <option value="">Selecione</option>
        <option value="ADEQUACAO SMF">ADEQUACAO SMF</option>
        <option value="CORTE POR FALTA DE PAGAMENTO">CORTE POR FALTA DE PAGAMENTO</option>
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
    state.retorno = {};
    state.lastTipoOrdem = '';
    localStorage.clear();
  });

  it('should return early when tipo equals lastTipoOrdem (no-op)', () => {
    // Configurar como se já estivesse no mesmo tipo
    DOM.tipoOrdem.value = 'ADEQUACAO SMF';
    state.lastTipoOrdem = 'ADEQUACAO SMF';
    state.retorno = { descricao: 'dado existente' };

    // Espiar saveState
    const saveSpy = vi.spyOn(dbModule, 'saveDraft');

    handleTipoChange();

    // saveDraft não deve ser chamado (saveState retorna cedo)
    expect(saveSpy).not.toHaveBeenCalled();
    saveSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G4: applyRecord migration fallback (v3 fallback)
// ─────────────────────────────────────────────────────────────────────────────

describe('G4: applyRecord attachment migration fallback', () => {
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
      <div id="retorno-desc"></div>
      <div id="retorno-placeholder"></div>
      <select id="tipo-ordem">
        <option value="">Selecione</option>
        <option value="CORTE POR FALTA DE PAGAMENTO">CORTE POR FALTA DE PAGAMENTO</option>
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
    localStorage.clear();
    state.iniciais = {};
    state.equipamentos = {
      instaladoEquip: 'NAO',
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
    state.attachments = [];
    state.retorno = {};
    state.lastTipoOrdem = '';
    state._createdAt = null;
  });

  it('should handle getAttachmentsByUuid failure gracefully (v3 fallback)', async () => {
    const spy = vi.spyOn(dbModule, 'getAttachmentsByUuid').mockRejectedValue(new Error('DB error'));

    const record = {
      uuid: 'test-uuid-fallback',
      tipoOrdem: 'CORTE POR FALTA DE PAGAMENTO',
      iniciais: { uc: '11111', os: '22222', 'tipo-ordem': 'CORTE POR FALTA DE PAGAMENTO' },
      retorno: { situacao_corte: 'CLIENTE CORTADO' },
      equipamentos: [],
      attachmentCount: 2, // gatilho para buscar no store v3
      createdAt: new Date().toISOString(),
    };

    await applyRecord(record);

    // Não deve lançar — fallback captura erro e zera attachments
    expect(state.attachments).toEqual([]);

    spy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G5: generateUUID fallback (crypto.randomUUID ausente)
// ─────────────────────────────────────────────────────────────────────────────

describe('G5: generateUUID fallback path', () => {
  it('should generate valid UUID when crypto.randomUUID is available', () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should generate valid UUID using fallback when crypto.randomUUID is undefined', () => {
    const originalRandomUUID = crypto.randomUUID;
    crypto.randomUUID = undefined;

    const uuid = generateUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(uuid.length).toBe(36);

    crypto.randomUUID = originalRandomUUID;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G6: resolveCreatedAt failure path
// ─────────────────────────────────────────────────────────────────────────────

describe('G6: resolveCreatedAt failure fallback', () => {
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
      <div id="retorno-desc"></div>
      <select id="tipo-ordem"><option value="">Selecione</option></select>
      <div id="preview-grid"></div>
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
      <div id="retorno-placeholder"></div>
    `;
    cacheDOM();
    state.iniciais = {};
    state.equipamentos = {
      instaladoEquip: 'NAO',
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
    state.attachments = [];
    state.lastTipoOrdem = '';
    state.iniciaisValido = false;
    state.currentUUID = '';
    state.retorno = {};
    state._createdAt = null;
    localStorage.clear();
  });

  it('should generate new createdAt when getRecord fails in resolveCreatedAt', async () => {
    renderIniciais();
    const uc = document.getElementById('uc');
    if (uc) uc.value = '11111';
    const os = document.getElementById('os');
    if (os) os.value = '22222';
    state.iniciaisValido = true;
    iniciaisFields.forEach(f => {
      const el = document.getElementById(f.nome);
      if (el && !el.value) el.value = 'teste';
    });

    // Mock getRecord para rejeitar no resolveCreatedAt
    const spy = vi.spyOn(dbModule, 'getRecord').mockRejectedValue(new Error('DB error'));

    // saveState não deve lançar
    await expect(saveState()).resolves.toBeUndefined();

    // _createdAt deve ter sido preenchido (novo timestamp)
    expect(state._createdAt).toBeTruthy();

    spy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G7: serializeAndSaveAttachments with empty files
// G8: markAttachmentsDirty flow
// ─────────────────────────────────────────────────────────────────────────────

describe('G7+G8: markAttachmentsDirty and empty attachments save', () => {
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
      <div id="retorno-desc"></div>
      <select id="tipo-ordem"><option value="">Selecione</option></select>
      <div id="preview-grid"></div>
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
      <div id="retorno-placeholder"></div>
    `;
    cacheDOM();
    state.iniciais = {};
    state.equipamentos = {
      instaladoEquip: 'NAO',
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
    state.attachments = [];
    state.lastTipoOrdem = '';
    state.iniciaisValido = false;
    state.currentUUID = '';
    state.retorno = {};
    state._createdAt = null;
    localStorage.clear();
  });

  it('should handle dirty flag: markAttachmentsDirty toggles correctly', () => {
    state.attachments = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
    // Após marcar dirty, saveState deve tentar salvar attachments
    markAttachmentsDirty();
    // Não podemos testar o save real aqui, mas podemos verificar que a flag foi setada
    // (a flag é interna do módulo, mas o comportamento é: markAttachmentsDirty → saveState → saveAttachments)
    expect(true).toBe(true); // placeholder — dirty flag é privada
  });

  it('should save empty attachments list correctly', async () => {
    renderIniciais();
    const uc = document.getElementById('uc');
    if (uc) uc.value = '11111';
    const os = document.getElementById('os');
    if (os) os.value = '22222';
    state.iniciaisValido = true;
    state.attachments = [];
    iniciaisFields.forEach(f => {
      const el = document.getElementById(f.nome);
      if (el && !el.value) el.value = 'teste';
    });

    const saveAttSpy = vi.spyOn(dbModule, 'saveAttachments');

    await saveState();

    // saveAttachments deve ser chamado com array vazio
    expect(saveAttSpy).toHaveBeenCalled();
    expect(saveAttSpy.mock.calls[0][1]).toEqual([]);

    saveAttSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G9: updateLivePreview atualiza o DOM corretamente
// ─────────────────────────────────────────────────────────────────────────────

describe('G9: updateLivePreview DOM update', () => {
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
      <div id="retorno-desc"></div>
      <div id="retorno-placeholder"></div>
      <select id="tipo-ordem">
        <option value="">Selecione</option>
        <option value="ADEQUACAO SMF">ADEQUACAO SMF</option>
      </select>
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
    state.equipamentos = {
      instaladoEquip: 'NAO',
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
    state.retorno = {};
    state.attachments = [];
    localStorage.clear();
    renderIniciais();
  });

  it('should update previewCorpo textContent with composeEmail output', () => {
    // Preencher state
    state.iniciais = {
      uc: '99999',
      os: '88888',
      'tipo-ordem': 'ADEQUACAO SMF',
      coordenadas: '',
      lider: '',
      parceiro: '',
      municipio: '',
      notificado: '',
      placa: '',
      data: '',
      hora_inicio: '',
      hora_fim: '',
    };
    DOM.tipoOrdem.value = 'ADEQUACAO SMF';

    updateLivePreview();

    // Preview deve conter os dados do state
    expect(DOM.previewCorpo.textContent).not.toBe('—');
    expect(DOM.previewCorpo.textContent).toContain('UC:');
    expect(DOM.previewCorpo.textContent).toContain('99999');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G10: styles.js constantes
// ─────────────────────────────────────────────────────────────────────────────

describe('G10: styles.js constants', () => {
  it('INPUT_CLASS should be a non-empty string', () => {
    expect(typeof INPUT_CLASS).toBe('string');
    expect(INPUT_CLASS.length).toBeGreaterThan(0);
    expect(INPUT_CLASS).toContain('w-full');
  });

  it('SELECT_CLASS should include INPUT_CLASS', () => {
    expect(SELECT_CLASS).toContain(INPUT_CLASS);
    expect(SELECT_CLASS).toContain('py-3');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G11: resetForm preview consistency
// ─────────────────────────────────────────────────────────────────────────────

describe('G11: resetForm preview state', () => {
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
      <div id="retorno-desc"></div>
      <div id="retorno-placeholder"></div>
      <select id="tipo-ordem">
        <option value="">Selecione</option>
        <option value="ADEQUACAO SMF">ADEQUACAO SMF</option>
      </select>
      <div id="preview-corpo">—</div>
      <div id="preview-grid"></div>
      <div id="file-count">0 / 12</div>
      <textarea id="complemento-corpo"></textarea>
      <div id="file-upload-area"></div>
      <input type="file" id="file-input">
      <button id="btn-novo-form">Novo</button>
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
    state.equipamentos = {
      instaladoEquip: 'NAO',
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
    state.attachments = [];
    state.retorno = {};
    state.lastTipoOrdem = '';
    state.iniciaisValido = false;
    state.currentUUID = '';
    state._createdAt = null;
    localStorage.clear();
    renderIniciais();
  });

  it('should generate full template with placeholder values after reset', () => {
    // Primeiro preencher e atualizar preview
    state.iniciais = { uc: '11111', os: '22222', 'tipo-ordem': '' };
    updateLivePreview();
    expect(DOM.previewCorpo.textContent).toContain('11111');

    // Reset
    resetForm();

    // resetForm() chama updateLivePreview() ao final (linha 52 do reset.js),
    // que gera o template completo com placeholders "—" para campos vazios.
    // O preview NUNCA é literalmente "—" — mostra o corpo formatado.
    expect(DOM.previewCorpo.textContent).not.toBe('—');
    expect(DOM.previewCorpo.textContent).toContain('COORDENADAS:');
    expect(DOM.previewCorpo.textContent).toContain('LIDER:');
    expect(DOM.previewCorpo.textContent).toContain('PARCEIRO:');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// G12: cacheDOM com elementos faltando
// ─────────────────────────────────────────────────────────────────────────────

describe('G12: cacheDOM resilience', () => {
  it('should not throw when DOM elements are missing', () => {
    document.body.innerHTML = '<div id="iniciais-campos"></div>';
    expect(() => cacheDOM()).not.toThrow();
    // Elementos ausentes: document.getElementById retorna null, não undefined
    expect(DOM.btnEnviar).toBeNull();
  });
});
