# Rascunho Condicional — Validação de Iniciais

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rascunho só é salvo no IndexedDB quando Iniciais estiver 100% válido e o usuário avançar para a próxima etapa. Auto-save continua atualizando o rascunho existente a cada 300ms.

**Architecture:** Adicionar flag `state.iniciaisValido` que controla se `saveState()` persiste no IndexedDB. A flag é setada quando `validateSection(1)` passa em `nextSection()`, e também quando um rascunho é restaurado via `applyRecord()`. Antes disso, os dados ficam apenas em memória (`state`).

**Tech Stack:** Vanilla JS (ES6 modules), IndexedDB, Tailwind CSS.

---

## File Structure

| Arquivo                 | Ação          | Responsabilidade                                                |
| ----------------------- | ------------- | --------------------------------------------------------------- |
| `scripts/validation.js` | **Modificar** | Adicionar `isIniciaisValid()` — verificação silenciosa (sem UI) |
| `scripts/state.js`      | **Modificar** | Adicionar flag `iniciaisValido`, condicionar `saveState()`      |
| `scripts/navigation.js` | **Modificar** | Setar flag após validação em `nextSection()`                    |
| `scripts/restore.js`    | **Modificar** | Setar flag em `applyRecord()`                                   |
| `sw.js`                 | **Modificar** | Bump `CACHE_NAME` de `retorno-v13` para `retorno-v14`           |

---

### Task 1: Adicionar `isIniciaisValid()` em `validation.js`

**Files:**

- Modify: `scripts/validation.js`

- [ ] **Step 1: Adicionar função `isIniciaisValid()` ao final do arquivo**

Adicionar após a função `collectSectionData` (após a linha 133):

```javascript
/**
 * Verifica se todos os campos obrigatórios de Iniciais estão preenchidos corretamente.
 * Versão silenciosa de validateSection(1) — não modifica UI, apenas retorna boolean.
 */
export function isIniciaisValid() {
  // Verificar campos obrigatórios
  for (const field of fieldsIniciais) {
    if (!field.obrigatorio) continue;
    const el = document.getElementById(field.nome);
    if (!el || !el.value || el.value.trim() === '') return false;
  }

  // Verificar data não futura
  const dataEl = document.getElementById('data');
  if (dataEl && dataEl.value) {
    const selectedDate = new Date(dataEl.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) return false;
  }

  // Verificar hora fim > hora início
  const horaInicioEl = document.getElementById('hora_inicio');
  const horaFimEl = document.getElementById('hora_fim');
  if (horaInicioEl && horaFimEl && horaInicioEl.value && horaFimEl.value) {
    if (horaFimEl.value <= horaInicioEl.value) return false;
  }

  return true;
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/validation.js
git commit -m "feat: add isIniciaisValid() silent validation check"
```

---

### Task 2: Adicionar flag `iniciaisValido` e condicionar `saveState()` em `state.js`

**Files:**

- Modify: `scripts/state.js`

- [ ] **Step 1: Adicionar flag ao objeto `state`**

Modificar o objeto `state` (linha 19-31), adicionando `iniciaisValido: false`:

```javascript
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
  currentUUID: getCurrentUUID(),
  composicao: { complementoCorpo: '' },
  iniciaisValido: false,
};
```

- [ ] **Step 2: Condicionar `saveState()` com a flag**

Modificar o início da função `saveState()` (linha 35-38), adicionando a verificação da flag:

```javascript
export async function saveState() {
  if (!state.iniciaisValido) return;

  const iniciaisData = getIniciaisData();
  const hasData = Object.values(iniciaisData).some(v => v && v.trim() !== "");
  if (!hasData && state.equipamentos.length === 0 && state.attachments.length === 0 && !state.currentUUID) return;
```

- [ ] **Step 3: Commit**

```bash
git add scripts/state.js
git commit -m "feat: gate saveState() behind iniciaisValido flag"
```

---

### Task 3: Setar flag em `nextSection()` em `navigation.js`

**Files:**

- Modify: `scripts/navigation.js`

- [ ] **Step 1: Importar `isIniciaisValid`**

Modificar a linha 4 (import de validation.js):

```javascript
import { validateSection, collectSectionData, isIniciaisValid } from './validation.js';
```

- [ ] **Step 2: Setar flag após validação em `nextSection()`**

Modificar a função `nextSection()` (linhas 108-118), adicionando a setagem da flag após `validateSection` passar:

```javascript
export async function nextSection() {
  if (!validateSection(state.currentSection, { equipamentos: state.equipamentos })) return;
  collectSectionData(state.currentSection);

  // Marcar Iniciais como válido após validação bem-sucedida
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

- [ ] **Step 3: Commit**

```bash
git add scripts/navigation.js
git commit -m "feat: set iniciaisValido flag after section 1 validation passes"
```

---

### Task 4: Setar flag em `applyRecord()` em `restore.js`

**Files:**

- Modify: `scripts/restore.js`

- [ ] **Step 1: Setar flag ao restaurar rascunho**

Modificar a função `applyRecord()`, adicionando `state.iniciaisValido = true;` após `setCurrentUUID(record.uuid);` (linha 8):

```javascript
export function applyRecord(record) {
  setCurrentUUID(record.uuid);
  state.iniciaisValido = true;

  state.equipamentos = record.equipamentos || [];
```

- [ ] **Step 2: Commit**

```bash
git add scripts/restore.js
git commit -m "feat: set iniciaisValido flag when restoring saved draft"
```

---

### Task 5: Atualizar Service Worker cache

**Files:**

- Modify: `sw.js`

- [ ] **Step 1: Bump do CACHE_NAME**

Alterar linha 1:

```javascript
const CACHE_NAME = 'retorno-v13';
```

Para:

```javascript
const CACHE_NAME = 'retorno-v14';
```

- [ ] **Step 2: Commit**

```bash
git add sw.js
git commit -m "chore: bump SW cache version to retorno-v14"
```

---

### Task 6: Testes manuais de verificação

- [ ] **Step 1: Testar que rascunho NÃO salva antes de validar Iniciais**
  - Abrir formulário novo
  - Preencher apenas 1 campo de Iniciais (ex: Líder)
  - Aguardar 1 segundo (auto-save trigger)
  - Abrir sidebar → verificar que NÃO aparece rascunho

- [ ] **Step 2: Testar que rascunho salva após validar e avançar**
  - Preencher todos os campos obrigatórios de Iniciais corretamente
  - Clicar "Avançar"
  - Abrir sidebar → verificar que o rascunho aparece

- [ ] **Step 3: Testar auto-save contínuo após avançar**
  - Com rascunho salvo, preencher equipamentos
  - Aguardar 1 segundo
  - Recarregar página → verificar que equipamentos foram restaurados

- [ ] **Step 4: Testar restore de rascunho existente**
  - Ter um rascunho salvo no IndexedDB
  - Recarregar página → aceitar continuar de onde parou
  - Verificar que o formulário é restaurado corretamente
  - Fazer alteração → verificar que auto-save continua funcionando

- [ ] **Step 5: Testar validação de hora**
  - Preencher hora início "08:00" e hora fim "07:00"
  - Clicar "Avançar" → verificar erro "Hora fim deve ser maior que hora início"
  - Verificar que rascunho NÃO foi salvo (sidebar vazia)

- [ ] **Step 6: Testar validação de data futura**
  - Preencher data com dia de amanhã
  - Clicar "Avançar" → verificar erro "Data não pode ser futura"
  - Verificar que rascunho NÃO foi salvo

---

## Self-Review

**Spec coverage:**

- [x] Rascunho só salva após Iniciais válido + avançar → Task 2 + Task 3
- [x] Auto-save continua atualizando rascunho existente → Task 2 (flag permite saveState após setada)
- [x] Restore de rascunho existente funciona → Task 4
- [x] Validação de hora/data bloqueia salvamento → Task 1 (isIniciaisValid verifica tudo)
- [x] SW cache atualizado → Task 5

**Placeholder scan:** Nenhum placeholder encontrado.

**Type consistency:** `isIniciaisValid()` retorna boolean, `state.iniciaisValido` é boolean. `saveState()` verifica `!state.iniciaisValido` e retorna early. `nextSection()` seta `state.iniciaisValido = true` após `validateSection` passar. `applyRecord()` seta `state.iniciaisValido = true` ao restaurar.
