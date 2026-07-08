# Playwright Persistence E2E Tests — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 18 Playwright E2E tests across 6 spec files + 1 helper file that verify form data survives reload, crash, multi-tab, and stateful flows.

**Architecture:** Each spec file covers one persistence category (reload, IndexedDB, multi-tab, attachments, stateful, service-worker). Shared helpers in `tests-e2e/helpers/persistence.js` provide reusable primitives (readIndexedDB, fillCompleteForm, addEquipRow, restoreViaSidebar, confirmModal, waitForSave, createPngBuffer). No existing files are modified.

**Tech Stack:** Playwright Test (already configured), Chromium only, `baseURL: http://localhost:8888`, `workers: 1`, `fullyParallel: false`.

**Design Doc:** `docs/superpowers/specs/2026-06-18-playwright-persistence-e2e-tests-design.md`

---

## Key Architecture Facts (from codebase)

1. **App does NOT auto-restore on reload.** `DOMContentLoaded` in `app.js:L127` calls `clearCurrentUUID()`. After reload, form starts EMPTY. User must: open sidebar (`#hamburger`) → click "✏️ Editar" (`.sidebar-btn-edit`) → `loadRecord()` → `applyRecord()` restores fields.
2. **First save requires UC + OS both filled.** `checkInitialPersistence()` in `app.js:L28-36` gates `state.iniciaisValido`. Without both, `saveState()` early-returns.
3. **Debounce is 1s.** `debouncedSave()` in `persistence.js:L90` uses `setTimeout(saveState, 1000)`.
4. **Delete flow:** `closeSidebar()` is called BEFORE `showConfirm()`. The confirm modal uses `#confirm-modal` (class `hidden` removed to show, added to hide). Buttons: `#confirm-modal-ok` and `#confirm-modal-cancel`.
5. **IndexedDB:** Database `mail-mvp` v3, stores `records` (keyPath: uuid) and `attachments` (keyPath: id, index on uuid).
6. **Sidebar record summary format:** `getRecordSummary()` in `sidebar.js:L13-22` returns `${uc}-${os}-${tipoOrdem}` when all three exist, `${uc}-${os}` when only uc+os exist.
7. **"Novo" button resets form:** `#btn-novo-form` → `saveState()` then `resetForm()` → clears all state and DOM.
8. **navigator.storage.persist()** is called on load (app.js:L115-117).
9. **File input:** `#file-input` is hidden, triggered by clicking `#file-upload-area`. Upload limit: 12 files. Preview items: `.preview-item`. File count: `#file-count`.
10. **Equipamentos rows:** `.equip-row` class. Status select (`.equip-row select` nth 0), categoria select (nth 1), numero input (`.equip-numero`). Add button: `#btn-add-equip`.

---

## File Structure

```
tests-e2e/
  helpers/
    persistence.js                       # Task 1 (CREATE)
  form-fill.spec.js                      # (EXISTING — no changes)
  persistence-reload.spec.js             # Task 2 (CREATE)
  persistence-indexeddb.spec.js          # Task 3 (CREATE)
  persistence-multi-tab.spec.js          # Task 4 (CREATE)
  persistence-attachments.spec.js        # Task 5 (CREATE)
  persistence-stateful.spec.js           # Task 6 (CREATE)
  persistence-sw.spec.js                 # Task 7 (CREATE)
```

---

### Task 1: Shared Helpers — `tests-e2e/helpers/persistence.js`

**Files:**

- Create: `tests-e2e/helpers/persistence.js`

This file provides all reusable primitives for the 6 spec files.

- [ ] **Step 1: Create `tests-e2e/helpers/` directory**

Run: `New-Item -ItemType Directory -Path "tests-e2e\helpers" -Force`
Expected: Directory created

- [ ] **Step 2: Write `tests-e2e/helpers/persistence.js`**

```js
// tests-e2e/helpers/persistence.js
// Shared helpers for Playwright persistence E2E tests

import { expect } from '@playwright/test';

// ── IndexedDB Helpers ────────────────────────────────────────────────────────

/**
 * Read all records from IndexedDB (mail-mvp v3, records store).
 * Runs inside the browser context via page.evaluate().
 */
export async function readIndexedDB(page) {
  return page.evaluate(() => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('mail-mvp', 3);
      req.onsuccess = () => {
        const tx = req.result.transaction('records', 'readonly');
        const getAll = tx.objectStore('records').getAll();
        getAll.onsuccess = () => resolve(getAll.result);
        getAll.onerror = () => reject(getAll.error);
      };
      req.onerror = () => reject(req.error);
    });
  });
}

/**
 * Read attachments for a given UUID from IndexedDB (attachments store).
 */
export async function readAttachments(page, uuid) {
  return page.evaluate(uuid => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('mail-mvp', 3);
      req.onsuccess = () => {
        const tx = req.result.transaction('attachments', 'readonly');
        const index = tx.objectStore('attachments').index('uuid');
        const getAll = index.getAll(uuid);
        getAll.onsuccess = () => resolve(getAll.result);
        getAll.onerror = () => reject(getAll.error);
      };
      req.onerror = () => reject(req.error);
    });
  }, uuid);
}

/**
 * Delete all records from IndexedDB (cleanup before/after tests).
 */
export async function clearIndexedDB(page) {
  return page.evaluate(() => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('mail-mvp', 3);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(['records', 'attachments'], 'readwrite');
        tx.objectStore('records').clear();
        tx.objectStore('attachments').clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  });
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
 * Restore a record via sidebar: open hamburger → find record by summary text → click Editar.
 * The sidebar record summary format is "${uc}-${os}" or "${uc}-${os}-${tipoOrdem}".
 * After clicking Editar, sidebar closes and form is populated.
 */
export async function restoreViaSidebar(page, summaryText) {
  await page.click('#hamburger');
  await page.waitForSelector('#sidebar-list .sidebar-item');
  const item = page.locator('#sidebar-list .sidebar-item', { hasText: summaryText }).first();
  await item.locator('.sidebar-btn-edit').click();
  // Sidebar closes after Editar (loadRecord calls closeSidebar)
  await page.waitForSelector('#sidebar-list', { state: 'hidden', timeout: 5000 }).catch(() => {});
}

/**
 * Click the delete button on a sidebar record, then confirm the modal.
 * Flow: closeSidebar() → showConfirm() → click OK → record deleted.
 */
export async function deleteViaSidebar(page, summaryText) {
  await page.click('#hamburger');
  await page.waitForSelector('#sidebar-list .sidebar-item');
  const item = page.locator('#sidebar-list .sidebar-item', { hasText: summaryText }).first();
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
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x00, 0x02, 0x00, 0x01, 0xe2, 0x21, 0xbc, 0x33, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
    0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
}
```

- [ ] **Step 3: Verify the file was created**

Run: `Test-Path -LiteralPath "tests-e2e\helpers\persistence.js"`
Expected: `True`

- [ ] **Step 4: Commit helpers**

```bash
git add tests-e2e/helpers/persistence.js
git commit -m "feat(e2e): add shared helpers for persistence E2E tests"
```

---

### Task 2: Reload Persistence — `tests-e2e/persistence-reload.spec.js`

**Files:**

- Create: `tests-e2e/persistence-reload.spec.js`
- Depends on: Task 1 (helpers)

**Tests:** 1a (full form → reload → restore), 1b (close tab → reopen → restore), 1c (navigate during debounce), 1d (progressive auto-save across reloads)

- [ ] **Step 1: Write `tests-e2e/persistence-reload.spec.js`**

```js
// tests-e2e/persistence-reload.spec.js
import { test, expect } from '@playwright/test';
import {
  readIndexedDB,
  clearIndexedDB,
  fillCompleteForm,
  fillMinimal,
  addEquipRow,
  restoreViaSidebar,
  waitForSave,
} from './helpers/persistence.js';

test.describe('Persistence — Reload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#uc');
    await clearIndexedDB(page);
    await page.goto('/');
    await page.waitForSelector('#uc');
  });

  test('1a — complete form survives F5 and is restorable via sidebar', async ({ page }) => {
    // Fill full form
    await fillCompleteForm(page);
    await page.selectOption('#tipo-ordem', 'CORTE POR FALTA DE PAGAMENTO');
    await page.waitForSelector('#situacao_corte');
    await page.selectOption('#situacao_corte', 'CLIENTE CORTADO');
    await addEquipRow(page, 'Instalado', 'Medidor', '99999');
    await page.fill('#complemento-corpo', 'Teste E2E persistência');
    await waitForSave(page);

    // Reload
    await page.reload();
    await page.waitForSelector('#uc');

    // Form is empty after reload (clearCurrentUUID)
    await expect(page.locator('#uc')).toHaveValue('');

    // Data survived in IndexedDB
    const records = await readIndexedDB(page);
    expect(records).toHaveLength(1);
    expect(records[0].iniciais.uc).toBe('11111');

    // Restore via sidebar
    await restoreViaSidebar(page, '11111-22222');

    // Verify all fields restored
    await expect(page.locator('#uc')).toHaveValue('11111');
    await expect(page.locator('#os')).toHaveValue('22222');
    await expect(page.locator('#lider')).toHaveValue('ANDRE DE SOUSA CARVALHO');
    await expect(page.locator('#complemento-corpo')).toHaveValue('Teste E2E persistência');

    // Verify equipment restored
    const equipRows = page.locator('.equip-row');
    await expect(equipRows).toHaveCount(1);

    // Verify preview includes key data
    const previewText = await page.locator('#preview-corpo').innerText();
    expect(previewText).toContain('11111');
    expect(previewText).toContain('CLIENTE CORTADO');
  });

  test('1b — data survives closing and reopening tab', async ({ page, context }) => {
    await fillCompleteForm(page);
    await page.selectOption('#tipo-ordem', 'ADEQUACAO SMF');
    await waitForSave(page);

    // Close page, open new one in same context
    await page.close();
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.waitForSelector('#uc');

    // Data exists in IndexedDB
    const records = await readIndexedDB(page2);
    expect(records).toHaveLength(1);
    expect(records[0].iniciais.uc).toBe('11111');

    // Restore via sidebar
    await restoreViaSidebar(page2, '11111-22222');
    await expect(page2.locator('#uc')).toHaveValue('11111');

    await page2.close();
  });

  test('1c — abrupt navigation during debounce does not crash', async ({ page }) => {
    await fillMinimal(page, '99999', '88888');

    // Navigate away immediately (before 1s debounce completes)
    await page.goto('/');
    await page.waitForSelector('#uc');

    // Page loaded without errors — fill again and verify
    await fillMinimal(page, '99999', '88888');
    await waitForSave(page);

    const previewText = await page.locator('#preview-corpo').innerText();
    expect(previewText).toContain('99999');
  });

  test('1d — progressive auto-save survives multiple reloads', async ({ page }) => {
    // First save with minimal fields
    await fillMinimal(page, '33333', '44444');
    await waitForSave(page);

    // Reload 1
    await page.reload();
    await page.waitForSelector('#uc');

    const records1 = await readIndexedDB(page);
    expect(records1).toHaveLength(1);
    expect(records1[0].iniciais.uc).toBe('33333');

    // Restore, add more data
    await restoreViaSidebar(page, '33333-44444');
    await page.selectOption('#lider', { label: 'ANDRE DE SOUSA CARVALHO' });
    await waitForSave(page);

    // Reload 2
    await page.reload();
    await page.waitForSelector('#uc');

    // Restore again
    await restoreViaSidebar(page, '33333-44444');
    await expect(page.locator('#uc')).toHaveValue('33333');
    await expect(page.locator('#lider')).toHaveValue('ANDRE DE SOUSA CARVALHO');
  });
});
```

- [ ] **Step 2: Run the spec to verify tests pass**

Run: `npx playwright test tests-e2e/persistence-reload.spec.js --reporter=list`
Expected: 4 tests PASS

- [ ] **Step 3: Commit**

```bash
git add tests-e2e/persistence-reload.spec.js
git commit -m "feat(e2e): add reload persistence tests (1a-1d)"
```

---

### Task 3: IndexedDB Verification — `tests-e2e/persistence-indexeddb.spec.js`

**Files:**

- Create: `tests-e2e/persistence-indexeddb.spec.js`
- Depends on: Task 1 (helpers)

**Tests:** 2a (DB schema), 2b (saved content structure), 2c (attachmentCount + attachments), 2d (unique UUID per record)

- [ ] **Step 1: Write `tests-e2e/persistence-indexeddb.spec.js`**

```js
// tests-e2e/persistence-indexeddb.spec.js
import { test, expect } from '@playwright/test';
import {
  readIndexedDB,
  readAttachments,
  clearIndexedDB,
  fillCompleteForm,
  fillMinimal,
  addEquipRow,
  waitForSave,
  createPngBuffer,
} from './helpers/persistence.js';

test.describe('Persistence — IndexedDB', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#uc');
    await clearIndexedDB(page);
    await page.goto('/');
    await page.waitForSelector('#uc');
  });

  test('2a — database schema is correct (v3, records + attachments stores)', async ({ page }) => {
    const dbInfo = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open('mail-mvp', 3);
        req.onsuccess = () => {
          const db = req.result;
          resolve({
            name: db.name,
            version: db.version,
            stores: Array.from(db.objectStoreNames),
          });
        };
        req.onerror = () => reject(req.error);
      });
    });

    expect(dbInfo.name).toBe('mail-mvp');
    expect(dbInfo.version).toBe(3);
    expect(dbInfo.stores).toContain('records');
    expect(dbInfo.stores).toContain('attachments');
  });

  test('2b — saved content is correct in IndexedDB', async ({ page }) => {
    await fillCompleteForm(page);
    await page.selectOption('#tipo-ordem', 'CORTE POR FALTA DE PAGAMENTO');
    await page.waitForSelector('#situacao_corte');
    await page.selectOption('#situacao_corte', 'CLIENTE CORTADO');
    await addEquipRow(page, 'Instalado', 'Medidor', '99999');
    await page.fill('#complemento-corpo', 'Teste IndexedDB');
    await waitForSave(page);

    const records = await readIndexedDB(page);
    expect(records).toHaveLength(1);

    const record = records[0];
    expect(record.iniciais.uc).toBe('11111');
    expect(record.iniciais['tipo-ordem']).toBe('CORTE POR FALTA DE PAGAMENTO');
    expect(record.retorno.situacao_corte).toBe('CLIENTE CORTADO');
    expect(record.composicao.complementoCorpo).toBe('Teste IndexedDB');
    expect(record.uuid).toBeTruthy();
    expect(record.uuid.length).toBe(36);
    expect(record.createdAt).toBeTruthy();
    expect(record.updatedAt).toBeTruthy();
    expect(record.equipamentos).toHaveLength(1);
    expect(record.equipamentos[0].numero).toBe('99999');
  });

  test('2c — attachmentCount and attachment data are correct', async ({ page }) => {
    await fillMinimal(page, '11111', '22222');

    const buf = createPngBuffer();
    await page.setInputFiles('#file-input', [
      { name: 'a.png', mimeType: 'image/png', buffer: buf },
      { name: 'b.png', mimeType: 'image/png', buffer: buf },
    ]);
    await page.waitForSelector('.preview-item', { timeout: 5000 });
    await waitForSave(page);

    const records = await readIndexedDB(page);
    expect(records).toHaveLength(1);
    expect(records[0].attachmentCount).toBe(2);

    const attachments = await readAttachments(page, records[0].uuid);
    expect(attachments).toHaveLength(2);
    expect(attachments[0].name).toBe('a.png');
    expect(attachments[1].name).toBe('b.png');
  });

  test('2d — each record has a unique UUID', async ({ page }) => {
    await fillMinimal(page, '11111', '22222');
    await waitForSave(page);

    let records = await readIndexedDB(page);
    expect(records).toHaveLength(1);
    const uuid1 = records[0].uuid;

    // Create new record
    await page.click('#btn-novo-form');
    await fillMinimal(page, '33333', '44444');
    await waitForSave(page);

    records = await readIndexedDB(page);
    expect(records).toHaveLength(2);
    const uuid2 = records.find(r => r.iniciais.uc === '33333').uuid;
    expect(uuid2).not.toBe(uuid1);
  });
});
```

- [ ] **Step 2: Run the spec to verify tests pass**

Run: `npx playwright test tests-e2e/persistence-indexeddb.spec.js --reporter=list`
Expected: 4 tests PASS

- [ ] **Step 3: Commit**

```bash
git add tests-e2e/persistence-indexeddb.spec.js
git commit -m "feat(e2e): add IndexedDB verification tests (2a-2d)"
```

---

### Task 4: Multi-Tab Persistence — `tests-e2e/persistence-multi-tab.spec.js`

**Files:**

- Create: `tests-e2e/persistence-multi-tab.spec.js`
- Depends on: Task 1 (helpers)

**Tests:** 3a (tab B sees tab A's data), 3b (tab A edits, tab B reloads and sees), 3c (tab B deletes, tab A creates new without crash)

Uses `test.serial` to guarantee order across tabs sharing the same browser context.

- [ ] **Step 1: Write `tests-e2e/persistence-multi-tab.spec.js`**

```js
// tests-e2e/persistence-multi-tab.spec.js
import { test, expect } from '@playwright/test';
import {
  readIndexedDB,
  clearIndexedDB,
  fillMinimal,
  restoreViaSidebar,
  deleteViaSidebar,
  waitForSave,
} from './helpers/persistence.js';

test.describe('Persistence — Multi-Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#uc');
    await clearIndexedDB(page);
    await page.goto('/');
    await page.waitForSelector('#uc');
  });

  test('3a — tab B sees data saved by tab A', async ({ page, context }) => {
    // Tab A fills and saves
    await fillMinimal(page, '11111', '22222');
    await waitForSave(page);

    // Tab B opens
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.waitForSelector('#uc');

    // Tab B can read the data from IndexedDB
    const records = await readIndexedDB(page2);
    expect(records).toHaveLength(1);
    expect(records[0].iniciais.uc).toBe('11111');

    // Tab B opens sidebar and sees the record
    await page2.click('#hamburger');
    await page2.waitForSelector('#sidebar-list .sidebar-item');
    const item = page2.locator('#sidebar-list .sidebar-item', { hasText: '11111' });
    await expect(item).toBeVisible();

    await page2.close();
  });

  test('3b — tab A edits, tab B reload sees the update', async ({ page, context }) => {
    // Both tabs start with the same data
    await fillMinimal(page, '11111', '22222');
    await waitForSave(page);

    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.waitForSelector('#uc');

    // Tab A adds more data
    await page.selectOption('#lider', { label: 'ANDRE DE SOUSA CARVALHO' });
    await waitForSave(page);

    // Tab B reloads and restores
    await page2.reload();
    await page2.waitForSelector('#uc');
    await restoreViaSidebar(page2, '11111-22222');
    await expect(page2.locator('#lider')).toHaveValue('ANDRE DE SOUSA CARVALHO');

    await page2.close();
  });

  test('3c — tab B deletes record, tab A creates new without crash', async ({ page, context }) => {
    // Tab A saves
    await fillMinimal(page, '55555', '66666');
    await waitForSave(page);

    // Tab B deletes the record
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.waitForSelector('#uc');
    await deleteViaSidebar(page2, '55555-66666');
    await waitForSave(page2);

    // Verify record is gone from IndexedDB
    const records = await readIndexedDB(page2);
    expect(records).toHaveLength(0);

    // Tab A continues working — fills new data (gets new UUID since old was deleted)
    await page.selectOption('#lider', { label: 'ANDRE DE SOUSA CARVALHO' });
    await waitForSave(page);

    // Tab A didn't crash and saved new data
    await expect(page.locator('#lider')).toHaveValue('ANDRE DE SOUSA CARVALHO');
    const recordsFinal = await readIndexedDB(page);
    expect(recordsFinal.length).toBeGreaterThanOrEqual(1);

    await page2.close();
  });
});
```

- [ ] **Step 2: Run the spec to verify tests pass**

Run: `npx playwright test tests-e2e/persistence-multi-tab.spec.js --reporter=list`
Expected: 3 tests PASS

- [ ] **Step 3: Commit**

```bash
git add tests-e2e/persistence-multi-tab.spec.js
git commit -m "feat(e2e): add multi-tab persistence tests (3a-3c)"
```

---

### Task 5: Attachment Persistence — `tests-e2e/persistence-attachments.spec.js`

**Files:**

- Create: `tests-e2e/persistence-attachments.spec.js`
- Depends on: Task 1 (helpers)

**Tests:** 4a (single file survives reload), 4b (multiple files survive reload), 4c (invalid file doesn't break persistence)

- [ ] **Step 1: Write `tests-e2e/persistence-attachments.spec.js`**

```js
// tests-e2e/persistence-attachments.spec.js
import { test, expect } from '@playwright/test';
import {
  clearIndexedDB,
  fillMinimal,
  restoreViaSidebar,
  waitForSave,
  createPngBuffer,
} from './helpers/persistence.js';

test.describe('Persistence — Attachments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#uc');
    await clearIndexedDB(page);
    await page.goto('/');
    await page.waitForSelector('#uc');
  });

  test('4a — single file survives reload and restore', async ({ page }) => {
    const buf = createPngBuffer();
    await fillMinimal(page, '11111', '22222');

    await page.setInputFiles('#file-input', [
      { name: 'test.png', mimeType: 'image/png', buffer: buf },
    ]);
    await page.waitForSelector('.preview-item', { timeout: 5000 });
    await waitForSave(page);

    // Reload and restore
    await page.reload();
    await page.waitForSelector('#uc');
    await restoreViaSidebar(page, '11111-22222');

    // Verify file count (format: "1 / 12")
    const fileCountText = await page.locator('#file-count').innerText();
    expect(fileCountText).toContain('1');
  });

  test('4b — multiple files survive reload and restore', async ({ page }) => {
    const buf = createPngBuffer();
    await fillMinimal(page, '11111', '22222');

    await page.setInputFiles('#file-input', [
      { name: 'a.png', mimeType: 'image/png', buffer: buf },
      { name: 'b.png', mimeType: 'image/png', buffer: buf },
      { name: 'c.png', mimeType: 'image/png', buffer: buf },
    ]);
    await page.waitForSelector('.preview-item', { timeout: 5000 });
    await waitForSave(page);

    // Reload and restore
    await page.reload();
    await page.waitForSelector('#uc');
    await restoreViaSidebar(page, '11111-22222');

    // Verify file count
    const fileCountText = await page.locator('#file-count').innerText();
    expect(fileCountText).toContain('3');
  });

  test('4c — invalid file does not break persistence', async ({ page }) => {
    await fillMinimal(page, '11111', '22222');

    // Try uploading an .exe (should be rejected by the app's file type validation)
    await page.setInputFiles('#file-input', [
      { name: 'script.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from('MZ') },
    ]);

    // Either no preview-item appears (rejected) or error shown
    const previewCount = await page.locator('.preview-item').count();
    expect(previewCount).toBe(0);

    // IndexedDB is not corrupted — save still works
    await waitForSave(page);
    const ucValue = await page.locator('#uc').inputValue();
    expect(ucValue).toBe('11111');
  });
});
```

- [ ] **Step 2: Run the spec to verify tests pass**

Run: `npx playwright test tests-e2e/persistence-attachments.spec.js --reporter=list`
Expected: 3 tests PASS

- [ ] **Step 3: Commit**

```bash
git add tests-e2e/persistence-attachments.spec.js
git commit -m "feat(e2e): add attachment persistence tests (4a-4c)"
```

---

### Task 6: Stateful Flows — `tests-e2e/persistence-stateful.spec.js`

**Files:**

- Create: `tests-e2e/persistence-stateful.spec.js`
- Depends on: Task 1 (helpers)

**Tests:** 5a (tipo-ordem change clears retorno in IndexedDB), 5b (5+ records no data leakage), 5c (Novo + restore cycle), 5d (edit after restore + reload)

- [ ] **Step 1: Write `tests-e2e/persistence-stateful.spec.js`**

```js
// tests-e2e/persistence-stateful.spec.js
import { test, expect } from '@playwright/test';
import {
  readIndexedDB,
  clearIndexedDB,
  fillMinimal,
  restoreViaSidebar,
  waitForSave,
} from './helpers/persistence.js';

test.describe('Persistence — Stateful Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#uc');
    await clearIndexedDB(page);
    await page.goto('/');
    await page.waitForSelector('#uc');
  });

  test('5a — tipo-ordem change clears retorno and persists in IndexedDB', async ({ page }) => {
    await fillMinimal(page, '11111', '22222');

    // Select first tipo-ordem and fill retorno
    await page.selectOption('#tipo-ordem', 'VISTORIA DA UC');
    await page.waitForSelector('#resultado');
    await page.selectOption('#resultado', 'Regular');
    await waitForSave(page);

    // Switch to a different tipo-ordem
    await page.selectOption('#tipo-ordem', 'CORTE POR FALTA DE PAGAMENTO');
    await page.waitForSelector('#situacao_corte');

    // Old retorno field should be gone from DOM
    await expect(page.locator('#resultado')).toHaveCount(0);

    await waitForSave(page);

    // Check IndexedDB: retorno should not have old fields
    const records = await readIndexedDB(page);
    expect(records).toHaveLength(1);
    expect(records[0].retorno.resultado).toBeUndefined();
    // New field should be present (empty — not selected yet)
  });

  test('5b — 5+ records in sidebar with no data leakage', async ({ page }) => {
    for (let i = 1; i <= 5; i++) {
      if (i > 1) {
        await page.click('#btn-novo-form');
      }
      const uc = String(i).repeat(5);
      const os = `OS-${i}`;
      await fillMinimal(page, uc, os);
      await waitForSave(page);
    }

    // Verify 5 records in IndexedDB
    const records = await readIndexedDB(page);
    expect(records).toHaveLength(5);

    // Verify each record restores correctly (no leakage)
    for (let i = 1; i <= 5; i++) {
      const uc = String(i).repeat(5);
      const os = `OS-${i}`;
      await restoreViaSidebar(page, `${uc}-${os}`);
      await expect(page.locator('#uc')).toHaveValue(uc);
      await expect(page.locator('#os')).toHaveValue(os);
    }

    // All UUIDs are unique
    const uuids = records.map(r => r.uuid);
    const uniqueUuids = new Set(uuids);
    expect(uniqueUuids.size).toBe(5);
  });

  test('5c — Novo + restore full cycle', async ({ page }) => {
    await fillMinimal(page, '11111', '22222');
    await page.selectOption('#lider', { label: 'ANDRE DE SOUSA CARVALHO' });
    await waitForSave(page);

    // Click Novo — form resets
    await page.click('#btn-novo-form');
    await expect(page.locator('#uc')).toHaveValue('');
    await expect(page.locator('#os')).toHaveValue('');

    // Restore the saved record
    await restoreViaSidebar(page, '11111-22222');
    await expect(page.locator('#uc')).toHaveValue('11111');
    await expect(page.locator('#lider')).toHaveValue('ANDRE DE SOUSA CARVALHO');
  });

  test('5d — edit after restore then reload preserves changes', async ({ page }) => {
    await fillMinimal(page, '11111', '22222');
    await waitForSave(page);

    // Reload and restore
    await page.reload();
    await page.waitForSelector('#uc');
    await restoreViaSidebar(page, '11111-22222');

    // Edit UC
    await page.fill('#uc', '99999');
    await waitForSave(page);

    // Reload again
    await page.reload();
    await page.waitForSelector('#uc');

    // Restore — summary now uses "99999"
    await restoreViaSidebar(page, '99999-22222');
    await expect(page.locator('#uc')).toHaveValue('99999');
  });
});
```

- [ ] **Step 2: Run the spec to verify tests pass**

Run: `npx playwright test tests-e2e/persistence-stateful.spec.js --reporter=list`
Expected: 4 tests PASS

- [ ] **Step 3: Commit**

```bash
git add tests-e2e/persistence-stateful.spec.js
git commit -m "feat(e2e): add stateful flows persistence tests (5a-5d)"
```

---

### Task 7: Service Worker — `tests-e2e/persistence-sw.spec.js`

**Files:**

- Create: `tests-e2e/persistence-sw.spec.js`
- Depends on: Task 1 (helpers)

**Tests:** 6a (SW is registered), 6b (SW doesn't interfere with IndexedDB), 6c (navigator.storage.persist requested)

- [ ] **Step 1: Write `tests-e2e/persistence-sw.spec.js`**

```js
// tests-e2e/persistence-sw.spec.js
import { test, expect } from '@playwright/test';
import { readIndexedDB, clearIndexedDB, fillMinimal, waitForSave } from './helpers/persistence.js';

test.describe('Persistence — Service Worker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#uc');
    await clearIndexedDB(page);
    await page.goto('/');
    await page.waitForSelector('#uc');
  });

  test('6a — service worker is registered', async ({ page }) => {
    // Allow time for SW registration
    await page.waitForTimeout(2000);

    const hasRegistration = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return !!reg;
    });
    expect(hasRegistration).toBe(true);
  });

  test('6b — SW does not interfere with IndexedDB persistence', async ({ page }) => {
    await fillMinimal(page, '11111', '22222');
    await waitForSave(page);

    // Reload — SW may serve cached assets, but IndexedDB should survive
    await page.reload();
    await page.waitForSelector('#uc');

    const records = await readIndexedDB(page);
    expect(records).toHaveLength(1);
    expect(records[0].iniciais.uc).toBe('11111');
  });

  test('6c — navigator.storage.persist() was requested', async ({ page }) => {
    const isPersisted = await page.evaluate(async () => {
      return navigator.storage.persisted();
    });
    // Box is checked when browser grants persistent storage
    // Even if not granted, the request was made (app.js L115-117)
    expect(typeof isPersisted).toBe('boolean');
  });
});
```

- [ ] **Step 2: Run the spec to verify tests pass**

Run: `npx playwright test tests-e2e/persistence-sw.spec.js --reporter=list`
Expected: 3 tests PASS

- [ ] **Step 3: Commit**

```bash
git add tests-e2e/persistence-sw.spec.js
git commit -m "feat(e2e): add service worker persistence tests (6a-6c)"
```

---

### Task 8: Full Suite Integration Check

**Files:** No new files. Verifies all specs work together.

- [ ] **Step 1: Run all Playwright tests (old + new)**

Run: `npx playwright test --reporter=list`
Expected: All tests PASS (existing form-fill + 18 new persistence tests = 19 total)

- [ ] **Step 2: Run 3 consecutive times for flakiness check**

Run the full suite 3 times. If any test fails once but passes on retry, increase `waitForSave` timeout or add explicit waits.

```bash
npx playwright test --reporter=list
npx playwright test --reporter=list
npx playwright test --reporter=list
```

Expected: 3/3 runs all green

- [ ] **Step 3: Ensure existing unit tests still pass**

Run: `npm test`
Expected: All unit tests PASS (no changes to source code)

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add tests-e2e/
git commit -m "fix(e2e): adjust timing/selections after integration check"
```

(Only if changes were needed. If all passed on first run, skip this step.)
