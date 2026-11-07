import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestDOM } from './helpers/dom-fixture.js';
import { DOM } from '../scripts/dom.js';
import { state, setCurrentUUID, createDefaultEquipamentos } from '../scripts/state.js';
import { getAllRecords, deleteRecord, saveDraft } from '../scripts/db.js';
import { checkInitialPersistence, restoreLastRecord } from '../scripts/app.js';
import { renderIniciais } from '../scripts/iniciais.js';

describe('checkInitialPersistence', () => {
  beforeEach(() => {
    createTestDOM();

    state.iniciais = { uc: '', os: '' };
    state.iniciaisValido = false;
    state.currentUUID = '';
    state._createdAt = null;

    localStorage.clear();
  });

  afterEach(async () => {
    const all = await getAllRecords();
    for (const r of all) {
      await deleteRecord(r.uuid);
    }
  });

  it('should set iniciaisValido and save when both UC and OS are filled', async () => {
    // checkInitialPersistence checks state.iniciais.uc/os BEFORE calling saveState
    // Then saveState -> collectIniciais reads from DOM, so both must match
    renderIniciais();
    document.getElementById('uc').value = '12345';
    document.getElementById('os').value = '67890';

    state.iniciais.uc = '12345';
    state.iniciais.os = '67890';
    state.iniciaisValido = false;

    await checkInitialPersistence();

    expect(state.iniciaisValido).toBe(true);
    // saveState should have been called — a record should exist
    expect(state.currentUUID).toBeTruthy();
    const records = await getAllRecords();
    expect(records.length).toBeGreaterThanOrEqual(1);
  });

  it('should NOT activate when UC is filled but OS is empty', async () => {
    state.iniciais.uc = '12345';
    state.iniciais.os = '';
    state.iniciaisValido = false;

    await checkInitialPersistence();

    expect(state.iniciaisValido).toBe(false);
    expect(state.currentUUID).toBe('');
  });

  it('should NOT activate when OS is filled but UC is empty', async () => {
    state.iniciais.uc = '';
    state.iniciais.os = '67890';
    state.iniciaisValido = false;

    await checkInitialPersistence();

    expect(state.iniciaisValido).toBe(false);
    expect(state.currentUUID).toBe('');
  });

  it('should NOT activate when iniciaisValido is already true', async () => {
    state.iniciais.uc = '12345';
    state.iniciais.os = '67890';
    state.iniciaisValido = true; // already valid
    state.currentUUID = 'existing-uuid';

    await checkInitialPersistence();

    // Should not change anything
    expect(state.iniciaisValido).toBe(true);
    expect(state.currentUUID).toBe('existing-uuid');
  });

  it('should NOT activate when both UC and OS are empty', async () => {
    state.iniciais.uc = '';
    state.iniciais.os = '';
    state.iniciaisValido = false;

    await checkInitialPersistence();

    expect(state.iniciaisValido).toBe(false);
    expect(state.currentUUID).toBe('');
  });
});

describe('P6 — reabrir o último registro', () => {
  beforeEach(() => {
    createTestDOM();
    state.iniciais = {};
    state.retorno = {};
    state.equipamentos = createDefaultEquipamentos();
    state.attachments = [];
    state.iniciaisValido = false;
    state.currentUUID = '';
    localStorage.clear();
  });

  afterEach(async () => {
    const all = await getAllRecords();
    for (const r of all) {
      await deleteRecord(r.uuid);
    }
  });

  it('restaura o registro correspondente ao UUID salvo', async () => {
    await saveDraft({
      uuid: 'retomar-1',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      iniciais: { uc: '99999', os: '88888', coordenadas: '-3.1000, -38.4000' },
      retorno: {},
      equipamentos: createDefaultEquipamentos(),
      attachmentCount: 0,
    });
    setCurrentUUID('retomar-1');

    await restoreLastRecord();

    expect(state.iniciais.uc).toBe('99999');
    expect(document.getElementById('uc').value).toBe('99999');
    expect(document.getElementById('coordenadas').value).toBe('-3.1000, -38.4000');
  });

  it('limpa o UUID quando o registro não existe mais', async () => {
    setCurrentUUID('registro-apagado');

    await restoreLastRecord();

    expect(state.currentUUID).toBe('');
    expect(localStorage.getItem('currentUUID')).toBeFalsy();
  });
});

describe('coordenadas — sem captura automática ao iniciar', () => {
  it('não solicita a localização ao carregar a aplicação', async () => {
    createTestDOM();
    state.currentUUID = '';
    state.iniciais = {};
    state.retorno = {};
    state.equipamentos = createDefaultEquipamentos();
    state.attachments = [];
    state.iniciaisValido = false;
    localStorage.clear();
    for (const r of await getAllRecords()) await deleteRecord(r.uuid);

    const getCurrentPosition = vi.fn();
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    });

    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 50));

    expect(getCurrentPosition).not.toHaveBeenCalled();
    delete navigator.geolocation;
  });
});
