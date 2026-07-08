# Refatoração Arquitetural e Persistência — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolver 15 problemas arquiteturais e 8 problemas de persistência identificados nas análises, priorizando quebra de dependências circulares, eliminação de código duplicado e correção de bugs de estado.

**Architecture:** Refatoração incremental em 4 fases: (1) quebrar dependências circulares extraindo módulo de dados puros, (2) consolidar lógica duplicada em módulos compartilhados, (3) refatorar módulos sobrecarregados, (4) corrigir persistência de estado. Cada fase produz código testável e funcional.

**Tech Stack:** JavaScript ES6 modules, IndexedDB, Tailwind CSS (CDN), Netlify Functions

---

## File Structure

### Novos arquivos:

- `scripts/fields.js` — Definições de campo puras (iniciaisFields, retornoFields) sem imports
- `scripts/ui.js` — Funções de UI compartilhadas (showConfirm, showError, hideError, showToast)
- `scripts/restore.js` — Função applyRecord() para restaurar estado de um registro
- `scripts/compress.js` — Lógica de compressão de imagem extraída de send.js

### Arquivos modificados:

- `scripts/iniciais.js` — Importar de fields.js, adicionar listeners de debouncedSave
- `scripts/retornos.js` — Importar de fields.js
- `scripts/validation.js` — Importar de fields.js, remover dependência de state
- `scripts/state.js` — Centralizar sessionStorage, remover STORAGE_KEY, adicionar getCurrentUUID/setCurrentUUID/clearCurrentUUID
- `scripts/app.js` — Usar applyRecord(), usar showConfirm(), remover STORAGE_KEY
- `scripts/sidebar.js` — Usar applyRecord(), usar showConfirm(), usar formatDate de utils
- `scripts/duplicate.js` — Usar formatDate de utils, usar textContent ao invés de innerHTML
- `scripts/navigation.js` — Remover nextSection() (vai para app.js), remover getSectionName()
- `scripts/send.js` — Extrair compressão para compress.js, aguardar updateRecordStatus
- `scripts/db.js` — Singleton openDB(), tratamento de QuotaExceededError
- `scripts/utils.js` — Adicionar formatDate()
- `scripts/equipment.js` — Atualizar state.equipamentos antes de saveState()
- `scripts/attachments.js` — Toast avisando que anexos não persistem entre sessões
- `netlify/functions/send.js` — Validar text e SMTP_FROM

---

## Fase 1: Quebrar Dependências Circulares

### Task 1: Extrair fields.js (dados puros)

**Files:**

- Create: `scripts/fields.js`
- Modify: `scripts/iniciais.js:6-18` (remover iniciaisFields)
- Modify: `scripts/retornos.js:7-9` (remover retornoFields)

- [ ] **Step 1: Criar fields.js com definições puras**

```javascript
// scripts/fields.js
export const iniciaisFields = [
  {
    linha: 1,
    nome: 'lider',
    label: 'Líder',
    tipo: 'select',
    obrigatorio: true,
    opcoes: [
      'ANDRE DE SOUSA CARVALHO',
      'ANTONIO MAURIELLTON DE ARAUJO MARTINS',
      'BERKSON EVANGELISTA DE OLIVEIRA',
      'CARLOS CRISTIANO DO NASCIMENTO SILVA',
      'DIEGO DA SILVA DE LIMA',
      'DOUGLAS MONTEIRO DE ABREU',
      'FRANCISCO ADRIANO DE SOUSA VIANA',
      'JOSE DOGIVAN DA SILVA',
      'LEANDRO OLIVEIRA SOUSA',
      'MARCIO JOHNNATAN CHAGAS CAETANO',
      'RENATO RODRIGUES VIEIRA',
      'VALDI DOS SANTOS VIANA FILHO',
    ],
  },
  {
    linha: 2,
    nome: 'parceiro',
    label: 'Parceiro',
    tipo: 'select',
    obrigatorio: true,
    opcoes: [
      'ANDRE DE SOUSA CARVALHO',
      'ANTONIO MAURIELLTON DE ARAUJO MARTINS',
      'BERKSON EVANGELISTA DE OLIVEIRA',
      'CARLOS CRISTIANO DO NASCIMENTO SILVA',
      'DIEGO DA SILVA DE LIMA',
      'DOUGLAS MONTEIRO DE ABREU',
      'FRANCISCO ADRIANO DE SOUSA VIANA',
      'JOSE DOGIVAN DA SILVA',
      'LEANDRO OLIVEIRA SOUSA',
      'MARCIO JOHNNATAN CHAGAS CAETANO',
      'RENATO RODRIGUES VIEIRA',
      'VALDI DOS SANTOS VIANA FILHO',
    ],
  },
  {
    linha: 3,
    nome: 'municipio',
    label: 'Município',
    tipo: 'select',
    obrigatorio: true,
    opcoes: [
      'ACARAPE',
      'AQUIRAZ',
      'ARACOIABA',
      'ARATUBA',
      'BARREIRA',
      'BATURITE',
      'BEBERIBE',
      'CAPISTRANO',
      'CASCAVEL',
      'CAUCAIA',
      'CHOROZINHO',
      'EUSÉBIO',
      'FORTALEZA',
      'GUAIUBA',
      'GUARAMIRANGA',
      'HORIZONTE',
      'ITAITINGA',
      'ITAPIUNA',
      'MARACANAU',
      'MARANGUAPE',
      'MULUNGU',
      'OCARA',
      'PACAJUS',
      'PACATUBA',
      'PACOTI',
      'PALMACIA',
      'PINDORETAMA',
      'REDENCAO',
      'SAO GONCALO',
    ],
  },
  { linha: 4, nome: 'uc', label: 'UC', tipo: 'number', obrigatorio: true },
  { linha: 4, nome: 'os', label: 'OS', tipo: 'text', obrigatorio: true },
  {
    linha: 5,
    nome: 'notificado',
    label: 'Notificado',
    tipo: 'select',
    obrigatorio: true,
    opcoes: ['SIM', 'NÃO'],
  },
  {
    linha: 5,
    nome: 'placa',
    label: 'Placa',
    tipo: 'select',
    obrigatorio: true,
    opcoes: [
      'RHS6G02',
      'RIE0D84',
      'RIH3H88',
      'SDZ7E43',
      'SDZ9B15',
      'SDZ9B16',
      'SRT8J10',
      'SRW6J12',
      'SRW6J13',
      'SRW6J41',
      'TCI4F69',
      'TUL0I49',
    ],
  },
  { linha: 6, nome: 'data', label: 'Data', tipo: 'date', obrigatorio: true },
  { linha: 6, nome: 'hora_inicio', label: 'Início', tipo: 'time', obrigatorio: true },
  { linha: 6, nome: 'hora_fim', label: 'Fim', tipo: 'time', obrigatorio: true },
  {
    linha: 7,
    nome: 'tipo-ordem',
    label: 'Tipo de Ordem',
    tipo: 'select',
    obrigatorio: true,
    opcoes: [
      'ADEQUACAO SMF',
      'AFERIÇÃO DE MEDIDOR',
      'AFERIÇÃO MEDIDOR CLIENTE LIVRE',
      'COLHER LEITURA',
      'CORTE DE UC POR DEF TECNICO',
      'CORTE DEFINITIVO A PEDIDO',
      'CORTE POR FALTA DE PAGAMENTO',
      'DESLIG.PROG.MANUTENÇÃO',
      'DESLOCAMENTO DE SUBESTAÇÃO',
      'DISPON. SAIDA SERIAL MEDIDOR',
      'EXECUÇÃO DE MUDANÇA DE TARIFA',
      'EXECUCAO DO ACRESCIMO DE POTENCIA',
      'EXECUCAO DO DECRESCIMO DE POTENCIA',
      'GRANDES CLIENTES SELO ROMPIDO',
      'GRANDES CLIENTES SEM MEDIÇÃO',
      'INSPECAO UC CORTADA I15',
      'INSPECAO UC CORTADA I180',
      'INSPECAO UC CORTADA I30',
      'INSPECAO UC CORTADA I90',
      'INSTALACAO DO DISPLAY',
      'LIBERAÇÃO DE PULSO',
      'LIGAÇÃO NOVA ISOLADA',
      'LIGACAO NOVA MEDIA TENSAO',
      'LIGACAO NOVA MT - CLIENTE LIVRE',
      'LIGAÇÃO NOVA SIMULTÂNEA',
      'RELIGACAO NORMAL RURAL',
      'RELIGAÇÃO NORMAL URBANA',
      'RESELAR MEDICAO',
      'RESSERVICO',
      'RETIRAR EQUIPAMENTOS',
      'RETIRAR RAMAL',
      'SERVIÇO ESPECIAL OPERAÇÃO GRUPO A',
      'SUBST. DE EQUIPAMENTO DE MEDICAO',
      'SUBST. MEDIDOR A PEDIDO',
      'SUBST. MEDIDOR INICIATIVA COELCE',
      'SUBSTITUIÇÃO DA BATERIA DO MEDIDOR',
      'SUBSTITUIÇÃO DE DISPLAY',
      'TELEMEDIÇÃO MANUTENÇÃO',
      'TELEMEDIÇÃO MANUTENÇÃO CLIENTE LIVRE',
      'TELEMEDIÇÃO MANUTENÇÃO LOTE',
      'VISITA TECNICA GRUPO A',
      'VISTORIA DA UC',
      'VISTORIA GERAÇÃO DISTRIBUIDA',
    ],
  },
];

export const retornoFields = [
  { label: 'Descrição', id: 'descricao-retorno', type: 'textarea', required: true },
];
```

- [ ] **Step 2: Atualizar iniciais.js para importar de fields.js**

```javascript
// scripts/iniciais.js (topo do arquivo)
import { DOM } from './dom.js';
import { addBlurValidation } from './validation.js';
import { iniciaisFields } from './fields.js';

// Remover a definição de iniciaisFields (linhas 6-18)
// Manter o export da re-exportação:
export { iniciaisFields };

// Resto do arquivo permanece igual
```

- [ ] **Step 3: Atualizar retornos.js para importar de fields.js**

```javascript
// scripts/retornos.js (topo do arquivo)
import { DOM } from './dom.js';
import { state, saveState, debouncedSave } from './state.js';
import { addBlurValidation } from './validation.js';
import { retornoFields } from './fields.js';

// Remover a definição de retornoFields (linhas 7-9)
// Manter o export da re-exportação:
export { retornoFields };

// Resto do arquivo permanece igual
```

- [ ] **Step 4: Atualizar validation.js para importar de fields.js**

```javascript
// scripts/validation.js (linha 4)
import { DOM } from './dom.js';
import { showError, hideError } from './ui.js';
import { iniciaisFields, getIniciaisData } from './iniciais.js';
import { getRetornoData } from './retornos.js';
import { iniciaisFields as fieldsIniciais } from './fields.js';

// Substituir uso de iniciaisFields por fieldsIniciais nas funções
// validateSection() usa iniciaisFields.forEach — mudar para fieldsIniciais.forEach
```

- [ ] **Step 5: Commit**

```bash
git add scripts/fields.js scripts/iniciais.js scripts/retornos.js scripts/validation.js
git commit -m "refactor: extract fields.js to break circular dependencies (C1, C2)"
```

---

### Task 2: Remover dependência de state em validation.js

**Files:**

- Modify: `scripts/validation.js:2` (remover import de state)
- Modify: `scripts/validation.js:80-95` (collectSectionData)

- [ ] **Step 1: Remover import de state e receber dados por parâmetro**

```javascript
// scripts/validation.js (topo)
import { DOM } from './dom.js';
import { showError, hideError } from './ui.js';
import { iniciaisFields, getIniciaisData } from './iniciais.js';
import { getRetornoData } from './retornos.js';
import { iniciaisFields as fieldsIniciais } from './fields.js';

// Remover: import { state } from "./state.js";
```

- [ ] **Step 2: Atualizar validateSection para receber parâmetros**

```javascript
// scripts/validation.js (linha 6)
export function validateSection(n, { equipamentos = [] } = {}) {
  hideError();
  let valid = true;

  if (n === 1) {
    fieldsIniciais.forEach(field => {
      if (!field.obrigatorio) return;
      const el = document.getElementById(field.nome);
      if (el) {
        if (!el.value || el.value.trim() === '') {
          el.classList.add('error');
          valid = false;
        } else {
          el.classList.remove('error');
        }
      }
    });
    if (!valid) showError('Preencha todos os campos obrigatórios.');
  }

  if (n === 2) {
    const rows = DOM.equipList.querySelectorAll('.equip-row');
    if (rows.length > 0) {
      let hasError = false;
      const nums = [];
      rows.forEach(row => {
        const tipo = row.querySelector('.equip-tipo');
        const categoria = row.querySelector('.equip-categoria');
        const inp = row.querySelector('.equip-numero');
        [tipo, categoria, inp].forEach(el => el.classList.remove('error'));
        if (tipo.value === '') {
          tipo.classList.add('error');
          hasError = true;
        }
        if (categoria.value === '') {
          categoria.classList.add('error');
          hasError = true;
        }
        if (inp.value === '') {
          inp.classList.add('error');
          hasError = true;
        } else if (nums.includes(inp.value)) {
          inp.classList.add('error');
          hasError = true;
        } else {
          nums.push(inp.value);
        }
      });
      if (hasError) {
        const dup = nums.length !== new Set(nums).size;
        showError(
          dup ? 'Nº de equipamento duplicado.' : 'Preencha todos os campos de cada equipamento.'
        );
        valid = false;
      }
    }
  }

  if (n === 3) {
    const campos = DOM.retornoCampos.querySelectorAll('textarea, input');
    campos.forEach(el => {
      if (el.hasAttribute('data-required') && el.value.trim() === '') {
        el.classList.add('error');
        valid = false;
      } else {
        el.classList.remove('error');
      }
    });
    if (!valid) showError('Preencha todos os campos obrigatórios.');
  }

  return valid;
}
```

- [ ] **Step 3: Atualizar chamadas de validateSection em navigation.js**

```javascript
// scripts/navigation.js (linha 93)
export async function nextSection() {
  if (!validateSection(state.currentSection, { equipamentos: state.equipamentos })) return;
  collectSectionData(state.currentSection);

  if (state.currentSection === state.totalSections) {
    const success = await sendEmail();
    return;
  }

  showSection(state.currentSection + 1, 'next');
}
```

- [ ] **Step 4: Commit**

```bash
git add scripts/validation.js scripts/navigation.js
git commit -m "refactor: remove state dependency from validation.js (C2)"
```

---

## Fase 2: Consolidar Lógica Duplicada

### Task 3: Mover formatDate para utils.js

**Files:**

- Modify: `scripts/utils.js` (adicionar formatDate)
- Modify: `scripts/duplicate.js:5-10` (remover formatDate local)
- Modify: `scripts/sidebar.js:10-15` (remover formatDate local)

- [ ] **Step 1: Adicionar formatDate em utils.js**

```javascript
// scripts/utils.js (final do arquivo)
export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
```

- [ ] **Step 2: Atualizar duplicate.js para importar formatDate**

```javascript
// scripts/duplicate.js (topo)
import { DOM } from './dom.js';
import { formatDate } from './utils.js';

// Remover a função formatDate local (linhas 5-10)
```

- [ ] **Step 3: Atualizar sidebar.js para importar formatDate**

```javascript
// scripts/sidebar.js (topo)
import { DOM } from './dom.js';
import { state } from './state.js';
import { getAllRecords, deleteRecord, getRecord } from './db.js';
import { showSection } from './navigation.js';
import { renderIniciais, iniciaisFields } from './iniciais.js';
import { formatDate } from './utils.js';

// Remover a função formatDate local (linhas 10-15)
```

- [ ] **Step 4: Commit**

```bash
git add scripts/utils.js scripts/duplicate.js scripts/sidebar.js
git commit -m "refactor: move formatDate to utils.js (D1)"
```

---

### Task 4: Criar restore.js com applyRecord()

**Files:**

- Create: `scripts/restore.js`
- Modify: `scripts/app.js:28-47` (usar applyRecord)
- Modify: `scripts/sidebar.js:108-134` (usar applyRecord)

- [ ] **Step 1: Criar restore.js**

```javascript
// scripts/restore.js
import { DOM } from './dom.js';
import { state } from './state.js';
import { renderIniciais, iniciaisFields } from './iniciais.js';
import { showSection } from './navigation.js';

export function applyRecord(record) {
  state.currentUUID = record.uuid;
  sessionStorage.setItem('currentUUID', record.uuid);

  state.equipamentos = record.equipamentos || [];
  state.lastTipoOrdem = record.lastTipoOrdem || '';
  state.visitedRetorno = record.visitedRetorno || false;
  state.iniciais = record.iniciais || {};
  state.retorno = record.retorno || {};
  state._createdAt = record.createdAt;

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
}
```

- [ ] **Step 2: Atualizar app.js para usar applyRecord**

```javascript
// scripts/app.js (topo)
import { DOM, cacheDOM } from './dom.js';
import { state, debouncedSave } from './state.js';
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
import { renderSidebar, closeSidebar } from './sidebar.js';
import { getRecord } from './db.js';
import { applyRecord } from './restore.js';

// scripts/app.js (linha 28-47)
async function restoreSavedState() {
  const uuid = sessionStorage.getItem('currentUUID');
  if (!uuid) return false;

  try {
    const record = await getRecord(uuid);
    if (!record) {
      sessionStorage.removeItem('currentUUID');
      return false;
    }
    const ok = confirm(
      `Há um formulário salvo (Seção ${record.currentSection} de 5). Deseja continuar de onde parou?`
    );
    if (!ok) {
      sessionStorage.removeItem('currentUUID');
      return false;
    }

    applyRecord(record);
    return true;
  } catch (_) {
    return false;
  }
}
```

- [ ] **Step 3: Atualizar sidebar.js para usar applyRecord**

```javascript
// scripts/sidebar.js (topo)
import { DOM } from './dom.js';
import { state } from './state.js';
import { getAllRecords, deleteRecord, getRecord } from './db.js';
import { showSection } from './navigation.js';
import { renderIniciais, iniciaisFields } from './iniciais.js';
import { formatDate } from './utils.js';
import { applyRecord } from './restore.js';

// scripts/sidebar.js (linha 108-134)
function loadRecord(record) {
  applyRecord(record);
  closeSidebar();
}
```

- [ ] **Step 4: Commit**

```bash
git add scripts/restore.js scripts/app.js scripts/sidebar.js
git commit -m "refactor: extract applyRecord to restore.js (D2)"
```

---

### Task 5: Adicionar showConfirm em ui.js

**Files:**

- Modify: `scripts/ui.js` (adicionar showConfirm)
- Modify: `index.html` (adicionar modal genérico)
- Modify: `scripts/app.js:70-73` (usar showConfirm)
- Modify: `scripts/sidebar.js:85-87` (usar showConfirm)

- [ ] **Step 1: Adicionar modal genérico em index.html**

```html
<!-- index.html (antes de </body>) -->
<div
  class="modal-overlay fixed inset-0 bg-black/40 z-50 items-center justify-center hidden"
  id="confirm-modal"
>
  <div class="modal bg-white rounded-xl p-7 max-w-[420px] w-[90%] shadow-2xl text-center">
    <p class="text-base text-gray-700 mb-6 leading-relaxed" id="confirm-modal-text"></p>
    <div class="flex gap-2.5 justify-center">
      <button class="btn btn-secondary" id="confirm-modal-cancel">Cancelar</button>
      <button class="btn btn-primary" id="confirm-modal-ok">Confirmar</button>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Adicionar showConfirm em ui.js**

```javascript
// scripts/ui.js
import { DOM } from './dom.js';

export function showError(msg) {
  DOM.errorMsg.textContent = msg;
  DOM.errorMsg.style.display = 'block';
}

export function hideError() {
  DOM.errorMsg.style.display = 'none';
}

export function showToast(msg, success = true) {
  DOM.toast.textContent = msg;
  DOM.toast.className = `toast show ${success ? 'toast-success' : 'toast-error'}`;
  setTimeout(() => {
    DOM.toast.className = 'toast';
  }, 3000);
}

export function showConfirm(message) {
  return new Promise(resolve => {
    const modal = document.getElementById('confirm-modal');
    const text = document.getElementById('confirm-modal-text');
    const okBtn = document.getElementById('confirm-modal-ok');
    const cancelBtn = document.getElementById('confirm-modal-cancel');

    text.textContent = message;
    modal.classList.remove('hidden');

    const cleanup = () => {
      modal.classList.add('hidden');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
    };

    okBtn.onclick = () => {
      cleanup();
      resolve(true);
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve(false);
    };
  });
}
```

- [ ] **Step 3: Atualizar app.js para usar showConfirm**

```javascript
// scripts/app.js (topo)
import { DOM, cacheDOM } from './dom.js';
import { state, debouncedSave } from './state.js';
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
import { renderSidebar, closeSidebar } from './sidebar.js';
import { getRecord } from './db.js';
import { applyRecord } from './restore.js';
import { showConfirm } from './ui.js';

// scripts/app.js (linha 70-73)
DOM.btnLimpar.addEventListener('click', async () => {
  const ok = await showConfirm('Tem certeza? Todos os dados serão perdidos.');
  if (!ok) return;
  resetForm();
  showSection(1, 'prev', true);
});

// scripts/app.js (linha 22-26)
async function restoreSavedState() {
  const uuid = sessionStorage.getItem('currentUUID');
  if (!uuid) return false;

  try {
    const record = await getRecord(uuid);
    if (!record) {
      sessionStorage.removeItem('currentUUID');
      return false;
    }
    const ok = await showConfirm(
      `Há um formulário salvo (Seção ${record.currentSection} de 5). Deseja continuar de onde parou?`
    );
    if (!ok) {
      sessionStorage.removeItem('currentUUID');
      return false;
    }

    applyRecord(record);
    return true;
  } catch (_) {
    return false;
  }
}
```

- [ ] **Step 4: Atualizar sidebar.js para usar showConfirm**

```javascript
// scripts/sidebar.js (topo)
import { DOM } from './dom.js';
import { state } from './state.js';
import { getAllRecords, deleteRecord, getRecord } from './db.js';
import { showSection } from './navigation.js';
import { renderIniciais, iniciaisFields } from './iniciais.js';
import { formatDate } from './utils.js';
import { applyRecord } from './restore.js';
import { showConfirm } from './ui.js';

// scripts/sidebar.js (linha 85-87)
deleteBtn.addEventListener('click', async e => {
  e.stopPropagation();
  const ok = await showConfirm('Excluir este registro? Esta ação não pode ser desfeita.');
  if (!ok) return;
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
```

- [ ] **Step 5: Commit**

```bash
git add scripts/ui.js scripts/app.js scripts/sidebar.js index.html
git commit -m "refactor: replace confirm() with showConfirm modal (O1)"
```

---

## Fase 3: Refatorar Módulos

### Task 6: Extrair compress.js de send.js

**Files:**

- Create: `scripts/compress.js`
- Modify: `scripts/send.js:26-70` (remover lógica de compressão)

- [ ] **Step 1: Criar compress.js**

```javascript
// scripts/compress.js
import { MAX_SIZE, SKIP_SIZE, toBase64, blobToBase64, loadImage } from './utils.js';

export async function compressAttachments(files) {
  const attachments = [];

  for (const file of files) {
    if (file.size <= SKIP_SIZE) {
      attachments.push({
        filename: file.name,
        content: await toBase64(file),
        encoding: 'base64',
      });
      continue;
    }

    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let width = img.naturalWidth;
    let quality = 0.9;
    let blob;

    for (let attempt = 0; attempt < 10; attempt++) {
      const ratio = width / img.naturalWidth;
      canvas.width = width;
      canvas.height = Math.round(img.naturalHeight * ratio);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (blob.size <= MAX_SIZE) break;
      width = Math.round(width * 0.8);
    }

    if (blob.size > MAX_SIZE) {
      quality = 0.7;
      const ratio = width / img.naturalWidth;
      canvas.width = width;
      canvas.height = Math.round(img.naturalHeight * ratio);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    }

    const dot = file.name.lastIndexOf('.');
    const basename = dot > -1 ? file.name.slice(0, dot) : file.name;
    attachments.push({
      filename: basename + '_red.jpg',
      content: await blobToBase64(blob),
      encoding: 'base64',
    });
  }

  return attachments;
}
```

- [ ] **Step 2: Atualizar send.js para usar compress.js**

```javascript
// scripts/send.js (topo)
import { DOM } from './dom.js';
import { state } from './state.js';
import { updateRecordStatus } from './db.js';
import { showToast } from './ui.js';
import { checkDuplicate } from './duplicate.js';
import { compressAttachments } from './compress.js';

// scripts/send.js (linha 26-70 substituir por)
const attachments = await compressAttachments(state.attachments);
```

- [ ] **Step 3: Commit**

```bash
git add scripts/compress.js scripts/send.js
git commit -m "refactor: extract image compression to compress.js (M2)"
```

---

### Task 7: Singleton openDB() em db.js

**Files:**

- Modify: `scripts/db.js:5-20` (openDB com singleton)

- [ ] **Step 1: Implementar singleton em openDB**

```javascript
// scripts/db.js (linha 5-20)
const DB_NAME = 'mail-mvp';
const DB_VERSION = 2;
const STORE_NAME = 'records';

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);

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
    req.onsuccess = () => {
      _db = req.result;
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/db.js
git commit -m "refactor: implement openDB singleton (O2)"
```

---

### Task 8: Centralizar sessionStorage em state.js

**Files:**

- Modify: `scripts/state.js` (adicionar getCurrentUUID, setCurrentUUID, clearCurrentUUID)
- Modify: `scripts/app.js` (usar funções centralizadas)
- Modify: `scripts/sidebar.js` (usar funções centralizadas)
- Modify: `scripts/reset.js` (usar funções centralizadas)

- [ ] **Step 1: Adicionar funções auxiliares em state.js**

```javascript
// scripts/state.js (após linha 18)
export const getCurrentUUID = () => sessionStorage.getItem('currentUUID') || '';

export const setCurrentUUID = uuid => {
  state.currentUUID = uuid;
  sessionStorage.setItem('currentUUID', uuid);
};

export const clearCurrentUUID = () => {
  state.currentUUID = '';
  sessionStorage.removeItem('currentUUID');
};

// Remover linha 5: export const STORAGE_KEY = "mail_form_estado";
```

- [ ] **Step 2: Atualizar app.js para usar funções centralizadas**

```javascript
// scripts/app.js (linha 2)
import { state, debouncedSave, getCurrentUUID, setCurrentUUID, clearCurrentUUID } from './state.js';

// scripts/app.js (linha 13)
const uuid = getCurrentUUID();

// scripts/app.js (linha 19-20)
if (!record) {
  clearCurrentUUID();
  return false;
}

// scripts/app.js (linha 24-25)
if (!ok) {
  clearCurrentUUID();
  return false;
}

// scripts/app.js (linha 28)
setCurrentUUID(uuid);
```

- [ ] **Step 3: Atualizar sidebar.js para usar funções centralizadas**

```javascript
// scripts/sidebar.js (linha 2)
import { state, clearCurrentUUID } from './state.js';

// scripts/sidebar.js (linha 91-93)
if (state.currentUUID === record.uuid) {
  clearCurrentUUID();
}
```

- [ ] **Step 4: Atualizar reset.js para usar funções centralizadas**

```javascript
// scripts/reset.js (topo)
import { state, clearCurrentUUID } from './state.js';

// scripts/reset.js (linha 8-9)
clearCurrentUUID();
```

- [ ] **Step 5: Commit**

```bash
git add scripts/state.js scripts/app.js scripts/sidebar.js scripts/reset.js
git commit -m "refactor: centralize sessionStorage access in state.js (D4, O3)"
```

---

## Fase 4: Corrigir Persistência

### Task 9: Adicionar listeners em renderIniciais()

**Files:**

- Modify: `scripts/iniciais.js:89-93` (adicionar listeners após criar campos)

- [ ] **Step 1: Adicionar listeners de debouncedSave em renderIniciais**

```javascript
// scripts/iniciais.js (linha 89-93)
addBlurValidation(input);
input.addEventListener('input', debouncedSave);
input.addEventListener('change', debouncedSave);
group.appendChild(label);
group.appendChild(input);
wrapper.appendChild(group);
```

- [ ] **Step 2: Commit**

```bash
git add scripts/iniciais.js
git commit -m "fix: add debouncedSave listeners to iniciais fields (P1)"
```

---

### Task 10: Mover UUID para localStorage

**Files:**

- Modify: `scripts/state.js:16` (usar localStorage ao invés de sessionStorage)
- Modify: `scripts/state.js:20-28` (atualizar funções auxiliares)

- [ ] **Step 1: Alterar state.js para usar localStorage**

```javascript
// scripts/state.js (linha 16)
currentUUID: localStorage.getItem("currentUUID") || "",

// scripts/state.js (linha 20-28)
export const getCurrentUUID = () => localStorage.getItem("currentUUID") || "";

export const setCurrentUUID = (uuid) => {
  state.currentUUID = uuid;
  localStorage.setItem("currentUUID", uuid);
};

export const clearCurrentUUID = () => {
  state.currentUUID = "";
  localStorage.removeItem("currentUUID");
};
```

- [ ] **Step 2: Commit**

```bash
git add scripts/state.js
git commit -m "fix: use localStorage for UUID to persist across sessions (P6)"
```

---

### Task 11: Atualizar state.equipamentos antes de saveState()

**Files:**

- Modify: `scripts/equipment.js:32,38` (atualizar state.equipamentos antes de saveState)

- [ ] **Step 1: Atualizar equipment.js para coletar dados antes de salvar**

```javascript
// scripts/equipment.js (linha 32)
export function removeEquip(row) {
  row.remove();
  updateSkipBtn();
  collectEquipamentos();
  saveState();
}

// scripts/equipment.js (linha 38)
export function addEquip(data = null) {
  const row = createEquipRow(data);
  DOM.equipList.appendChild(row);
  updateSkipBtn();
  collectEquipamentos();
  saveState();
}

// scripts/equipment.js (nova função)
function collectEquipamentos() {
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

- [ ] **Step 2: Commit**

```bash
git add scripts/equipment.js
git commit -m "fix: update state.equipamentos before saveState (P3)"
```

---

### Task 12: Restaurar \_createdAt em restoreSavedState

**Files:**

- Modify: `scripts/app.js:28` (adicionar state.\_createdAt = record.createdAt)

- [ ] **Step 1: Atualizar applyRecord para restaurar \_createdAt**

```javascript
// scripts/restore.js (linha 13)
state.retorno = record.retorno || {};
state._createdAt = record.createdAt;
```

- [ ] **Step 2: Commit**

```bash
git add scripts/restore.js
git commit -m "fix: restore _createdAt from record (P8)"
```

---

### Task 13: Tratamento de QuotaExceededError

**Files:**

- Modify: `scripts/state.js:64` (verificar QuotaExceededError)

- [ ] **Step 1: Adicionar tratamento de quota em saveState**

```javascript
// scripts/state.js (linha 64)
saveDraft(data).catch(err => {
  console.error('saveDraft error:', err);
  if (err.name === 'QuotaExceededError' || err.message?.includes('quota')) {
    showToast('Espaço insuficiente no navegador. Limpe dados antigos na sidebar.', false);
  }
});
```

- [ ] **Step 2: Commit**

```bash
git add scripts/state.js
git commit -m "fix: handle QuotaExceededError in saveState (P9)"
```

---

### Task 14: Aguardar updateRecordStatus em send.js

**Files:**

- Modify: `scripts/send.js:80-85` (aguardar updateRecordStatus antes de liberar botão)

- [ ] **Step 1: Atualizar send.js para aguardar updateRecordStatus**

```javascript
// scripts/send.js (linha 80-85)
if (res.ok && data.success) {
  showToast('Email enviado com sucesso!', true);
  if (state.currentUUID) {
    await updateRecordStatus(state.currentUUID, {
      to: data.to,
      subject,
      sentAt: new Date().toISOString(),
    });
  }
  return true;
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/send.js
git commit -m "fix: await updateRecordStatus before enabling button (P11)"
```

---

### Task 15: Validar text e SMTP_FROM no backend

**Files:**

- Modify: `netlify/functions/send.js:15-25` (adicionar validações)

- [ ] **Step 1: Adicionar validação de text e SMTP_FROM**

```javascript
// netlify/functions/send.js (linha 15-25)
const { subject, text, attachments } = JSON.parse(event.body || '{}');

if (!subject || typeof subject !== 'string') {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: "Campo 'subject' é obrigatório." }),
  };
}

if (!text || typeof text !== 'string') {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: "Campo 'text' é obrigatório." }),
  };
}

const SMTP_FROM = process.env.SMTP_FROM;
if (!SMTP_FROM || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(SMTP_FROM)) {
  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'SMTP_FROM inválido ou não configurado.' }),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add netlify/functions/send.js
git commit -m "fix: validate text and SMTP_FROM in backend (P12, P13)"
```

---

## Resumo

**Total de tarefas:** 15  
**Estimativa de tempo:** 45-75 minutos (3-5 min por tarefa)

**Problemas resolvidos:**

- ✅ C1, C2: Dependências circulares
- ✅ D1, D2, D4: Código duplicado
- ✅ M2: Compressão inline
- ✅ O1, O2, O3: Código obsoleto
- ✅ P1, P3, P6, P8, P9, P11, P12, P13: Persistência

**Problemas adiados (baixa prioridade):**

- M1, M3, M4: Refatorações maiores de navigation.js e state.js
- D3, D5: Código duplicado menor
- O4: innerHTML com dados interpolados
- P2, P5, P7, P10: Melhorias incrementais
