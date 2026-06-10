# Single Page UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the wizard-based multi-step form into a single-page layout with 5 vertically stacked sections, dynamic Retorno fields based on Tipo de Ordem, and real-time email preview.

**Architecture:** All 5 sections (Início, Retorno, Equipamentos, Anexos, Revisão) render simultaneously on one scrollable page. Navigation via Anterior/Próximo is removed. Validation happens on "Enviar" click, scrolling to first error. Retorno fields render dynamically when Tipo de Ordem is selected, with conditional sub-fields. Email preview updates live on every input.

**Tech Stack:** Vanilla JS (ES6 modules), Tailwind CSS, Vitest + jsdom, IndexedDB, Netlify Functions

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `index.html` | Modify | Remove wizard structure, add single-page sections with new IDs |
| `style.css` | Modify | Remove wizard styles, add section card styles |
| `scripts/dom.js` | Modify | Update cacheDOM for new elements, remove old refs |
| `scripts/state.js` | Modify | Remove `currentSection`, `totalSections`, `animating` |
| `scripts/app.js` | Modify | Rewrite event wiring, remove navigation, add live preview |
| `scripts/validation.js` | Modify | Add `validateAll()`, update `validateSection3` for dynamic fields |
| `scripts/sectionManager.js` | Delete | No longer needed (wizard removed) |
| `scripts/animator.js` | Delete | No longer needed (no animations) |
| `scripts/retornos.js` | Modify | Remove modal, add dynamic field rendering, conditional fields |
| `scripts/fields.js` | Modify | Add `retornoFieldsByTipo` map + `getRetornoFields()` |
| `scripts/iniciais.js` | Modify | Export `INPUT_CREATORS`, add `createTextarea` |
| `scripts/email.js` | Modify | Use dynamic retorno fields, export `updateLivePreview()` |
| `scripts/send.js` | Modify | Use `validateAll()`, scroll to first error |
| `scripts/reset.js` | Modify | Clear all sections at once, reset Retorno placeholder |
| `scripts/restore.js` | Modify | Render all sections, trigger Retorno render if tipo set |
| `scripts/persistence.js` | Modify | Remove `currentSection` from saved data |
| `scripts/sidebar.js` | Modify | Update `loadRecord` to not use `showSection` |
| `tests/navigation.test.js` | Delete | Wizard navigation tests no longer relevant |
| `tests/app-init.test.js` | Modify | Update DOM IDs for new structure |
| `tests/validation.test.js` | Modify | Add tests for `validateAll()`, update section 3 tests |
| `tests/retornos.test.js` | Modify | Remove modal tests, add conditional field tests |
| `tests/restore.test.js` | Modify | Update for new restore flow |
| `tests/sidebar.test.js` | Modify | Update `loadRecord` tests |
| `tests/reset.test.js` | Modify | Update for new reset flow |
| `sw.js` | Modify | Bump `CACHE_NAME` |

---

### Task 1: Update `index.html` — Single Page Structure

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Remove wizard elements from HTML**

Remove these elements:
- `<div class="sticky top-0 z-10 ...">` (progress bar with step labels)
- `<div class="section-wrapper ...">` wrapper
- All `<div class="section ...">` wrappers
- Nav buttons container `<div class="flex justify-between ...">`
- `<button id="btn-anterior">` and `<button id="btn-proximo">`
- `<span id="step-current-text">`

- [ ] **Step 2: Add single-page section structure**

Replace with this structure inside `.container`:

```html
<!-- Header -->
<div class="flex justify-between items-center px-5 pt-3.5 pb-2.5">
  <button class="hamburger" id="hamburger">&#9776;</button>
  <h1 class="text-xl text-slate-900 font-bold m-0 tracking-tight">Retorno de Ordens</h1>
  <button class="btn-new-form" id="btn-novo-form" title="Novo formulário">+</button>
</div>

<!-- Error message -->
<div class="bg-red-50 text-red-600 px-4 py-3 rounded-[10px] text-xs font-semibold border border-red-200 mx-4 mt-3" id="error-msg" style="display:none"></div>

<!-- Section 1: Início -->
<section class="sec-card mx-4 mt-4" id="sec-inicio">
  <div class="sec-head">
    <span class="sec-num">1</span> Início
  </div>
  <div class="sec-body" id="iniciais-campos"></div>
</section>

<!-- Section 2: Retorno -->
<section class="sec-card mx-4 mt-4" id="sec-retorno">
  <div class="sec-head">
    <span class="sec-num">2</span> Retorno
  </div>
  <div class="sec-body">
    <p class="text-base font-bold text-slate-900 mb-4" id="retorno-desc">—</p>
    <div id="retorno-placeholder" class="ret-placeholder">
      <span class="ret-icon">👆</span>
      Selecione o Tipo de Ordem na seção "Início" para exibir os campos de Retorno
    </div>
    <div id="retorno-campos"></div>
  </div>
</section>

<!-- Section 3: Equipamentos -->
<section class="sec-card mx-4 mt-4" id="sec-equipamentos">
  <div class="sec-head">
    <span class="sec-num">3</span> Equipamentos
  </div>
  <div class="sec-body">
    <div id="equipamentos-list"></div>
    <button class="btn-add flex-1 py-3 px-4 border-2 border-dashed border-slate-200 rounded-[10px] bg-slate-50/30 text-slate-600 text-sm font-semibold cursor-pointer transition-all duration-200 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/30" id="btn-add-equip" type="button">+ Adicionar equipamento</button>
  </div>
</section>

<!-- Section 4: Anexos -->
<section class="sec-card mx-4 mt-4" id="sec-anexos">
  <div class="sec-head">
    <span class="sec-num">4</span> Anexos
  </div>
  <div class="sec-body">
    <div class="file-upload-area border-2 border-dashed border-slate-200 rounded-[12px] py-8 px-5 text-center cursor-pointer transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/30 bg-slate-50/50" id="file-upload-area">
      <span class="text-3xl block mb-2">📎</span>
      <span class="text-sm text-slate-600 font-semibold">Clique para selecionar imagens</span>
      <span class="file-count block mt-1.5 text-xs text-slate-400 font-medium" id="file-count">0 / 12</span>
    </div>
    <input type="file" id="file-input" accept="image/*" multiple class="hidden">
    <div class="preview-grid grid grid-cols-4 max-sm:grid-cols-2 gap-2 mt-4" id="preview-grid"></div>
  </div>
</section>

<!-- Section 5: Revisão -->
<section class="sec-card mx-4 mt-4" id="sec-revisao">
  <div class="sec-head">
    <span class="sec-num">5</span> Revisão
  </div>
  <div class="sec-body">
    <div class="email-preview bg-slate-50/70 border border-slate-200 rounded-[12px] p-5">
      <div class="preview-value text-sm text-slate-800 whitespace-pre-wrap leading-relaxed" id="preview-corpo">—</div>
      <div class="mt-5 pt-4 border-t border-slate-200/60">
        <label for="complemento-corpo" class="block font-semibold text-sm text-slate-700 mb-1.5">Complemento do corpo (opcional)</label>
        <textarea id="complemento-corpo" rows="3" placeholder="Texto adicional para o corpo..." class="w-full px-3.5 py-3 border rounded-[10px] text-sm font-sans text-slate-800 outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10 resize-y min-h-[60px]"></textarea>
      </div>
    </div>
  </div>
</section>

<!-- Send button -->
<div class="mx-4 mt-4 mb-6 text-center">
  <button class="btn btn-success" id="btn-enviar">📨 Enviar</button>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: replace wizard with single-page section layout"
```

---

### Task 2: Update `style.css` — Section Styles

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Remove wizard styles**

Remove CSS rules for:
- `.progress`, `.step-label`, `.step-label.active`, `.step-label.completed`
- `.section-wrapper`, `.section`, `.section.active`
- `.nav-buttons`, `#btn-anterior`, `#btn-proximo`
- `.slide-out-left`, `.slide-out-right`, `.section-enter-next`, `.section-enter-prev`
- `.step-current-text`

- [ ] **Step 2: Add section card styles**

```css
/* Section cards */
.sec-card {
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
}
.sec-head {
  padding: 0.75rem 1.25rem;
  font-weight: 700;
  font-size: 0.9rem;
  color: #0f172a;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 8px;
}
.sec-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #2563eb;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
}
.sec-body {
  padding: 1rem 1.25rem;
}

/* Retorno placeholder */
.ret-placeholder {
  text-align: center;
  padding: 1.5rem 1rem;
  color: #94a3b8;
  font-size: 0.8rem;
}
.ret-icon {
  font-size: 1.5rem;
  display: block;
  margin-bottom: 6px;
}

/* Send button */
#btn-enviar {
  background: linear-gradient(135deg, #059669, #047857);
  color: #fff;
  border: none;
  padding: 0.85rem 3rem;
  border-radius: 30px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);
  transition: all 0.2s;
}
#btn-enviar:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
}
```

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "style: replace wizard styles with section card styles"
```

---

### Task 3: Update `scripts/dom.js` — Cache New Elements

**Files:**
- Modify: `scripts/dom.js`

- [ ] **Step 1: Update cacheDOM function**

Replace the entire `cacheDOM` function:

```javascript
export function cacheDOM() {
  // Header
  DOM.hamburger = document.getElementById("hamburger");
  DOM.btnNovoForm = document.getElementById("btn-novo-form");

  // Sections
  DOM.secInicio = document.getElementById("sec-inicio");
  DOM.secRetorno = document.getElementById("sec-retorno");
  DOM.secEquipamentos = document.getElementById("sec-equipamentos");
  DOM.secAnexos = document.getElementById("sec-anexos");
  DOM.secRevisao = document.getElementById("sec-revisao");

  // Error & Toast
  DOM.errorMsg = document.getElementById("error-msg");
  DOM.toast = document.getElementById("toast");

  // Início
  DOM.iniciaisCampos = document.getElementById("iniciais-campos");
  DOM.tipoOrdem = document.getElementById("tipo-ordem");

  // Retorno
  DOM.retornoDesc = document.getElementById("retorno-desc");
  DOM.retornoPlaceholder = document.getElementById("retorno-placeholder");
  DOM.retornoCampos = document.getElementById("retorno-campos");

  // Equipamentos
  DOM.equipList = document.getElementById("equipamentos-list");
  DOM.btnAddEquip = document.getElementById("btn-add-equip");

  // Anexos
  DOM.fileInput = document.getElementById("file-input");
  DOM.fileCount = document.getElementById("file-count");
  DOM.previewGrid = document.getElementById("preview-grid");
  DOM.fileUploadArea = document.getElementById("file-upload-area");

  // Revisão
  DOM.previewCorpo = document.getElementById("preview-corpo");
  DOM.complementoCorpo = document.getElementById("complemento-corpo");

  // Send
  DOM.btnEnviar = document.getElementById("btn-enviar");

  // Sidebar
  DOM.sidebar = document.getElementById("sidebar");
  DOM.sidebarOverlay = document.getElementById("sidebar-overlay");
  DOM.sidebarClose = document.getElementById("sidebar-close");
  DOM.sidebarList = document.getElementById("sidebar-list");
  DOM.sidebarFilter = document.getElementById("sidebar-filter");

  // Modals
  DOM.dupModal = document.getElementById("dup-modal");
  DOM.dupModalTitle = document.getElementById("dup-modal-title");
  DOM.dupModalBody = document.getElementById("dup-modal-body");
  DOM.dupModalCancel = document.getElementById("dup-modal-cancel");
  DOM.dupModalConfirm = document.getElementById("dup-modal-confirm");
  DOM.lightbox = document.getElementById("lightbox");
  DOM.lightboxImg = document.getElementById("lightbox-img");
  DOM.lightboxClose = document.getElementById("lightbox-close");
  DOM.confirmModal = document.getElementById("confirm-modal");
  DOM.confirmModalText = document.getElementById("confirm-modal-text");
  DOM.confirmModalOk = document.getElementById("confirm-modal-ok");
  DOM.confirmModalCancel = document.getElementById("confirm-modal-cancel");
}
```

Removed: `sections`, `wrapper`, `steps`, `btnAnterior`, `btnProximo`, `modalTipo`, `modalCancel`, `modalConfirm`, `stepCurrentText`

- [ ] **Step 2: Commit**

```bash
git add scripts/dom.js
git commit -m "refactor: update cacheDOM for single-page structure"
```

---

### Task 4: Update `scripts/state.js` — Remove Wizard State

**Files:**
- Modify: `scripts/state.js`

- [ ] **Step 1: Remove wizard-related state properties**

```javascript
import { getRawUUID } from "./storage.js";

export { setCurrentUUID, clearCurrentUUID, saveState, debouncedSave, getCurrentUUID } from "./persistence.js";

export const state = {
  iniciais: {},
  equipamentos: [],
  attachments: [],
  lastTipoOrdem: "",
  retorno: {},
  currentUUID: getRawUUID(),
  composicao: { complementoCorpo: "" },
  iniciaisValido: false,
};
```

Removed: `currentSection`, `totalSections`, `animating`, `visitedRetorno`

- [ ] **Step 2: Commit**

```bash
git add scripts/state.js
git commit -m "refactor: remove wizard state (currentSection, animating, visitedRetorno)"
```

---

### Task 5: Update `scripts/fields.js` — Add Retorno Field Definitions

**Files:**
- Modify: `scripts/fields.js`

- [ ] **Step 1: Add retornoFieldsByTipo map**

Add after the existing `retornoFields` export:

```javascript
// ── Retorno fields by Tipo de Ordem ──────────────────────────────────────────

const FIELD_DESCRICAO = { nome: "descricao", label: "Descrição do Serviço", tipo: "textarea" };

export const retornoFieldsByTipo = {
  "default": [FIELD_DESCRICAO],

  "SUBST. MEDIDOR A PEDIDO": [
    FIELD_DESCRICAO,
    { nome: "tipo-servico", label: "Tipo de Serviço", tipo: "select", opcoes: ["Troca de Medidor", "Reparo", "Aferição"] },
    { nome: "medidor-antigo", label: "Nº do Medidor Antigo", tipo: "text", condicional: { campoRef: "tipo-servico", valor: "Troca de Medidor" } },
    { nome: "medidor-novo", label: "Nº do Medidor Novo", tipo: "text", condicional: { campoRef: "tipo-servico", valor: "Troca de Medidor" } },
    { nome: "marca-medidor", label: "Marca do Medidor", tipo: "select", opcoes: ["Landis+Gyr", "EDMI", "Siemens", "Itron", "Nansen", "Outra"], condicional: { campoRef: "tipo-servico", valor: "Troca de Medidor" } },
    { nome: "leitura-anterior", label: "Leitura Anterior", tipo: "number", condicional: { campoRef: "tipo-servico", valor: "Aferição" } },
    { nome: "leitura-atual", label: "Leitura Atual", tipo: "number", condicional: { campoRef: "tipo-servico", valor: "Aferição" } },
  ],

  "VISTORIA DA UC": [
    FIELD_DESCRICAO,
    { nome: "resultado", label: "Resultado da Vistoria", tipo: "select", opcoes: ["Regular", "Irregularidade Leve", "Irregularidade Grave", "Cliente Ausente", "Recusou", "Outro"] },
    { nome: "motivo-recusa", label: "Motivo da Recusa", tipo: "text", condicional: { campoRef: "resultado", valor: "Recusou" } },
    { nome: "desc-irregularidade", label: "Descrição da Irregularidade", tipo: "textarea", condicional: { campoRef: "resultado", valor: "Irregularidade Leve" } },
    { nome: "desc-irregularidade", label: "Descrição da Irregularidade", tipo: "textarea", condicional: { campoRef: "resultado", valor: "Irregularidade Grave" } },
  ],

  "GRANDES CLIENTES SELO ROMPIDO": [
    FIELD_DESCRICAO,
    { nome: "selo-rompido", label: "Selo Rompido?", tipo: "select", opcoes: ["SIM", "NÃO"] },
    { nome: "medidor-substituido", label: "Medidor Substituído?", tipo: "select", opcoes: ["SIM", "NÃO"], condicional: { campoRef: "selo-rompido", valor: "SIM" } },
    { nome: "num-novo-medidor", label: "Nº do Novo Medidor", tipo: "text", condicional: { campoRef: "medidor-substituido", valor: "SIM" } },
  ],

  "INSTALACAO DO DISPLAY": [
    FIELD_DESCRICAO,
    { nome: "display-instalado", label: "Display Instalado?", tipo: "select", opcoes: ["SIM", "NÃO"] },
    { nome: "motivo-nao-instalar", label: "Motivo de não Instalar", tipo: "text", condicional: { campoRef: "display-instalado", valor: "NÃO" } },
  ],

  "SUBSTITUIÇÃO DE DISPLAY": [
    FIELD_DESCRICAO,
    { nome: "motivo-subst", label: "Motivo da Substituição", tipo: "select", opcoes: ["Display Quebrado", "Display Sem Leitura", "Display Danificado", "Outro"] },
    { nome: "display-funcionando", label: "Display Novo Funcionando?", tipo: "select", opcoes: ["SIM", "NÃO"] },
  ],

  "AFERIÇÃO DE MEDIDOR": [
    FIELD_DESCRICAO,
    { nome: "medidor-aferido", label: "Medidor Aferido?", tipo: "select", opcoes: ["SIM", "NÃO"] },
    { nome: "resultado-afericao", label: "Resultado da Aferição", tipo: "text", condicional: { campoRef: "medidor-aferido", valor: "SIM" } },
  ],

  "CORTE POR FALTA DE PAGAMENTO": [
    FIELD_DESCRICAO,
    { nome: "motivo-corte", label: "Motivo do Corte", tipo: "select", opcoes: ["Falta de Pagamento", "Irregularidade", "A Pedido do Cliente", "Outro"] },
    { nome: "data-corte", label: "Data do Corte", tipo: "date" },
    { nome: "religado", label: "Religado?", tipo: "select", opcoes: ["SIM", "NÃO"], condicional: { campoRef: "motivo-corte", valor: "Falta de Pagamento" } },
  ],

  "TELEMEDIÇÃO MANUTENÇÃO": [
    FIELD_DESCRICAO,
    { nome: "equipamento", label: "Equipamento", tipo: "select", opcoes: ["Modem", "Roteador", "Concentrador", "Fonte", "Antena", "Hub", "Outro"] },
    { nome: "defeito", label: "Defeito Encontrado", tipo: "text" },
    { nome: "num-serie", label: "Nº de Série", tipo: "text" },
  ],
};

export function getRetornoFields(tipo) {
  return retornoFieldsByTipo[tipo] || retornoFieldsByTipo["default"];
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/fields.js
git commit -m "feat: add retornoFieldsByTipo map with conditional field support"
```

---

### Task 6: Update `scripts/iniciais.js` — Export INPUT_CREATORS

**Files:**
- Modify: `scripts/iniciais.js`

- [ ] **Step 1: Add createTextarea and export INPUT_CREATORS**

Add `createTextarea` function:

```javascript
function createTextareaInput() {
  const input = document.createElement("textarea");
  input.rows = 4;
  input.className = INPUT_CLASS + " resize-y min-h-[80px]";
  return input;
}
```

Update `INPUT_CREATORS` to include textarea and export it:

```javascript
export const INPUT_CREATORS = {
  select: createSelectInput,
  number: createNumberInput,
  date: createDateInput,
  time: createTimeInput,
  text: createTextInput,
  textarea: createTextareaInput,
};
```

- [ ] **Step 2: Commit**

```bash
git add scripts/iniciais.js
git commit -m "refactor: export INPUT_CREATORS, add textarea creator"
```

---

### Task 7: Rewrite `scripts/retornos.js` — Dynamic Fields, No Modal

**Files:**
- Modify: `scripts/retornos.js`

- [ ] **Step 1: Rewrite the entire module**

```javascript
import { DOM } from "./dom.js";
import { state, saveState, debouncedSave } from "./state.js";
import { addBlurValidation } from "./validation.js";
import { getRetornoFields } from "./fields.js";
import { INPUT_CREATORS } from "./iniciais.js";
import { INPUT_CLASS } from "./styles.js";

export function renderRetorno() {
  const tipo = DOM.tipoOrdem?.value || "";

  // Update description
  const tipoLabel = DOM.tipoOrdem?.options[DOM.tipoOrdem.selectedIndex]?.text || "—";
  DOM.retornoDesc.innerHTML = `<span class="text-base font-bold text-slate-900">${tipoLabel}</span>`;

  // Clear fields
  DOM.retornoCampos.innerHTML = "";

  if (!tipo) {
    // Show placeholder
    DOM.retornoPlaceholder.style.display = "";
    return;
  }

  // Hide placeholder
  DOM.retornoPlaceholder.style.display = "none";

  const fields = getRetornoFields(tipo);

  fields.forEach((field) => {
    const group = document.createElement("div");
    group.className = "mb-4";
    group.dataset.fieldNome = field.nome;

    // Handle conditional visibility
    if (field.condicional) {
      group.dataset.condicionalRef = field.condicional.campoRef;
      group.dataset.condicionalVal = field.condicional.valor;
      group.style.display = "none";
    }

    const label = document.createElement("label");
    label.setAttribute("for", field.nome);
    label.className = "block font-semibold text-[13px] text-slate-600 mb-1";
    label.textContent = field.label;

    const creator = INPUT_CREATORS[field.tipo] ?? INPUT_CREATORS.text;
    const input = creator(field);
    input.id = field.nome;
    input.placeholder = field.label;
    input.setAttribute("data-required", "");

    addBlurValidation(input);
    input.addEventListener("input", debouncedSave);
    input.addEventListener("change", debouncedSave);

    // If this field controls conditional fields, add listener
    if (hasConditionalDependents(field.nome, fields)) {
      input.addEventListener("change", () => updateConditionalFields(fields));
    }

    const errorSpan = document.createElement("span");
    errorSpan.className = "field-error";

    group.appendChild(label);
    group.appendChild(input);
    group.appendChild(errorSpan);
    DOM.retornoCampos.appendChild(group);
  });

  // Initial conditional check
  updateConditionalFields(fields);
}

function hasConditionalDependents(nome, fields) {
  return fields.some(f => f.condicional?.campoRef === nome);
}

function updateConditionalFields(fields) {
  fields.forEach((field) => {
    if (!field.condicional) return;

    const group = DOM.retornoCampos.querySelector(`[data-field-nome="${field.nome}"]`);
    if (!group) return;

    const controlEl = document.getElementById(field.condicional.campoRef);
    if (!controlEl) return;

    if (controlEl.value === field.condicional.valor) {
      group.style.display = "";
    } else {
      group.style.display = "none";
      // Clear value of hidden field
      const input = group.querySelector("input, select, textarea");
      if (input) input.value = "";
    }
  });
}

export function getRetornoData() {
  const tipo = DOM.tipoOrdem?.value || "";
  if (!tipo) return {};

  const fields = getRetornoFields(tipo);
  const data = {};

  fields.forEach((field) => {
    // Only collect visible fields
    const group = DOM.retornoCampos.querySelector(`[data-field-nome="${field.nome}"]`);
    if (!group || group.style.display === "none") return;

    const el = document.getElementById(field.nome);
    if (el) data[field.nome] = el.value;
  });

  return data;
}

export function setRetornoData(data) {
  if (!data) return;

  Object.entries(data).forEach(([nome, value]) => {
    const el = document.getElementById(nome);
    if (el) el.value = value;
  });

  // Re-evaluate conditionals after restoring values
  const tipo = DOM.tipoOrdem?.value || "";
  if (tipo) {
    updateConditionalFields(getRetornoFields(tipo));
  }
}

export function handleTipoChange() {
  const tipo = DOM.tipoOrdem?.value || "";

  if (tipo === state.lastTipoOrdem) return;

  // Clear retorno fields and re-render
  state.lastTipoOrdem = tipo;
  state.retorno = {};
  DOM.retornoCampos.innerHTML = "";
  renderRetorno();
  saveState();
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/retornos.js
git commit -m "feat: rewrite retornos.js with dynamic fields, remove modal"
```

---

### Task 8: Update `scripts/validation.js` — Add validateAll()

**Files:**
- Modify: `scripts/validation.js`

- [ ] **Step 1: Add validateAll function**

Add after the existing `validateSection` function:

```javascript
export function validateAll() {
  hideError();
  let firstError = null;
  let valid = true;

  // Section 1: Iniciais
  const s1Valid = validateSection1();
  if (!s1Valid && !firstError) {
    firstError = document.querySelector("#sec-inicio .error");
  }
  valid = valid && s1Valid;

  // Section 3: Retorno (only if tipo is selected)
  const tipo = DOM.tipoOrdem?.value || "";
  if (tipo) {
    const s3Valid = validateSection3();
    if (!s3Valid && !firstError) {
      firstError = document.querySelector("#sec-retorno .error");
    }
    valid = valid && s3Valid;
  }

  // Section 2: Equipamentos (optional, but validate if rows exist)
  const s2Valid = validateSection2();
  if (!s2Valid && !firstError) {
    firstError = document.querySelector("#sec-equipamentos .error");
  }
  valid = valid && s2Valid;

  // Section 4: Anexos
  const s4Valid = validateSection4();
  if (!s4Valid && !firstError) {
    firstError = document.querySelector("#sec-anexos .error");
  }
  valid = valid && s4Valid;

  // Scroll to first error
  if (firstError) {
    firstError.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return valid;
}
```

- [ ] **Step 2: Update validateSection3 for dynamic fields**

Replace the existing `validateSection3` function:

```javascript
function validateSection3() {
  const tipo = DOM.tipoOrdem?.value || "";
  if (!tipo) return true;

  const campos = DOM.retornoCampos.querySelectorAll(".mb-4");
  let valid = true;

  campos.forEach((group) => {
    // Skip hidden conditional fields
    if (group.style.display === "none") return;

    const input = group.querySelector("input, select, textarea");
    if (!input) return;

    if (!input.value || input.value.trim() === "") {
      markError(input, "Campo obrigatório");
      valid = false;
    } else {
      clearError(input);
    }
  });

  if (!valid) return false;

  state.retorno = getRetornoData();
  _validatedData[3] = state.retorno;
  return true;
}
```

- [ ] **Step 3: Commit**

```bash
git add scripts/validation.js
git commit -m "feat: add validateAll() for single-page validation"
```

---

### Task 9: Update `scripts/email.js` — Dynamic Retorno in Email

**Files:**
- Modify: `scripts/email.js`

- [ ] **Step 1: Update composeEmail to use dynamic fields**

```javascript
import { iniciaisFields, getRetornoFields } from "./fields.js";

function normalizeText(str) {
  if (!str) return str;
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C")
    .toUpperCase();
}

export function composeEmail(data) {
  let body = "";

  iniciaisFields.forEach((field) => {
    const raw = data.iniciais?.[field.nome] || "";
    const val = raw && field.tipo === "date"
      ? raw.split("-").reverse().join("-")
      : (raw || "\u2014");
    body += `${normalizeText(field.label)}: ${normalizeText(val)}\n`;
  });

  if (data.equipamentos && data.equipamentos.length > 0) {
    body += "\n\nEQUIPAMENTOS:";
    data.equipamentos.forEach((eq) => {
      body += `\n${normalizeText(eq.categoria)} ${normalizeText(eq.status)} N\u00BA ${normalizeText(eq.numero || "\u2014")}`;
    });
  }

  body += "\n\nRETORNO:";
  const tipo = data.iniciais?.["tipo-ordem"] || "";
  const retornoFields = getRetornoFields(tipo);

  retornoFields.forEach((field) => {
    const val = data.retorno?.[field.nome] || "";
    body += `\n${normalizeText(field.label)}: ${normalizeText(val || "(nao preenchido)")}`;
  });

  return body;
}

export function updateLivePreview() {
  const emailData = {
    iniciais: getIniciaisData(),
    equipamentos: state.equipamentos,
    retorno: getRetornoData(),
  };
  DOM.previewCorpo.textContent = composeEmail(emailData);
}
```

Add imports at top:

```javascript
import { DOM } from "./dom.js";
import { state } from "./state.js";
import { getIniciaisData } from "./iniciais.js";
import { getRetornoData } from "./retornos.js";
```

- [ ] **Step 2: Commit**

```bash
git add scripts/email.js
git commit -m "feat: email.js uses dynamic retorno fields, add live preview"
```

---

### Task 10: Update `scripts/send.js` — Use validateAll

**Files:**
- Modify: `scripts/send.js`

- [ ] **Step 1: Update sendEmail to validate all at once**

```javascript
import { DOM } from "./dom.js";
import { state } from "./state.js";
import { updateRecordStatus } from "./db.js";
import { showToast } from "./ui.js";
import { checkDuplicate } from "./duplicate.js";
import { compressAttachments } from "./compress.js";
import { validateAll } from "./validation.js";

export async function sendEmail() {
  if (!validateAll()) return false;

  const canProceed = await checkDuplicate();
  if (!canProceed) return false;

  const btn = DOM.btnEnviar;
  btn.disabled = true;
  btn.textContent = "Enviando...";

  try {
    const uc = state.iniciais?.uc || "—";
    const os = state.iniciais?.os || "—";
    const tipoLabel = DOM.tipoOrdem?.options[DOM.tipoOrdem.selectedIndex]?.text || "\u2014";
    const subject = `OS #${os} - UC ${uc} - ${tipoLabel}`;
    const baseBody = DOM.previewCorpo.textContent;
    const compCorpo = DOM.complementoCorpo.value.trim();

    const text = compCorpo ? `${baseBody}\n\n${compCorpo}` : baseBody;

    const attachments = await compressAttachments(state.attachments);

    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, text, attachments }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      showToast("Email enviado com sucesso!", true);
      if (state.currentUUID) {
        await updateRecordStatus(state.currentUUID, { to: data.to, subject, sentAt: new Date().toISOString() });
      }
      return true;
    } else {
      showToast(data.error || "Erro ao enviar email.", false);
      return false;
    }
  } catch (err) {
    showToast("Erro de conexão. Tente novamente.", false);
    return false;
  } finally {
    btn.disabled = false;
    btn.textContent = "📨 Enviar";
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/send.js
git commit -m "feat: send.js uses validateAll for single-page validation"
```

---

### Task 11: Update `scripts/reset.js` — Clear All Sections

**Files:**
- Modify: `scripts/reset.js`

- [ ] **Step 1: Update resetForm**

```javascript
import { DOM } from "./dom.js";
import { state, clearCurrentUUID } from "./state.js";
import { renderIniciais } from "./iniciais.js";
import { showEmptyEquip } from "./equipment.js";
import { updateFileCount } from "./attachments.js";
import { hideError } from "./ui.js";
import { captureCoordinates } from "./utils.js";

export function resetForm() {
  // Reset state
  state.equipamentos = [];
  state.attachments = [];
  state.iniciais = {};
  state.retorno = {};
  state.lastTipoOrdem = "";
  state.currentUUID = "";
  state._createdAt = null;
  state.iniciaisValido = false;

  // Clear all sections
  renderIniciais();
  captureCoordinates();
  DOM.retornoCampos.innerHTML = "";
  DOM.retornoPlaceholder.style.display = "";
  DOM.retornoDesc.innerHTML = "—";
  DOM.equipList.innerHTML = "";
  DOM.complementoCorpo.value = "";
  DOM.previewGrid.innerHTML = "";
  DOM.previewCorpo.textContent = "—";

  showEmptyEquip();
  updateFileCount();
  hideError();
  clearCurrentUUID();
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/reset.js
git commit -m "refactor: reset.js clears all sections at once"
```

---

### Task 12: Update `scripts/restore.js` — Render All Sections

**Files:**
- Modify: `scripts/restore.js`

- [ ] **Step 1: Update applyRecord**

```javascript
import { DOM } from "./dom.js";
import { state, setCurrentUUID } from "./state.js";
import { renderIniciais, iniciaisFields } from "./iniciais.js";
import { renderRetorno, setRetornoData } from "./retornos.js";
import { renderEquipamentos } from "./equipment.js";
import { renderPreviews } from "./attachments.js";
import { base64ToBlob } from "./utils.js";

export function applyRecord(record) {
  setCurrentUUID(record.uuid);
  state.iniciaisValido = true;

  state.equipamentos = record.equipamentos || [];
  state.lastTipoOrdem = record.lastTipoOrdem || "";
  state.iniciais = record.iniciais || {};
  state.retorno = record.retorno || {};
  state._createdAt = record.createdAt;

  if (record.attachments && Array.isArray(record.attachments)) {
    state.attachments = record.attachments.map((att) => {
      const blob = base64ToBlob(att.data, att.type);
      return new File([blob], att.name, { type: att.type });
    });
  } else {
    state.attachments = [];
  }

  // Render Início
  renderIniciais();

  if (record.tipoOrdem && DOM.tipoOrdem) {
    DOM.tipoOrdem.value = record.tipoOrdem;
  }

  if (record.iniciais) {
    iniciaisFields.forEach((field) => {
      const el = document.getElementById(field.nome);
      const val = record.iniciais[field.nome];
      if (el && val != null && val !== "") el.value = val;
    });
  }

  // Render Retorno if tipo is set
  if (record.tipoOrdem) {
    renderRetorno();
    setRetornoData(record.retorno);
  }

  // Render Equipamentos
  renderEquipamentos();

  // Render Anexos
  renderPreviews();

  // Restore complemento
  if (record.composicao?.complementoCorpo && DOM.complementoCorpo) {
    DOM.complementoCorpo.value = record.composicao.complementoCorpo;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/restore.js
git commit -m "refactor: restore.js renders all sections on restore"
```

---

### Task 13: Update `scripts/sidebar.js` — Remove showSection

**Files:**
- Modify: `scripts/sidebar.js`

- [ ] **Step 1: Update loadRecord function**

Replace the `loadRecord` function:

```javascript
function loadRecord(record) {
  applyRecord(record);
  closeSidebar();
  // Scroll to top after loading
  window.scrollTo({ top: 0, behavior: "smooth" });
}
```

Remove the import of `showSection`:

```javascript
// Remove: import { showSection } from "./sectionManager.js";
```

- [ ] **Step 2: Commit**

```bash
git add scripts/sidebar.js
git commit -m "refactor: sidebar.js removes showSection dependency"
```

---

### Task 14: Update `scripts/persistence.js` — Remove currentSection

**Files:**
- Modify: `scripts/persistence.js`

- [ ] **Step 1: Remove currentSection from saved data**

In `saveState()`, remove the `currentSection` property from the data object:

```javascript
const data = {
  uuid: state.currentUUID,
  status: "draft",
  createdAt,
  updatedAt: new Date().toISOString(),
  iniciais: iniciaisData,
  retorno: getRetornoData(),
  tipoOrdem: DOM.tipoOrdem ? DOM.tipoOrdem.value : "",
  equipamentos: state.equipamentos,
  lastTipoOrdem: state.lastTipoOrdem,
  composicao: { complementoCorpo: DOM.complementoCorpo ? DOM.complementoCorpo.value : "" },
  attachments: attachmentsData,
  sentData: null,
};
```

Removed: `currentSection`, `visitedRetorno`

- [ ] **Step 2: Commit**

```bash
git add scripts/persistence.js
git commit -m "refactor: persistence.js removes currentSection from saved data"
```

---

### Task 15: Rewrite `scripts/app.js` — Single Page Events

**Files:**
- Modify: `scripts/app.js`

- [ ] **Step 1: Rewrite the entire module**

```javascript
import { DOM, cacheDOM } from "./dom.js";
import { state, debouncedSave, saveState, getCurrentUUID, clearCurrentUUID } from "./state.js";
import { renderIniciais } from "./iniciais.js";
import { addEquip } from "./equipment.js";
import { handleTipoChange } from "./retornos.js";
import { handleUploadClick, handleFileChange, closeLightbox, updateFileCount, renderPreviews } from "./attachments.js";
import { resetForm } from "./reset.js";
import { renderSidebar, closeSidebar, initSidebarFilter } from "./sidebar.js";
import { getRecord } from "./db.js";
import { applyRecord } from "./restore.js";
import { showConfirm } from "./ui.js";
import { captureCoordinates } from "./utils.js";
import { sendEmail } from "./send.js";
import { updateLivePreview } from "./email.js";

async function restoreSavedState() {
  const uuid = getCurrentUUID();
  if (!uuid) return false;

  try {
    const record = await getRecord(uuid);
    if (!record) {
      clearCurrentUUID();
      return false;
    }

    const ok = await showConfirm(`Há um formulário salvo. Deseja continuar de onde parou?`);
    if (!ok) {
      clearCurrentUUID();
      return false;
    }

    applyRecord(record);
    updateAllFilledClasses();
    updateLivePreview();
    return true;
  } catch (_) {
    return false;
  }
}

function updateFilledClass(el) {
  if (el.value && el.value.trim() !== "") {
    el.classList.add("is-filled");
  } else {
    el.classList.remove("is-filled");
  }
}

export function updateAllFilledClasses() {
  document.querySelectorAll("input, select, textarea").forEach((el) => {
    updateFilledClass(el);
  });
}

function initEvents() {
  // Send button
  DOM.btnEnviar.addEventListener("click", sendEmail);

  // New form button
  DOM.btnNovoForm.addEventListener("click", async () => {
    await saveState();
    resetForm();
    await captureCoordinates();
    updateAllFilledClasses();
  });

  // Equipment button
  DOM.btnAddEquip.addEventListener("click", () => addEquip());

  // Tipo de Ordem change
  DOM.tipoOrdem.addEventListener("change", handleTipoChange);

  // File upload
  DOM.fileUploadArea.addEventListener("click", handleUploadClick);
  DOM.fileInput.addEventListener("change", handleFileChange);

  // Lightbox
  DOM.lightboxClose.addEventListener("click", closeLightbox);
  DOM.lightbox.addEventListener("click", (e) => {
    if (e.target === DOM.lightbox) closeLightbox();
  });

  // Sidebar
  DOM.hamburger.addEventListener("click", () => {
    renderSidebar();
    document.body.classList.add("sidebar-open");
  });
  DOM.sidebarOverlay.addEventListener("click", closeSidebar);
  DOM.sidebarClose.addEventListener("click", closeSidebar);

  // Live preview on any input
  document.addEventListener("input", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") {
      updateFilledClass(e.target);
      debouncedSave();
      updateLivePreview();
    }
  });

  document.addEventListener("change", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") {
      updateFilledClass(e.target);
      debouncedSave();
      updateLivePreview();
    }
  });

  // Blur focus handling
  document.addEventListener("pointerdown", (e) => {
    if (e.target.tagName !== "INPUT" && e.target.tagName !== "SELECT" && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "BUTTON") {
      document.activeElement?.blur();
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  cacheDOM();
  initSidebarFilter();
  renderIniciais();
  initEvents();
  updateFileCount();
  renderPreviews();
  await captureCoordinates();
  const restored = await restoreSavedState();
  if (!restored) {
    updateLivePreview();
  }
  updateAllFilledClasses();
});
```

- [ ] **Step 2: Commit**

```bash
git add scripts/app.js
git commit -m "feat: rewrite app.js for single-page layout with live preview"
```

---

### Task 16: Delete Obsolete Modules

**Files:**
- Delete: `scripts/sectionManager.js`
- Delete: `scripts/animator.js`

- [ ] **Step 1: Delete the files**

```bash
git rm scripts/sectionManager.js
git rm scripts/animator.js
```

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: remove obsolete wizard modules (sectionManager, animator)"
```

---

### Task 17: Update Tests

**Files:**
- Delete: `tests/navigation.test.js`
- Modify: `tests/app-init.test.js`
- Modify: `tests/validation.test.js`
- Modify: `tests/retornos.test.js`
- Modify: `tests/restore.test.js`
- Modify: `tests/sidebar.test.js`
- Modify: `tests/reset.test.js`
- Modify: `tests/state.test.js`

- [ ] **Step 1: Delete navigation tests**

```bash
git rm tests/navigation.test.js
```

- [ ] **Step 2: Update app-init.test.js**

Update the DOM IDs array to match new structure:

```javascript
const ids = [
  'hamburger', 'btn-novo-form',
  'sidebar', 'sidebar-list', 'sidebar-overlay', 'sidebar-close', 'sidebar-filter',
  'btn-enviar', 'error-msg',
  'sec-inicio', 'iniciais-campos',
  'sec-retorno', 'retorno-desc', 'retorno-placeholder', 'retorno-campos',
  'sec-equipamentos', 'equipamentos-list', 'btn-add-equip',
  'sec-anexos', 'file-input', 'file-count', 'preview-grid', 'file-upload-area',
  'sec-revisao', 'preview-corpo', 'complemento-corpo',
  'toast',
  'lightbox', 'lightbox-img', 'lightbox-close',
  'dup-modal', 'dup-modal-title', 'dup-modal-body', 'dup-modal-cancel', 'dup-modal-confirm',
  'confirm-modal', 'confirm-modal-text', 'confirm-modal-ok', 'confirm-modal-cancel',
];
```

Remove: `expect(document.querySelectorAll('.section')).toHaveLength(5);`
Remove: `expect(document.querySelectorAll('.step-label')).toHaveLength(5);`

- [ ] **Step 3: Update validation.test.js**

Remove tests for `validateSection` with section numbers. Add tests for `validateAll()`:

```javascript
describe('validateAll', () => {
  it('should return true when all required fields are filled', () => {
    // Fill all iniciais fields
    // Set tipo-ordem
    // Fill retorno fields
    expect(validateAll()).toBe(true);
  });

  it('should scroll to first error when validation fails', () => {
    // Leave required field empty
    // Call validateAll
    // Check scrollIntoView was called
  });
});
```

- [ ] **Step 4: Update retornos.test.js**

Remove all modal-related tests (`handleTipoChange` modal behavior, `cancelTipoChange`, `confirmTipoChange`). Add tests for conditional fields:

```javascript
describe('conditional fields', () => {
  it('should hide conditional fields initially', () => {
    renderRetorno();
    // Check conditional field groups have display:none
  });

  it('should show conditional field when parent value matches', () => {
    // Set parent select to expected value
    // Check conditional field becomes visible
  });
});
```

- [ ] **Step 5: Update other test files**

- `restore.test.js`: Remove `currentSection` references
- `sidebar.test.js`: Update `loadRecord` tests (no `showSection`)
- `reset.test.js`: Update for new reset behavior
- `state.test.js`: Remove `currentSection`, `totalSections`, `animating` tests

- [ ] **Step 6: Run tests and fix failures**

```bash
npm test
```

- [ ] **Step 7: Commit**

```bash
git add tests/
git commit -m "test: update tests for single-page UI"
```

---

### Task 18: Update Service Worker Cache

**Files:**
- Modify: `sw.js`

- [ ] **Step 1: Bump CACHE_NAME**

```javascript
const CACHE_NAME = 'retorno-v46';
```

- [ ] **Step 2: Update STATIC_ASSETS list**

Remove `scripts/sectionManager.js` and `scripts/animator.js` from the list.

- [ ] **Step 3: Commit**

```bash
git add sw.js
git commit -m "chore: bump SW cache v45 → v46 (single-page UI)"
```

---

### Task 19: Final Verification

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 2: Test locally with Netlify dev**

```bash
npx netlify dev
```

Verify:
- All 5 sections visible on one page
- Tipo de Ordem selection renders Retorno fields
- Conditional fields show/hide correctly
- Live preview updates on input
- Enviar button validates and sends
- Sidebar and restore work correctly
- Reset clears all sections

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: final adjustments for single-page UI"
```

---

## Summary

This plan transforms the wizard-based form into a single-page layout with:
- 5 vertically stacked sections (Início → Retorno → Equipamentos → Anexos → Revisão)
- Dynamic Retorno fields based on Tipo de Ordem selection
- Conditional sub-fields that show/hide based on parent field values
- Real-time email preview
- Single validation on "Enviar" click with scroll-to-first-error
- Removed wizard navigation (no more Anterior/Próximo buttons)

Total estimated tasks: 19 (including test updates and verification)
