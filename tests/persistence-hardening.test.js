// tests/persistence-hardening.test.js
// Correções da auditoria de armazenamento local (P1, P3, P4, P5, P7).

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { state, createDefaultEquipamentos } from '../scripts/state.js';
import { saveState, debouncedSave, flushPendingSave } from '../scripts/persistence.js';
import { DOM } from '../scripts/dom.js';
import { createTestDOM } from './helpers/dom-fixture.js';
import { getAllRecords, deleteRecord, saveDraft, getRecord } from '../scripts/db.js';
import { applyRecord } from '../scripts/restore.js';
import * as dbModule from '../scripts/db.js';

function prepareDom() {
  createTestDOM();
  document.body.insertAdjacentHTML(
    'beforeend',
    `
      <input id="coordenadas">
      <input id="uc">
      <input id="os">
      <input id="data" type="date">
      <input id="hora_inicio" type="time">
      <input id="hora_fim" type="time">
    `
  );

  state.iniciais = {};
  state.equipamentos = createDefaultEquipamentos();
  state.attachments = [];
  state.currentUUID = '';
  state.iniciaisValido = false;
  state.retorno = {};
  state.lastTipoOrdem = '';
  state._createdAt = null;
  state._lastSeenUpdatedAt = null;
  localStorage.clear();

  document.getElementById('uc').value = '11111';
  document.getElementById('os').value = '22222';
  state.iniciaisValido = true;
}

async function clearDB() {
  const all = await getAllRecords();
  for (const r of all) await deleteRecord(r.uuid);
}

describe('P1 — falhas de gravação visíveis', () => {
  beforeEach(prepareDom);

  afterEach(async () => {
    vi.restoreAllMocks();
    await clearDB();
  });

  it('mostra toast quando o salvamento falha por erro que não é de quota', async () => {
    vi.spyOn(dbModule, 'saveRecordAtomic').mockRejectedValue(new Error('boom'));

    await saveState();

    expect(DOM.toast.textContent).toContain('Não foi possível salvar');
  });
});

describe('P3 — salvamentos concorrentes serializados', () => {
  beforeEach(prepareDom);

  afterEach(async () => {
    vi.restoreAllMocks();
    await clearDB();
  });

  it('não inicia o segundo save antes de o primeiro terminar', async () => {
    let resolveFirst;
    const first = new Promise(resolve => {
      resolveFirst = resolve;
    });
    const spy = vi
      .spyOn(dbModule, 'saveRecordAtomic')
      .mockImplementationOnce(() => first)
      .mockResolvedValue(undefined);

    const p1 = saveState();
    const p2 = saveState();

    await new Promise(r => setTimeout(r, 20));
    expect(spy).toHaveBeenCalledTimes(1);

    resolveFirst();
    await Promise.all([p1, p2]);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe('P4 — compatibilidade de campos antigos', () => {
  beforeEach(prepareDom);

  afterEach(async () => {
    await clearDB();
  });

  async function seed(overrides = {}) {
    await saveDraft({
      uuid: 'legacy-1',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      iniciais: { uc: '11111', os: '22222' },
      retorno: {},
      equipamentos: createDefaultEquipamentos(),
      ...overrides,
    });
    state.currentUUID = 'legacy-1';
  }

  it('preserva campos de iniciais removidos do schema atual', async () => {
    await seed({ iniciais: { uc: '11111', os: '22222', campo_removido: 'VALOR' } });

    await saveState();

    const record = await getRecord('legacy-1');
    expect(record.iniciais.campo_removido).toBe('VALOR');
  });

  it('preserva retorno legado mas descarta campo conhecido oculto', async () => {
    await seed({ retorno: { descricao: 'texto antigo', campo_removido: 'X' } });

    await saveState();

    const record = await getRecord('legacy-1');
    expect(record.retorno.campo_removido).toBe('X');
    expect(record.retorno.descricao).toBeUndefined();
  });

  it('restaura valor de select cuja opção foi removida', async () => {
    await applyRecord({
      uuid: 'legacy-2',
      createdAt: new Date().toISOString(),
      iniciais: { uc: '11111', os: '22222', lider: 'NOME ANTIGO REMOVIDO' },
      retorno: {},
      equipamentos: createDefaultEquipamentos(),
    });

    expect(document.getElementById('lider').value).toBe('NOME ANTIGO REMOVIDO');
  });

  it('restaura registro cujo Tipo de Ordem foi removido do dropdown', async () => {
    await applyRecord({
      uuid: 'legacy-3',
      createdAt: new Date().toISOString(),
      tipoOrdem: 'DESLOCAMENTO DE SUBESTAÇÃO',
      iniciais: { uc: '11111', os: '22222', 'tipo-ordem': 'DESLOCAMENTO DE SUBESTAÇÃO' },
      retorno: { descricao: 'Deslocamento realizado' },
      equipamentos: createDefaultEquipamentos(),
    });

    expect(document.getElementById('tipo-ordem').value).toBe('DESLOCAMENTO DE SUBESTAÇÃO');
    expect(document.getElementById('descricao').value).toBe('Deslocamento realizado');
  });

  it('grava schemaVersion no registro', async () => {
    await saveState();

    const record = await getRecord(state.currentUUID);
    expect(record.schemaVersion).toBe(1);
  });
});

describe('P5 — flush do save pendente', () => {
  beforeEach(prepareDom);

  afterEach(async () => {
    vi.restoreAllMocks();
    await clearDB();
  });

  it('executa imediatamente o salvamento pendente do debounce', async () => {
    const spy = vi.spyOn(dbModule, 'saveRecordAtomic').mockResolvedValue(undefined);

    debouncedSave();
    await flushPendingSave();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('P2 — anexos comprimidos e quota', () => {
  beforeEach(prepareDom);

  afterEach(async () => {
    vi.restoreAllMocks();
    await clearDB();
  });

  it('grava anexo grande já comprimido', async () => {
    state.attachments = [
      new File([new ArrayBuffer(800 * 1024)], 'foto.jpg', { type: 'image/jpeg' }),
    ];
    const spy = vi.spyOn(dbModule, 'saveRecordAtomic').mockResolvedValue(undefined);

    await saveState();

    expect(spy).toHaveBeenCalledTimes(1);
    const storedAttachments = spy.mock.calls[0][2];
    expect(storedAttachments[0].name).toBe('foto_red.jpg');
    expect(storedAttachments[0].type).toBe('image/jpeg');
  });

  it('ao estourar a quota, salva o formulário sem anexos', async () => {
    state.attachments = [new File(['x'], 'a.jpg', { type: 'image/jpeg' })];
    const spy = vi
      .spyOn(dbModule, 'saveRecordAtomic')
      .mockRejectedValueOnce(
        Object.assign(new Error('Quota exceeded'), { name: 'QuotaExceededError' })
      )
      .mockResolvedValueOnce(undefined);

    await saveState();

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[1][2]).toEqual([]);
    expect(DOM.toast.textContent).toContain('anexos');
  });
});

describe('P7 — alteração concorrente entre abas', () => {
  beforeEach(prepareDom);

  afterEach(async () => {
    vi.restoreAllMocks();
    await clearDB();
  });

  it('avisa quando o registro foi alterado por outra aba', async () => {
    await saveState();
    const uuid = state.currentUUID;
    const saved = await getRecord(uuid);

    // Simula outra aba gravando o mesmo registro.
    await saveDraft({
      ...saved,
      updatedAt: new Date(Date.now() + 1000).toISOString(),
    });

    DOM.toast.textContent = '';
    await saveState();

    expect(DOM.toast.textContent).toContain('outra aba');
  });

  it('não avisa ao salvar um registro recém-aberto nesta aba', async () => {
    await saveState();
    const saved = await getRecord(state.currentUUID);

    await applyRecord(saved);
    DOM.toast.textContent = '';
    await saveState();

    expect(DOM.toast.textContent).not.toContain('outra aba');
  });
});
