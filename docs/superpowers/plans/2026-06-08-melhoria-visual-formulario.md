# Melhoria Visual — Formulário de Envio — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar 8 melhorias visuais no formulário conforme spec aprovado.

**Architecture:** Modificações puramente frontend em HTML, CSS e JS. Sem mudanças de lógica de negócio. Todas as alterações são em arquivos existentes (nenhum arquivo novo).

**Tech Stack:** HTML5 + Tailwind CSS (inline) + Vanilla JS (ES6 modules) + Vitest

---

## Arquivos afetados

| Arquivo | Itens |
|---|---|
| `index.html` | 4, 5, 7, 8 |
| `style.css` | 3, 6, 8 |
| `scripts/iniciais.js` | 2 |
| `scripts/equipment.js` | 4 |
| `scripts/validation.js` | 1 |
| `scripts/reset.js` | 4 |
| `tests/navigation.test.js` | 4 |
| `tests/reset.test.js` | 4 |
| `tests/setup.js` | 4 |
| `tests/app-init.test.js` | 4 |
| `sw.js` | Bump cache version |

---

### Task 1: Remover mensagens globais de erro (Item 1)

**Files:**
- Modify: `scripts/validation.js:52,128,158`

- [ ] **Step 1: Remover `showError` da seção 1**

Em `validateSection1()`, substituir:
```js
  if (!valid) {
    showError("Preencha todos os campos obrigatórios.");
    return false;
  }
```
por:
```js
  if (!valid) return false;
```

- [ ] **Step 2: Remover `showError` da seção 2**

Em `validateSection2()`, substituir:
```js
  if (hasError) {
    showError(hasDuplicate
      ? "Nº de equipamento duplicado."
      : "Preencha todos os campos de cada equipamento.");
    return false;
  }
```
por:
```js
  if (hasError) return false;
```

- [ ] **Step 3: Remover `showError` da seção 3**

Em `validateSection3()`, substituir:
```js
  if (!valid) {
    showError("Preencha todos os campos obrigatórios.");
    return false;
  }
```
por:
```js
  if (!valid) return false;
```

- [ ] **Step 4: Rodar testes para verificar que nada quebrou**

```bash
cd C:\web-projects\mail && npx vitest run tests/validation.test.js
```
Esperado: todos os testes passam.

- [ ] **Step 5: Commit**

```bash
git add scripts/validation.js
git commit -m "feat: remove global error messages from validation (item 1)"
```

---

### Task 2: Melhorar ícone de coordenadas (Item 2)

**Files:**
- Modify: `scripts/iniciais.js:80-97`

- [ ] **Step 1: Substituir CSS inline do botão de refresh**

Em `createCoordinatesGroup()`, substituir o bloco `refreshBtn.style.cssText`:
```js
// Antes:
refreshBtn.style.cssText =
  "position:absolute;right:8px;top:50%;transform:translateY(-50%);width:28px;height:28px;" +
  "display:flex;align-items:center;justify-content:center;border:none;border-radius:4px;" +
  "background:transparent;color:#6b7280;font-size:16px;cursor:pointer;transition:color 0.2s,background 0.2s;z-index:10;";

// Depois:
refreshBtn.style.cssText =
  "position:absolute;right:8px;top:50%;transform:translateY(-50%);width:36px;height:36px;" +
  "display:flex;align-items:center;justify-content:center;border:1px solid #d1d5db;border-radius:8px;" +
  "background:#f9fafb;color:#2563eb;font-size:20px;cursor:pointer;transition:all 0.15s;z-index:10;" +
  "box-shadow:0 1px 3px rgba(0,0,0,0.08);";
```

- [ ] **Step 2: Atualizar handlers de hover**

Substituir os listeners de mouseenter/mouseleave:
```js
  refreshBtn.addEventListener("mouseenter", () => {
    refreshBtn.style.color = "#2563eb";
    refreshBtn.style.background = "#eff6ff";
    refreshBtn.style.borderColor = "#3b82f6";
    refreshBtn.style.boxShadow = "0 2px 8px rgba(59,130,246,0.15)";
  });
  refreshBtn.addEventListener("mouseleave", () => {
    refreshBtn.style.color = "#2563eb";
    refreshBtn.style.background = "#f9fafb";
    refreshBtn.style.borderColor = "#d1d5db";
    refreshBtn.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
  });
```

- [ ] **Step 3: Rodar testes**

```bash
cd C:\web-projects\mail && npx vitest run tests/iniciais.test.js
```
Esperado: todos os testes passam.

- [ ] **Step 4: Commit**

```bash
git add scripts/iniciais.js
git commit -m "feat: increase coordinate refresh icon to 36x36px (item 2)"
```

---

### Task 3: Reforçar .is-filled em campos preenchidos (Item 3)

**Files:**
- Modify: `style.css:97-101`

- [ ] **Step 1: Atualizar cores da classe .is-filled**

Substituir:
```css
input.is-filled, select.is-filled, textarea.is-filled {
  background-color: #f0f7ff !important;
  border-color: #3b82f6 !important;
  border-width: 2px !important;
}
```
por:
```css
input.is-filled, select.is-filled, textarea.is-filled {
  background-color: #dbeafe !important;
  border-color: #2563eb !important;
  border-width: 2.5px !important;
}
```

- [ ] **Step 2: Commit**

```bash
git add style.css
git commit -m "feat: reinforce filled-field styling with stronger blue (item 3)"
```

---

### Task 4: Ajustes nos equipamentos e remover botão Pular (Item 4)

**Files:**
- Modify: `index.html:51` (remover btn-skip)
- Modify: `scripts/equipment.js:7-24` (classes CSS)
- Modify: `scripts/reset.js:4,26` (remover updateSkipBtn)
- Modify: `tests/navigation.test.js:58`
- Modify: `tests/reset.test.js:16`
- Modify: `tests/setup.js:55`
- Modify: `tests/app-init.test.js:34`

- [ ] **Step 1: Remover botão Pular do HTML**

Em `index.html`, remover a linha:
```html
        <button class="btn-skip bg-none border-none text-slate-400 text-base cursor-pointer font-sans px-2 whitespace-nowrap transition-colors duration-200 hover:text-slate-600 font-medium" id="btn-skip-equip" type="button" style="display:none">Pular →</button>
```

- [ ] **Step 2: Atualizar classes CSS em addEquip()**

Em `scripts/equipment.js`, alterar classes dos elementos:

Na `div` principal (linha 7):
```js
// Antes:
div.className = "equip-row flex gap-2.5 items-center mb-4 p-2.5 bg-slate-50/50 border border-slate-200/50 rounded-xl shadow-sm";

// Depois:
div.className = "equip-row flex gap-2.5 items-center mb-6 p-3 bg-slate-50/50 border border-slate-200/50 rounded-xl shadow-sm";
```

Nos selects (tipo e categoria):
```js
// Antes:
<select class="equip-tipo flex-1 min-w-0 px-3 py-3 border border-slate-200 rounded-lg text-base outline-none ...">
// (mesmo para equip-categoria)

// Depois:
<select class="equip-tipo flex-1 min-w-0 px-3 py-4 border border-slate-200 rounded-lg text-lg outline-none ...">
// (mesmo para equip-categoria)
```

No input de número:
```js
// Antes:
<input type="number" class="equip-numero flex-1 min-w-0 px-3 py-3 border border-slate-200 rounded-lg text-base outline-none ...">

// Depois:
<input type="number" class="equip-numero flex-1 min-w-0 px-3 py-4 border border-slate-200 rounded-lg text-lg outline-none ...">
```

- [ ] **Step 3: Remover referências a updateSkipBtn em reset.js**

Em `scripts/reset.js`:
```js
// Linha 4 - remover 'updateSkipBtn' do import:
import { showEmptyEquip, updateSkipBtn } from "./equipment.js";
// → import { showEmptyEquip } from "./equipment.js";

// Linha 26 - remover a linha:
  updateSkipBtn();
```

- [ ] **Step 4: Remover btn-skip-equip dos testes**

Em `tests/setup.js`, remover a linha:
```html
<button id="btn-skip-equip" style="display:none">Pular →</button>
```

Em `tests/navigation.test.js`, remover a linha:
```html
<button id="btn-skip-equip" style="display:none">Pular →</button>
```

Em `tests/reset.test.js`, remover a linha:
```html
<button id="btn-skip-equip" style="display:none">Pular →</button>
```

Em `tests/app-init.test.js`, modificar o array (linha 34):
```js
// Antes:
'equipamentos-list', 'btn-add-equip', 'btn-skip-equip',
// Depois:
'equipamentos-list', 'btn-add-equip',
```

- [ ] **Step 5: Rodar testes**

```bash
cd C:\web-projects\mail && npx vitest run
```
Esperado: todos os 268 testes passam.

- [ ] **Step 6: Commit**

```bash
git add index.html scripts/equipment.js scripts/reset.js tests/setup.js tests/navigation.test.js tests/reset.test.js tests/app-init.test.js
git commit -m "feat: adjust equipment fields layout and remove Pular button (item 4)"
```

---

### Task 5: Melhorar botão "Novo formulário" (Item 5)

**Files:**
- Modify: `index.html:26`

- [ ] **Step 1: Atualizar classes do botão**

Em `index.html`, substituir as classes do `#btn-novo-form`:

```html
<!-- Antes: -->
<button class="btn-novo-form w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-2xl font-semibold shadow-sm cursor-pointer transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 hover:scale-105 active:scale-95 hover:shadow-md select-none leading-none pb-1" id="btn-novo-form" title="Novo formulário">+</button>

<!-- Depois: -->
<button class="btn-novo-form w-11 h-11 flex items-center justify-center rounded-xl border-none bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-bold shadow-lg shadow-blue-500/25 cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 active:scale-95 select-none leading-none" id="btn-novo-form" title="Novo formulário">+</button>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: enhance new-form button with blue gradient (item 5)"
```

---

### Task 6: Aumentar texto das etapas (Item 6)

**Files:**
- Modify: `style.css:44-75,276`

- [ ] **Step 1: Aumentar font-size dos steps**

Em `style.css`, na classe `.step`:
```css
/* Antes: */
.step {
  ...
  font-size: 0.875rem;
  ...
  padding: 6.5px 15px;
}

/* Depois: */
.step {
  ...
  font-size: 1rem;
  ...
  padding: 7px 17px;
}
```

- [ ] **Step 2: Ajustar media query mobile**

Em `style.css`, no media query `@media (max-width: 640px)`:
```css
/* Antes: */
.step { font-size: 0.775rem !important; padding: 6px 12px !important; }

/* Depois: */
.step { font-size: 0.85rem !important; padding: 6px 13px !important; }
```

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: increase step label font size to 1rem (item 6)"
```

---

### Task 7: Retorno — só nome do tipo de ordem (Item 7)

**Files:**
- Modify: `index.html:56`

- [ ] **Step 1: Atualizar texto inicial do #retorno-desc**

Em `index.html`:
```html
<!-- Antes: -->
<p class="text-base text-gray-600 mb-5" id="retorno-desc">Preencha as informações de retorno.</p>

<!-- Depois: -->
<p class="text-lg font-bold text-slate-800 mb-5" id="retorno-desc">—</p>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: retorno section shows only tipo de ordem name (item 7)"
```

---

### Task 8: Mover botões de navegação para o topo + remover rodapé (Item 8)

**Files:**
- Modify: `index.html:29-90` (reorganizar)
- Modify: `style.css:131-152,278` (ajustar estilos)

- [ ] **Step 1: Reorganizar index.html**

Mover `<div class="nav-buttons" id="nav-buttons">` (linhas 86-89) para logo após o fechamento de `</div>` da `.progress` (após linha 35).

A nova ordem no `index.html` deve ser:

```html
  <!-- Steps -->
  <div class="progress sticky top-0 z-10 bg-white/80 backdrop-blur-md pb-4 -mx-1 px-1 border-b border-slate-100 flex items-center justify-center mb-6 gap-1.5 sm:gap-2.5 flex-wrap" id="progress">
    <div class="step active" data-step="1">Iniciais</div>
    <div class="step" data-step="2">Equip.</div>
    <div class="step" data-step="3">Retorno</div>
    <div class="step" data-step="4">Anexos</div>
    <div class="step" data-step="5">Revisão</div>
  </div>

  <!-- Nav buttons moved to top -->
  <div class="nav-buttons flex justify-between" id="nav-buttons">
    <button class="btn btn-secondary" id="btn-anterior" disabled>← Anterior</button>
    <button class="btn btn-primary" id="btn-proximo">Avançar →</button>
  </div>

  <div class="error-msg ..." id="error-msg" style="display:none"></div>

  <div class="section-wrapper relative min-h-[320px]" id="section-wrapper">
    ...seções...
  </div>

  <!-- Fim do container — sem nav-buttons no rodapé -->
```

- [ ] **Step 2: Ajustar container e nav-buttons no style.css**

Remover o layout flex column com altura fixa do `.container`:
```css
/* Antes: */
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  padding-bottom: 0;
}

/* Depois: */
.container {
  padding-bottom: 0;
}
```

Simplificar `#section-wrapper` (remover flex: 1):
```css
/* Antes: */
#section-wrapper {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 16px;
}

/* Depois: */
#section-wrapper {
  overflow-y: auto;
  min-height: 320px;
  padding: 0 16px;
}
```

Ajustar `#nav-buttons` para o topo:
```css
/* Antes: */
#nav-buttons {
  flex-shrink: 0;
  z-index: 100;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  padding: 12px 16px;
}

/* Depois: */
#nav-buttons {
  flex-shrink: 0;
  z-index: 100;
  background: transparent;
  border-bottom: 1px solid #e5e7eb;
  padding: 8px 16px 12px;
  margin-bottom: 0;
}
```

Ajustar media query mobile:
```css
/* Substituir: */
.nav-buttons .btn { min-width: 100px !important; }
/* por: */
.nav-buttons .btn { min-width: 110px !important; }
```

- [ ] **Step 3: Rodar testes**

```bash
cd C:\web-projects\mail && npx vitest run
```
Esperado: todos os testes passam.

- [ ] **Step 4: Commit**

```bash
git add index.html style.css
git commit -m "feat: move nav buttons to top and remove empty footer (item 8)"
```

---

### Task 9: Bump SW cache version

**Files:**
- Modify: `sw.js`

- [ ] **Step 1: Incrementar CACHE_NAME**

Em `sw.js`, alterar:
```js
const CACHE_NAME = 'retorno-v20';
```
para:
```js
const CACHE_NAME = 'retorno-v21';
```

- [ ] **Step 2: Commit**

```bash
git add sw.js
git commit -m "chore: bump SW cache version after layout changes"
```

---

### Task 10: Verificação final

**Files:**
- All modified files

- [ ] **Step 1: Rodar suite completa de testes**

```bash
cd C:\web-projects\mail && npx vitest run
```
Esperado: todos os testes passam sem falhas.

- [ ] **Step 2: Verificar git status**

```bash
cd C:\web-projects\mail && git status
```
Esperado: working tree clean, sem arquivos não trackeados.
