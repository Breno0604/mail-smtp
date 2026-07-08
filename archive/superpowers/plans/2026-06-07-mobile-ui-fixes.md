# Mobile Android UI Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar 5 melhorias de UI/UX para mobile Android: dismiss teclado ao tocar fora, bloquear zoom acidental, modo retrato, scroll ao topo na navegação, e alto contraste em textos.

**Architecture:** Mudanças puramente CSS/JS no frontend existente. Nenhuma alteração no backend (Netlify Function) ou no fluxo de dados. Cada melhoria é independente e pode ser implementada em qualquer ordem.

**Tech Stack:** HTML5, Tailwind CSS (CDN), vanilla JS, style.css

---

### Task 1: Não permitir zoom acidental ao clicar em campos

**Files:**

- Modify: `style.css`

- [ ] **Step 1: Adicionar `touch-action: manipulation` no body**

Adicionar no `style.css`:

```css
body {
  touch-action: manipulation;
}
```

Isso desativa o duplo-toque para zoom e o pinça em toda a página, sem afetar o scroll. Substitui a necessidade de `user-scalable=no` no viewport meta.

- [ ] **Step 2: Commit**

```bash
git add style.css
git commit -m "fix: touch-action manipulation para evitar zoom acidental em campos"
```

---

### Task 2: Modo retrato obrigatório (overlay landscape)

**Files:**

- Modify: `index.html`
- Modify: `style.css`

- [ ] **Step 1: Adicionar overlay de orientação no HTML**

Adicionar antes de `</body>` em `index.html`:

```html
<div class="orientation-overlay" id="orientation-overlay">
  <div class="orientation-overlay-content">
    <span class="orientation-icon">📱</span>
    <p class="orientation-text">Gire o celular na vertical</p>
    <p class="orientation-sub">O formulário funciona melhor no modo retrato.</p>
  </div>
</div>
```

- [ ] **Step 2: Adicionar CSS do overlay**

Adicionar no `style.css`:

```css
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
  .orientation-overlay {
    display: flex;
  }
}

.orientation-overlay-content {
  text-align: center;
  padding: 24px;
}

.orientation-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 16px;
  animation: rotate-phone 2s ease-in-out infinite;
}

.orientation-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.orientation-sub {
  font-size: 0.875rem;
  color: #6b7280;
}

@keyframes rotate-phone {
  0%,
  100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(90deg);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add index.html style.css
git commit -m "feat: overlay de orientacao retrato obrigatorio para mobile"
```

---

### Task 3: Voltar ao topo ao mudar de seção

**Files:**

- Modify: `scripts/navigation.js`

- [ ] **Step 1: Adicionar scrollTop = 0 no showSection**

Em `scripts/navigation.js`, após a linha `hideError();`, adicionar:

```javascript
DOM.wrapper.scrollTop = 0;
```

O trecho final fica:

```javascript
hideError();
DOM.wrapper.scrollTop = 0;
state.currentSection = n;
saveState();
```

- [ ] **Step 2: Commit**

```bash
git add scripts/navigation.js
git commit -m "fix: scroll ao topo da section-wrapper ao navegar entre secoes"
```

---

### Task 4: Fechar teclado ao tocar fora do campo

**Files:**

- Modify: `scripts/app.js`

- [ ] **Step 1: Adicionar event listener de dismiss do teclado**

Adicionar no final de `initEvents()` em `scripts/app.js`:

```javascript
document.addEventListener('pointerdown', e => {
  if (
    e.target.tagName !== 'INPUT' &&
    e.target.tagName !== 'SELECT' &&
    e.target.tagName !== 'TEXTAREA'
  ) {
    document.activeElement?.blur();
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add scripts/app.js
git commit -m "fix: dismiss teclado ao tocar fora do campo"
```

---

### Task 5: Textos com alto contraste

**Files:**

- Modify: `index.html`
- Modify: `style.css`

- [ ] **Step 1: Ajustar classes de cor no HTML**

Buscar e substituir classes de cor com contraste insuficiente em `index.html`:

| Classe antiga             | Contraste (branco) | Nova classe                                       |
| ------------------------- | ------------------ | ------------------------------------------------- |
| `text-gray-400` (#9CA3AF) | 2.9:1              | `text-gray-600` (#4B5563)                         |
| `text-gray-500` (#6B7280) | 4.2:1              | `text-gray-600` (#4B5563) — ou manter se >= 4.5:1 |

No `index.html`:

- `text-gray-500` no `btn-link` (Limpar tudo) → `text-gray-600`
- `text-gray-500` nos `.step-label` → `text-gray-600`
- `text-gray-500` no `#retorno-desc` → `text-gray-600`
- `text-gray-400` no `file-count` → `text-gray-500`
- `text-gray-400` no `.empty-msg` (equipment.js) → deixar como está (é JS, não HTML)

- [ ] **Step 2: Ajustar cores no CSS**

Em `style.css`:

- `.step.done .step-circle` — verificar `color`
- `.toast` já é `#1f2937` (contraste 14:1) — OK
- `.btn-secondary` — `color: #374151` (7:1) — OK
- `.btn-link` — sem estilo específico no CSS, usa classes Tailwind

- [ ] **Step 3: Commit**

```bash
git add index.html style.css
git commit -m "fix: alto contraste em textos para legibilidade em luz solar"
```
