import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { closeSidebar, renderSidebar, initSidebarFilter } from '../scripts/sidebar.js';
import { cacheDOM, DOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';
import { saveDraft, getAllRecords, deleteRecord } from '../scripts/db.js';

// Mock restore to prevent heavy side effects
vi.mock('../scripts/restore.js', () => ({
  applyRecord: vi.fn(),
}));

// Mock reset to track calls
const mockResetForm = vi.fn();
vi.mock('../scripts/reset.js', () => ({
  resetForm: (...args) => mockResetForm(...args),
}));

// Helper para aguardar microtasks assíncronas (promises pendentes)
const flushPromises = () => new Promise((r) => setTimeout(r, 0));

describe('sidebar', () => {
  async function clearDB() {
    const records = await getAllRecords();
    for (const r of records) {
      await deleteRecord(r.uuid);
    }
  }

  beforeEach(async () => {
    document.body.innerHTML = `
      <div class="sidebar" id="sidebar">
        <div class="sidebar-inner">
          <h2 class="sidebar-title">Registros</h2>
          <button class="sidebar-close" id="sidebar-close">&times;</button>
        </div>
        <input type="search" id="sidebar-filter" placeholder="Buscar por UC ou OS...">
        <div class="sidebar-list" id="sidebar-list"></div>
      </div>
      <div class="sidebar-overlay" id="sidebar-overlay"></div>
      <div id="error-msg" style="display:none"></div>
      <div class="modal-overlay hidden" id="confirm-modal">
        <div class="modal">
          <p id="confirm-modal-text"></p>
          <button id="confirm-modal-cancel">Cancelar</button>
          <button id="confirm-modal-ok">Confirmar</button>
        </div>
      </div>
    `;
    cacheDOM();
    state.currentUUID = '';
    state.iniciaisValido = false;
    mockResetForm.mockClear();
    await clearDB();
  });

  describe('closeSidebar', () => {
    it('should remove sidebar-open class from body', () => {
      document.body.classList.add('sidebar-open');
      closeSidebar();
      expect(document.body.classList.contains('sidebar-open')).toBe(false);
    });
  });

  describe('renderSidebar', () => {
    it('should show empty message when no records', async () => {
      await renderSidebar();
      const list = DOM.sidebarList;
      expect(list.innerHTML).toContain('Nenhum registro encontrado');
    });

    it('should render records when they exist', async () => {
      await saveDraft({
        uuid: 'test-1',
        status: 'draft',
        iniciais: { uc: '12345', os: '67890' },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        equipamentos: [],
        attachments: [],
        composicao: {},
      });

      await renderSidebar();
      const list = DOM.sidebarList;
      expect(list.innerHTML).toContain('12345');
      expect(list.innerHTML).toContain('67890');
    });

    it('should show sent status for sent records', async () => {
      await saveDraft({
        uuid: 'test-sent',
        status: 'sent',
        iniciais: { uc: '111', os: '222' },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        equipamentos: [],
        attachments: [],
        composicao: {},
        sentData: { to: ['a@b.com'], subject: 'test', sentAt: new Date().toISOString() },
      });

      await renderSidebar();
      const list = DOM.sidebarList;
      expect(list.innerHTML).toContain('Enviado');
    });

    it('should show draft status for draft records', async () => {
      await saveDraft({
        uuid: 'test-draft',
        status: 'draft',
        iniciais: { uc: '333', os: '444' },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        equipamentos: [],
        attachments: [],
        composicao: {},
      });

      await renderSidebar();
      const list = DOM.sidebarList;
      expect(list.innerHTML).toContain('Rascunho');
    });

    it('should filter by UC term', async () => {
      await saveDraft({
        uuid: 'uc-match',
        status: 'draft',
        iniciais: { uc: '99999', os: '111' },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        equipamentos: [],
        attachments: [],
        composicao: {},
      });
      await saveDraft({
        uuid: 'uc-nomatch',
        status: 'draft',
        iniciais: { uc: '00000', os: '222' },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        equipamentos: [],
        attachments: [],
        composicao: {},
      });

      await renderSidebar('99999');
      const list = DOM.sidebarList;
      expect(list.innerHTML).toContain('99999');
      expect(list.innerHTML).not.toContain('00000');
    });

    it('should filter by OS term', async () => {
      await saveDraft({
        uuid: 'os-match',
        status: 'draft',
        iniciais: { uc: '111', os: '55555' },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        equipamentos: [],
        attachments: [],
        composicao: {},
      });
      await saveDraft({
        uuid: 'os-nomatch',
        status: 'draft',
        iniciais: { uc: '222', os: '66666' },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        equipamentos: [],
        attachments: [],
        composicao: {},
      });

      await renderSidebar('55555');
      const list = DOM.sidebarList;
      expect(list.innerHTML).toContain('55555');
      expect(list.innerHTML).not.toContain('66666');
    });

    it('should show "Nenhum registro encontrado" when filter matches nothing', async () => {
      await saveDraft({
        uuid: 'test',
        status: 'draft',
        iniciais: { uc: '123', os: '456' },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        equipamentos: [],
        attachments: [],
        composicao: {},
      });

      await renderSidebar('NONEXISTENT');
      const list = DOM.sidebarList;
      expect(list.innerHTML).toContain('Nenhum registro encontrado');
    });

    it('should show edit and delete buttons for each record', async () => {
      await saveDraft({
        uuid: 'test-btns',
        status: 'draft',
        iniciais: { uc: '123', os: '456' },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        equipamentos: [],
        attachments: [],
        composicao: {},
      });

      await renderSidebar();
      const list = DOM.sidebarList;
      expect(list.innerHTML).toContain('Editar');
      expect(list.innerHTML).toContain('Excluir');
    });
  });

  describe('initSidebarFilter', () => {
    it('should set up input listener on sidebar filter', () => {
      const spy = vi.spyOn(DOM.sidebarFilter, 'addEventListener');
      initSidebarFilter();
      expect(spy).toHaveBeenCalledWith('input', expect.any(Function));
      spy.mockRestore();
    });
  });

  describe('delete record', () => {
    it('should call resetForm when deleting the currently active record', async () => {
      await saveDraft({
        uuid: 'delete-me',
        status: 'draft',
        iniciais: { uc: '12345', os: '67890' },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        equipamentos: [],
        attachments: [],
        composicao: {},
      });

      // Set this as the current record
      state.currentUUID = 'delete-me';
      state.iniciaisValido = true;

      await renderSidebar();

      // Find and click the delete button
      const deleteBtns = DOM.sidebarList.querySelectorAll('.sidebar-btn-delete');
      expect(deleteBtns.length).toBe(1);

      // Click delete — this triggers showConfirm which shows the modal
      // We need to click OK on the confirm modal to proceed
      const clickPromise = Promise.resolve(deleteBtns[0].click());

      // showConfirm sets onclick handlers — simulate clicking OK
      // Flush microtasks to let the click handler execute first
      await flushPromises();
      DOM.confirmModalOk.onclick();

      await clickPromise;
      // Flush microtasks for async operations (deleteRecord, renderSidebar)
      await flushPromises();

      // Record should be deleted from DB
      const records = await getAllRecords();
      expect(records.length).toBe(0);

      // resetForm should have been called (not just clearCurrentUUID)
      expect(mockResetForm).toHaveBeenCalled();
    });

    it('should NOT call resetForm when deleting a different record', async () => {
      await saveDraft({
        uuid: 'keep-me',
        status: 'draft',
        iniciais: { uc: '111', os: '222' },
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        equipamentos: [],
        attachments: [],
        composicao: {},
      });
      await saveDraft({
        uuid: 'delete-other',
        status: 'draft',
        iniciais: { uc: '333', os: '444' },
        updatedAt: new Date(Date.now() - 10000).toISOString(), // older
        createdAt: new Date().toISOString(),
        equipamentos: [],
        attachments: [],
        composicao: {},
      });

      // Set current to 'keep-me'
      state.currentUUID = 'keep-me';
      state.iniciaisValido = true;

      await renderSidebar();

      // Find the delete button for 'delete-other' by looking at sidebar items
      const items = DOM.sidebarList.querySelectorAll('.sidebar-item');
      let deleteBtnForOther = null;
      items.forEach((item) => {
        const title = item.querySelector('.sidebar-item-title');
        if (title && title.textContent.includes('333')) {
          deleteBtnForOther = item.querySelector('.sidebar-btn-delete');
        }
      });
      expect(deleteBtnForOther).toBeTruthy();

      // Click delete on the other record
      deleteBtnForOther.click();
      await flushPromises();
      DOM.confirmModalOk.onclick();
      await flushPromises();

      // resetForm should NOT have been called since we deleted a different record
      expect(mockResetForm).not.toHaveBeenCalled();

      // Current record should still be active
      expect(state.currentUUID).toBe('keep-me');
    });
  });
});
