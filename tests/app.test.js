import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestDOM } from './helpers/dom-fixture.js';
import { DOM } from '../scripts/dom.js';
import { state, setCurrentUUID } from '../scripts/state.js';
import { getAllRecords, deleteRecord } from '../scripts/db.js';
import { checkInitialPersistence } from '../scripts/app.js';
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
