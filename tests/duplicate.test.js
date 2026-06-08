import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { checkDuplicate } from '../scripts/duplicate.js';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';
import { saveDraft, getAllRecords, deleteRecord } from '../scripts/db.js';

describe('duplicate', () => {
  async function clearDB() {
    const records = await getAllRecords();
    for (const r of records) {
      await deleteRecord(r.uuid);
    }
  }

  beforeEach(async () => {
    document.body.innerHTML = `
      <div class="modal-overlay hidden" id="dup-modal">
        <div class="modal">
          <p id="dup-modal-title"></p>
          <p id="dup-modal-body"></p>
          <button id="dup-modal-cancel">Cancelar</button>
          <button id="dup-modal-confirm">Reenviar</button>
        </div>
      </div>
      <div id="error-msg" style="display:none"></div>
    `;
    cacheDOM();
    state.currentUUID = '';
    await clearDB();
  });

  describe('checkDuplicate', () => {
    it('should resolve true when no currentUUID', async () => {
      state.currentUUID = '';
      const result = await checkDuplicate();
      expect(result).toBe(true);
    });

    it('should resolve true when record does not exist', async () => {
      state.currentUUID = 'non-existent-uuid';
      const result = await checkDuplicate();
      expect(result).toBe(true);
    });

    it('should resolve true when record status is not "sent"', async () => {
      state.currentUUID = 'draft-uuid';
      await saveDraft({
        uuid: 'draft-uuid',
        status: 'draft',
        iniciais: { uc: '123', os: '456' },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        equipamentos: [],
        attachments: [],
        composicao: {},
      });
      const result = await checkDuplicate();
      expect(result).toBe(true);
    });

    it('should show modal when record was already sent', async () => {
      state.currentUUID = 'sent-uuid';
      await saveDraft({
        uuid: 'sent-uuid',
        status: 'sent',
        iniciais: { uc: '123', os: '456' },
        sentData: {
          to: ['test@example.com'],
          subject: 'Test',
          sentAt: '2024-03-15T12:00:00.000Z',
        },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        equipamentos: [],
        attachments: [],
        composicao: {},
      });

      const promise = checkDuplicate();
      // Wait briefly for the promise microtask
      await new Promise(resolve => setTimeout(resolve, 200));

      // Modal should be visible
      expect(DOM.dupModal.classList.contains('hidden')).toBe(false);
      expect(DOM.dupModalTitle.textContent).toBe('Registro já enviado');
      expect(DOM.dupModalBody.innerHTML).toContain('456');

      // Click confirm to resolve
      DOM.dupModalConfirm.click();
      const result = await promise;
      expect(result).toBe(true);
    });

    it('should resolve false when user clicks cancel on sent modal', async () => {
      state.currentUUID = 'sent-uuid-2';
      await saveDraft({
        uuid: 'sent-uuid-2',
        status: 'sent',
        iniciais: { uc: '789', os: '012' },
        sentData: {
          to: ['test@example.com'],
          subject: 'Test',
          sentAt: '2024-03-15T12:00:00.000Z',
        },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        equipamentos: [],
        attachments: [],
        composicao: {},
      });

      const promise = checkDuplicate();
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(DOM.dupModal.classList.contains('hidden')).toBe(false);
      DOM.dupModalCancel.click();
      const result = await promise;
      expect(result).toBe(false);
    });

    it('should hide modal after confirm', async () => {
      state.currentUUID = 'sent-uuid-3';
      await saveDraft({
        uuid: 'sent-uuid-3',
        status: 'sent',
        iniciais: { uc: '111', os: '222' },
        sentData: {
          to: ['test@example.com'],
          subject: 'Test',
          sentAt: '2024-03-15T12:00:00.000Z',
        },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        equipamentos: [],
        attachments: [],
        composicao: {},
      });

      const promise = checkDuplicate();
      await new Promise(resolve => setTimeout(resolve, 200));

      DOM.dupModalConfirm.click();
      await promise;
      expect(DOM.dupModal.classList.contains('hidden')).toBe(true);
    });

    it('should hide modal after cancel', async () => {
      state.currentUUID = 'sent-uuid-4';
      await saveDraft({
        uuid: 'sent-uuid-4',
        status: 'sent',
        iniciais: { uc: '333', os: '444' },
        sentData: {
          to: ['test@example.com'],
          subject: 'Test',
          sentAt: '2024-03-15T12:00:00.000Z',
        },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        equipamentos: [],
        attachments: [],
        composicao: {},
      });

      const promise = checkDuplicate();
      await new Promise(resolve => setTimeout(resolve, 200));

      DOM.dupModalCancel.click();
      await promise;
      expect(DOM.dupModal.classList.contains('hidden')).toBe(true);
    });
  });
});
