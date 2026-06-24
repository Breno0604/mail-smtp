import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { state, setCurrentUUID } from '../scripts/state.js';
import { getAllRecords, deleteRecord } from '../scripts/db.js';
import { checkInitialPersistence } from '../scripts/app.js';
import { renderIniciais } from '../scripts/iniciais.js';

describe('checkInitialPersistence', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="iniciais-campos"></div>
      <div id="equipamentos-list"></div>
      <div id="retorno-campos"></div>
      <div id="retorno-desc"></div>
      <div id="retorno-placeholder"></div>
      <select id="tipo-ordem"><option value="">Selecione</option></select>
      <div id="preview-corpo">—</div>
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
      <div id="update-modal" class="hidden"></div>
    `;
    cacheDOM();

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
