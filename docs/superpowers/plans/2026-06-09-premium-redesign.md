# Premium Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenho visual completo do formulário "Retorno de Ordens" com estética SaaS Premium (estilo Linear/Stripe), mobile-first, mantendo toda a lógica JavaScript intacta.

**Architecture:** Reescrita de `style.css` (design system premium), `index.html` (nova estrutura com classes Tailwind), e ajustes nos módulos JS que geram HTML dinâmico (`styles.js`, `iniciais.js`, `equipment.js`, `retornos.js`, `attachments.js`). Bump de cache no `sw.js`.

**Tech Stack:** HTML5, Tailwind CSS 3.4, CSS custom (style.css), vanilla JS (ES6 modules), Vitest

**Spec:** `docs/superpowers/specs/2026-06-09-premium-redesign.md`

---

## File Structure

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `tailwind-input.css` | **Criar** | Input do Tailwind (diretivas base) para permitir `npm run build:css` |
| `style.css` | **Reescrever** | Design system premium: cores, botões, inputs, steps, container, header, sidebar |
| `index.html` | **Reescrever** | Nova estrutura HTML com classes Tailwind premium |
| `scripts/styles.js` | **Modificar** | Novas constantes INPUT_CLASS / SELECT_CLASS |
| `scripts/iniciais.js` | **Modificar** | Classes de label e grid atualizadas |
| `scripts/equipment.js` | **Modificar** | Classes de equipment-row, selects, inputs, botão remover |
| `scripts/retornos.js` | **Modificar** | Classes de label e textarea |
| `scripts/attachments.js` | **Modificar** | Classes de preview-item |
| `sw.js` | **Modificar** | Incrementar CACHE_NAME |

---

### Task 1: Criar tailwind-input.css e regenerar Tailwind

**Files:**
- Create: `tailwind-input.css`
- Regenerate: `tailwind.css`

- [ ] **Step 1: Criar tailwind-input.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 2: Rodar build do Tailwind**

Run: `npm run build:css`

Expected: `tailwind.css` é regenerado sem erros.

- [ ] **Step 3: Commit**

```bash
git add tailwind-input.css tailwind.css
git commit -m "chore: create tailwind-input.css for rebuildable Tailwind"
```

---

### Task 2: Reescrever style.css com design system premium

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Substituir todo o conteúdo de style.css**

Substituir o conteúdo completo de `style.css` pelo seguinte:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* === Reset === */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html { overflow: hidden; }
body { touch-action: manipulation; }

/* === Sections === */
.section { display: none; }
.section.active { display: block; }

/* === Section Transitions === */
@keyframes slideOutLeft {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(-30px); opacity: 0; }
}
@keyframes slideOutRight {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(30px); opacity: 0; }
}
@keyframes enterFromRight {
  from { transform: translateX(30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes enterFromLeft {
  from { transform: translateX(-30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.section.slide-out-left { animation: slideOutLeft 0.25s ease forwards; }
.section.slide-out-right { animation: slideOutRight 0.25s ease forwards; }
.section.section-enter-next { animation: enterFromRight 0.25s ease forwards; }
.section.section-enter-prev { animation: enterFromLeft 0.25s ease forwards; }

/* === Step Indicators (Pill Segments) === */
.step-label {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: #64748b;
  background: #f1f5f9;
  user-select: none;
  transition: all 0.2s ease;
  cursor: default;
}
.step-label.active {
  background: #2563eb;
  color: #fff;
  font-weight: 700;
}
.step-label.completed {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}

.step-current-text {
  color: #1d4ed8;
  font-size: 0.8125rem;
  font-weight: 700;
  text-align: center;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* === Container === */
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  padding-bottom: 0;
}

/* === Section Wrapper === */
#section-wrapper {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 16px;
}

/* === Buttons === */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  text-align: center;
  min-width: 120px;
  min-height: 44px;
  line-height: 1.5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}
.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  box-shadow: 0 3px 8px rgba(37, 99, 235, 0.2);
}
.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.25);
  transform: translateY(-1px);
}
.btn-primary:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.15);
}
.btn-secondary {
  background: #f1f5f9;
  color: #64748b;
  border: none;
  box-shadow: none;
}
.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
  color: #475569;
  transform: translateY(-1px);
}
.btn-secondary:active:not(:disabled) {
  transform: translateY(1px);
}
.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  box-shadow: 0 3px 8px rgba(5, 150, 105, 0.2);
}
.btn-success:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  box-shadow: 0 6px 16px rgba(5, 150, 105, 0.25);
  transform: translateY(-1px);
}
.btn-success:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 2px 6px rgba(5, 150, 105, 0.15);
}

#nav-buttons .btn {
  min-width: 100px;
}

/* === Field States === */
.field-error {
  display: none;
  color: #dc2626;
  font-size: 0.75rem;
  line-height: 1.3;
  margin-top: 2px;
}
.field-error.show { display: block; }
.equip-row .field-error { flex-basis: 100%; order: 99; }

input.error, select.error, textarea.error {
  border-color: #dc2626 !important;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.12) !important;
}

input.is-filled, select.is-filled, textarea.is-filled {
  background-color: #eff6ff !important;
  border-color: #2563eb !important;
  border-width: 2.5px !important;
}

/* === Toast === */
.toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  padding: 14px 28px;
  background: #1f2937;
  color: #fff;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  pointer-events: none;
  z-index: 999;
  opacity: 0;
  transition: all 0.4s ease;
  transform: translateX(-50%) translateY(80px);
}
.toast.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}
.toast.success { background: #16a34a !important; }

/* === Linha Data Grid === */
.linha-data {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
}
@media (max-width: 640px) {
  .linha-data { grid-template-columns: 1.4fr 1fr 1fr; }
}

/* === New Form Button === */
.btn-new-form {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  font-size: 20px;
  font-weight: 700;
  box-shadow: 0 3px 10px rgba(37,99,235,0.25);
  cursor: pointer;
  transition: all 0.15s;
}
.btn-new-form:hover {
  transform: scale(1.08);
  box-shadow: 0 5px 16px rgba(37,99,235,0.35);
}

/* === Hamburger === */
.hamburger {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border: none;
  border-radius: 10px;
  font-size: 1.25rem;
  cursor: pointer;
  color: #475569;
  transition: all 0.2s;
}
.hamburger:hover {
  color: #2563eb;
  background: #eff6ff;
}

/* === Sidebar === */
.sidebar {
  position: fixed;
  top: 0;
  left: -320px;
  width: 320px;
  height: 100%;
  height: 100dvh;
  background: #fff;
  box-shadow: 4px 0 24px rgba(0,0,0,0.12);
  z-index: 200;
  transition: left 0.3s ease;
  display: flex;
  flex-direction: column;
}
.sidebar-open .sidebar { left: 0; }
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 199;
  display: none;
}
.sidebar-open .sidebar-overlay { display: block; }
.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1rem;
}
.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}
.sidebar-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}
.sidebar-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  padding: 4px;
  line-height: 1;
  transition: color 0.2s;
}
.sidebar-close:hover { color: #0f172a; }
.sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}
.sidebar-empty {
  text-align: center;
  color: #94a3b8;
  padding: 40px 16px;
  font-size: 0.9375rem;
}
.sidebar-item {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 8px;
  background: #f8fafc;
  transition: border-color 0.15s;
}
.sidebar-item:hover { border-color: #cbd5e1; }
.sidebar-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.sidebar-item-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
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
.status-draft { background: #f1f5f9; color: #64748b; }
.status-sent { background: #d1fae5; color: #065f46; }
.sidebar-item-meta {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 8px;
}
.sidebar-item-actions { display: flex; gap: 8px; }
.sidebar-btn {
  flex: 1;
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.sidebar-btn-edit { background: #eff6ff; color: #2563eb; }
.sidebar-btn-edit:hover { background: #dbeafe; }
.sidebar-btn-delete { background: #fef2f2; color: #dc2626; }
.sidebar-btn-delete:hover { background: #fee2e2; }

/* === Orientation Overlay === */
.orientation-overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #fff;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
@media (orientation: landscape) and (max-height: 500px) {
  .orientation-overlay { display: flex; }
}
.orientation-overlay-content { text-align: center; padding: 24px; }
.orientation-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 16px;
  animation: rotate-phone 2s ease-in-out infinite;
}
.orientation-text { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
.orientation-sub { font-size: 0.875rem; color: #475569; }
@keyframes rotate-phone {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(90deg); }
}

/* === Mobile Adjustments === */
@media (max-width: 640px) {
  .step-label { font-size: 10px !important; padding: 7px 0 !important; }
  .preview-grid { grid-template-columns: repeat(2, 1fr) !important; }
  #nav-buttons .btn { min-width: 90px !important; padding: 8px 14px !important; font-size: 0.8125rem !important; }
}
```

- [ ] **Step 2: Verificar que o arquivo foi salvo corretamente**

Run: `Select-String -Path style.css -Pattern "step-label" | Select-Object -First 3`

Expected: Deve encontrar a nova definição de `.step-label` com `flex: 1`, `border-radius: 10px`, etc.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "style: rewrite style.css with SaaS Premium design system"
```

---

### Task 3: Reescrever index.html com nova estrutura

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Substituir o conteúdo do body no index.html**

Substituir **apenas o conteúdo dentro de `<body>`** (linhas 18-159) pelo seguinte:

```html
<body class="font-sans bg-gradient-to-br from-slate-100 to-blue-50 flex justify-center items-start min-h-screen p-0">

<div class="container bg-white rounded-[20px] shadow-sm border border-slate-200/50 w-full max-w-[640px] relative">
  <div class="flex justify-between items-center px-5 pt-3.5 pb-2.5">
    <button class="hamburger" id="hamburger">&#9776;</button>
    <h1 class="text-xl text-slate-900 font-bold m-0 tracking-tight">Retorno de Ordens</h1>
    <button class="btn-new-form" id="btn-novo-form" title="Novo formulário">+</button>
  </div>

  <div class="sticky top-0 z-10 bg-white/85 backdrop-blur-md pb-3 px-5 border-b border-slate-100 flex flex-col gap-2.5" id="progress">
    <div class="flex items-center gap-1.5" style="padding-top: 4px;">
      <div class="step-label" data-step="1">Inicio</div>
      <div class="step-label" data-step="2">Equip.</div>
      <div class="step-label" data-step="3">Retorno</div>
      <div class="step-label" data-step="4">Anexos</div>
      <div class="step-label" data-step="5">Revisão</div>
    </div>
    <div class="flex justify-between items-center gap-3" id="nav-buttons">
      <button class="btn btn-secondary" id="btn-anterior" disabled>← Anterior</button>
      <span class="step-current-text" id="step-current-text">Inicio</span>
      <button class="btn btn-primary" id="btn-proximo">Avançar →</button>
    </div>
  </div>

  <div class="bg-red-50 text-red-600 px-4 py-3 rounded-[10px] text-xs font-semibold border border-red-200 mx-4 mt-3" id="error-msg" style="display:none"></div>

  <div class="section-wrapper relative min-h-[320px]" id="section-wrapper">

    <div class="section active" id="section-1">
      <div id="iniciais-campos"></div>
    </div>

    <div class="section" id="section-2">
      <div id="equipamentos-list"></div>
      <div class="flex gap-3.5 items-center mt-2">
        <button class="btn-add flex-1 py-3 px-4 border-2 border-dashed border-slate-200 rounded-[10px] bg-slate-50/30 text-slate-600 text-sm font-semibold cursor-pointer transition-all duration-200 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/30" id="btn-add-equip" type="button">+ Adicionar equipamento</button>
      </div>
    </div>

    <div class="section" id="section-3">
      <p class="text-base font-bold text-slate-900 mb-4" id="retorno-desc">—</p>
      <div id="retorno-campos"></div>
    </div>

    <div class="section" id="section-4">
      <div class="file-upload-area border-2 border-dashed border-slate-200 rounded-[12px] py-8 px-5 text-center cursor-pointer transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/30 bg-slate-50/50" id="file-upload-area">
        <span class="text-3xl block mb-2">📎</span>
        <span class="text-sm text-slate-600 font-semibold">Clique para selecionar imagens</span>
        <span class="file-count block mt-1.5 text-xs text-slate-400 font-medium" id="file-count">0 / 12</span>
      </div>
      <input type="file" id="file-input" accept="image/*" multiple class="hidden">
      <div class="preview-grid grid grid-cols-4 max-sm:grid-cols-2 gap-2 mt-4" id="preview-grid"></div>
    </div>

    <div class="section" id="section-5">
      <div class="email-preview bg-slate-50/70 border border-slate-200 rounded-[12px] p-5">
        <div class="preview-value text-sm text-slate-800 whitespace-pre-wrap leading-relaxed" id="preview-corpo">—</div>
        <div class="mt-5 pt-4 border-t border-slate-200/60">
          <label for="complemento-corpo" class="block font-semibold text-sm text-slate-700 mb-1.5">Complemento do corpo (opcional)</label>
          <textarea id="complemento-corpo" rows="3" placeholder="Texto adicional para o corpo..." class="w-full px-3.5 py-3 border border-slate-200 rounded-[10px] text-sm font-sans text-slate-800 bg-white outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder-slate-400 resize-y min-h-[60px]"></textarea>
        </div>
      </div>
    </div>

  </div>
</div>

<div class="sidebar" id="sidebar">
  <div class="sidebar-inner">
    <div class="sidebar-head">
      <h2 class="sidebar-title">Registros</h2>
      <button class="sidebar-close" id="sidebar-close">&times;</button>
    </div>
    <input type="search" id="sidebar-filter" placeholder="Buscar por UC ou OS..." autocomplete="off" class="w-full px-4 py-3 mb-3 border border-slate-200 rounded-[10px] text-sm font-sans text-slate-900 bg-white outline-none transition-colors focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
    <div class="sidebar-list" id="sidebar-list"></div>
  </div>
</div>
<div class="sidebar-overlay" id="sidebar-overlay"></div>

<div class="toast" id="toast"></div>

<div class="modal-overlay fixed inset-0 bg-black/40 z-50 items-center justify-center hidden" id="modal-tipo">
  <div class="modal bg-white rounded-[12px] p-7 max-w-[420px] w-[90%] shadow-xl text-center">
    <p class="text-sm text-slate-600 mb-6 leading-relaxed">Ao alterar o Tipo de ordem, os campos de Retorno preenchidos serão perdidos.</p>
    <div class="flex gap-2.5 justify-center">
      <button class="btn btn-secondary" id="modal-cancel">Cancelar</button>
      <button class="btn btn-primary" id="modal-confirm">Alterar mesmo assim</button>
    </div>
  </div>
</div>

<div class="modal-overlay fixed inset-0 bg-black/40 z-50 items-center justify-center hidden" id="dup-modal">
  <div class="modal bg-white rounded-[12px] p-7 max-w-[420px] w-[90%] shadow-xl text-center">
    <p class="text-base font-bold text-slate-900 mb-3" id="dup-modal-title"></p>
    <p class="text-sm text-slate-600 mb-6 leading-relaxed" id="dup-modal-body"></p>
    <div class="flex gap-2.5 justify-center">
      <button class="btn btn-secondary" id="dup-modal-cancel">Cancelar</button>
      <button class="btn btn-primary" id="dup-modal-confirm">Reenviar</button>
    </div>
  </div>
</div>

<div class="lightbox-overlay fixed inset-0 bg-black/80 z-[1001] items-center justify-center hidden" id="lightbox">
  <button class="lightbox-close absolute top-5 right-7 bg-none border-none text-white text-3xl cursor-pointer" id="lightbox-close">✕</button>
  <img id="lightbox-img" src="" alt="Preview ampliado" class="max-w-[90vw] max-h-[90vh] rounded-[10px] shadow-2xl">
</div>

<div class="orientation-overlay" id="orientation-overlay">
  <div class="orientation-overlay-content">
    <div class="orientation-icon">📱</div>
    <p class="orientation-text">Gire o celular na vertical</p>
    <p class="orientation-sub">O formulário funciona melhor no modo retrato.</p>
  </div>
</div>

<div class="modal-overlay fixed inset-0 bg-black/40 z-50 items-center justify-center hidden" id="confirm-modal">
  <div class="modal bg-white rounded-[12px] p-7 max-w-[420px] w-[90%] shadow-xl text-center">
    <p class="text-sm text-slate-600 mb-6 leading-relaxed" id="confirm-modal-text"></p>
    <div class="flex gap-2.5 justify-center">
      <button class="btn btn-secondary" id="confirm-modal-cancel">Cancelar</button>
      <button class="btn btn-primary" id="confirm-modal-ok">Confirmar</button>
    </div>
  </div>
</div>

<div class="modal-overlay fixed inset-0 bg-black/40 z-50 items-center justify-center hidden" id="update-modal">
  <div class="modal bg-white rounded-[12px] p-7 max-w-[420px] w-[90%] shadow-xl text-center">
    <p class="text-base font-bold text-slate-900 mb-3">Sistema atualizado</p>
    <p class="text-sm text-slate-600 mb-6 leading-relaxed">O sistema foi atualizado com sucesso. Clique em OK para recarregar.</p>
    <div class="flex gap-2.5 justify-center">
      <button class="btn btn-primary" id="update-modal-ok">OK</button>
    </div>
  </div>
</div>

</body>
```

- [ ] **Step 2: Verificar que o HTML está válido**

Run: `npx netlify dev` e abrir no navegador. Verificar se a página carrega sem erros no console.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: redesign index.html with SaaS Premium layout"
```

---

### Task 4: Atualizar scripts/styles.js com novas classes de input

**Files:**
- Modify: `scripts/styles.js`

- [ ] **Step 1: Substituir o conteúdo de styles.js**

```js
// styles.js — constantes de classes CSS compartilhadas entre módulos.
// Evita a duplicação de strings longas de Tailwind em iniciais.js e retornos.js.

export const INPUT_CLASS =
  "w-full px-3.5 py-3 border border-slate-200 rounded-[10px] text-[15px] font-sans text-slate-900 bg-white outline-none transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder-slate-400";

export const SELECT_CLASS = INPUT_CLASS + " py-3";
```

- [ ] **Step 2: Commit**

```bash
git add scripts/styles.js
git commit -m "style: update INPUT_CLASS/SELECT_CLASS with premium design"
```

---

### Task 5: Atualizar scripts/iniciais.js com novas classes

**Files:**
- Modify: `scripts/iniciais.js`

- [ ] **Step 1: Atualizar a classe do label em renderIniciais**

Na função `renderIniciais`, alterar a linha 145:

De:
```js
label.className = "block font-semibold text-base text-gray-700 mb-1";
```

Para:
```js
label.className = "block font-semibold text-[13px] text-slate-600 mb-1";
```

- [ ] **Step 2: Commit**

```bash
git add scripts/iniciais.js
git commit -m "style: update iniciais.js label classes for premium design"
```

---

### Task 6: Atualizar scripts/equipment.js com novas classes

**Files:**
- Modify: `scripts/equipment.js`

- [ ] **Step 1: Atualizar classes da equipment row e seus filhos**

Na função `addEquip`, substituir o template `innerHTML` (linhas 8-24) por:

```js
div.className = "equip-row flex gap-2 items-center mb-4 p-3 bg-slate-50/50 border border-slate-200/50 rounded-[10px]";
div.innerHTML = `
  <select class="equip-tipo flex-1 min-w-0 px-3 py-3 border border-slate-200 rounded-[10px] text-sm outline-none bg-white transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-900 font-sans">
    <option value="">Selecione...</option>
    <option value="Instalado" ${data?.status === "Instalado" ? "selected" : ""}>Instalado</option>
    <option value="Retirado" ${data?.status === "Retirado" ? "selected" : ""}>Retirado</option>
  </select>
  <select class="equip-categoria flex-1 min-w-0 px-3 py-3 border border-slate-200 rounded-[10px] text-sm outline-none bg-white transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-900 font-sans">
    <option value="">Selecione...</option>
    <option value="Medidor" ${data?.categoria === "Medidor" ? "selected" : ""}>Medidor</option>
    <option value="Display" ${data?.categoria === "Display" ? "selected" : ""}>Display</option>
    <option value="Conjunto" ${data?.categoria === "Conjunto" ? "selected" : ""}>Conjunto</option>
    <option value="TC" ${data?.categoria === "TC" ? "selected" : ""}>TC</option>
    <option value="TP" ${data?.categoria === "TP" ? "selected" : ""}>TP</option>
  </select>
  <input type="number" class="equip-numero flex-1 min-w-0 px-3 py-3 border border-slate-200 rounded-[10px] text-sm outline-none bg-white transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-900 font-sans placeholder-slate-400" placeholder="N\u00B0" value="${data?.numero || ""}">
  <button class="btn-remove w-9 h-9 border-none rounded-[8px] bg-red-50 text-red-500 text-sm cursor-pointer flex-shrink-0 transition-all duration-200 flex items-center justify-center hover:bg-red-100 active:scale-95" type="button">\u2715</button>
`;
```

- [ ] **Step 2: Atualizar classe da mensagem vazia**

Na função `showEmptyEquip`, alterar a linha 46:

De:
```js
msg.className = "empty-msg text-center text-slate-400 text-sm font-medium py-8 bg-slate-50/30 border border-dashed border-slate-200 rounded-xl mb-4";
```

Para:
```js
msg.className = "empty-msg text-center text-slate-400 text-sm font-medium py-8 bg-slate-50/30 border border-dashed border-slate-200 rounded-[10px] mb-4";
```

- [ ] **Step 3: Commit**

```bash
git add scripts/equipment.js
git commit -m "style: update equipment.js classes for premium design"
```

---

### Task 7: Atualizar scripts/retornos.js com novas classes

**Files:**
- Modify: `scripts/retornos.js`

- [ ] **Step 1: Atualizar classes do label e descrição**

Na função `renderRetorno`, alterar a linha 14:

De:
```js
DOM.retornoDesc.innerHTML = `<span class="text-lg font-bold text-slate-800">${tipoLabel}</span>`;
```

Para:
```js
DOM.retornoDesc.innerHTML = `<span class="text-base font-bold text-slate-900">${tipoLabel}</span>`;
```

E alterar a linha 23:

De:
```js
label.className = "block font-semibold text-base text-gray-700 mb-1";
```

Para:
```js
label.className = "block font-semibold text-[13px] text-slate-600 mb-1";
```

- [ ] **Step 2: Commit**

```bash
git add scripts/retornos.js
git commit -m "style: update retornos.js classes for premium design"
```

---

### Task 8: Atualizar scripts/attachments.js com novas classes

**Files:**
- Modify: `scripts/attachments.js`

- [ ] **Step 1: Atualizar classes dos preview items**

Na função `renderPreviews`, alterar a linha 37:

De:
```js
div.className = "preview-item relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50 cursor-pointer";
```

Para:
```js
div.className = "preview-item relative border border-slate-200 rounded-[10px] overflow-hidden bg-slate-50 cursor-pointer transition-all duration-200 hover:border-blue-300";
```

- [ ] **Step 2: Commit**

```bash
git add scripts/attachments.js
git commit -m "style: update attachments.js preview classes for premium design"
```

---

### Task 9: Bump do cache no sw.js e testes finais

**Files:**
- Modify: `sw.js`

- [ ] **Step 1: Incrementar CACHE_NAME**

Na linha 1 de `sw.js`, alterar:

De:
```js
const CACHE_NAME = 'retorno-v40';
```

Para:
```js
const CACHE_NAME = 'retorno-v41';
```

- [ ] **Step 2: Rodar testes**

Run: `npm test`

Expected: Todos os testes passam sem falhas.

- [ ] **Step 3: Regenerar Tailwind (garantir que novas classes estão compiladas)**

Run: `npm run build:css`

Expected: `tailwind.css` regenerado sem erros.

- [ ] **Step 4: Commit final**

```bash
git add sw.js tailwind.css
git commit -m "chore: bump SW cache v40 → v41, rebuild tailwind.css"
```

---

### Task 10: Verificação visual e commit de integração

- [ ] **Step 1: Iniciar servidor local**

Run: `npx netlify dev`

- [ ] **Step 2: Verificação visual checklist**

Abrir `http://localhost:8888` e verificar:

- [ ] Container com bordas arredondadas (20px) e sombra sutil
- [ ] Header com hamburger (fundo slate-100, rounded-10px), título 20px bold, botão + azul
- [ ] Steps em formato pill segment (ativo azul, inativos cinza)
- [ ] Botões "Anterior" (cinza) e "Avançar" (azul gradiente) com min-height 44px
- [ ] Inputs com borda 1.5px, rounded-10px, foco com ring azul
- [ ] Sidebar abre/fecha corretamente
- [ ] Navegação entre seções funciona (5 steps)
- [ ] Upload de imagens funciona
- [ ] Toast aparece corretamente
- [ ] Modais funcionam
- [ ] Layout responsivo em mobile (< 640px)

- [ ] **Step 3: Commit final de integração (se necessário)**

```bash
git add -A
git commit -m "feat: premium SaaS redesign complete"
```
