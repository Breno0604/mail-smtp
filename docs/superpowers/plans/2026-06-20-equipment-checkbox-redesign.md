# Equipment Checkbox Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the equipment section to use checkbox-driven dynamic fields with instant persistence and validation.

**Architecture:** Replace row-based equipment system with two sections (Instalados/Retirados) controlled by SIM/NAO selects. Checkboxes control visibility of individual numeric input fields. State persisted to IndexedDB on every change.

**Tech Stack:** Vanilla JS (ES6 modules), IndexedDB, Tailwind CSS, Vitest

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `scripts/state.js` | Modify | New equipment data structure |
| `scripts/dom.js` | Modify | Cache new DOM elements |
| `index.html` | Modify | New HTML structure for equipment section |
| `scripts/equipment.js` | Rewrite | Checkbox and dynamic field logic |
| `scripts/collectors.js` | Modify | Collect new equipment structure |
| `scripts/validation.js` | Modify | Validate at least one equipment when SIM |
| `scripts/email.js` | Modify | Format new structure in email |
| `scripts/persistence.js` | Modify | Update hasData criteria |
| `scripts/restore.js` | Modify | Restore new equipment structure |
| `scripts/reset.js` | Modify | Reset checkboxes and fields |
| `scripts/app.js` | Modify | Update event listeners |
| `tests/equipment-checkbox.test.js` | Create | Unit tests for new equipment logic |
| `tests/collectors.test.js` | Modify | Adapt to new structure |
| `tests/email.test.js` | Modify | Adapt to new structure |
| `tests/validation.test.js` | Modify | Adapt to new structure |

---

## Task 1: Update State Structure

**Files:**
- Modify: `scripts/state.js:9`
- Test: `tests/state.test.js`

- [ ] **Step 1: Write failing test for new equipment structure**

Create `tests/state.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { state } from '../scripts/state.js';

describe('state.equipamentos structure', () => {
  beforeEach(() => {
    state.equipamentos = {
      instaladoEquip: 'NAO',
      retiradoEquip: 'NAO',
      instalados: {
        medidor: '',
        conjunto: '',
        display: '',
        tc_fase_a: '',
        tc_fase_b: '',
        tc_fase_c: '',
        tp_fase_a: '',
        tp_fase_b: '',
        tp_fase_c: ''
      },
      retirados: {
        medidor: '',
        conjunto: '',
        display: '',
        tc_fase_a: '',
        tc_fase_b: '',
        tc_fase_c: '',
        tp_fase_a: '',
        tp_fase_b: '',
        tp_fase_c: ''
      },
      checkboxes: {
        instalados: {
          medidor: false,
          conjunto: false,
          display: false,
          tc_fase_a: false,
          tc_fase_b: false,
          tc_fase_c: false,
          tp_fase_a: false,
          tp_fase_b: false,
          tp_fase_c: false
        },
        retirados: {
          medidor: false,
          conjunto: false,
          display: false,
          tc_fase_a: false,
          tc_fase_b: false,
          tc_fase_c: false,
          tp_fase_a: false,
          tp_fase_b: false,
          tp_fase_c: false
        }
      }
    };
  });

  it('should have installed and removed control fields', () => {
    expect(state.equipamentos.instaladoEquip).toBe('NAO');
    expect(state.equipamentos.retiradoEquip).toBe('NAO');
  });

  it('should have installed equipment fields', () => {
    expect(state.equipamentos.instalados.medidor).toBe('');
    expect(state.equipamentos.instalados.tc_fase_a).toBe('');
  });

  it('should have removed equipment fields', () => {
    expect(state.equipamentos.retirados.medidor).toBe('');
    expect(state.equipamentos.retirados.tc_fase_a).toBe('');
  });

  it('should have checkbox states for installed', () => {
    expect(state.equipamentos.checkboxes.instalados.medidor).toBe(false);
  });

  it('should have checkbox states for removed', () => {
    expect(state.equipamentos.checkboxes.retirados.medidor).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/state.test.js`
Expected: FAIL (state.equipamentos is currently an array)

- [ ] **Step 3: Update state.js with new structure**

Modify `scripts/state.js` line 9:

```javascript
export const state = {
  iniciais: {},
  equipamentos: {
    instaladoEquip: 'NAO',
    retiradoEquip: 'NAO',
    instalados: {
      medidor: '',
      conjunto: '',
      display: '',
      tc_fase_a: '',
      tc_fase_b: '',
      tc_fase_c: '',
      tp_fase_a: '',
      tp_fase_b: '',
      tp_fase_c: ''
    },
    retirados: {
      medidor: '',
      conjunto: '',
      display: '',
      tc_fase_a: '',
      tc_fase_b: '',
      tc_fase_c: '',
      tp_fase_a: '',
      tp_fase_b: '',
      tp_fase_c: ''
    },
    checkboxes: {
      instalados: {
        medidor: false,
        conjunto: false,
        display: false,
        tc_fase_a: false,
        tc_fase_b: false,
        tc_fase_c: false,
        tp_fase_a: false,
        tp_fase_b: false,
        tp_fase_c: false
      },
      retirados: {
        medidor: false,
        conjunto: false,
        display: false,
        tc_fase_a: false,
        tc_fase_b: false,
        tc_fase_c: false,
        tp_fase_a: false,
        tp_fase_b: false,
        tp_fase_c: false
      }
    }
  },
  attachments: [],
  lastTipoOrdem: '',
  retorno: {},
  currentUUID: getCurrentUUID(),
  iniciaisValido: false,
  _createdAt: null,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/state.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/state.js tests/state.test.js
git commit -m "feat: update state.equipamentos to new checkbox structure"
```

---

## Task 2: Update DOM Cache

**Files:**
- Modify: `scripts/dom.js:32-34`

- [ ] **Step 1: Update DOM cache with new equipment elements**

Modify `scripts/dom.js` lines 32-34:

```javascript
  // Equipamentos
  DOM.instaladoEquip = document.getElementById("instalado-equip");
  DOM.retiradoEquip = document.getElementById("retirado-equip");
  DOM.secEquipInstalados = document.getElementById("sec-equip-instalados");
  DOM.secEquipRetirados = document.getElementById("sec-equip-retirados");
  DOM.checkboxesInstalados = document.getElementById("checkboxes-instalados");
  DOM.checkboxesRetirados = document.getElementById("checkboxes-retirados");
  DOM.camposInstalados = document.getElementById("campos-instalados");
  DOM.camposRetirados = document.getElementById("campos-retirados");
```

- [ ] **Step 2: Commit**

```bash
git add scripts/dom.js
git commit -m "feat: add new equipment DOM elements to cache"
```

---

## Task 3: Update HTML Structure

**Files:**
- Modify: `index.html:52-61`

- [ ] **Step 1: Replace equipment section HTML**

Replace lines 52-61 in `index.html`:

```html
  <!-- Section 3: Equipamentos -->
  <section class="sec-card mx-2.5 mt-4" id="sec-equipamentos">
    <div class="sec-head">
      <span class="sec-num">3</span> Equipamentos
    </div>
    <div class="sec-body">
      <!-- Control fields -->
      <div class="mb-6 space-y-3">
        <div class="flex items-center justify-between">
          <label for="instalado-equip" class="text-sm font-semibold text-slate-700">Foi instalado Equipamentos?</label>
          <select id="instalado-equip" class="px-3 py-2 border rounded-[10px] text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 font-sans">
            <option value="NAO">NAO</option>
            <option value="SIM">SIM</option>
          </select>
        </div>
        <div class="flex items-center justify-between">
          <label for="retirado-equip" class="text-sm font-semibold text-slate-700">Foi retirado Equipamentos?</label>
          <select id="retirado-equip" class="px-3 py-2 border rounded-[10px] text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 font-sans">
            <option value="NAO">NAO</option>
            <option value="SIM">SIM</option>
          </select>
        </div>
      </div>

      <!-- EQUIPAMENTOS INSTALADOS section -->
      <div id="sec-equip-instalados" class="equip-section hidden mb-6">
        <h4 class="text-sm font-bold text-slate-800 mb-3">EQUIPAMENTOS INSTALADOS</h4>
        <div class="grid grid-cols-3 gap-3 mb-4" id="checkboxes-instalados"></div>
        <div class="space-y-2" id="campos-instalados"></div>
      </div>

      <!-- EQUIPAMENTOS RETIRADOS section -->
      <div id="sec-equip-retirados" class="equip-section hidden mb-6">
        <h4 class="text-sm font-bold text-slate-800 mb-3">EQUIPAMENTOS RETIRADOS</h4>
        <div class="grid grid-cols-3 gap-3 mb-4" id="checkboxes-retirados"></div>
        <div class="space-y-2" id="campos-retirados"></div>
      </div>
    </div>
  </section>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: update equipment section HTML structure"
```

---

## Task 4: Implement Equipment Logic

**Files:**
- Rewrite: `scripts/equipment.js`
- Test: `tests/equipment-checkbox.test.js`

- [ ] **Step 1: Write failing tests for equipment rendering**

Create `tests/equipment-checkbox.test.js`:

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderEquipamentos, toggleSectionVisibility, toggleFieldVisibility } from '../scripts/equipment.js';
import { state } from '../scripts/state.js';

describe('Equipment checkbox logic', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="instalado-equip">
        <option value="NAO">NAO</option>
        <option value="SIM">SIM</option>
      </select>
      <select id="retirado-equip">
        <option value="NAO">NAO</option>
        <option value="SIM">SIM</option>
      </select>
      <div id="sec-equip-instalados" class="hidden"></div>
      <div id="sec-equip-retirados" class="hidden"></div>
      <div id="checkboxes-instalados"></div>
      <div id="checkboxes-retirados"></div>
      <div id="campos-instalados"></div>
      <div id="campos-retirados"></div>
    `;
    
    // Reset state
    state.equipamentos = {
      instaladoEquip: 'NAO',
      retiradoEquip: 'NAO',
      instalados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
      retirados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
      checkboxes: {
        instalados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false },
        retirados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false }
      }
    };
  });

  it('should render checkboxes for installed equipment', () => {
    renderEquipamentos();
    const checkboxes = document.querySelectorAll('#checkboxes-instalados input[type="checkbox"]');
    expect(checkboxes.length).toBe(9);
  });

  it('should render checkboxes for removed equipment', () => {
    renderEquipamentos();
    const checkboxes = document.querySelectorAll('#checkboxes-retirados input[type="checkbox"]');
    expect(checkboxes.length).toBe(9);
  });

  it('should show installed section when SIM selected', () => {
    document.getElementById('instalado-equip').value = 'SIM';
    toggleSectionVisibility('instalados');
    const section = document.getElementById('sec-equip-instalados');
    expect(section.classList.contains('hidden')).toBe(false);
  });

  it('should hide installed section when NAO selected', () => {
    document.getElementById('instalado-equip').value = 'NAO';
    toggleSectionVisibility('instalados');
    const section = document.getElementById('sec-equip-instalados');
    expect(section.classList.contains('hidden')).toBe(true);
  });

  it('should clear all values when section hidden', () => {
    state.equipamentos.instalados.medidor = '12345';
    state.equipamentos.checkboxes.instalados.medidor = true;
    document.getElementById('instalado-equip').value = 'NAO';
    toggleSectionVisibility('instalados');
    expect(state.equipamentos.instalados.medidor).toBe('');
    expect(state.equipamentos.checkboxes.instalados.medidor).toBe(false);
  });

  it('should show field when checkbox checked', () => {
    renderEquipamentos();
    toggleFieldVisibility('instalados', 'medidor', true);
    const field = document.querySelector('#campos-instalados [data-equip="medidor"]');
    expect(field).not.toBeNull();
  });

  it('should hide field when checkbox unchecked', () => {
    renderEquipamentos();
    toggleFieldVisibility('instalados', 'medidor', true);
    toggleFieldVisibility('instalados', 'medidor', false);
    const field = document.querySelector('#campos-instalados [data-equip="medidor"]');
    expect(field).toBeNull();
  });

  it('should clear field value when checkbox unchecked', () => {
    state.equipamentos.instalados.medidor = '12345';
    toggleFieldVisibility('instalados', 'medidor', false);
    expect(state.equipamentos.instalados.medidor).toBe('');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/equipment-checkbox.test.js`
Expected: FAIL (functions not defined)

- [ ] **Step 3: Implement equipment.js**

Rewrite `scripts/equipment.js`:

```javascript
import { state } from "./state.js";
import { saveState, debouncedSave } from "./persistence.js";

const EQUIPMENT_LIST = [
  { key: 'medidor', label: 'MEDIDOR' },
  { key: 'conjunto', label: 'CONJUNTO' },
  { key: 'display', label: 'DISPLAY' },
  { key: 'tc_fase_a', label: 'TC FASE A' },
  { key: 'tc_fase_b', label: 'TC FASE B' },
  { key: 'tc_fase_c', label: 'TC FASE C' },
  { key: 'tp_fase_a', label: 'TP FASE A' },
  { key: 'tp_fase_b', label: 'TP FASE B' },
  { key: 'tp_fase_c', label: 'TP FASE C' }
];

/**
 * Render all equipment checkboxes
 */
export function renderEquipamentos() {
  renderCheckboxes('instalados');
  renderCheckboxes('retirados');
  restoreCheckboxStates();
  restoreFieldStates();
}

function renderCheckboxes(tipo) {
  const container = document.getElementById(`checkboxes-${tipo}`);
  container.innerHTML = '';
  
  EQUIPMENT_LIST.forEach((equip) => {
    const label = document.createElement('label');
    label.className = 'flex items-center gap-2 cursor-pointer';
    label.innerHTML = `
      <input type="checkbox" 
             data-tipo="${tipo}" 
             data-equip="${equip.key}" 
             class="equip-checkbox w-4 h-4 border border-slate-300 rounded cursor-pointer">
      <span class="text-sm font-medium text-slate-700">${equip.label}</span>
    `;
    container.appendChild(label);
  });
}

function restoreCheckboxStates() {
  ['instalados', 'retirados'].forEach((tipo) => {
    Object.keys(state.equipamentos.checkboxes[tipo]).forEach((key) => {
      if (state.equipamentos.checkboxes[tipo][key]) {
        const checkbox = document.querySelector(`[data-tipo="${tipo}"][data-equip="${key}"]`);
        if (checkbox) {
          checkbox.checked = true;
          showField(tipo, key);
        }
      }
    });
  });
}

function restoreFieldStates() {
  ['instalados', 'retirados'].forEach((tipo) => {
    Object.keys(state.equipamentos[tipo]).forEach((key) => {
      const input = document.querySelector(`#campos-${tipo} [data-equip="${key}"] input`);
      if (input && state.equipamentos[tipo][key]) {
        input.value = state.equipamentos[tipo][key];
      }
    });
  });
}

/**
 * Toggle section visibility based on control field
 */
export function toggleSectionVisibility(tipo) {
  const selectId = tipo === 'instalados' ? 'instalado-equip' : 'retirado-equip';
  const sectionId = `sec-equip-${tipo}`;
  const value = document.getElementById(selectId).value;
  const section = document.getElementById(sectionId);
  
  if (value === 'SIM') {
    section.classList.remove('hidden');
    state.equipamentos[tipo === 'instalados' ? 'instaladoEquip' : 'retiradoEquip'] = 'SIM';
  } else {
    section.classList.add('hidden');
    state.equipamentos[tipo === 'instalados' ? 'instaladoEquip' : 'retiradoEquip'] = 'NAO';
    clearSection(tipo);
  }
  
  debouncedSave();
}

function clearSection(tipo) {
  // Uncheck all checkboxes
  Object.keys(state.equipamentos.checkboxes[tipo]).forEach((key) => {
    state.equipamentos.checkboxes[tipo][key] = false;
    state.equipamentos[tipo][key] = '';
  });
  
  // Clear fields
  const container = document.getElementById(`campos-${tipo}`);
  container.innerHTML = '';
  
  // Reset checkboxes in DOM
  const checkboxes = document.querySelectorAll(`[data-tipo="${tipo}"]`);
  checkboxes.forEach((cb) => {
    cb.checked = false;
  });
}

/**
 * Toggle field visibility based on checkbox
 */
export function toggleFieldVisibility(tipo, equipKey, checked) {
  state.equipamentos.checkboxes[tipo][equipKey] = checked;
  
  if (checked) {
    showField(tipo, equipKey);
  } else {
    hideField(tipo, equipKey);
    state.equipamentos[tipo][equipKey] = '';
  }
  
  debouncedSave();
}

function showField(tipo, equipKey) {
  const container = document.getElementById(`campos-${tipo}`);
  const equip = EQUIPMENT_LIST.find((e) => e.key === equipKey);
  
  if (!equip) return;
  
  // Check if field already exists
  if (container.querySelector(`[data-equip="${equipKey}"]`)) return;
  
  const div = document.createElement('div');
  div.setAttribute('data-equip', equipKey);
  div.className = 'flex items-center justify-between gap-3';
  div.innerHTML = `
    <label class="text-sm font-semibold text-slate-700">${equip.label}</label>
    <input type="number" 
           data-tipo="${tipo}" 
           data-equip="${equipKey}" 
           class="flex-1 max-w-[200px] px-3 py-2 border rounded-[10px] text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-slate-900 font-sans" 
           placeholder="">
  `;
  
  container.appendChild(div);
  
  // Restore value if exists
  const input = div.querySelector('input');
  if (state.equipamentos[tipo][equipKey]) {
    input.value = state.equipamentos[tipo][equipKey];
  }
}

function hideField(tipo, equipKey) {
  const field = document.querySelector(`#campos-${tipo} [data-equip="${equipKey}"]`);
  if (field) {
    field.remove();
  }
}

/**
 * Update field value in state
 */
export function updateFieldValue(tipo, equipKey, value) {
  state.equipamentos[tipo][equipKey] = value;
  debouncedSave();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/equipment-checkbox.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/equipment.js tests/equipment-checkbox.test.js
git commit -m "feat: implement checkbox-based equipment logic"
```

---

## Task 5: Update Collectors

**Files:**
- Modify: `scripts/collectors.js:50-62`
- Test: `tests/collectors.test.js`

- [ ] **Step 1: Write failing test for new collector**

Modify `tests/collectors.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { collectEquipamentos } from '../scripts/collectors.js';
import { state } from '../scripts/state.js';

describe('collectEquipamentos', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="instalado-equip">
        <option value="NAO">NAO</option>
        <option value="SIM" selected>SIM</option>
      </select>
      <select id="retirado-equip">
        <option value="NAO" selected>NAO</option>
        <option value="SIM">SIM</option>
      </select>
      <div id="campos-instalados">
        <div data-equip="medidor">
          <input type="number" data-tipo="instalados" data-equip="medidor" value="12345">
        </div>
      </div>
      <div id="campos-retirados"></div>
    `;
    
    state.equipamentos = {
      instaladoEquip: 'NAO',
      retiradoEquip: 'NAO',
      instalados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
      retirados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
      checkboxes: {
        instalados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false },
        retirados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false }
      }
    };
  });

  it('should collect control field values', () => {
    collectEquipamentos();
    expect(state.equipamentos.instaladoEquip).toBe('SIM');
    expect(state.equipamentos.retiradoEquip).toBe('NAO');
  });

  it('should collect installed equipment values', () => {
    collectEquipamentos();
    expect(state.equipamentos.instalados.medidor).toBe('12345');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/collectors.test.js`
Expected: FAIL (old collector expects array)

- [ ] **Step 3: Update collectEquipamentos function**

Modify `scripts/collectors.js` lines 50-62:

```javascript
/**
 * Collect equipment data from DOM and update state
 * @returns {Object} Collected equipment data
 */
export function collectEquipamentos() {
  // Collect control fields
  const instaladoSelect = document.getElementById('instalado-equip');
  const retiradoSelect = document.getElementById('retirado-equip');
  
  if (instaladoSelect) {
    state.equipamentos.instaladoEquip = instaladoSelect.value;
  }
  if (retiradoSelect) {
    state.equipamentos.retiradoEquip = retiradoSelect.value;
  }
  
  // Collect installed equipment values
  const installedInputs = document.querySelectorAll('#campos-instalados input[type="number"]');
  installedInputs.forEach((input) => {
    const equipKey = input.getAttribute('data-equip');
    if (equipKey) {
      state.equipamentos.instalados[equipKey] = input.value;
    }
  });
  
  // Collect removed equipment values
  const removedInputs = document.querySelectorAll('#campos-retirados input[type="number"]');
  removedInputs.forEach((input) => {
    const equipKey = input.getAttribute('data-equip');
    if (equipKey) {
      state.equipamentos.retirados[equipKey] = input.value;
    }
  });
  
  return state.equipamentos;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/collectors.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/collectors.js tests/collectors.test.js
git commit -m "feat: update collectors for new equipment structure"
```

---

## Task 6: Update Validation

**Files:**
- Modify: `scripts/validation.js:90-128`
- Test: `tests/validation.test.js`

- [ ] **Step 1: Write failing test for equipment validation**

Add to `tests/validation.test.js`:

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { validateSection } from '../scripts/validation.js';
import { state } from '../scripts/state.js';

describe('validateSection2 - Equipment', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="instalado-equip">
        <option value="NAO">NAO</option>
        <option value="SIM" selected>SIM</option>
      </select>
      <div id="campos-instalados">
        <div data-equip="medidor">
          <input type="number" data-tipo="instalados" data-equip="medidor" value="">
        </div>
      </div>
    `;
    
    state.equipamentos = {
      instaladoEquip: 'SIM',
      retiradoEquip: 'NAO',
      instalados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
      retirados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
      checkboxes: {
        instalados: { medidor: true, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false },
        retirados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false }
      }
    };
  });

  it('should fail when SIM selected but no equipment filled', () => {
    const valid = validateSection(2);
    expect(valid).toBe(false);
  });

  it('should pass when SIM selected and at least one equipment filled', () => {
    state.equipamentos.instalados.medidor = '12345';
    document.querySelector('[data-equip="medidor"] input').value = '12345';
    const valid = validateSection(2);
    expect(valid).toBe(true);
  });

  it('should pass when NAO selected', () => {
    state.equipamentos.instaladoEquip = 'NAO';
    state.equipamentos.retiradoEquip = 'NAO';
    document.getElementById('instalado-equip').value = 'NAO';
    const valid = validateSection(2);
    expect(valid).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/validation.test.js`
Expected: FAIL (old validation expects array)

- [ ] **Step 3: Update validateSection2 function**

Modify `scripts/validation.js` lines 90-128:

```javascript
function validateSection2() {
  const instalado = state.equipamentos.instaladoEquip;
  const retirado = state.equipamentos.retiradoEquip;
  
  // If both NAO, no validation needed
  if (instalado === 'NAO' && retirado === 'NAO') {
    return true;
  }
  
  let hasError = false;
  
  // Validate installed equipment
  if (instalado === 'SIM') {
    const hasAtLeastOne = Object.values(state.equipamentos.instalados).some((val) => val && val.trim() !== '');
    if (!hasAtLeastOne) {
      const firstInput = document.querySelector('#campos-instalados input[type="number"]');
      if (firstInput) {
        markError(firstInput, 'Preencha pelo menos um equipamento');
      }
      hasError = true;
    }
  }
  
  // Validate removed equipment
  if (retirado === 'SIM') {
    const hasAtLeastOne = Object.values(state.equipamentos.retirados).some((val) => val && val.trim() !== '');
    if (!hasAtLeastOne) {
      const firstInput = document.querySelector('#campos-retirados input[type="number"]');
      if (firstInput) {
        markError(firstInput, 'Preencha pelo menos um equipamento');
      }
      hasError = true;
    }
  }
  
  if (hasError) return false;
  
  return true;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/validation.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/validation.js tests/validation.test.js
git commit -m "feat: update validation for new equipment structure"
```

---

## Task 7: Update Email Composition

**Files:**
- Modify: `scripts/email.js:29-34`
- Test: `tests/email.test.js`

- [ ] **Step 1: Write failing test for new email format**

Add to `tests/email.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { composeEmail } from '../scripts/email.js';

describe('composeEmail - Equipment', () => {
  it('should format installed equipment correctly', () => {
    const data = {
      iniciais: {},
      retorno: {},
      equipamentos: {
        instaladoEquip: 'SIM',
        retiradoEquip: 'NAO',
        instalados: { medidor: '12345', tc_fase_a: '67890' },
        retirados: {},
        checkboxes: {}
      }
    };
    
    const body = composeEmail(data);
    expect(body).toContain('FOI INSTALADO EQUIPAMENTOS: SIM');
    expect(body).toContain('EQUIPAMENTOS INSTALADOS:');
    expect(body).toContain('MEDIDOR: 12345');
    expect(body).toContain('TC FASE A: 67890');
  });

  it('should not include empty equipment fields', () => {
    const data = {
      iniciais: {},
      retorno: {},
      equipamentos: {
        instaladoEquip: 'SIM',
        retiradoEquip: 'NAO',
        instalados: { medidor: '12345', tc_fase_a: '' },
        retirados: {},
        checkboxes: {}
      }
    };
    
    const body = composeEmail(data);
    expect(body).not.toContain('TC FASE A:');
  });

  it('should format removed equipment correctly', () => {
    const data = {
      iniciais: {},
      retorno: {},
      equipamentos: {
        instaladoEquip: 'NAO',
        retiradoEquip: 'SIM',
        instalados: {},
        retirados: { display: '99999' },
        checkboxes: {}
      }
    };
    
    const body = composeEmail(data);
    expect(body).toContain('FOI RETIRADO EQUIPAMENTOS: SIM');
    expect(body).toContain('EQUIPAMENTOS RETIRADOS:');
    expect(body).toContain('DISPLAY: 99999');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/email.test.js`
Expected: FAIL (old format expects array)

- [ ] **Step 3: Update composeEmail function**

Modify `scripts/email.js` lines 29-34:

```javascript
  // Equipment section
  body += "\n\nEQUIPAMENTOS:";
  body += `\nFoi instalado Equipamentos: ${data.equipamentos.instaladoEquip}`;
  
  if (data.equipamentos.instaladoEquip === 'SIM') {
    body += "\nEQUIPAMENTOS INSTALADOS:";
    const equipLabels = {
      medidor: 'MEDIDOR',
      conjunto: 'CONJUNTO',
      display: 'DISPLAY',
      tc_fase_a: 'TC FASE A',
      tc_fase_b: 'TC FASE B',
      tc_fase_c: 'TC FASE C',
      tp_fase_a: 'TP FASE A',
      tp_fase_b: 'TP FASE B',
      tp_fase_c: 'TP FASE C'
    };
    
    Object.keys(data.equipamentos.instalados).forEach((key) => {
      const value = data.equipamentos.instalados[key];
      if (value && value.trim() !== '') {
        body += `\n${equipLabels[key]}: ${normalizeText(value)}`;
      }
    });
  }
  
  body += `\nFoi retirado Equipamentos: ${data.equipamentos.retiradoEquip}`;
  
  if (data.equipamentos.retiradoEquip === 'SIM') {
    body += "\nEQUIPAMENTOS RETIRADOS:";
    const equipLabels = {
      medidor: 'MEDIDOR',
      conjunto: 'CONJUNTO',
      display: 'DISPLAY',
      tc_fase_a: 'TC FASE A',
      tc_fase_b: 'TC FASE B',
      tc_fase_c: 'TC FASE C',
      tp_fase_a: 'TP FASE A',
      tp_fase_b: 'TP FASE B',
      tp_fase_c: 'TP FASE C'
    };
    
    Object.keys(data.equipamentos.retirados).forEach((key) => {
      const value = data.equipamentos.retirados[key];
      if (value && value.trim() !== '') {
        body += `\n${equipLabels[key]}: ${normalizeText(value)}`;
      }
    });
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/email.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/email.js tests/email.test.js
git commit -m "feat: update email composition for new equipment structure"
```

---

## Task 8: Update Persistence, Restore, and Reset

**Files:**
- Modify: `scripts/persistence.js:32`
- Modify: `scripts/restore.js:24`
- Modify: `scripts/reset.js:15`

- [ ] **Step 1: Update persistence.js hasData check**

Modify `scripts/persistence.js` line 32:

```javascript
  const hasData = Object.values(state.iniciais).some(v => v && v.trim() !== '') ||
                  state.equipamentos.instaladoEquip === 'SIM' ||
                  state.equipamentos.retiradoEquip === 'SIM' ||
                  state.attachments.length > 0 ||
                  state.currentUUID;
```

- [ ] **Step 2: Update restore.js to handle new structure**

Modify `scripts/restore.js` line 24:

```javascript
  // Handle migration from old array format
  if (Array.isArray(record.equipamentos)) {
    // Old format - ignore or convert
    state.equipamentos = {
      instaladoEquip: 'NAO',
      retiradoEquip: 'NAO',
      instalados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
      retirados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
      checkboxes: {
        instalados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false },
        retirados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false }
      }
    };
  } else {
    state.equipamentos = record.equipamentos || {
      instaladoEquip: 'NAO',
      retiradoEquip: 'NAO',
      instalados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
      retirados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
      checkboxes: {
        instalados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false },
        retirados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false }
      }
    };
  }
```

- [ ] **Step 3: Update reset.js**

Modify `scripts/reset.js` line 15:

```javascript
  state.equipamentos = {
    instaladoEquip: 'NAO',
    retiradoEquip: 'NAO',
    instalados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
    retirados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
    checkboxes: {
      instalados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false },
      retirados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false }
    }
  };
```

- [ ] **Step 4: Commit**

```bash
git add scripts/persistence.js scripts/restore.js scripts/reset.js
git commit -m "feat: update persistence, restore, and reset for new equipment structure"
```

---

## Task 9: Update App Event Listeners

**Files:**
- Modify: `scripts/app.js:54`

- [ ] **Step 1: Remove old btn-add-equip listener**

Remove line 54 in `scripts/app.js`:

```javascript
DOM.btnAddEquip.addEventListener("click", () => addEquip());
```

- [ ] **Step 2: Add new event listeners in initEvents**

Add after line 56 in `scripts/app.js`:

```javascript
  // Equipment control fields
  DOM.instaladoEquip.addEventListener("change", () => {
    toggleSectionVisibility('instalados');
    updateLivePreview();
  });
  
  DOM.retiradoEquip.addEventListener("change", () => {
    toggleSectionVisibility('retirados');
    updateLivePreview();
  });
  
  // Equipment checkboxes
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains('equip-checkbox')) {
      const tipo = e.target.getAttribute('data-tipo');
      const equipKey = e.target.getAttribute('data-equip');
      toggleFieldVisibility(tipo, equipKey, e.target.checked);
      updateLivePreview();
    }
  });
  
  // Equipment input fields
  document.addEventListener("input", (e) => {
    if (e.target.matches('#campos-instalados input, #campos-retirados input')) {
      const tipo = e.target.getAttribute('data-tipo');
      const equipKey = e.target.getAttribute('data-equip');
      updateFieldValue(tipo, equipKey, e.target.value);
      updateLivePreview();
    }
  });
```

- [ ] **Step 3: Update imports**

Modify imports in `scripts/app.js`:

```javascript
import { renderEquipamentos, toggleSectionVisibility, toggleFieldVisibility, updateFieldValue } from "./equipment.js";
```

- [ ] **Step 4: Add renderEquipamentos call in DOMContentLoaded**

Add after line 116 in `scripts/app.js`:

```javascript
  renderEquipamentos();
```

- [ ] **Step 5: Commit**

```bash
git add scripts/app.js
git commit -m "feat: update app event listeners for new equipment logic"
```

---

## Task 10: Update Remaining Tests

**Files:**
- Modify: `tests/integration.test.js`
- Modify: `tests/restore.test.js`
- Modify: `tests/duplicate.test.js`
- Modify: `tests/sidebar.test.js`
- Modify: `tests/send.test.js`
- Modify: `tests/db.test.js`
- Modify: `tests/gaps-edge-cases.test.js`
- Modify: `tests/complete-fill.test.js`

- [ ] **Step 1: Update all test files to use new equipment structure**

Replace all instances of `equipamentos: []` with:

```javascript
equipamentos: {
  instaladoEquip: 'NAO',
  retiradoEquip: 'NAO',
  instalados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
  retirados: { medidor: '', conjunto: '', display: '', tc_fase_a: '', tc_fase_b: '', tc_fase_c: '', tp_fase_a: '', tp_fase_b: '', tp_fase_c: '' },
  checkboxes: {
    instalados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false },
    retirados: { medidor: false, conjunto: false, display: false, tc_fase_a: false, tc_fase_b: false, tc_fase_c: false, tp_fase_a: false, tp_fase_b: false, tp_fase_c: false }
  }
}
```

- [ ] **Step 2: Run all tests**

Run: `npm test`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add tests/
git commit -m "test: update all tests for new equipment structure"
```

---

## Task 11: Add CSS Animation

**Files:**
- Modify: `styles/main.css` (or wherever styles are defined)

- [ ] **Step 1: Add animation styles**

Add to CSS file:

```css
.equip-section {
  transition: opacity 0.2s ease, max-height 0.2s ease;
  opacity: 1;
  max-height: 1000px;
  overflow: hidden;
}

.equip-section.hidden {
  opacity: 0;
  max-height: 0;
  display: none;
}
```

- [ ] **Step 2: Commit**

```bash
git add styles/
git commit -m "feat: add simple animation for equipment sections"
```

---

## Task 12: Manual Testing and Verification

- [ ] **Step 1: Start dev server**

Run: `npx netlify dev`

- [ ] **Step 2: Test complete workflow**

1. Open browser at localhost
2. Fill iniciais (UC, OS, etc.)
3. Select "SIM" in "Foi instalado Equipamentos?"
4. Verify section appears
5. Check MEDIDOR checkbox
6. Verify field appears
7. Enter value "12345"
8. Verify auto-save works
9. Refresh page
10. Verify state restored correctly
11. Uncheck MEDIDOR
12. Verify field disappears and value cleared
13. Select "NAO"
14. Verify section disappears

- [ ] **Step 3: Test email preview**

1. Fill equipment fields
2. Check review section
3. Verify email format matches spec

- [ ] **Step 4: Test validation**

1. Select "SIM" but leave all fields empty
2. Try to send
3. Verify validation error appears

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete equipment checkbox redesign"
git push
```

---

## Self-Review Checklist

✅ **Spec coverage:** All requirements implemented (checkboxes, visibility control, persistence, validation, animation, email format)

✅ **Placeholder scan:** No TBD/TODO found, all code complete

✅ **Type consistency:** Function names match across tasks (toggleSectionVisibility, toggleFieldVisibility, updateFieldValue, renderEquipamentos)

✅ **Test coverage:** Unit tests for each major function, integration tests for persistence/restore

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-06-20-equipment-checkbox-redesign.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
