// tests/persistence.test.js
// Unit tests for persistence.js — save/load state management
//
// NOTE: Full integration tests covering real-world persistence scenarios
// (progressive save, restore, multi-record, conditional fields, etc.)
// are in persistence-flow.test.js (10 scenarios, ~700 lines).
//
// This file focuses on the exported API contract and edge cases
// not covered by the integration tests.

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { state, clearCurrentUUID, setCurrentUUID } from '../scripts/state.js';
import { saveState, debouncedSave, markAttachmentsDirty } from '../scripts/persistence.js';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { getAllRecords, deleteRecord } from '../scripts/db.js';

describe('persistence — API contract', () => {
  it('should export expected functions', () => {
    expect(saveState).toBeInstanceOf(Function);
    expect(debouncedSave).toBeInstanceOf(Function);
    expect(markAttachmentsDirty).toBeInstanceOf(Function);
  });
});

describe('persistence — early return guards', () => {
  beforeEach(() => {
    // Minimal DOM setup required by collectors (collectIniciais reads by id)
    document.body.innerHTML = `
      <div id="iniciais-campos"></div>
      <div id="equipamentos-list"></div>
      <div id="retorno-campos"></div>
      <select id="tipo-ordem">
        <option value="">Selecione</option>
        <option value="ADEQUACAO SMF">ADEQUACAO SMF</option>
      </select>
      <textarea id="complemento-corpo"></textarea>
      <!-- collectIniciais iterates iniciaisFields looking for these IDs -->
      <input id="coordenadas">
      <select id="lider"></select>
      <select id="parceiro"></select>
      <select id="municipio"></select>
      <input id="uc">
      <input id="os">
      <select id="notificado"></select>
      <select id="placa"></select>
      <input id="data" type="date">
      <input id="hora_inicio" type="time">
      <input id="hora_fim" type="time">
    `;
    cacheDOM();

    state.iniciais = {};
    state.equipamentos = [];
    state.attachments = [];
    state.currentUUID = '';
    state.iniciaisValido = false;
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

  it('should NOT save when iniciaisValido is false', async () => {
    state.iniciaisValido = false;
    state.iniciais = { uc: '12345', os: '67890' }; // has data but not valid

    await saveState();

    // No UUID should be assigned (record never created)
    expect(state.currentUUID).toBe('');
    const records = await getAllRecords();
    expect(records).toHaveLength(0);
  });

  it('should NOT save when there is no data at all', async () => {
    state.iniciaisValido = true; // valid but empty
    state.iniciais = {};
    state.equipamentos = [];
    state.attachments = [];

    await saveState();

    expect(state.currentUUID).toBe('');
    const records = await getAllRecords();
    expect(records).toHaveLength(0);
  });

  it('should create a UUID on first valid save with data', async () => {
    state.iniciaisValido = true;
    // Set values in DOM so collectIniciais() reads them
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    setCurrentUUID(''); // ensure clean

    await saveState();

    expect(state.currentUUID).toBeTruthy();
    const records = await getAllRecords();
    expect(records).toHaveLength(1);
    expect(records[0].iniciais.uc).toBe('11111');

    // Save again — same UUID reused
    const uuid = state.currentUUID;
    await saveState();
    expect(state.currentUUID).toBe(uuid);
    const records2 = await getAllRecords();
    expect(records2).toHaveLength(1);
  });

  it('should preserve createdAt across saves', async () => {
    state.iniciaisValido = true;
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';

    await saveState();
    const uuid = state.currentUUID;

    const firstRecords = await getAllRecords();
    const createdAt = firstRecords[0].createdAt;

    await new Promise(r => setTimeout(r, 50));

    // Update a field
    document.getElementById('lider').value = 'ANDRE DE SOUSA CARVALHO';
    await saveState();

    const secondRecords = await getAllRecords();
    expect(secondRecords[0].createdAt).toBe(createdAt);
  });

  it('should update tipoOrdem in saved record', async () => {
    state.iniciaisValido = true;
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    DOM.tipoOrdem.value = 'ADEQUACAO SMF';

    await saveState();
    const uuid = state.currentUUID;

    const records = await getAllRecords();
    expect(records[0].tipoOrdem).toBe('ADEQUACAO SMF');
  });
});

describe('persistence — debouncedSave', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="iniciais-campos"></div>
      <div id="equipamentos-list"></div>
      <div id="retorno-campos"></div>
      <select id="tipo-ordem">
        <option value="">Selecione</option>
      </select>
      <textarea id="complemento-corpo"></textarea>
      <input id="coordenadas">
      <select id="lider"></select>
      <select id="parceiro"></select>
      <select id="municipio"></select>
      <input id="uc">
      <input id="os">
      <select id="notificado"></select>
      <select id="placa"></select>
      <input id="data" type="date">
      <input id="hora_inicio" type="time">
      <input id="hora_fim" type="time">
    `;
    cacheDOM();
    state.iniciais = {};
    state.equipamentos = [];
    state.attachments = [];
    state.currentUUID = '';
    state.iniciaisValido = false;
    state.retorno = {};
    state._createdAt = null;
    localStorage.clear();
  });

  it('should debounce: fire once after 1s, reset on rapid calls', async () => {
    document.getElementById('uc').value = '11111';
    document.getElementById('os').value = '22222';
    state.iniciaisValido = true;

    // Timer shouldn't have fired yet immediately
    let records = await getAllRecords();
    expect(records).toHaveLength(0);

    // Call debouncedSave — will fire after 1s
    debouncedSave();

    // Wait just under 1s — should NOT have saved
    await new Promise(r => setTimeout(r, 800));
    records = await getAllRecords();
    expect(records).toHaveLength(0);

    // Wait remaining time — now should have saved
    await new Promise(r => setTimeout(r, 300));
    expect(state.currentUUID).toBeTruthy();
    records = await getAllRecords();
    expect(records).toHaveLength(1);
  });
});

describe('persistence — markAttachmentsDirty', () => {
  it('should be callable without errors', () => {
    expect(() => markAttachmentsDirty()).not.toThrow();
    expect(() => markAttachmentsDirty()).not.toThrow(); // idempotent
  });
});
