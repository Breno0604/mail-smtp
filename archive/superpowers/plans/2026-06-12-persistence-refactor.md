# Persistence System Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar o sistema de persistência para ter state como fonte única de verdade, remover caches/hacks e melhorar a organização dos módulos.

**Architecture:**

- State será a única fonte de verdade (saveState lê apenas do state)
- Criar módulo `uuid.js` para gerenciar UUIDs (separar responsabilidade)
- Criar módulo `collectors.js` para unificar coleta de dados
- Remover cache `_validatedData` do validation.js
- Remover parâmetro `silent` de `addEquip()` criando `renderEquipRow()` separada
- Remover campo redundante `lastTipoOrdem` do record salvo

**Tech Stack:** Vanilla JS (ES6 modules), IndexedDB, localStorage, Vitest

---

## File Structure

### New Files

- `scripts/uuid.js` — Gerenciamento de UUID (generate, get, set, clear)
- `scripts/collectors.js` — Coleta unificada de dados do formulário
- `tests/uuid.test.js` — Testes para uuid.js
- `tests/collectors.test.js` — Testes para collectors.js

### Modified Files

- `scripts/state.js` — Remover re-exports, adicionar setters para todos os campos
- `scripts/persistence.js` — Ler apenas do state, usar uuid.js
- `scripts/restore.js` — Usar setters do state, remover sync DOM→state
- `scripts/reset.js` — Usar setters do state, chamar updateLivePreview()
- `scripts/equipment.js` — Separar renderEquipRow() de addEquip()
- `scripts/validation.js` — Remover cache \_validatedData
- `scripts/iniciais.js` — Adicionar collectIniciais() que atualiza state
- `scripts/retornos.js` — Adicionar collectRetorno() que atualiza state
- `scripts/app.js` — Usar collectors.js
- `scripts/email.js` — Usar collectors.js
- `scripts/sidebar.js` — Usar uuid.js se necessário

---

## Task 1: Create uuid.js Module

**Files:**

- Create: `scripts/uuid.js`
- Create: `tests/uuid.test.js`

- [ ] **Step 1: Write failing tests for uuid.js**

```javascript
// tests/uuid.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { generateUUID, getCurrentUUID, setCurrentUUID, clearCurrentUUID } from '../scripts/uuid.js';

describe('uuid', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('generateUUID', () => {
    it('should generate a valid UUID v4', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('getCurrentUUID', () => {
    it('should return empty string when no UUID is set', () => {
      expect(getCurrentUUID()).toBe('');
    });

    it('should return UUID from localStorage', () => {
      localStorage.setItem('currentUUID', 'test-uuid-123');
      expect(getCurrentUUID()).toBe('test-uuid-123');
    });
  });

  describe('setCurrentUUID', () => {
    it('should store UUID in localStorage', () => {
      setCurrentUUID('test-uuid-456');
      expect(localStorage.getItem('currentUUID')).toBe('test-uuid-456');
    });

    it('should return the UUID that was set', () => {
      const result = setCurrentUUID('test-uuid-789');
      expect(result).toBe('test-uuid-789');
    });
  });

  describe('clearCurrentUUID', () => {
    it('should remove UUID from localStorage', () => {
      localStorage.setItem('currentUUID', 'test-uuid');
      clearCurrentUUID();
      expect(localStorage.getItem('currentUUID')).toBeNull();
    });

    it('should not throw if no UUID is set', () => {
      expect(() => clearCurrentUUID()).not.toThrow();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/uuid.test.js`
Expected: FAIL with "Cannot find module '../scripts/uuid.js'"

- [ ] **Step 3: Implement uuid.js**

```javascript
// scripts/uuid.js
const UUID_KEY = 'currentUUID';

/**
 * Generate a new UUID v4
 * @returns {string} UUID v4
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get current UUID from localStorage
 * @returns {string} Current UUID or empty string
 */
export function getCurrentUUID() {
  return localStorage.getItem(UUID_KEY) || '';
}

/**
 * Set current UUID in localStorage
 * @param {string} uuid - UUID to set
 * @returns {string} The UUID that was set
 */
export function setCurrentUUID(uuid) {
  localStorage.setItem(UUID_KEY, uuid);
  return uuid;
}

/**
 * Clear current UUID from localStorage
 */
export function clearCurrentUUID() {
  localStorage.removeItem(UUID_KEY);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/uuid.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add scripts/uuid.js tests/uuid.test.js
git commit -m "feat: add uuid.js module for UUID management"
```

---

## Task 2: Create collectors.js Module

**Files:**

- Create: `scripts/collectors.js`
- Create: `tests/collectors.test.js`

- [ ] **Step 1: Write failing tests for collectors.js**

```javascript
// tests/collectors.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import {
  collectAllData,
  collectIniciais,
  collectRetorno,
  collectEquipamentos,
} from '../scripts/collectors.js';
import { cacheDOM } from '../scripts/dom.js';
import { state } from '../scripts/state.js';

describe('collectors', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="iniciais-campos"></div>
      <div id="equipamentos-list"></div>
      <div id="retorno-campos"></div>
      <select id="tipo-ordem">
        <option value="">Selecione</option>
        <option value="CORTE POR FALTA DE PAGAMENTO">CORTE POR FALTA DE PAGAMENTO</option>
      </select>
      <textarea id="complemento-corpo"></textarea>
    `;
    cacheDOM();

    // Reset state
    state.iniciais = {};
    state.retorno = {};
    state.equipamentos = [];
    state.attachments = [];
  });

  describe('collectIniciais', () => {
    it('should collect initial fields from DOM and update state', () => {
      // Setup DOM with fields
      const container = document.getElementById('iniciais-campos');
      container.innerHTML = `
        <input id="uc" value="12345">
        <input id="os" value="67890">
        <input id="lider" value="ANDRE DE SOUSA CARVALHO">
      `;

      const result = collectIniciais();

      expect(result.uc).toBe('12345');
      expect(result.os).toBe('67890');
      expect(result.lider).toBe('ANDRE DE SOUSA CARVALHO');
      expect(state.iniciais.uc).toBe('12345');
    });
  });

  describe('collectRetorno', () => {
    it('should collect retorno fields from DOM and update state', () => {
      document.getElementById('tipo-ordem').value = 'CORTE POR FALTA DE PAGAMENTO';

      const container = document.getElementById('retorno-campos');
      container.innerHTML = `
        <div data-field-nome="situacao_corte" style="display: block;">
          <select id="situacao_corte">
            <option value="CLIENTE CORTADO">CLIENTE CORTADO</option>
          </select>
        </div>
      `;
      document.getElementById('situacao_corte').value = 'CLIENTE CORTADO';

      const result = collectRetorno();

      expect(result.situacao_corte).toBe('CLIENTE CORTADO');
      expect(state.retorno.situacao_corte).toBe('CLIENTE CORTADO');
    });

    it('should return empty object when no tipo-ordem is selected', () => {
      document.getElementById('tipo-ordem').value = '';

      const result = collectRetorno();

      expect(result).toEqual({});
    });
  });

  describe('collectEquipamentos', () => {
    it('should collect equipment rows from DOM and update state', () => {
      const container = document.getElementById('equipamentos-list');
      container.innerHTML = `
        <div class="equip-row">
          <select class="equip-tipo"><option value="Instalado" selected>Instalado</option></select>
          <select class="equip-categoria"><option value="Medidor" selected>Medidor</option></select>
          <input class="equip-numero" value="12345">
        </div>
      `;

      const result = collectEquipamentos();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Instalado');
      expect(result[0].categoria).toBe('Medidor');
      expect(result[0].numero).toBe('12345');
      expect(state.equipamentos).toHaveLength(1);
    });
  });

  describe('collectAllData', () => {
    it('should collect all data and update state', () => {
      // Setup DOM
      const iniciaisContainer = document.getElementById('iniciais-campos');
      iniciaisContainer.innerHTML = `
        <input id="uc" value="12345">
        <input id="os" value="67890">
      `;

      const equipContainer = document.getElementById('equipamentos-list');
      equipContainer.innerHTML = `
        <div class="equip-row">
          <select class="equip-tipo"><option value="Instalado" selected>Instalado</option></select>
          <select class="equip-categoria"><option value="Medidor" selected>Medidor</option></select>
          <input class="equip-numero" value="12345">
        </div>
      `;

      state.attachments = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];

      const result = collectAllData();

      expect(result.iniciais.uc).toBe('12345');
      expect(result.equipamentos).toHaveLength(1);
      expect(result.attachments).toHaveLength(1);
      expect(state.iniciais.uc).toBe('12345');
      expect(state.equipamentos).toHaveLength(1);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/collectors.test.js`
Expected: FAIL with "Cannot find module '../scripts/collectors.js'"

- [ ] **Step 3: Implement collectors.js**

```javascript
// scripts/collectors.js
import { DOM } from './dom.js';
import { state } from './state.js';
import { iniciaisFields, getRetornoFields } from './fields.js';

/**
 * Collect initial fields from DOM and update state
 * @returns {Object} Collected initial data
 */
export function collectIniciais() {
  const data = {};
  iniciaisFields.forEach(field => {
    const el = document.getElementById(field.nome);
    data[field.nome] = el ? el.value : '';
  });
  state.iniciais = data;
  return data;
}

/**
 * Collect retorno fields from DOM and update state
 * @returns {Object} Collected retorno data
 */
export function collectRetorno() {
  const tipo = DOM.tipoOrdem?.value || '';
  if (!tipo) {
    state.retorno = {};
    return {};
  }

  const fields = getRetornoFields(tipo);
  const data = {};

  fields.forEach(field => {
    const group = DOM.retornoCampos.querySelector(`[data-field-nome="${field.nome}"]`);
    if (!group || group.style.display === 'none') return;

    const el = document.getElementById(field.nome);
    if (el) data[field.nome] = el.value;
  });

  state.retorno = data;
  return data;
}

/**
 * Collect equipment rows from DOM and update state
 * @returns {Array} Collected equipment data
 */
export function collectEquipamentos() {
  const rows = DOM.equipList.querySelectorAll('.equip-row');
  const data = [];
  rows.forEach(row => {
    data.push({
      status: row.querySelector('.equip-tipo').value,
      categoria: row.querySelector('.equip-categoria').value,
      numero: row.querySelector('.equip-numero').value,
    });
  });
  state.equipamentos = data;
  return data;
}

/**
 * Collect all form data and update state
 * @returns {Object} Complete record data
 */
export function collectAllData() {
  const iniciais = collectIniciais();
  const retorno = collectRetorno();
  const equipamentos = collectEquipamentos();

  return {
    iniciais,
    retorno,
    equipamentos,
    attachments: state.attachments,
    tipoOrdem: DOM.tipoOrdem?.value || '',
    complementoCorpo: DOM.complementoCorpo?.value || '',
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/collectors.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add scripts/collectors.js tests/collectors.test.js
git commit -m "feat: add collectors.js module for unified data collection"
```

---

## Task 3: Refactor state.js to Remove Re-exports

**Files:**

- Modify: `scripts/state.js`
- Modify: `scripts/persistence.js`
- Modify: `scripts/app.js`
- Modify: `scripts/restore.js`
- Modify: `scripts/reset.js`
- Modify: `tests/state.test.js`

- [ ] **Step 1: Rewrite state.js to remove re-exports**

```javascript
// scripts/state.js
import {
  getCurrentUUID,
  setCurrentUUID as setUUID,
  clearCurrentUUID as clearUUID,
} from './uuid.js';

/**
 * Global application state
 */
export const state = {
  iniciais: {},
  equipamentos: [],
  attachments: [],
  lastTipoOrdem: '',
  retorno: {},
  currentUUID: getCurrentUUID(),
  composicao: { complementoCorpo: '' },
  iniciaisValido: false,
  _createdAt: null,
};

/**
 * Set current UUID in both state and localStorage
 * @param {string} uuid - UUID to set
 */
export function setCurrentUUID(uuid) {
  state.currentUUID = uuid;
  setUUID(uuid);
}

/**
 * Clear current UUID from both state and localStorage
 */
export function clearCurrentUUID() {
  state.currentUUID = '';
  clearUUID();
}
```

- [ ] **Step 2: Rewrite persistence.js to use uuid.js directly and read from state**

```javascript
// scripts/persistence.js
import { state } from './state.js';
import { saveDraft, getRecord, saveAttachments } from './db.js';
import { toBase64 } from './utils.js';
import { generateUUID } from './uuid.js';

let saveTimer = null;
let attachmentsDirty = true;

/**
 * Mark attachments as dirty (need to be re-saved)
 */
export function markAttachmentsDirty() {
  attachmentsDirty = true;
}

/**
 * Save current state to IndexedDB
 */
export async function saveState() {
  if (!state.iniciaisValido) return;

  // Check if there's any data to save
  const hasData =
    Object.values(state.iniciais).some(v => v && v.trim() !== '') ||
    state.equipamentos.length > 0 ||
    state.attachments.length > 0 ||
    state.currentUUID;

  if (!hasData) return;

  // Ensure UUID exists
  if (!state.currentUUID) {
    const uuid = generateUUID();
    const { setCurrentUUID } = await import('./state.js');
    setCurrentUUID(uuid);
  }

  // Resolve createdAt
  const createdAt = await resolveCreatedAt(state.currentUUID);

  // Build record from state (single source of truth)
  const data = {
    uuid: state.currentUUID,
    status: 'draft',
    createdAt,
    updatedAt: new Date().toISOString(),
    iniciais: state.iniciais,
    retorno: state.retorno,
    tipoOrdem: state.iniciais['tipo-ordem'] || '',
    equipamentos: state.equipamentos,
    composicao: { complementoCorpo: state.composicao.complementoCorpo },
    attachmentCount: state.attachments.length,
    sentData: null,
  };

  // Save record
  saveDraft(data).catch(err => {
    console.error('saveDraft error:', err);
    if (err?.name === 'QuotaExceededError' || err?.message?.includes('quota')) {
      import('./ui.js').then(({ showToast }) => {
        showToast('Espaço insuficiente no navegador. Limpe dados antigos.', false);
      });
    }
  });

  // Save attachments if dirty
  if (attachmentsDirty) {
    attachmentsDirty = false;
    serializeAndSaveAttachments(state.currentUUID, state.attachments).catch(err => {
      console.error('saveAttachments error:', err);
      attachmentsDirty = true;
    });
  }
}

/**
 * Debounced save (1 second delay)
 */
export function debouncedSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 1000);
}

/**
 * Resolve createdAt timestamp
 * @param {string} uuid - Record UUID
 * @returns {Promise<string>} ISO timestamp
 */
async function resolveCreatedAt(uuid) {
  if (state._createdAt) return state._createdAt;

  try {
    const existing = await getRecord(uuid);
    if (existing?.createdAt) {
      state._createdAt = existing.createdAt;
      return state._createdAt;
    }
  } catch (err) {
    console.error('getRecord in saveState:', err);
  }

  state._createdAt = new Date().toISOString();
  return state._createdAt;
}

/**
 * Serialize and save attachments to IndexedDB
 * @param {string} uuid - Record UUID
 * @param {Array<File>} files - Attachment files
 */
async function serializeAndSaveAttachments(uuid, files) {
  if (files.length === 0) {
    await saveAttachments(uuid, []);
    return;
  }

  const serialized = await Promise.all(
    files.map(async file => ({
      name: file.name,
      type: file.type,
      data: await toBase64(file),
    }))
  );

  await saveAttachments(uuid, serialized);
}
```

- [ ] **Step 3: Update app.js imports**

```javascript
// scripts/app.js - Update imports at top of file
import { DOM, cacheDOM } from './dom.js';
import { state, debouncedSave, clearCurrentUUID } from './state.js';
import { saveState } from './persistence.js';
import { collectIniciais } from './collectors.js';
import { renderIniciais } from './iniciais.js';
import { addEquip } from './equipment.js';
import { handleTipoChange } from './retornos.js';
import {
  handleUploadClick,
  handleFileChange,
  closeLightbox,
  updateFileCount,
  renderPreviews,
} from './attachments.js';
import { resetForm } from './reset.js';
import { renderSidebar, closeSidebar, initSidebarFilter } from './sidebar.js';
import { captureCoordinates } from './utils.js';
import { sendEmail } from './send.js';
import { updateLivePreview } from './email.js';

// Update checkInitialPersistence to use state directly
function checkInitialPersistence() {
  const ucPreenchido = state.iniciais.uc && state.iniciais.uc.trim() !== '';
  const osPreenchido = state.iniciais.os && state.iniciais.os.trim() !== '';

  if (ucPreenchido && osPreenchido && !state.iniciaisValido) {
    state.iniciaisValido = true;
    saveState();
  }
}

// Rest of app.js remains the same...
```

- [ ] **Step 4: Update restore.js imports and remove DOM sync**

```javascript
// scripts/restore.js - Update imports at top of file
import { DOM } from './dom.js';
import { state, setCurrentUUID, markAttachmentsDirty } from './state.js';
import { renderIniciais, iniciaisFields } from './iniciais.js';
import { renderRetorno, setRetornoData, handleTipoChange } from './retornos.js';
import { renderEquipamentos } from './equipment.js';
import { renderPreviews } from './attachments.js';
import { base64ToBlob } from './utils.js';
import { getAttachmentsByUuid } from './db.js';
import { updateLivePreview } from './email.js';

export async function applyRecord(record) {
  setCurrentUUID(record.uuid);
  state.iniciaisValido = true;
  state._createdAt = record.createdAt;

  // Restore state from record (state becomes source of truth)
  state.iniciais = record.iniciais || {};
  state.retorno = record.retorno || {};
  state.equipamentos = record.equipamentos || [];
  state.lastTipoOrdem = record.tipoOrdem || '';
  state.composicao = record.composicao || { complementoCorpo: '' };

  // Restore attachments with migration (v2 → v3)
  if (record.attachments && Array.isArray(record.attachments) && record.attachments.length > 0) {
    state.attachments = record.attachments.map(att => {
      const blob = base64ToBlob(att.data, att.type);
      return new File([blob], att.name, { type: att.type });
    });
  } else if (record.attachmentCount > 0 || record.attachments === undefined) {
    try {
      const storedAttachments = await getAttachmentsByUuid(record.uuid);
      state.attachments = storedAttachments.map(att => {
        const blob = base64ToBlob(att.data, att.type);
        return new File([blob], att.name, { type: att.type });
      });
    } catch (err) {
      console.error('Erro ao buscar anexos do store:', err);
      state.attachments = [];
    }
  } else {
    state.attachments = [];
  }

  markAttachmentsDirty();

  // Render form
  renderIniciais();

  if (DOM.tipoOrdem) {
    DOM.tipoOrdem.addEventListener('change', handleTipoChange);
  }

  if (record.tipoOrdem && DOM.tipoOrdem) {
    DOM.tipoOrdem.value = record.tipoOrdem;
  }

  if (record.iniciais) {
    iniciaisFields.forEach(field => {
      const el = document.getElementById(field.nome);
      const val = record.iniciais[field.nome];
      if (el && val != null && val !== '') el.value = val;
    });
  }

  if (record.tipoOrdem) {
    renderRetorno();
    setRetornoData(record.retorno);
  }

  renderEquipamentos();
  renderPreviews();

  if (record.composicao?.complementoCorpo && DOM.complementoCorpo) {
    DOM.complementoCorpo.value = record.composicao.complementoCorpo;
  }

  // Update preview
  updateLivePreview();
}
```

- [ ] **Step 5: Update reset.js imports and add updateLivePreview**

```javascript
// scripts/reset.js - Update imports at top of file
import { DOM } from './dom.js';
import { state, clearCurrentUUID, markAttachmentsDirty } from './state.js';
import { renderIniciais } from './iniciais.js';
import { handleTipoChange } from './retornos.js';
import { showEmptyEquip } from './equipment.js';
import { updateFileCount } from './attachments.js';
import { hideError } from './ui.js';
import { captureCoordinates } from './utils.js';
import { updateLivePreview } from './email.js';

export function resetForm() {
  // Reset state
  state.iniciais = {};
  state.retorno = {};
  state.equipamentos = [];
  state.attachments = [];
  state.lastTipoOrdem = '';
  state._createdAt = null;
  state.iniciaisValido = false;
  state.composicao = { complementoCorpo: '' };

  markAttachmentsDirty();

  // Clear DOM
  renderIniciais();
  captureCoordinates();

  if (DOM.tipoOrdem) {
    DOM.tipoOrdem.addEventListener('change', handleTipoChange);
  }

  DOM.retornoCampos.innerHTML = '';
  DOM.retornoPlaceholder.style.display = '';
  DOM.retornoDesc.innerHTML = '—';

  DOM.equipList.innerHTML = '';
  DOM.complementoCorpo.value = '';
  DOM.previewGrid.innerHTML = '';

  showEmptyEquip();
  updateFileCount();
  hideError();
  clearCurrentUUID();

  // Update preview
  updateLivePreview();
}
```

- [ ] **Step 6: Update tests/state.test.js to remove old re-export tests**

```javascript
// tests/state.test.js - Remove tests for re-exports
// Keep tests for state object initialization
// Add tests for setCurrentUUID and clearCurrentUUID

import { describe, it, expect, beforeEach } from 'vitest';
import { state, setCurrentUUID, clearCurrentUUID } from '../scripts/state.js';

describe('state', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset state
    state.iniciais = {};
    state.equipamentos = [];
    state.attachments = [];
    state.lastTipoOrdem = '';
    state.retorno = {};
    state.currentUUID = '';
    state.composicao = { complementoCorpo: '' };
    state.iniciaisValido = false;
    state._createdAt = null;
  });

  describe('state object', () => {
    it('should have correct initial structure', () => {
      expect(state.iniciais).toEqual({});
      expect(state.equipamentos).toEqual([]);
      expect(state.attachments).toEqual([]);
      expect(state.lastTipoOrdem).toBe('');
      expect(state.retorno).toEqual({});
      expect(state.composicao).toEqual({ complementoCorpo: '' });
      expect(state.iniciaisValido).toBe(false);
    });
  });

  describe('setCurrentUUID', () => {
    it('should update state.currentUUID and localStorage', () => {
      setCurrentUUID('test-uuid-123');
      expect(state.currentUUID).toBe('test-uuid-123');
      expect(localStorage.getItem('currentUUID')).toBe('test-uuid-123');
    });
  });

  describe('clearCurrentUUID', () => {
    it('should clear state.currentUUID and localStorage', () => {
      setCurrentUUID('test-uuid-456');
      clearCurrentUUID();
      expect(state.currentUUID).toBe('');
      expect(localStorage.getItem('currentUUID')).toBeNull();
    });
  });
});
```

- [ ] **Step 7: Run all tests to verify nothing broke**

Run: `npm test`
Expected: All tests pass (may need to update some test imports)

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: state.js as single source of truth, remove re-exports"
```

---

## Task 4: Remove validation.js Cache

**Files:**

- Modify: `scripts/validation.js`
- Modify: `tests/validation.test.js`

- [ ] **Step 1: Remove \_validatedData cache from validation.js**

```javascript
// scripts/validation.js
import { DOM } from './dom.js';
import { state } from './state.js';
import { showError, hideError, setFieldError, clearFieldError } from './ui.js';
import { collectIniciais, collectRetorno, collectEquipamentos } from './collectors.js';
import { iniciaisFields as fieldsIniciais } from './fields.js';

// Remove: const _validatedData = {};
// Remove: export function _resetValidationCache() { ... }

// ... keep helper functions (markError, clearError) ...

function validateSection1() {
  const data = {};
  let valid = true;

  fieldsIniciais.forEach(field => {
    const el = document.getElementById(field.nome);
    if (!el) return;
    data[field.nome] = el.value;

    if (!field.obrigatorio) return;
    if (!data[field.nome] || data[field.nome].trim() === '') {
      markError(el, 'Campo obrigatório');
      valid = false;
    } else {
      clearError(el);
    }
  });

  if (!valid) return false;

  // Special validations
  // ... (keep existing special validation logic) ...

  // Update state
  state.iniciais = data;
  return true;
}

function validateSection2() {
  const rows = DOM.equipList.querySelectorAll('.equip-row');
  if (rows.length === 0) return true;

  let hasError = false;
  let hasDuplicate = false;
  const nums = [];

  rows.forEach(row => {
    const tipo = row.querySelector('.equip-tipo');
    const categoria = row.querySelector('.equip-categoria');
    const inp = row.querySelector('.equip-numero');

    [tipo, categoria, inp].forEach(el => clearError(el));

    if (tipo.value === '') {
      markError(tipo, 'Selecione o tipo');
      hasError = true;
    }
    if (categoria.value === '') {
      markError(categoria, 'Selecione a categoria');
      hasError = true;
    }
    if (inp.value === '') {
      markError(inp, 'Informe o número');
      hasError = true;
    } else {
      const normalizedNum = isNaN(Number(inp.value))
        ? inp.value.replace(/^0+/, '')
        : String(Number(inp.value));
      if (nums.includes(normalizedNum)) {
        markError(inp, 'Número duplicado');
        hasError = true;
        hasDuplicate = true;
      } else {
        nums.push(normalizedNum);
      }
    }
  });

  if (hasError) return false;

  // Update state
  collectEquipamentos();
  return true;
}

function validateSection3() {
  const tipo = DOM.tipoOrdem?.value || '';
  if (!tipo) return true;

  const fieldGroups = DOM.retornoCampos.querySelectorAll('[data-field-nome]');
  let valid = true;

  fieldGroups.forEach(group => {
    if (group.style.display === 'none') return;

    const input = group.querySelector('input, select, textarea');
    if (!input) return;

    if (!input.value || input.value.trim() === '') {
      markError(input, 'Campo obrigatório');
      valid = false;
    } else {
      clearError(input);
    }
  });

  if (!valid) return false;

  // Update state
  collectRetorno();
  return true;
}

function validateSection4() {
  if (state.attachments.length > 12) {
    showError('Máximo de 12 anexos permitido.');
    return false;
  }
  const oversized = state.attachments.filter(f => f.size > 8 * 1024 * 1024);
  if (oversized.length > 0) {
    showError('Anexo(s) excedem 8 MB: ' + oversized.map(f => f.name).join(', ') + '.');
    return false;
  }
  return true;
}

const SECTION_VALIDATORS = {
  1: validateSection1,
  2: validateSection2,
  3: validateSection3,
  4: validateSection4,
  5: () => true,
};

export function validateSection(n) {
  hideError();
  const validator = SECTION_VALIDATORS[n];
  if (!validator) return true;
  return validator();
}

export function validateAll() {
  hideError();
  let firstError = null;
  let valid = true;

  const s1Valid = validateSection1();
  if (!s1Valid && !firstError) {
    firstError = document.querySelector('#sec-inicio .error');
  }
  valid = valid && s1Valid;

  const tipo = DOM.tipoOrdem?.value || '';
  if (tipo) {
    const s3Valid = validateSection3();
    if (!s3Valid && !firstError) {
      firstError = document.querySelector('#sec-retorno .error');
    }
    valid = valid && s3Valid;
  }

  const s2Valid = validateSection2();
  if (!s2Valid && !firstError) {
    firstError = document.querySelector('#sec-equipamentos .error');
  }
  valid = valid && s2Valid;

  const s4Valid = validateSection4();
  if (!s4Valid && !firstError) {
    firstError = document.querySelector('#sec-anexos .error');
  }
  valid = valid && s4Valid;

  if (firstError) {
    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return valid;
}

export function addBlurValidation(el) {
  el.addEventListener('blur', () => {
    if (el.hasAttribute('required') || el.hasAttribute('data-required')) {
      const empty = !el.value || el.value.trim() === '';
      if (empty) {
        markError(el, 'Campo obrigatório');
      } else {
        clearError(el);
      }
    }
  });
  el.addEventListener('input', () => clearError(el));
  el.addEventListener('change', () => {
    if (el.value && el.value.trim() !== '') clearError(el);
  });
}

// Remove: export function collectSectionData(n) { ... }
```

- [ ] **Step 2: Update tests to remove \_resetValidationCache usage**

```javascript
// tests/validation.test.js
// Remove all imports of _resetValidationCache
// Remove all calls to _resetValidationCache()
// ... rest of tests remain the same ...
```

- [ ] **Step 3: Run tests to verify**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add scripts/validation.js tests/validation.test.js
git commit -m "refactor: remove _validatedData cache from validation.js"
```

---

## Task 5: Remove `silent` Parameter from addEquip()

**Files:**

- Modify: `scripts/equipment.js`
- Modify: `tests/equipment.test.js`

- [ ] **Step 1: Separate renderEquipRow() from addEquip()**

```javascript
// scripts/equipment.js
import { DOM } from './dom.js';
import { state, saveState, debouncedSave } from './state.js';
import { addBlurValidation } from './validation.js';
import { collectEquipamentos } from './collectors.js';

/**
 * Render a single equipment row (does NOT save)
 * @param {Object} data - Equipment data
 * @returns {HTMLElement} The rendered row element
 */
export function renderEquipRow(data) {
  const div = document.createElement('div');
  div.className =
    'equip-row flex gap-2 items-center mb-4 p-3 bg-slate-50/50 border border-slate-200/50 rounded-[10px]';
  div.innerHTML = `
    <select class="equip-tipo flex-1 min-w-0 px-3 py-3 border rounded-[10px] text-sm outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10 text-slate-900 font-sans">
      <option value="">Selecione...</option>
      <option value="Instalado" ${data?.status === 'Instalado' ? 'selected' : ''}>Instalado</option>
      <option value="Retirado" ${data?.status === 'Retirado' ? 'selected' : ''}>Retirado</option>
    </select>
    <select class="equip-categoria flex-1 min-w-0 px-3 py-3 border rounded-[10px] text-sm outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10 text-slate-900 font-sans">
      <option value="">Selecione...</option>
      <option value="Medidor" ${data?.categoria === 'Medidor' ? 'selected' : ''}>Medidor</option>
      <option value="Display" ${data?.categoria === 'Display' ? 'selected' : ''}>Display</option>
      <option value="Conjunto" ${data?.categoria === 'Conjunto' ? 'selected' : ''}>Conjunto</option>
      <option value="TC" ${data?.categoria === 'TC' ? 'selected' : ''}>TC</option>
      <option value="TP" ${data?.categoria === 'TP' ? 'selected' : ''}>TP</option>
    </select>
    <input type="number" class="equip-numero flex-1 min-w-0 px-3 py-3 border rounded-[10px] text-sm outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10 text-slate-900 font-sans" placeholder="N°" value="${data?.numero || ''}">
    <button class="btn-remove w-9 h-9 border-none rounded-[8px] bg-red-50 text-red-500 text-sm cursor-pointer flex-shrink-0 transition-all duration-200 flex items-center justify-center hover:bg-red-100 active:scale-95" type="button">✕</button>
  `;

  addBlurValidation(div.querySelector('.equip-tipo'));
  addBlurValidation(div.querySelector('.equip-categoria'));
  addBlurValidation(div.querySelector('.equip-numero'));

  // Update state on input/change
  const equipFields = div.querySelectorAll('.equip-tipo, .equip-categoria, .equip-numero');
  equipFields.forEach(field => {
    field.addEventListener('input', () => {
      collectEquipamentos();
      debouncedSave();
    });
    field.addEventListener('change', () => {
      collectEquipamentos();
      debouncedSave();
    });
  });

  div.querySelector('.btn-remove').addEventListener('click', () => {
    div.remove();
    if (DOM.equipList.querySelectorAll('.equip-row').length === 0) showEmptyEquip();
    collectEquipamentos();
    saveState();
  });

  return div;
}

/**
 * Add a new equipment row and save (user action)
 * @param {Object} data - Equipment data
 */
export function addEquip(data) {
  const div = renderEquipRow(data);
  DOM.equipList.appendChild(div);
  hideEmptyEquip();
  collectEquipamentos();
  saveState();
}

export function showEmptyEquip() {
  if (!DOM.equipList.querySelector('.empty-msg')) {
    const msg = document.createElement('div');
    msg.className =
      'empty-msg text-center text-slate-400 text-sm font-medium py-8 bg-slate-50/30 border border-dashed border-slate-200 rounded-[10px] mb-4';
    msg.textContent = 'Nenhum equipamento adicionado.';
    DOM.equipList.appendChild(msg);
  }
}

export function hideEmptyEquip() {
  const msg = DOM.equipList.querySelector('.empty-msg');
  if (msg) msg.remove();
}

/**
 * Render all equipment from state (does NOT save)
 */
export function renderEquipamentos() {
  DOM.equipList.innerHTML = '';
  if (state.equipamentos.length === 0) {
    showEmptyEquip();
  } else {
    state.equipamentos.forEach(eq => {
      const row = renderEquipRow(eq);
      DOM.equipList.appendChild(row);
    });
  }
}
```

- [ ] **Step 2: Update tests**

```javascript
// tests/equipment.test.js
// Update tests to use renderEquipRow() where silent=true was used
// Remove tests for silent parameter
// ... update test code accordingly ...
```

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add scripts/equipment.js tests/equipment.test.js
git commit -m "refactor: separate renderEquipRow() from addEquip(), remove silent parameter"
```

---

## Task 6: Remove Redundant `lastTipoOrdem` from Saved Record

**Files:**

- Modify: `scripts/persistence.js`
- Modify: `scripts/restore.js`
- Modify: `tests/restore.test.js`

- [ ] **Step 1: Remove `lastTipoOrdem` from saveState()**

```javascript
// scripts/persistence.js (in saveState function)
const data = {
  uuid: state.currentUUID,
  status: 'draft',
  createdAt,
  updatedAt: new Date().toISOString(),
  iniciais: state.iniciais,
  retorno: state.retorno,
  tipoOrdem: state.iniciais['tipo-ordem'] || '',
  equipamentos: state.equipamentos,
  // Remove: lastTipoOrdem: state.lastTipoOrdem,
  composicao: { complementoCorpo: state.composicao.complementoCorpo },
  attachmentCount: state.attachments.length,
  sentData: null,
};
```

- [ ] **Step 2: Update restore.js to not use `record.lastTipoOrdem`**

```javascript
// scripts/restore.js (in applyRecord function)
export async function applyRecord(record) {
  setCurrentUUID(record.uuid);
  state.iniciaisValido = true;
  state._createdAt = record.createdAt;

  // Restore state from record
  state.iniciais = record.iniciais || {};
  state.retorno = record.retorno || {};
  state.equipamentos = record.equipamentos || [];
  state.lastTipoOrdem = record.tipoOrdem || ''; // Use tipoOrdem, not lastTipoOrdem
  state.composicao = record.composicao || { complementoCorpo: '' };

  // ... rest of restore logic ...
}
```

- [ ] **Step 3: Update tests**

```javascript
// tests/restore.test.js
// Update tests to not check for record.lastTipoOrdem
// ... update test code accordingly ...
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add scripts/persistence.js scripts/restore.js tests/restore.test.js
git commit -m "refactor: remove redundant lastTipoOrdem from saved record"
```

---

## Task 7: Update email.js to Use collectors.js

**Files:**

- Modify: `scripts/email.js`

- [ ] **Step 1: Update email.js to use state instead of DOM reads**

```javascript
// scripts/email.js
import { DOM } from './dom.js';
import { state } from './state.js';
import { iniciaisFields, getRetornoFields } from './fields.js';
import { collectAllData } from './collectors.js';

function normalizeText(str) {
  if (!str) return str;
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
    .toUpperCase();
}

export function composeEmail(data) {
  let body = '';

  iniciaisFields.forEach(field => {
    const raw = data.iniciais?.[field.nome] || '';
    const val = raw && field.tipo === 'date' ? raw.split('-').reverse().join('-') : raw || '—';
    body += `${normalizeText(field.label)}: ${normalizeText(val)}\n`;
  });

  if (data.equipamentos && data.equipamentos.length > 0) {
    body += '\n\nEQUIPAMENTOS:';
    data.equipamentos.forEach(eq => {
      body += `\n${normalizeText(eq.categoria)} ${normalizeText(eq.status)} Nº ${normalizeText(eq.numero || '—')}`;
    });
  }

  body += '\n\nRETORNO:';
  const tipo = data.iniciais?.['tipo-ordem'] || '';
  const retornoFields = getRetornoFields(tipo);

  retornoFields.forEach(field => {
    if (!data.retorno || !(field.nome in data.retorno)) return;
    const val = data.retorno[field.nome];
    body += `\n${normalizeText(field.label)}: ${normalizeText(val || '(nao preenchido)')}`;
  });

  return body;
}

export function updateLivePreview() {
  // Collect data from DOM and update state
  const data = collectAllData();
  DOM.previewCorpo.textContent = composeEmail(data);
}
```

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add scripts/email.js
git commit -m "refactor: email.js uses collectors.js for data collection"
```

---

## Task 8: Final Integration and Cleanup

**Files:**

- Modify: All remaining files with old imports
- Modify: `sw.js`

- [ ] **Step 1: Update all remaining imports**

Search for and update any remaining imports of:

- `_resetValidationCache` (remove)
- `collectSectionData` (remove)
- `silent` parameter in `addEquip` (remove)

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: All 382+ tests pass

- [ ] **Step 3: Bump cache version**

```javascript
// sw.js
const CACHE_NAME = 'retorno-v64'; // Increment from v63
```

- [ ] **Step 4: Manual testing checklist**

- [ ] Create new record, fill all fields, verify save
- [ ] Close browser, reopen, verify record restored
- [ ] Edit record, verify changes saved
- [ ] Create second record, switch between records
- [ ] Delete record, verify form reset
- [ ] Add/remove equipment, verify persistence
- [ ] Change tipo-ordem, verify retorno fields update
- [ ] Verify email preview updates correctly

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "refactor: complete persistence system refactor

- State as single source of truth
- Removed validation cache
- Separated renderEquipRow() from addEquip()
- Removed redundant lastTipoOrdem
- Created uuid.js and collectors.js modules
- Bump CACHE_NAME v63 -> v64"

git push origin main
```

---

## Summary

This plan refactors the persistence system to:

1. **Unify data source**: State is the single source of truth, saveState() reads only from state
2. **Simplify data flow**: Removed caches and hacks (validation cache, silent parameter)
3. **Improve organization**: Separated concerns into uuid.js and collectors.js

**Expected outcome:**

- Cleaner architecture with clear responsibilities
- Easier to test and maintain
- No more DOM/state synchronization issues
- Same functionality, better code quality

**Risk mitigation:**

- Incremental changes with tests at each step
- Backward compatibility maintained where possible
- Full test suite ensures no regressions
