# Time Picker Customizado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir `<input type="time">` nativo por modal customizado com rolos de hora/minuto para corrigir truncamento no Android.

**Architecture:** Novo módulo `timepicker.js` exporta `createTimePicker(input)` que esconde o input original, cria um display readonly e abre um modal com dois rolos scrolláveis (hora 00-23, minuto 00-59 passo 5). O modal é montado em JavaScript puro, estilizado com Tailwind, e fecha ao confirmar/cancelar.

**Tech Stack:** Vanilla JS (ES6 modules), Tailwind CSS, sem dependências externas.

---

## File Structure

| Arquivo | Ação | Responsabilidade |
|---------|------|------------------|
| `scripts/timepicker.js` | **Criar** | Módulo do picker: `createTimePicker()`, modal DOM, scroll snap, eventos |
| `scripts/iniciais.js` | **Modificar** | Substituir `input.type = "time"` por chamada ao `createTimePicker()` |
| `index.html` | **Modificar** | Adicionar import do módulo `timepicker.js` |
| `sw.js` | **Modificar** | Bump `CACHE_NAME` de `retorno-v5` para `retorno-v6` |

---

### Task 1: Criar `scripts/timepicker.js` — Estrutura base e export

**Files:**
- Create: `scripts/timepicker.js`

- [ ] **Step 1: Criar o arquivo com a estrutura do módulo**

```javascript
/**
 * Time Picker Customizado
 * Substitui <input type="time"> nativo por modal com rolos de hora/minuto.
 */

export function createTimePicker(originalInput) {
  // Esconde o input original (mantém value para validação/persistência)
  originalInput.type = "hidden";

  // Cria input de display (readonly, clicável)
  const displayInput = document.createElement("input");
  displayInput.type = "text";
  displayInput.readOnly = true;
  displayInput.className = originalInput.className;
  displayInput.placeholder = "HH:MM";
  displayInput.style.cursor = "pointer";

  // Atualiza display quando o valor do input original muda (ex: restore)
  const updateDisplay = () => {
    displayInput.value = originalInput.value || "";
  };

  // Observer para detectar mudanças externas no value (restore do IndexedDB)
  const observer = new MutationObserver(updateDisplay);
  observer.observe(originalInput, { attributes: true, attributeFilter: ["value"] });

  // Inicializa display
  updateDisplay();

  // Substitui o input original no DOM
  originalInput.parentNode.insertBefore(displayInput, originalInput.nextSibling);

  // Abre modal ao clicar no display
  displayInput.addEventListener("click", () => openModal());

  function openModal() {
    // TODO: implementar modal
  }

  return { displayInput, updateDisplay };
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/timepicker.js
git commit -m "feat: add timepicker module skeleton"
```

---

### Task 2: Implementar o modal DOM e abertura/fechamento

**Files:**
- Modify: `scripts/timepicker.js`

- [ ] **Step 1: Adicionar função `buildModal()` e lógica de abertura/fechamento**

Adicionar dentro do módulo `timepicker.js`, substituindo o `openModal` vazio:

```javascript
function buildModal() {
  // Overlay
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/50";

  // Container
  const container = document.createElement("div");
  container.className = "bg-white rounded-2xl shadow-xl w-80 overflow-hidden";

  // Header com display do horário
  const header = document.createElement("div");
  header.className = "bg-blue-600 text-white text-5xl font-bold py-6 text-center";
  header.id = "tp-display";
  header.textContent = "00:00";

  // Corpo com rolos
  const body = document.createElement("div");
  body.className = "flex justify-center gap-6 py-4 px-6";

  // Rolo de horas
  const hourColumn = document.createElement("div");
  hourColumn.className = "flex flex-col items-center";
  const hourLabel = document.createElement("div");
  hourLabel.className = "text-sm text-gray-500 mb-2";
  hourLabel.textContent = "Hora";
  const hourRoller = document.createElement("div");
  hourRoller.className = "h-48 w-16 overflow-y-scroll snap-y snap-mandatory scrollbar-hide";
  hourRoller.id = "tp-hours";

  for (let h = 0; h < 24; h++) {
    const item = document.createElement("div");
    item.className = "h-12 flex items-center justify-center snap-center text-lg text-gray-700 rounded-lg cursor-pointer transition-colors";
    item.textContent = String(h).padStart(2, "0");
    item.dataset.value = h;
    hourRoller.appendChild(item);
  }

  hourColumn.appendChild(hourLabel);
  hourColumn.appendChild(hourRoller);

  // Rolo de minutos (passo 5)
  const minuteColumn = document.createElement("div");
  minuteColumn.className = "flex flex-col items-center";
  const minuteLabel = document.createElement("div");
  minuteLabel.className = "text-sm text-gray-500 mb-2";
  minuteLabel.textContent = "Minuto";
  const minuteRoller = document.createElement("div");
  minuteRoller.className = "h-48 w-16 overflow-y-scroll snap-y snap-mandatory scrollbar-hide";
  minuteRoller.id = "tp-minutes";

  for (let m = 0; m < 60; m += 5) {
    const item = document.createElement("div");
    item.className = "h-12 flex items-center justify-center snap-center text-lg text-gray-700 rounded-lg cursor-pointer transition-colors";
    item.textContent = String(m).padStart(2, "0");
    item.dataset.value = m;
    minuteRoller.appendChild(item);
  }

  minuteColumn.appendChild(minuteLabel);
  minuteColumn.appendChild(minuteRoller);

  body.appendChild(hourColumn);
  body.appendChild(minuteColumn);

  // Footer com botões
  const footer = document.createElement("div");
  footer.className = "flex border-t border-gray-200";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "flex-1 py-3 text-blue-600 font-semibold hover:bg-gray-50 transition-colors";
  cancelBtn.textContent = "Cancelar";

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = "flex-1 py-3 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors";
  confirmBtn.textContent = "Confirmar";

  footer.appendChild(cancelBtn);
  footer.appendChild(confirmBtn);

  container.appendChild(header);
  container.appendChild(body);
  container.appendChild(footer);
  overlay.appendChild(container);

  return { overlay, header, hourRoller, minuteRoller, cancelBtn, confirmBtn };
}
```

- [ ] **Step 2: Atualizar `openModal()` para usar `buildModal()`**

```javascript
let currentModal = null;

function openModal() {
  if (currentModal) return;

  const { overlay, header, hourRoller, minuteRoller, cancelBtn, confirmBtn } = buildModal();

  // Parse valor atual
  const parts = (originalInput.value || "00:00").split(":");
  let selectedHour = parseInt(parts[0]) || 0;
  let selectedMinute = parseInt(parts[1]) || 0;

  // Scroll inicial para o valor selecionado
  const scrollToValue = (roller, value) => {
    const items = roller.querySelectorAll("[data-value]");
    const target = Array.from(items).find(el => parseInt(el.dataset.value) === value);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ block: "center", behavior: "instant" });
      }, 10);
    }
  };

  scrollToValue(hourRoller, selectedHour);
  scrollToValue(minuteRoller, selectedMinute);

  // Atualizar header ao rolar
  const updateHeader = () => {
    const hourItems = hourRoller.querySelectorAll("[data-value]");
    const minuteItems = minuteRoller.querySelectorAll("[data-value]");
    const centerHour = getCenterItem(hourRoller, hourItems);
    const centerMinute = getCenterItem(minuteRoller, minuteItems);
    selectedHour = parseInt(centerHour.dataset.value);
    selectedMinute = parseInt(centerMinute.dataset.value);
    header.textContent = `${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`;
  };

  hourRoller.addEventListener("scroll", updateHeader);
  minuteRoller.addEventListener("scroll", updateHeader);

  // Destacar item central
  const highlightCenter = (roller) => {
    const items = roller.querySelectorAll("[data-value]");
    items.forEach(item => {
      item.classList.remove("bg-blue-600", "text-white");
      item.classList.add("text-gray-700");
    });
    const center = getCenterItem(roller, items);
    if (center) {
      center.classList.add("bg-blue-600", "text-white");
      center.classList.remove("text-gray-700");
    }
  };

  hourRoller.addEventListener("scroll", () => highlightCenter(hourRoller));
  minuteRoller.addEventListener("scroll", () => highlightCenter(minuteRoller));

  // Fechar modal
  const closeModal = () => {
    overlay.remove();
    currentModal = null;
    document.body.style.overflow = "";
  };

  // Cancelar
  cancelBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  // Confirmar
  confirmBtn.addEventListener("click", () => {
    originalInput.value = `${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`;
    updateDisplay();
    originalInput.dispatchEvent(new Event("change", { bubbles: true }));
    closeModal();
  });

  // Mostrar modal
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";
  currentModal = overlay;

  // Highlight inicial
  setTimeout(() => {
    highlightCenter(hourRoller);
    highlightCenter(minuteRoller);
  }, 50);
}

function getCenterItem(roller, items) {
  const rollerRect = roller.getBoundingClientRect();
  const center = rollerRect.top + rollerRect.height / 2;
  let closest = items[0];
  let minDist = Infinity;
  items.forEach(item => {
    const rect = item.getBoundingClientRect();
    const itemCenter = rect.top + rect.height / 2;
    const dist = Math.abs(itemCenter - center);
    if (dist < minDist) {
      minDist = dist;
      closest = item;
    }
  });
  return closest;
}
```

- [ ] **Step 3: Adicionar CSS para esconder scrollbar nos rolos**

Adicionar no final de `tailwind-input.css` (ou `style.css` se não usar build):

```css
/* Time Picker - hide scrollbar */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

- [ ] **Step 4: Commit**

```bash
git add scripts/timepicker.js tailwind-input.css
git commit -m "feat: implement time picker modal with hour/minute rollers"
```

---

### Task 3: Integrar `timepicker.js` no `iniciais.js`

**Files:**
- Modify: `scripts/iniciais.js:64-67`
- Modify: `index.html` (adicionar import)

- [ ] **Step 1: Modificar `iniciais.js` para usar o time picker**

Substituir o bloco `else if (field.tipo === "time")` (linhas 64-67):

```javascript
    } else if (field.tipo === "time") {
      input = document.createElement("input");
      input.type = "time";
      input.className = inputClass;
    }
```

Por:

```javascript
    } else if (field.tipo === "time") {
      input = document.createElement("input");
      input.type = "time";
      input.className = inputClass;
      // Deferir criação do picker até o input estar no DOM
      setTimeout(() => {
        import("./timepicker.js").then(({ createTimePicker }) => {
          createTimePicker(input);
        });
      }, 0);
    }
```

- [ ] **Step 2: Adicionar import do timepicker no `index.html`**

No bloco de imports de módulos em `index.html`, adicionar:

```html
<script type="module" src="scripts/timepicker.js"></script>
```

Nota: O import dinâmico em `iniciais.js` já carrega o módulo, mas adicionar o import estático garante que o módulo seja cacheado pelo Service Worker.

- [ ] **Step 3: Commit**

```bash
git add scripts/iniciais.js index.html
git commit -m "feat: integrate custom time picker into iniciais form"
```

---

### Task 4: Atualizar Service Worker cache

**Files:**
- Modify: `sw.js`

- [ ] **Step 1: Bump do CACHE_NAME**

Alterar linha:
```javascript
const CACHE_NAME = 'retorno-v5';
```

Para:
```javascript
const CACHE_NAME = 'retorno-v6';
```

- [ ] **Step 2: Commit**

```bash
git add sw.js
git commit -m "chore: bump SW cache version to retorno-v6"
```

---

### Task 5: Testes manuais de verificação

- [ ] **Step 1: Testar abertura do modal**
  - Abrir `index.html` via `npx netlify dev`
  - Navegar até a seção "Iniciais"
  - Tocar no campo "Início" (hora)
  - Verificar: modal abre com rolos de hora e minuto

- [ ] **Step 2: Testar scroll e seleção**
  - Rolar hora até "11"
  - Rolar minuto até "35"
  - Verificar: header mostra "11:35", item central destacado em azul

- [ ] **Step 3: Testar confirmar**
  - Clicar "Confirmar"
  - Verificar: modal fecha, campo mostra "11:35"

- [ ] **Step 4: Testar cancelar**
  - Abrir modal novamente, mudar valores
  - Clicar "Cancelar"
  - Verificar: modal fecha, campo mantém valor anterior

- [ ] **Step 5: Testar validação**
  - Preencher hora início "08:00"
  - Preencher hora fim "07:00"
  - Verificar: erro "Hora fim deve ser maior que hora início"

- [ ] **Step 6: Testar persistência**
  - Preencher formulário com horas
  - Salvar rascunho (auto-save)
  - Recarregar página
  - Verificar: valores de hora restaurados corretamente

- [ ] **Step 7: Testar em mobile (Android)**
  - Abrir no Chrome Android
  - Verificar: modal abre em tela cheia, sem truncamento de botões

---

## Self-Review

**Spec coverage:**
- [x] Modal abre ao tocar no campo de hora → Task 2
- [x] Rolos de hora (00-23) e minuto (00-59, passo 5) com snap → Task 2
- [x] Botão "Confirmar" preenche input com "HH:MM" → Task 2
- [x] Botão "Cancelar" fecha sem alterar → Task 2
- [x] Validação `horaFim > horaInicio` continua funcionando → Task 5 (teste)
- [x] Persistência no IndexedDB funciona → Task 5 (teste)
- [x] Visual consistente com Tailwind → Task 2
- [x] Nenhum truncamento de texto → Task 5 (teste mobile)
- [x] Service Worker cache atualizado → Task 4

**Placeholder scan:** Nenhum placeholder encontrado.

**Type consistency:** `createTimePicker(input)` signature consistente entre Task 1 e Task 3. `originalInput.value` format "HH:MM" mantido em todos os pontos.
