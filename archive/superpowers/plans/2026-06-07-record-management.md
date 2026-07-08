# Record Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace localStorage + sent_emails store with a unified IndexedDB record management system featuring auto-save, sidebar browsing, and duplicate send prevention.

**Architecture:** Single IndexedDB store (`records`) keyed by UUID. sessionStorage holds the active draft UUID. No localStorage. A new sidebar component lists all records with Edit/Delete. A duplicate check runs before send.

**Tech Stack:** Vanilla JS (ES6 modules), IndexedDB, HTML5, Tailwind CSS (CDN)

---

### Task 1: Update IndexedDB schema and CRUD operations

**Files:**

- Modify: `scripts/db.js`

- [ ] **Step 1: Replace db.js with new schema (v2, `records` store) and full CRUD**

```js
const DB_NAME = 'mail-mvp';
const DB_VERSION = 2;
const STORE_NAME = 'records';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (db.objectStoreNames.contains('sent_emails')) {
        db.deleteObjectStore('sent_emails');
      }
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'uuid' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function saveDraft(record) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

export function getRecord(uuid) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(uuid);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  });
}

export function getAllRecords() {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  });
}

export function deleteRecord(uuid) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(uuid);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

export function updateRecordStatus(uuid, sentData) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(uuid);
      req.onsuccess = () => {
        const record = req.result;
        if (record) {
          record.status = 'sent';
          record.sentData = sentData;
          record.updatedAt = new Date().toISOString();
          store.put(record);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `node -e "const m = require('fs').readFileSync('scripts/db.js','utf8'); console.log('ok')"`

---

### Task 2: Update state.js — replace localStorage with IndexedDB, add composicao and currentUUID

**Files:**

- Modify: `scripts/state.js`

- [ ] **Step 1: Rewrite state.js**

Replace localStorage with IndexedDB auto-save. Add `currentUUID`, `composicao` to state. Export `saveState` that persists to IndexedDB.

```js
import { DOM } from './dom.js';
import { getIniciaisData } from './iniciais.js';
import { saveDraft, getRecord } from './db.js';

export const STORAGE_KEY = 'mail_form_estado';

export const state = {
  currentSection: 1,
  totalSections: 5,
  iniciais: {},
  equipamentos: [],
  attachments: [],
  lastTipoOrdem: '',
  visitedRetorno: false,
  animating: false,
  currentUUID: sessionStorage.getItem('currentUUID') || '',
  composicao: { complementoCorpo: '' },
};

let saveTimer = null;

export async function saveState() {
  const iniciaisData = getIniciaisData();
  const hasData = Object.values(iniciaisData).some(v => v && v.trim() !== '');
  if (
    !hasData &&
    state.equipamentos.length === 0 &&
    state.attachments.length === 0 &&
    !state.currentUUID
  )
    return;

  if (!state.currentUUID) {
    state.currentUUID = crypto.randomUUID();
    sessionStorage.setItem('currentUUID', state.currentUUID);
  }

  let createdAt = new Date().toISOString();
  if (state._createdAt) {
    createdAt = state._createdAt;
  } else {
    try {
      const existing = await getRecord(state.currentUUID);
      if (existing?.createdAt) {
        createdAt = existing.createdAt;
      }
    } catch (_) {
      /* ignore */
    }
    state._createdAt = createdAt;
  }

  const data = {
    uuid: state.currentUUID,
    status: 'draft',
    createdAt,
    updatedAt: new Date().toISOString(),
    currentSection: state.currentSection,
    iniciais: iniciaisData,
    tipoOrdem: DOM.tipoOrdem ? DOM.tipoOrdem.value : '',
    equipamentos: state.equipamentos,
    lastTipoOrdem: state.lastTipoOrdem,
    visitedRetorno: state.visitedRetorno,
    composicao: { complementoCorpo: DOM.complementoCorpo ? DOM.complementoCorpo.value : '' },
    sentData: null,
  };

  saveDraft(data).catch(() => {});
}

export function debouncedSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 300);
}
```

---

### Task 3: Update app.js — IndexedDB-based restore, sidebar init, duplicate check wiring

**Files:**

- Modify: `scripts/app.js`

- [ ] **Step 1: Add imports for sidebar and duplicate, rewrite restoreSavedState to use IndexedDB, wire sidebar and duplicate check**

```js
import { DOM, cacheDOM } from './dom.js';
import { state, STORAGE_KEY, saveState, debouncedSave } from './state.js';
import { renderIniciais, iniciaisFields } from './iniciais.js';
import { addEquip } from './equipment.js';
import { handleTipoChange, cancelTipoChange, confirmTipoChange } from './retornos.js';
import {
  handleUploadClick,
  handleFileChange,
  closeLightbox,
  updateFileCount,
} from './attachments.js';
import { showSection, prevSection, nextSection } from './navigation.js';
import { resetForm } from './reset.js';
import { renderSidebar } from './sidebar.js';
import { getRecord } from './db.js';

function restoreSavedState() {
  const uuid = sessionStorage.getItem('currentUUID');
  if (!uuid) return;

  getRecord(uuid)
    .then(record => {
      if (!record) {
        sessionStorage.removeItem('currentUUID');
        return;
      }
      const ok = confirm(
        `H\u00E1 um formul\u00E1rio salvo (Se\u00E7\u00E3o ${record.currentSection} de 5). Deseja continuar de onde parou?`
      );
      if (!ok) {
        sessionStorage.removeItem('currentUUID');
        return;
      }

      state.currentUUID = uuid;
      state.equipamentos = record.equipamentos || [];
      state.lastTipoOrdem = record.lastTipoOrdem || '';
      state.visitedRetorno = record.visitedRetorno || false;
      showSection(record.currentSection, 'next', true);

      if (record.iniciais) {
        iniciaisFields.forEach(field => {
          const el = document.getElementById(field.nome);
          if (el) el.value = record.iniciais[field.nome] || '';
        });
      }

      if (record.tipoOrdem && DOM.tipoOrdem) {
        DOM.tipoOrdem.value = record.tipoOrdem;
      }

      if (record.composicao && record.composicao.complementoCorpo && DOM.complementoCorpo) {
        DOM.complementoCorpo.value = record.composicao.complementoCorpo;
      }
    })
    .catch(() => {});
}

function initEvents() {
  DOM.btnAnterior.addEventListener('click', prevSection);
  DOM.btnProximo.addEventListener('click', nextSection);
  DOM.btnAddEquip.addEventListener('click', () => addEquip());
  DOM.btnSkipEquip.addEventListener('click', () => showSection(3, 'next'));
  DOM.tipoOrdem.addEventListener('change', handleTipoChange);
  DOM.modalCancel.addEventListener('click', cancelTipoChange);
  DOM.modalConfirm.addEventListener('click', confirmTipoChange);
  DOM.fileUploadArea.addEventListener('click', handleUploadClick);
  DOM.fileInput.addEventListener('change', handleFileChange);
  DOM.lightboxClose.addEventListener('click', closeLightbox);
  DOM.lightbox.addEventListener('click', e => {
    if (e.target === DOM.lightbox) closeLightbox();
  });
  DOM.btnLimpar.addEventListener('click', () => {
    if (!confirm('Tem certeza? Todos os dados ser\u00E3o perdidos.')) return;
    resetForm();
    showSection(1, 'prev', true);
  });
  DOM.hamburger.addEventListener('click', () => {
    renderSidebar();
    document.body.classList.add('sidebar-open');
  });
  DOM.sidebarOverlay.addEventListener('click', closeSidebar);
  DOM.sidebarClose.addEventListener('click', closeSidebar);

  document.addEventListener('pointerdown', e => {
    if (
      e.target.tagName !== 'INPUT' &&
      e.target.tagName !== 'SELECT' &&
      e.target.tagName !== 'TEXTAREA'
    ) {
      document.activeElement?.blur();
    }
  });

  document.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('change', debouncedSave);
    el.addEventListener('input', debouncedSave);
  });
}

export function closeSidebar() {
  document.body.classList.remove('sidebar-open');
}

document.addEventListener('DOMContentLoaded', () => {
  cacheDOM();
  renderIniciais();
  DOM.tipoOrdem = document.getElementById('tipo-ordem');
  initEvents();
  updateFileCount();
  restoreSavedState();
  if (
    state.currentSection === 1 &&
    !document.getElementById('section-1').classList.contains('active')
  ) {
    showSection(1, 'next', true);
  }
});
```

---

### Task 4: Update send.js — update IndexedDB record status on success

**Files:**

- Modify: `scripts/send.js`

- [ ] **Step 1: Add `updateRecordStatus` import and call it on successful send**

After the existing imports, add:

```js
import { updateRecordStatus } from './db.js';
```

After `showToast("Email enviado com sucesso!", true);`, add:

```js
if (state.currentUUID) {
  updateRecordStatus(state.currentUUID, {
    to: data.to,
    subject,
    sentAt: new Date().toISOString(),
  }).catch(() => {});
}
```

Add `import { state } from "./state.js";` if not already imported (it already is at line 2).

---

### Task 5: Update reset.js — clear sessionStorage and currentUUID

**Files:**

- Modify: `scripts/reset.js`

- [ ] **Step 1: Add cleanup of sessionStorage.currentUUID and state.currentUUID**

At the end of `resetForm()`, after `localStorage.removeItem(STORAGE_KEY);`, add:

```js
sessionStorage.removeItem('currentUUID');
state.currentUUID = '';
```

Also add `import { state } from "./state.js";` at the top (check if present — it should already be there).

---

### Task 6: Create sidebar.js

**Files:**

- Create: `scripts/sidebar.js`

- [ ] **Step 1: Write the sidebar module**

```js
import { DOM } from './dom.js';
import { state } from './state.js';
import { getAllRecords, deleteRecord, getRecord } from './db.js';
import { showSection } from './navigation.js';
import { renderIniciais, iniciaisFields } from './iniciais.js';
import { renderEquipamentos } from './equipment.js';
import { renderRetorno } from './retornos.js';
import { renderPreviews, updateFileCount } from './attachments.js';
import { closeSidebar } from './app.js';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getRecordSummary(record) {
  const uc = record.iniciais?.uc || '';
  const os = record.iniciais?.os || '';
  if (uc && os) return `OS #${os} — UC ${uc}`;
  if (os) return `OS #${os}`;
  if (uc) return `UC ${uc}`;
  return '(rascunho vazio)';
}

export async function renderSidebar() {
  const list = DOM.sidebarList;
  list.innerHTML = '';

  let records;
  try {
    records = await getAllRecords();
  } catch (e) {
    list.innerHTML = '<div class="sidebar-empty">Erro ao carregar registros.</div>';
    return;
  }

  if (!records || records.length === 0) {
    list.innerHTML = '<div class="sidebar-empty">Nenhum registro encontrado.</div>';
    return;
  }

  records.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  records.forEach(record => {
    const item = document.createElement('div');
    item.className = 'sidebar-item';

    const header = document.createElement('div');
    header.className = 'sidebar-item-header';

    const title = document.createElement('span');
    title.className = 'sidebar-item-title';
    title.textContent = getRecordSummary(record);

    const status = document.createElement('span');
    status.className = `sidebar-status ${record.status === 'sent' ? 'status-sent' : 'status-draft'}`;
    status.textContent = record.status === 'sent' ? 'Enviado' : 'Rascunho';

    header.appendChild(title);
    header.appendChild(status);

    const meta = document.createElement('div');
    meta.className = 'sidebar-item-meta';
    meta.textContent = formatDate(record.updatedAt);

    const actions = document.createElement('div');
    actions.className = 'sidebar-item-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'sidebar-btn sidebar-btn-edit';
    editBtn.textContent = '\u270F\uFE0F Editar';
    editBtn.addEventListener('click', async e => {
      e.stopPropagation();
      try {
        const full = await getRecord(record.uuid);
        if (!full) return;
        loadRecord(full);
      } catch (err) {
        /* ignore */
      }
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'sidebar-btn sidebar-btn-delete';
    deleteBtn.textContent = '\uD83D\uDDD1\uFE0F Excluir';
    deleteBtn.addEventListener('click', async e => {
      e.stopPropagation();
      if (!confirm('Excluir este registro? Esta a\u00E7\u00E3o n\u00E3o pode ser desfeita.'))
        return;
      try {
        await deleteRecord(record.uuid);
        if (state.currentUUID === record.uuid) {
          sessionStorage.removeItem('currentUUID');
          state.currentUUID = '';
        }
        renderSidebar();
      } catch (err) {
        /* ignore */
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(header);
    item.appendChild(meta);
    item.appendChild(actions);
    list.appendChild(item);
  });
}

function loadRecord(record) {
  state.currentUUID = record.uuid;
  sessionStorage.setItem('currentUUID', record.uuid);

  state.equipamentos = record.equipamentos || [];
  state.lastTipoOrdem = record.lastTipoOrdem || '';
  state.visitedRetorno = record.visitedRetorno || false;
  state.iniciais = record.iniciais || {};

  renderIniciais();
  DOM.tipoOrdem = document.getElementById('tipo-ordem');
  if (record.tipoOrdem && DOM.tipoOrdem) {
    DOM.tipoOrdem.value = record.tipoOrdem;
  }
  if (record.iniciais) {
    iniciaisFields.forEach(field => {
      const el = document.getElementById(field.nome);
      if (el) el.value = record.iniciais[field.nome] || '';
    });
  }
  if (record.composicao?.complementoCorpo && DOM.complementoCorpo) {
    DOM.complementoCorpo.value = record.composicao.complementoCorpo;
  }

  showSection(record.currentSection || 1, 'next', true);
  closeSidebar();
}
```

---

### Task 7: Create duplicate.js — pre-send check modal

**Files:**

- Create: `scripts/duplicate.js`

- [ ] **Step 1: Write the duplicate check module**

```js
import { DOM } from './dom.js';
import { state } from './state.js';
import { getRecord } from './db.js';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function checkDuplicate() {
  return new Promise(resolve => {
    const uuid = state.currentUUID;
    if (!uuid) {
      resolve(true);
      return;
    }

    getRecord(uuid)
      .then(record => {
        if (!record || record.status !== 'sent') {
          resolve(true);
          return;
        }

        const os = record.iniciais?.os || '\u2014';
        const sentAt = record.sentData?.sentAt
          ? formatDate(record.sentData.sentAt)
          : 'data desconhecida';

        DOM.dupModalTitle.textContent = 'Registro j\u00E1 enviado';
        DOM.dupModalBody.innerHTML = `Este registro (OS #${os}) j\u00E1 foi enviado com sucesso em ${sentAt}. Deseja realizar um novo envio mesmo assim?`;
        DOM.dupModal.classList.remove('hidden');

        DOM.dupModalCancel.onclick = () => {
          DOM.dupModal.classList.add('hidden');
          resolve(false);
        };

        DOM.dupModalConfirm.onclick = () => {
          DOM.dupModal.classList.add('hidden');
          resolve(true);
        };
      })
      .catch(() => {
        resolve(true);
      });
  });
}
```

---

### Task 8: Update index.html — add hamburger, sidebar markup, duplicate modal markup

**Files:**

- Modify: `index.html`

- [ ] **Step 1: Add hamburger button inside the container header**

Replace the header flex row with a hamburger + title group on the left:

Change:

```html
<h1 class="text-2xl text-gray-900 font-bold m-0">Formulário de Envio</h1>
```

To:

```html
<div class="flex items-center gap-2">
  <button class="hamburger" id="hamburger">&#9776;</button>
  <h1 class="text-2xl text-gray-900 font-bold m-0">Formulário de Envio</h1>
</div>
```

- [ ] **Step 2: Add sidebar HTML before the container closing**

Before `</div>` (closing `.container`), add:

```html
<div class="sidebar" id="sidebar">
  <div class="sidebar-inner">
    <div class="sidebar-head">
      <h2 class="sidebar-title">Registros</h2>
      <button class="sidebar-close" id="sidebar-close">&times;</button>
    </div>
    <div class="sidebar-list" id="sidebar-list"></div>
  </div>
</div>
<div class="sidebar-overlay" id="sidebar-overlay"></div>
```

- [ ] **Step 3: Add duplicate modal HTML**

After the existing modal (`#modal-tipo`), add:

```html
<div
  class="modal-overlay fixed inset-0 bg-black/40 z-50 items-center justify-center hidden"
  id="dup-modal"
>
  <div class="modal bg-white rounded-xl p-7 max-w-[420px] w-[90%] shadow-2xl text-center">
    <p class="text-lg font-bold text-gray-900 mb-3" id="dup-modal-title"></p>
    <p class="text-base text-gray-700 mb-6 leading-relaxed" id="dup-modal-body"></p>
    <div class="flex gap-2.5 justify-center">
      <button class="btn btn-secondary" id="dup-modal-cancel">Cancelar</button>
      <button class="btn btn-primary" id="dup-modal-confirm">Reenviar</button>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Update import in app.js reference**

In `index.html`, update the script tag (if needed — the imports are already in the JS modules).

---

### Task 9: Update style.css — sidebar, hamburger, record list, duplicate modal styles

**Files:**

- Modify: `style.css`

- [ ] **Step 1: Add hamburger button style**

```css
.hamburger {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #374151;
  padding: 4px 8px;
  line-height: 1;
  transition: color 0.2s;
}
.hamburger:hover {
  color: #2563eb;
}
```

- [ ] **Step 2: Add sidebar and overlay styles**

```css
.sidebar {
  position: fixed;
  top: 0;
  left: -320px;
  width: 320px;
  height: 100%;
  height: 100dvh;
  background: #fff;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
  z-index: 200;
  transition: left 0.3s ease;
  display: flex;
  flex-direction: column;
}
.sidebar-open .sidebar {
  left: 0;
}
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 199;
  display: none;
}
.sidebar-open .sidebar-overlay {
  display: block;
}
.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.sidebar-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.sidebar-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  line-height: 1;
}
.sidebar-close:hover {
  color: #111827;
}
.sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}
.sidebar-empty {
  text-align: center;
  color: #9ca3af;
  padding: 40px 16px;
  font-size: 0.9375rem;
}
.sidebar-item {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #f9fafb;
}
.sidebar-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.sidebar-item-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}
.sidebar-status {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  flex-shrink: 0;
}
.status-draft {
  background: #f3f4f6;
  color: #6b7280;
}
.status-sent {
  background: #d1fae5;
  color: #065f46;
}
.sidebar-item-meta {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 8px;
}
.sidebar-item-actions {
  display: flex;
  gap: 8px;
}
.sidebar-btn {
  flex: 1;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.sidebar-btn-edit {
  background: #eff6ff;
  color: #2563eb;
}
.sidebar-btn-edit:hover {
  background: #dbeafe;
}
.sidebar-btn-delete {
  background: #fef2f2;
  color: #dc2626;
}
.sidebar-btn-delete:hover {
  background: #fee2e2;
}
```

- [ ] **Step 3: Add container header flexbox (to keep hamburger + h1 in a row)**

Find `.container` and ensure the header area has a flex layout. Modify the `.container` styles:

Replace:

```css
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  padding-bottom: 0;
}
```

With:

```css
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  padding-bottom: 0;
}
.container > .flex:first-child {
  align-items: center;
  gap: 8px;
}
.container > .flex:first-child h1 {
  flex: 1;
}
```

Alternatively, add a simpler rule container for the header row. Since the header uses `flex justify-between items-center`, the hamburger will slot in naturally if we add it before the h1.

---

### Task 10: Update app.js DOM cache and navigation.js — add sidebar DOM references

**Files:**

- Modify: `scripts/dom.js`

- [ ] **Step 1: Add sidebar and duplicate modal DOM references**

```js
DOM.hamburger = document.getElementById('hamburger');
DOM.sidebar = document.getElementById('sidebar');
DOM.sidebarOverlay = document.getElementById('sidebar-overlay');
DOM.sidebarClose = document.getElementById('sidebar-close');
DOM.sidebarList = document.getElementById('sidebar-list');
DOM.dupModal = document.getElementById('dup-modal');
DOM.dupModalTitle = document.getElementById('dup-modal-title');
DOM.dupModalBody = document.getElementById('dup-modal-body');
DOM.dupModalCancel = document.getElementById('dup-modal-cancel');
DOM.dupModalConfirm = document.getElementById('dup-modal-confirm');
```

---

### Task 11: Wire duplicate check into send flow (send.js)

**Files:**

- Modify: `scripts/send.js`

- [ ] **Step 1: Add duplicate check before send logic**

At the start of `sendEmail()`, before `btn.disabled = true`:

```js
import { checkDuplicate } from './duplicate.js';

// ... in sendEmail():
const canProceed = await checkDuplicate();
if (!canProceed) return;
```

(Import at top of file.)

---

### Task 12: Update dom.js cache to include hamburger, sidebar, and duplicate modal IDs

This is covered in Task 10 already (it's the same file edit).

---

### Task 13: Integration review — verify all imports and cross-references

- [ ] **Step 1: Check all cross-module imports are consistent**

Verify:

- `app.js` exports `closeSidebar`, imports `renderSidebar` and `getRecord`
- `sidebar.js` imports `closeSidebar` from `./app.js`, imports db functions from `./db.js`, imports render functions from modules
- `duplicate.js` imports `getRecord` from `./db.js`
- `send.js` imports `checkDuplicate` from `./duplicate.js`, `updateRecordStatus` from `./db.js`
- `state.js` imports `saveDraft` and `getRecord` from `./db.js`
- All imports in `app.js` for DOM references match the IDs in `index.html`
- `reset.js` clears `sessionStorage.currentUUID` and `state.currentUUID`

- [ ] **Step 2: Open index.html in browser and test**

Run: `npx netlify dev`

Test flows:

1. Fresh form: type in a field → check IndexedDB for new record
2. Refresh page → restore prompt should appear
3. Fill form partially → sidebar should show draft with "Rascunho" badge
4. Click Edit on sidebar record → form loads record data
5. Click Delete → confirm → record removed from sidebar
6. Send email → record status changes to "Enviado"
7. Try to send same record again → duplicate modal appears
8. "Limpar tudo" → clears currentUUID, fresh start
