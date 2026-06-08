# Melhorias no Formulário e Sidebar - Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar 8 melhorias no formulário de retorno: persistência de anexos, ajustes visuais, steps clicáveis, validações e campo de coordenadas GPS.

**Architecture:** Mudanças distribuídas em múltiplos módulos JS (state.js, validation.js, navigation.js, iniciais.js, etc.) e arquivos de estilo (index.html, style.css). Cada melhoria é independente e pode ser implementada separadamente. Service Worker cache bump no final.

**Tech Stack:** Vanilla JS (ES6 modules), IndexedDB, Tailwind CSS, Service Worker

---

## Task 1: Persistir Anexos no IndexedDB

**Files:**
- Modify: `scripts/utils.js` (adicionar função base64ToBlob)
- Modify: `scripts/state.js` (salvar anexos como base64)
- Modify: `scripts/restore.js` (reconstruir File objects)

- [ ] **Step 1: Adicionar função base64ToBlob em utils.js**

```javascript
export function base64ToBlob(base64, type) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type });
}
```

- [ ] **Step 2: Modificar saveState() em state.js para salvar anexos**

Adicionar após linha 68 (antes de `composicao`):

```javascript
const attachmentsData = await Promise.all(
  state.attachments.map(async (file) => ({
    name: file.name,
    type: file.type,
    data: await toBase64(file),
  }))
);
```

Adicionar no objeto `data` (linha 73):

```javascript
attachments: attachmentsData,
```

Adicionar import no topo:

```javascript
import { toBase64 } from "./utils.js";
```

- [ ] **Step 3: Modificar restore.js para reconstruir anexos**

Adicionar import no topo:

```javascript
import { base64ToBlob } from "./utils.js";
```

Adicionar em applyRecord() após linha 14 (após `state._createdAt = record.createdAt;`):

```javascript
if (record.attachments && Array.isArray(record.attachments)) {
  state.attachments = record.attachments.map((att) => {
    const blob = base64ToBlob(att.data, att.type);
    return new File([blob], att.name, { type: att.type });
  });
} else {
  state.attachments = [];
}
```

- [ ] **Step 4: Testar manualmente**

1. Anexar 2-3 arquivos
2. Recarregar a página
3. Verificar se os arquivos aparecem novamente
4. Verificar se podem ser removidos e enviados

- [ ] **Step 5: Commit**

```bash
git add scripts/utils.js scripts/state.js scripts/restore.js
git commit -m "feat: persist attachments in IndexedDB as base64"
```

---

## Task 2: Espaçamento do Filtro na Sidebar

**Files:**
- Modify: `scripts/sidebar.js:20` (remover mx-4)
- Modify: `style.css` (adicionar padding em .sidebar-inner)

- [ ] **Step 1: Remover mx-4 do input de filtro**

Em `scripts/sidebar.js` linha 20, alterar:

```javascript
<input type="search" id="sidebar-filter" placeholder="Buscar por UC ou OS..." autocomplete="off" class="w-full px-4 py-3 mb-3 border border-gray-300 rounded-lg text-sm font-sans text-gray-900 bg-white outline-none transition-colors focus:border-blue-600 focus:ring-3 focus:ring-blue-600/15">
```

(remover `mx-4`, adicionar `w-full`)

- [ ] **Step 2: Adicionar padding em .sidebar-inner**

Em `style.css`, após `.sidebar-inner {` (linha 251), adicionar:

```css
padding: 1rem;
```

- [ ] **Step 3: Testar visualmente**

1. Abrir sidebar
2. Verificar se o filtro tem espaçamento adequado nas laterais
3. Verificar se outros elementos da sidebar estão alinhados

- [ ] **Step 4: Commit**

```bash
git add scripts/sidebar.js style.css
git commit -m "fix: improve sidebar filter spacing"
```

---

## Task 3: Espaço no Topo do Container

**Files:**
- Modify: `index.html:20`

- [ ] **Step 1: Adicionar pt-4 ao container**

Em `index.html` linha 20, alterar:

```html
<div class="container bg-gray-50 rounded-xl shadow-lg p-1 pt-4 w-full max-w-[640px] relative">
```

- [ ] **Step 2: Testar visualmente**

Verificar se há espaço adequado no topo do container

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "fix: add top padding to main container"
```

---

## Task 4: Step Indicators Clicáveis

**Files:**
- Modify: `scripts/navigation.js` (adicionar listeners)
- Modify: `style.css` (adicionar estilos de hover e ativo)

- [ ] **Step 1: Adicionar estilos CSS para steps**

Em `style.css`, após `.step {` (linha 130), adicionar:

```css
cursor: pointer;
transition: background-color 0.2s;
```

Adicionar nova regra:

```css
.step:hover {
  background-color: #eff6ff;
}

.step.active {
  background-color: #dbeafe;
}
```

- [ ] **Step 2: Adicionar listeners de click em navigation.js**

Em `showSection()` função, após linha 60 (após atualizar `.step-line`), adicionar:

```javascript
DOM.steps.forEach((el, i) => {
  el.onclick = () => {
    if (state.animating) return;
    showSection(i + 1, i + 1 > state.currentSection ? "next" : "prev", true);
  };
});
```

- [ ] **Step 3: Testar manualmente**

1. Clicar em cada step (1-5)
2. Verificar se navega corretamente
3. Verificar se o step ativo tem fundo azul claro
4. Verificar hover effect

- [ ] **Step 4: Commit**

```bash
git add scripts/navigation.js style.css
git commit -m "feat: make step indicators clickable with active highlight"
```

---

## Task 5: Fundo Interno Mais Escuro

**Files:**
- Modify: `index.html:20`

- [ ] **Step 1: Trocar bg-gray-50 para bg-gray-100**

Em `index.html` linha 20, alterar:

```html
<div class="container bg-gray-100 rounded-xl shadow-lg p-1 pt-4 w-full max-w-[640px] relative">
```

- [ ] **Step 2: Testar visualmente**

Verificar se a cor de fundo está mais escura e agradável

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "fix: darken inner background to bg-gray-100"
```

---

## Task 6: Validação de Data e Hora

**Files:**
- Modify: `scripts/validation.js`

- [ ] **Step 1: Adicionar validação de data futura**

Em `validation.js`, dentro de `if (n === 1)` (após linha 24), adicionar:

```javascript
const dataEl = document.getElementById("data");
if (dataEl && dataEl.value) {
  const selectedDate = new Date(dataEl.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate > today) {
    dataEl.classList.add("error");
    showError("Data não pode ser futura.");
    valid = false;
  }
}
```

- [ ] **Step 2: Adicionar validação de hora fim > hora início**

Após a validação de data (Step 1), adicionar:

```javascript
const horaInicioEl = document.getElementById("hora_inicio");
const horaFimEl = document.getElementById("hora_fim");
if (horaInicioEl && horaFimEl && horaInicioEl.value && horaFimEl.value) {
  if (horaFimEl.value <= horaInicioEl.value) {
    horaFimEl.classList.add("error");
    showError("Hora fim deve ser maior que hora início.");
    valid = false;
  }
}
```

- [ ] **Step 3: Testar manualmente**

1. Tentar salvar com data futura → deve mostrar erro
2. Tentar salvar com hora fim <= hora início → deve mostrar erro
3. Tentar salvar com valores válidos → deve funcionar

- [ ] **Step 4: Commit**

```bash
git add scripts/validation.js
git commit -m "feat: validate date not future and end time > start time"
```

---

## Task 7: Campo Coordenadas GPS

**Files:**
- Modify: `scripts/fields.js` (adicionar campo)
- Modify: `scripts/iniciais.js` (renderizar campo readonly)
- Modify: `scripts/app.js` (capturar geolocalização)
- Modify: `scripts/reset.js` (capturar ao resetar)

- [ ] **Step 1: Adicionar campo coordenadas em fields.js**

No início do array `iniciaisFields` (linha 3), adicionar:

```javascript
{ linha: 0, nome: "coordenadas", label: "Coordenadas", tipo: "coordinates", readonly: true },
```

- [ ] **Step 2: Renderizar campo readonly em iniciais.js**

Em `renderIniciais()`, dentro do `else if (field.tipo === "time")` (após linha 66), adicionar:

```javascript
} else if (field.tipo === "coordinates") {
  input = document.createElement("input");
  input.type = "text";
  input.readOnly = true;
  input.className = inputClass + " bg-gray-100 cursor-not-allowed";
}
```

- [ ] **Step 3: Criar função de captura de geolocalização**

Em `app.js`, adicionar função:

```javascript
async function captureCoordinates() {
  const coordEl = document.getElementById("coordenadas");
  if (!coordEl) return;
  
  if (!navigator.geolocation) {
    coordEl.value = "Não disponível";
    return;
  }
  
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        enableHighAccuracy: false,
      });
    });
    
    const lat = position.coords.latitude.toFixed(4);
    const lon = position.coords.longitude.toFixed(4);
    coordEl.value = `${lat}, ${lon}`;
  } catch (err) {
    coordEl.value = "Não disponível";
  }
}
```

- [ ] **Step 4: Chamar captureCoordinates() ao inicializar**

Em `app.js`, dentro de `DOMContentLoaded` (após linha 82), adicionar:

```javascript
await captureCoordinates();
```

- [ ] **Step 5: Chamar captureCoordinates() ao resetar**

Em `reset.js`, importar `captureCoordinates` do `app.js` e chamar após `renderIniciais()`:

```javascript
import { captureCoordinates } from "./app.js";
```

Após linha 9 (`renderIniciais();`), adicionar:

```javascript
captureCoordinates();
```

**Nota:** Como `captureCoordinates` é async e `resetForm` é sync, podemos chamá-la sem await (fire-and-forget).

- [ ] **Step 6: Testar manualmente**

1. Criar novo registro → coordenadas devem ser capturadas automaticamente
2. Verificar se o campo é readonly
3. Negar permissão de geolocalização → deve mostrar "Não disponível"
4. Resetar formulário → coordenadas devem ser recapturadas

- [ ] **Step 7: Commit**

```bash
git add scripts/fields.js scripts/iniciais.js scripts/app.js scripts/reset.js
git commit -m "feat: add GPS coordinates field with auto-capture"
```

---

## Task 8: Bump de Cache do Service Worker

**Files:**
- Modify: `sw.js`

- [ ] **Step 1: Incrementar CACHE_NAME**

Em `sw.js` linha 1, alterar:

```javascript
const CACHE_NAME = 'retorno-v5';
```

- [ ] **Step 2: Commit e push**

```bash
git add sw.js
git commit -m "fix: bump CACHE_NAME to retorno-v5"
git push
```

---

## Task 9: Testes Finais e Documentação

- [ ] **Step 1: Testar todas as funcionalidades**

1. Anexos persistem após reload
2. Sidebar com espaçamento correto
3. Container com padding-top
4. Steps clicáveis funcionam
5. Fundo interno mais escuro
6. Validações de data/hora funcionam
7. Coordenadas GPS capturadas automaticamente
8. PWA atualiza corretamente

- [ ] **Step 2: Atualizar AGENTS.md**

Adicionar nota sobre persistência de anexos em IndexedDB:

```markdown
## IndexedDB
- **Store:** `records` (keyPath: `uuid`)
- **Attachments:** salvos como base64 no campo `attachments` do record
```

- [ ] **Step 3: Commit final**

```bash
git add AGENTS.md
git commit -m "docs: document attachment persistence in AGENTS.md"
git push
```
