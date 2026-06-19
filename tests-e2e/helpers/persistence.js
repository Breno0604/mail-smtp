// tests-e2e/helpers/persistence.js
// Shared helpers for Playwright persistence E2E tests

// ── IndexedDB Schema Constants ───────────────────────────────────────────────

const DB_NAME = 'mail-mvp';
const DB_VERSION = 3;
const STORE_RECORDS = 'records';
const STORE_ATTACHMENTS = 'attachments';
const INDEX_UUID = 'uuid';

// ── IndexedDB Helpers ────────────────────────────────────────────────────────

/**
 * Read all records from IndexedDB (mail-mvp v3, records store).
 * Runs inside the browser context via page.evaluate().
 */
export async function readIndexedDB(page) {
  return page.evaluate(({ DB_NAME, DB_VERSION, STORE_RECORDS }) => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_RECORDS)) {
          db.createObjectStore(STORE_RECORDS, { keyPath: 'uuid' });
        }
      };
      req.onsuccess = () => {
        try {
          const db = req.result;
          const tx = db.transaction(STORE_RECORDS, 'readonly');
          const getAll = tx.objectStore(STORE_RECORDS).getAll();
          getAll.onsuccess = () => { resolve(getAll.result); db.close(); };
          getAll.onerror = () => { reject(getAll.error); db.close(); };
        } catch (e) { reject(e); }
      };
      req.onerror = () => reject(req.error);
    });
  }, { DB_NAME, DB_VERSION, STORE_RECORDS });
}

/**
 * Read attachments for a given UUID from IndexedDB (attachments store).
 */
export async function readAttachments(page, uuid) {
  return page.evaluate(({ uuid, DB_NAME, DB_VERSION, STORE_ATTACHMENTS, INDEX_UUID }) => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_ATTACHMENTS)) {
          const attStore = db.createObjectStore(STORE_ATTACHMENTS, { keyPath: 'id' });
          attStore.createIndex(INDEX_UUID, 'uuid', { unique: false });
        }
      };
      req.onsuccess = () => {
        try {
          const db = req.result;
          const tx = db.transaction(STORE_ATTACHMENTS, 'readonly');
          const index = tx.objectStore(STORE_ATTACHMENTS).index(INDEX_UUID);
          const getAll = index.getAll(uuid);
          getAll.onsuccess = () => { resolve(getAll.result); db.close(); };
          getAll.onerror = () => { reject(getAll.error); db.close(); };
        } catch (e) { reject(e); }
      };
      req.onerror = () => reject(req.error);
    });
  }, { uuid, DB_NAME, DB_VERSION, STORE_ATTACHMENTS, INDEX_UUID });
}

/**
 * Delete all records from IndexedDB (cleanup before/after tests).
 */
export async function clearIndexedDB(page) {
  return page.evaluate(({ DB_NAME, DB_VERSION, STORE_RECORDS, STORE_ATTACHMENTS }) => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_RECORDS)) {
          db.createObjectStore(STORE_RECORDS, { keyPath: 'uuid' });
        }
        if (!db.objectStoreNames.contains(STORE_ATTACHMENTS)) {
          const attStore = db.createObjectStore(STORE_ATTACHMENTS, { keyPath: 'id' });
          attStore.createIndex('uuid', 'uuid', { unique: false });
        }
      };
      req.onsuccess = () => {
        try {
          const db = req.result;
          const tx = db.transaction([STORE_RECORDS, STORE_ATTACHMENTS], 'readwrite');
          tx.objectStore(STORE_RECORDS).clear();
          tx.objectStore(STORE_ATTACHMENTS).clear();
          tx.oncomplete = () => { resolve(); db.close(); };
          tx.onerror = () => { reject(tx.error); db.close(); };
        } catch (e) { reject(e); }
      };
      req.onerror = () => reject(req.error);
    });
  }, { DB_NAME, DB_VERSION, STORE_RECORDS, STORE_ATTACHMENTS });
}

// ── Form Fill Helpers ─────────────────────────────────────────────────────────

/**
 * Fill the complete initial fields with deterministic test data.
 * Optionally pass a suffix to make UC/OS unique across tests.
 */
export async function fillCompleteForm(page, suffix = '') {
  await page.fill('#uc', `11111${suffix}`);
  await page.fill('#os', `22222${suffix}`);
  await page.selectOption('#lider', { label: 'ANDRE DE SOUSA CARVALHO' });
  await page.selectOption('#parceiro', { label: 'JOSE DOGIVAN DA SILVA' });
  await page.selectOption('#municipio', { label: 'FORTALEZA' });
  await page.selectOption('#notificado', { label: 'SIM' });
  await page.selectOption('#placa', { label: 'RHS6G02' });
  await page.fill('#data', '2026-06-13');
  await page.fill('#hora_inicio', '08:00');
  await page.fill('#hora_fim', '17:00');
}

/**
 * Fill minimum required fields (UC + OS) to trigger first save.
 * Without both, saveState() early-returns (checkInitialPersistence gate).
 */
export async function fillMinimal(page, uc = '11111', os = '22222') {
  await page.fill('#uc', uc);
  await page.fill('#os', os);
}

// ── Equipment Helpers ─────────────────────────────────────────────────────────

/**
 * Add one equipment row and fill it with the given values.
 * Clicks #btn-add-equip, waits for .equip-row, fills the last row.
 */
export async function addEquipRow(page, status, categoria, numero) {
  await page.click('#btn-add-equip');
  await page.waitForSelector('.equip-row');
  const lastRow = page.locator('.equip-row').last();
  await lastRow.locator('select').nth(0).selectOption(status);
  await lastRow.locator('select').nth(1).selectOption(categoria);
  await lastRow.locator('input.equip-numero').fill(numero);
}

// ── Sidebar / Restore Helpers ────────────────────────────────────────────────

/**
 * Open the sidebar and return the first .sidebar-item matching the summary text.
 */
async function findSidebarItem(page, summaryText) {
  await page.click('#hamburger');
  await page.waitForSelector('#sidebar-list .sidebar-item');
  return page.locator('#sidebar-list .sidebar-item', { hasText: summaryText }).first();
}

/**
 * Restore a record via sidebar: open hamburger → find record by summary text → click Editar.
 * The sidebar record summary format is "${uc}-${os}" or "${uc}-${os}-${tipoOrdem}".
 * After clicking Editar, sidebar closes and form is populated.
 */
export async function restoreViaSidebar(page, summaryText) {
  const item = await findSidebarItem(page, summaryText);
  await item.locator('.sidebar-btn-edit').click();
  // Sidebar closes after Editar (loadRecord calls closeSidebar)
  await page.waitForSelector('#sidebar-list', { state: 'hidden', timeout: 5000 }).catch(() => {});
}

/**
 * Click the delete button on a sidebar record, then confirm the modal.
 * Flow: closeSidebar() → showConfirm() → click OK → record deleted.
 */
export async function deleteViaSidebar(page, summaryText) {
  const item = await findSidebarItem(page, summaryText);
  await item.locator('.sidebar-btn-delete').click();
  // After click, sidebar closes first, then confirm modal appears
  await confirmModal(page);
}

// ── Modal Helpers ─────────────────────────────────────────────────────────────

/**
 * Confirm the #confirm-modal by clicking OK.
 * Waits for modal to become visible, clicks OK, waits for it to hide.
 */
export async function confirmModal(page) {
  await page.waitForSelector('#confirm-modal:not(.hidden)', { timeout: 3000 });
  await page.click('#confirm-modal-ok');
  await page.waitForSelector('#confirm-modal.hidden', { timeout: 3000 }).catch(() => {});
}

// ── Timing Helpers ────────────────────────────────────────────────────────────

/**
 * Wait for the debounce save to complete.
 * debouncedSave uses setTimeout(saveState, 1000), so 1500ms gives margin.
 */
export async function waitForSave(page, ms = 1500) {
  await page.waitForTimeout(ms);
}

// ── File Helpers ──────────────────────────────────────────────────────────────

/**
 * Create a minimal valid 1x1 PNG buffer for upload tests.
 * 67 bytes — the smallest valid PNG.
 */
export function createPngBuffer() {
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
    0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
    0x00, 0x00, 0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC,
    0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
    0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
}
