# Refatoração de Modularidade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar dependências circulares, reduzir acoplamento e melhorar a coesão dos módulos do projeto mail-smtp.

**Architecture:** Refatoração incremental mantendo a API pública de cada módulo sempre funcional. Cada tarefa é autocontida e pode ser testada independentemente. Nenhuma mudança de comportamento visível ao usuário.

**Tech Stack:** Vanilla JS (ES6 modules), Vitest + jsdom para testes

---

## Visão Geral das Tarefas

| #   | Tarefa                                                                 | Esforço | Dependências |
| --- | ---------------------------------------------------------------------- | ------- | ------------ |
| 1   | Mover `captureCoordinates` para `utils.js`                             | Baixo   | Nenhuma      |
| 2   | Tornar `DOM` imutável após `cacheDOM()`                                | Baixo   | Nenhuma      |
| 3   | Unificar `collectEquipamentos`                                         | Baixo   | Nenhuma      |
| 4   | `restore.js` não importar `navigation.js`                              | Baixo   | Nenhuma      |
| 5   | Extrair persistência de `state.js` para `persistence.js`               | Médio   | Tarefa 1     |
| 6   | Passar dados como parâmetro em `email.js`, `state.js`, `validation.js` | Médio   | Tarefa 5     |
| 7   | Dividir `navigation.js` em `animator.js` + `sectionManager.js`         | Médio   | Tarefas 1-6  |

---

### Task 1: Mover `captureCoordinates` para `utils.js`

**Objetivo:** Eliminar as dependências circulares `app.js ↔ iniciais.js` e `app.js ↔ reset.js`.

**Files:**

- Modify: `scripts/utils.js`
- Modify: `scripts/app.js`
- Modify: `scripts/iniciais.js`
- Modify: `scripts/reset.js`

- [ ] **Step 1: Adicionar `captureCoordinates` em `utils.js`**

Mover a função de `app.js` para `utils.js`. A função acessa `document.getElementById("coordenadas")` — isso é aceitável pois é um utilitário de geolocalização.

```javascript
// Adicionar ao final de scripts/utils.js

export async function captureCoordinates() {
  const coordEl = document.getElementById('coordenadas');
  if (!coordEl) return;

  if (!navigator.geolocation) {
    coordEl.value = 'Não disponível';
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
    coordEl.value = 'Não disponível';
  }
}
```

- [ ] **Step 2: Atualizar `app.js`**

Remover a exportação de `captureCoordinates` e importar de `utils.js`:

```javascript
// Remover: export async function captureCoordinates() { ... } (linhas 76-99)
// Adicionar no topo:
import { captureCoordinates } from './utils.js';
```

- [ ] **Step 3: Atualizar `iniciais.js`**

Trocar o import de `app.js` para `utils.js`:

```javascript
// Trocar linha 5:
// De: import { captureCoordinates } from "./app.js";
// Para:
import { captureCoordinates } from './utils.js';
```

- [ ] **Step 4: Atualizar `reset.js`**

Trocar o import de `app.js` para `utils.js`:

```javascript
// Trocar linha 7:
// De: import { captureCoordinates } from "./app.js";
// Para:
import { captureCoordinates } from './utils.js';
```

- [ ] **Step 5: Executar testes**

```bash
npm test
```

Esperado: Todos os 268 testes passam.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "refactor: move captureCoordinates to utils.js to break circular deps"
```

---

### Task 2: Tornar `DOM` Imutável Após `cacheDOM()`

**Objetivo:** Prevenir que módulos mutem o objeto `DOM` compartilhado, evitando bugs de "elemento não encontrado".

**Files:**

- Modify: `scripts/dom.js`
- Modify: `scripts/app.js`
- Modify: `scripts/navigation.js`
- Modify: `scripts/restore.js`

- [ ] **Step 1: Modificar `dom.js` para usar `Object.freeze`**

```javascript
// scripts/dom.js
const _DOM = {};

export function cacheDOM() {
  _DOM.sections = document.querySelectorAll('.section');
  _DOM.wrapper = document.getElementById('section-wrapper');
  _DOM.steps = document.querySelectorAll('.step');
  _DOM.btnAnterior = document.getElementById('btn-anterior');
  _DOM.btnProximo = document.getElementById('btn-proximo');
  _DOM.errorMsg = document.getElementById('error-msg');
  _DOM.iniciaisCampos = document.getElementById('iniciais-campos');
  _DOM.tipoOrdem = document.getElementById('tipo-ordem');
  _DOM.equipList = document.getElementById('equipamentos-list');
  _DOM.btnAddEquip = document.getElementById('btn-add-equip');
  _DOM.btnSkipEquip = document.getElementById('btn-skip-equip');
  _DOM.retornoDesc = document.getElementById('retorno-desc');
  _DOM.retornoCampos = document.getElementById('retorno-campos');
  _DOM.fileInput = document.getElementById('file-input');
  _DOM.fileCount = document.getElementById('file-count');
  _DOM.previewGrid = document.getElementById('preview-grid');
  _DOM.fileUploadArea = document.getElementById('file-upload-area');
  _DOM.previewCorpo = document.getElementById('preview-corpo');
  _DOM.complementoCorpo = document.getElementById('complemento-corpo');
  _DOM.toast = document.getElementById('toast');
  _DOM.btnNovoForm = document.getElementById('btn-novo-form');
  _DOM.modalTipo = document.getElementById('modal-tipo');
  _DOM.modalCancel = document.getElementById('modal-cancel');
  _DOM.modalConfirm = document.getElementById('modal-confirm');
  _DOM.lightbox = document.getElementById('lightbox');
  _DOM.lightboxImg = document.getElementById('lightbox-img');
  _DOM.lightboxClose = document.getElementById('lightbox-close');
  _DOM.hamburger = document.getElementById('hamburger');
  _DOM.sidebar = document.getElementById('sidebar');
  _DOM.sidebarOverlay = document.getElementById('sidebar-overlay');
  _DOM.sidebarClose = document.getElementById('sidebar-close');
  _DOM.sidebarList = document.getElementById('sidebar-list');
  _DOM.sidebarFilter = document.getElementById('sidebar-filter');
  _DOM.dupModal = document.getElementById('dup-modal');
  _DOM.dupModalTitle = document.getElementById('dup-modal-title');
  _DOM.dupModalBody = document.getElementById('dup-modal-body');
  _DOM.dupModalCancel = document.getElementById('dup-modal-cancel');
  _DOM.dupModalConfirm = document.getElementById('dup-modal-confirm');

  Object.freeze(_DOM);
}

export const DOM = _DOM;
```

- [ ] **Step 2: Corrigir `app.js` — remover mutação de `DOM.tipoOrdem`**

Na linha 105 de `app.js`:

```javascript
// Remover esta linha:
DOM.tipoOrdem = document.getElementById('tipo-ordem');
```

O `tipoOrdem` já é cacheado em `cacheDOM()`. Se o elemento é recriado (ex: após `renderIniciais`), precisamos de uma abordagem diferente — ver Step 3.

- [ ] **Step 3: Corrigir `navigation.js` — remover mutações de `DOM.tipoOrdem` e `DOM.btnProximo`**

Na linha 80 de `navigation.js`:

```javascript
// Remover:
DOM.tipoOrdem = document.getElementById('tipo-ordem');
```

Nas linhas 68-76, as mutações de `DOM.btnProximo.textContent` e `DOM.btnProximo.className` são aceitáveis pois são mutações de **propriedades do elemento DOM**, não do objeto `DOM` em si. O `Object.freeze` protege apenas as chaves do objeto `DOM`, não os elementos DOM armazenados nele.

- [ ] **Step 4: Corrigir `restore.js` — remover mutação de `DOM.tipoOrdem`**

Na linha 28 de `restore.js`:

```javascript
// Remover:
DOM.tipoOrdem = document.getElementById('tipo-ordem');
```

- [ ] **Step 5: Executar testes**

```bash
npm test
```

Esperado: Todos os testes passam.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "refactor: freeze DOM object to prevent accidental mutations"
```

---

### Task 3: Unificar `collectEquipamentos`

**Objetivo:** Eliminar a duplicação da lógica de coleta de equipamentos entre `equipment.js` e `validation.js`.

**Files:**

- Modify: `scripts/equipment.js`
- Modify: `scripts/validation.js`

- [ ] **Step 1: Exportar `collectEquipamentos` de `equipment.js`**

```javascript
// Adicionar export na função collectEquipamentos (linha 62):
export function collectEquipamentos() {
  const rows = DOM.equipList.querySelectorAll('.equip-row');
  state.equipamentos = [];
  rows.forEach(row => {
    state.equipamentos.push({
      status: row.querySelector('.equip-tipo').value,
      categoria: row.querySelector('.equip-categoria').value,
      numero: row.querySelector('.equip-numero').value,
    });
  });
}
```

- [ ] **Step 2: Atualizar `validation.js` para usar a função exportada**

```javascript
// Adicionar import no topo:
import { collectEquipamentos } from './equipment.js';

// Substituir o bloco de coleta em collectSectionData (linhas 119-128):
// De:
//   if (n === 2) {
//     const rows = DOM.equipList.querySelectorAll(".equip-row");
//     state.equipamentos = [];
//     rows.forEach((row) => {
//       state.equipamentos.push({
//         status: row.querySelector(".equip-tipo").value,
//         categoria: row.querySelector(".equip-categoria").value,
//         numero: row.querySelector(".equip-numero").value,
//       });
//     });
//   }
// Para:
//   if (n === 2) {
//     collectEquipamentos();
//   }
```

- [ ] **Step 3: Executar testes**

```bash
npm test
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor: unify collectEquipamentos in equipment.js"
```

---

### Task 4: `restore.js` Não Importar `navigation.js`

**Objetivo:** Remover a dependência de `restore.js` em `navigation.js`. O módulo de restore deve apenas aplicar dados, não controlar navegação.

**Files:**

- Modify: `scripts/restore.js`
- Modify: `scripts/app.js`

- [ ] **Step 1: Modificar `restore.js` para não navegar**

```javascript
// scripts/restore.js
import { DOM } from './dom.js';
import { state, setCurrentUUID } from './state.js';
import { renderIniciais, iniciaisFields } from './iniciais.js';
import { base64ToBlob } from './utils.js';

export function applyRecord(record) {
  setCurrentUUID(record.uuid);
  state.iniciaisValido = true;

  state.equipamentos = record.equipamentos || [];
  state.lastTipoOrdem = record.lastTipoOrdem || '';
  state.visitedRetorno = record.visitedRetorno || false;
  state.iniciais = record.iniciais || {};
  state.retorno = record.retorno || {};
  state._createdAt = record.createdAt;

  if (record.attachments && Array.isArray(record.attachments)) {
    state.attachments = record.attachments.map(att => {
      const blob = base64ToBlob(att.data, att.type);
      return new File([blob], att.name, { type: att.type });
    });
  } else {
    state.attachments = [];
  }

  renderIniciais();

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

  if (record.composicao?.complementoCorpo && DOM.complementoCorpo) {
    DOM.complementoCorpo.value = record.composicao.complementoCorpo;
  }

  // Retorna a seção para o chamador decidir
  return record.currentSection || 1;
}
```

- [ ] **Step 2: Atualizar `app.js` para navegar após restore**

```javascript
// Na função restoreSavedState, após applyRecord:
async function restoreSavedState() {
  const uuid = getCurrentUUID();
  if (!uuid) return false;

  try {
    const record = await getRecord(uuid);
    if (!record) {
      clearCurrentUUID();
      return false;
    }
    const ok = await showConfirm(
      `Há um formulário salvo (Seção ${record.currentSection} de 5). Deseja continuar de onde parou?`
    );
    if (!ok) {
      clearCurrentUUID();
      return false;
    }

    const section = applyRecord(record);
    showSection(section, 'next', true);
    return true;
  } catch (_) {
    return false;
  }
}
```

- [ ] **Step 3: Executar testes**

```bash
npm test
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor: remove navigation dependency from restore.js"
```

---

### Task 5: Extrair Persistência de `state.js` para `persistence.js`

**Objetivo:** `state.js` deve apenas armazenar estado. A lógica de salvar/carregar vai para `persistence.js`.

**Files:**

- Create: `scripts/persistence.js`
- Modify: `scripts/state.js`
- Modify: `scripts/app.js`
- Modify: `scripts/navigation.js`
- Modify: `scripts/attachments.js`
- Modify: `scripts/equipment.js`
- Modify: `scripts/retornos.js`

- [ ] **Step 1: Criar `persistence.js`**

```javascript
// scripts/persistence.js
import { state, getCurrentUUID, setCurrentUUID, clearCurrentUUID } from './state.js';
import { getIniciaisData } from './iniciais.js';
import { getRetornoData } from './retornos.js';
import { saveDraft, getRecord } from './db.js';
import { toBase64 } from './utils.js';
import { DOM } from './dom.js';

let saveTimer = null;

export async function saveState() {
  if (!state.iniciaisValido) return;

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
    try {
      state.currentUUID = crypto.randomUUID();
    } catch (_) {
      state.currentUUID = Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
    setCurrentUUID(state.currentUUID);
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
      console.error('getRecord in saveState:', _);
    }
    state._createdAt = createdAt;
  }

  const attachmentsData = await Promise.all(
    state.attachments.map(async file => ({
      name: file.name,
      type: file.type,
      data: await toBase64(file),
    }))
  );

  const data = {
    uuid: state.currentUUID,
    status: 'draft',
    createdAt,
    updatedAt: new Date().toISOString(),
    currentSection: state.currentSection,
    iniciais: iniciaisData,
    retorno: getRetornoData(),
    tipoOrdem: DOM.tipoOrdem ? DOM.tipoOrdem.value : '',
    equipamentos: state.equipamentos,
    lastTipoOrdem: state.lastTipoOrdem,
    visitedRetorno: state.visitedRetorno,
    composicao: { complementoCorpo: DOM.complementoCorpo ? DOM.complementoCorpo.value : '' },
    attachments: attachmentsData,
    sentData: null,
  };

  saveDraft(data).catch(err => {
    console.error('saveDraft error:', err);
    if (err?.name === 'QuotaExceededError' || err?.message?.includes('quota')) {
      import('./ui.js').then(({ showToast }) => {
        showToast('Espaço insuficiente no navegador. Limpe dados antigos.', false);
      });
    }
  });
}

export function debouncedSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 300);
}
```

- [ ] **Step 2: Limpar `state.js`**

```javascript
// scripts/state.js
import {
  getCurrentUUID as _getCurrentUUID,
  setCurrentUUID as _setCurrentUUID,
  clearCurrentUUID as _clearCurrentUUID,
} from './persistence.js';

// Re-exportar para manter compatibilidade
export const getCurrentUUID = _getCurrentUUID;
export const setCurrentUUID = _setCurrentUUID;
export const clearCurrentUUID = _clearCurrentUUID;

export const state = {
  currentSection: 1,
  totalSections: 5,
  iniciais: {},
  equipamentos: [],
  attachments: [],
  lastTipoOrdem: '',
  visitedRetorno: false,
  retorno: {},
  animating: false,
  currentUUID: '',
  composicao: { complementoCorpo: '' },
  iniciaisValido: false,
};
```

**Nota:** Precisamos evitar o ciclo `state.js → persistence.js → state.js`. A solução é mover `getCurrentUUID/setCurrentUUID/clearCurrentUUID` para `persistence.js` e re-exportar de `state.js`.

- [ ] **Step 3: Atualizar imports em todos os módulos que usam `saveState` e `debouncedSave`**

Trocar `from "./state.js"` para `from "./persistence.js"` em:

- `app.js`
- `navigation.js`
- `attachments.js`
- `equipment.js`
- `retornos.js`
- `validation.js`

- [ ] **Step 4: Executar testes**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor: extract persistence logic from state.js to persistence.js"
```

---

### Task 6: Passar Dados como Parâmetro em `email.js`, `state.js`, `validation.js`

**Objetivo:** Reduzir acoplamento com DOM, melhorando testabilidade.

**Files:**

- Modify: `scripts/email.js`
- Modify: `scripts/persistence.js` (antigo state.js)
- Modify: `scripts/navigation.js`

- [ ] **Step 1: Refatorar `email.js` para receber dados**

```javascript
// scripts/email.js
import { iniciaisFields } from './iniciais.js';
import { retornoFields } from './retornos.js';

export function composeEmail(data) {
  let body = '';

  iniciaisFields.forEach(field => {
    const raw = data.iniciais?.[field.nome] || '';
    const val = raw && field.tipo === 'date' ? raw.split('-').reverse().join('-') : raw || '—';
    body += `${field.label}: ${val}\n`;
  });

  if (data.equipamentos && data.equipamentos.length > 0) {
    body += '\n\nEquipamentos:';
    data.equipamentos.forEach(eq => {
      body += `\n${eq.categoria} ${eq.status} Nº ${eq.numero || '—'}`;
    });
  }

  body += '\n\nRetorno:';
  retornoFields.forEach(field => {
    const val = data.retorno?.[field.id] || '';
    body += `\n${field.label}: ${val || '(não preenchido)'}`;
  });

  return body;
}
```

- [ ] **Step 2: Atualizar chamador em `navigation.js`**

```javascript
// Em showSection, quando n === state.totalSections:
if (n === state.totalSections) {
  const emailData = {
    iniciais: state.iniciais,
    equipamentos: state.equipamentos,
    retorno: state.retorno,
  };
  const body = composeEmail(emailData);
  DOM.previewCorpo.textContent = body;
}
```

- [ ] **Step 3: Executar testes**

```bash
npm test
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor: pass data as params to composeEmail instead of reading DOM"
```

---

### Task 7: Dividir `navigation.js` em `animator.js` + `sectionManager.js`

**Objetivo:** Reduzir o módulo "Deus" separando animação de gerenciamento de seções.

**Files:**

- Create: `scripts/animator.js`
- Create: `scripts/sectionManager.js`
- Modify: `scripts/navigation.js` (reduzido a re-exports)
- Modify: `scripts/app.js`

- [ ] **Step 1: Criar `animator.js`**

```javascript
// scripts/animator.js
import { state } from './state.js';

export function animateSectionTransition(current, next, direction, noAnimation) {
  if (!noAnimation && state.animating) return false;
  if (!noAnimation) state.animating = true;

  const currentEl = document.getElementById(`section-${current}`);
  const nextEl = document.getElementById(`section-${next}`);
  const goingForward = direction !== 'prev';

  if (!noAnimation && current !== next) {
    currentEl.classList.remove('active');
    currentEl.classList.add(goingForward ? 'slide-out-left' : 'slide-out-right');

    setTimeout(() => {
      currentEl.classList.remove('slide-out-left', 'slide-out-right');
      currentEl.style.display = 'none';

      nextEl.style.display = 'block';
      nextEl.classList.add(goingForward ? 'section-enter-next' : 'section-enter-prev');

      setTimeout(() => {
        nextEl.classList.remove('section-enter-next', 'section-enter-prev');
        nextEl.classList.add('active');
        state.animating = false;
      }, 220);
    }, 220);
  } else {
    currentEl.classList.remove('active');
    currentEl.style.display = 'none';
    nextEl.style.display = 'block';
    nextEl.classList.add('active');
    state.animating = false;
  }

  return true;
}
```

- [ ] **Step 2: Criar `sectionManager.js`**

```javascript
// scripts/sectionManager.js
import { DOM } from './dom.js';
import { state } from './state.js';
import { hideError } from './ui.js';
import { validateSection, collectSectionData } from './validation.js';
import { renderIniciais, iniciaisFields } from './iniciais.js';
import { renderEquipamentos } from './equipment.js';
import { renderRetorno, setRetornoData } from './retornos.js';
import { renderPreviews } from './attachments.js';
import { composeEmail } from './email.js';
import { sendEmail } from './send.js';
import { animateSectionTransition } from './animator.js';
import { saveState } from './persistence.js';

function updateStepIndicators(n) {
  DOM.steps.forEach((el, i) => {
    const num = i + 1;
    el.classList.toggle('active', num === n);
    el.classList.toggle('completed', num < n);
  });

  DOM.steps.forEach((el, i) => {
    el.onclick = () => {
      if (state.animating) return;
      showSection(i + 1, i + 1 > state.currentSection ? 'next' : 'prev', true);
    };
  });
}

function updateNavButtons(n) {
  DOM.btnAnterior.disabled = n === 1;

  if (n === state.totalSections) {
    DOM.btnProximo.textContent = 'Enviar';
    DOM.btnProximo.className = 'btn btn-success';
  } else if (n === state.totalSections - 1) {
    DOM.btnProximo.textContent = 'Revisar →';
    DOM.btnProximo.className = 'btn btn-primary';
  } else {
    DOM.btnProximo.textContent = 'Avançar →';
    DOM.btnProximo.className = 'btn btn-primary';
  }
}

function renderSectionContent(n) {
  if (n === 1) {
    renderIniciais();
    if (state.iniciais && Object.keys(state.iniciais).length > 0) {
      iniciaisFields.forEach(field => {
        const el = document.getElementById(field.nome);
        if (el) el.value = state.iniciais[field.nome] || '';
      });
    }
  }
  if (n === 2) renderEquipamentos();
  if (n === 3) {
    renderRetorno();
    setRetornoData(state.retorno);
    state.visitedRetorno = true;
  }
  if (n === 4) renderPreviews();
  if (n === 5) {
    const emailData = {
      iniciais: state.iniciais,
      equipamentos: state.equipamentos,
      retorno: state.retorno,
    };
    const body = composeEmail(emailData);
    DOM.previewCorpo.textContent = body;
  }
}

export function showSection(n, direction, noAnimation) {
  const current = state.currentSection;
  const ok = animateSectionTransition(current, n, direction, noAnimation);
  if (!ok) return;

  updateStepIndicators(n);
  updateNavButtons(n);
  renderSectionContent(n);

  hideError();
  DOM.wrapper.scrollTop = 0;
  state.currentSection = n;
  saveState();
}

export function prevSection() {
  if (state.currentSection <= 1) return;
  collectSectionData(state.currentSection);
  showSection(state.currentSection - 1, 'prev');
}

export async function nextSection() {
  if (!validateSection(state.currentSection, { equipamentos: state.equipamentos })) return;
  collectSectionData(state.currentSection);

  if (state.currentSection === 1) {
    state.iniciaisValido = true;
  }

  if (state.currentSection === state.totalSections) {
    const success = await sendEmail();
    return;
  }

  showSection(state.currentSection + 1, 'next');
}
```

- [ ] **Step 3: Reduzir `navigation.js` a re-exports**

```javascript
// scripts/navigation.js
export { showSection, prevSection, nextSection } from './sectionManager.js';
```

- [ ] **Step 4: Executar testes**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor: split navigation.js into animator.js and sectionManager.js"
```

---

## Pós-Implementação

- [ ] **Verificar mapa de dependências final** — confirmar que não há mais ciclos
- [ ] **Incrementar `CACHE_NAME` em `sw.js`** — ex: `retorno-v15` → `retorno-v16`
- [ ] **Commit final**

```bash
git add -A && git commit -m "chore: bump SW cache version after refactoring"
```
