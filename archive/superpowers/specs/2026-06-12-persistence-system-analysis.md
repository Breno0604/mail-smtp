# Análise Profunda do Sistema de Salvamento

## 1. Arquitetura Atual

### 1.1 Módulos Envolvidos

```
┌─────────────────────────────────────────────────────────────────┐
│                         app.js                                   │
│  - Inicialização e listeners globais (input/change)             │
│  - Chama debouncedSave() em cada input                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     persistence.js                               │
│  - saveState(): Coleta dados e salva no IndexedDB              │
│  - debouncedSave(): Debounce de 1 segundo                       │
│  - UUID helpers: getCurrentUUID, setCurrentUUID, clearCurrentUUID│
│  - markAttachmentsDirty(): Dirty tracking para anexos           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        db.js                                     │
│  - IndexedDB wrapper (records + attachments stores)             │
│  - saveDraft(), getRecord(), getAllRecords(), deleteRecord()    │
│  - saveAttachments(), getAttachmentsByUuid()                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       state.js                                   │
│  - Objeto state global (iniciais, retorno, equipamentos, etc.)  │
│  - Re-exporta funções de persistence.js                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      storage.js                                  │
│  - Operações puras de localStorage para UUID                    │
│  - Quebra ciclo de dependência state.js ↔ persistence.js        │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Fluxo de Dados (SAVE)

```
Usuário digita algo
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ app.js: document.addEventListener("input")                  │
│   - updateFilledClass()                                     │
│   - debouncedSave()                                         │
│   - updateLivePreview()                                     │
│   - checkInitialPersistence() (se UC/OS)                    │
└─────────────────────────────────────────────────────────────┘
        │
        ▼ (1 segundo depois)
┌─────────────────────────────────────────────────────────────┐
│ persistence.js: saveState()                                 │
│   1. Verifica state.iniciaisValido                          │
│   2. getIniciaisData() ← lê do DOM                          │
│   3. getRetornoData() ← lê do DOM                           │
│   4. state.equipamentos ← já está no state (coletado antes) │
│   5. _ensureUUID() ← gera UUID se não existe                │
│   6. _resolveCreatedAt() ← busca ou cria createdAt          │
│   7. Monta objeto record                                    │
│   8. saveDraft(record) ← IndexedDB                          │
│   9. Se attachmentsDirty: saveAttachments() ← IndexedDB     │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Fluxo de Dados (RESTORE)

```
Usuário clica "Editar" na sidebar
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ sidebar.js: loadRecord(record)                              │
│   - applyRecord(record)                                     │
│   - closeSidebar()                                          │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ restore.js: applyRecord(record)                             │
│   1. setCurrentUUID(record.uuid)                            │
│   2. state.iniciaisValido = true                            │
│   3. state.equipamentos = record.equipamentos               │
│   4. state.lastTipoOrdem = record.tipoOrdem                 │
│   5. state.iniciais = record.iniciais                       │
│   6. state.retorno = record.retorno                         │
│   7. Restaurar anexos (migração v2→v3)                      │
│   8. renderIniciais() ← recria campos vazios                │
│   9. Preenche campos com valores do record                  │
│  10. renderRetorno() ← recria campos de retorno             │
│  11. setRetornoData() ← preenche valores                    │
│  12. renderEquipamentos() ← recria equipamentos             │
│  13. renderPreviews() ← recria previews de anexos           │
│  14. Restaura complementoCorpo                              │
│  15. state.iniciais = getIniciaisData() ← sincroniza DOM    │
│  16. state.retorno = getRetornoData() ← sincroniza DOM      │
│  17. updateLivePreview() ← atualiza preview                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Pontos de Atenção

### 2.1 ⚠️ Fonte de Dados Dupla (DOM vs State)

**Problema:** O sistema tem duas fontes de verdade:

- `state.iniciais`, `state.retorno`, `state.equipamentos` (memória)
- DOM (campos do formulário)

**Onde acontece:**

- `saveState()` lê de AMBAS as fontes:
  - `getIniciaisData()` ← lê do DOM
  - `getRetornoData()` ← lê do DOM
  - `state.equipamentos` ← lê do state (coletado via `collectEquipamentos()`)

**Risco:** Dessincronização entre state e DOM. Se o state não for atualizado após um restore, `saveState()` pode salvar dados incorretos.

**Mitigação atual:** `applyRecord()` termina com:

```js
state.iniciais = getIniciaisData();
state.retorno = getRetornoData();
```

**Crítica:** Isso é um "band-aid". O ideal seria ter UMA fonte de verdade.

---

### 2.2 ⚠️ Equipamentos: Coleta Explícita Necessária

**Problema:** Diferente de `iniciais` e `retorno` (que são lidos do DOM no `saveState()`), equipamentos exigem chamada explícita a `collectEquipamentos()` para atualizar o state.

**Onde acontece:**

- `equipment.js`: `collectEquipamentos()` é chamado em:
  - `addEquip()` (linha 52, 34, 38)
  - Botão remover (linha 46)
  - `validation.js:validateSection2()` (linha 137)

**Risco:** Se o usuário digitar nos campos de equipamento e o `collectEquipamentos()` não for chamado, `state.equipamentos` fica stale.

**Mitigação atual:** Listeners `input` e `change` em cada campo de equipamento chamam `collectEquipamentos()` + `debouncedSave()`.

**Crítica:** Padrão inconsistente. Por que equipamentos são diferentes de iniciais/retorno?

---

### 2.3 ⚠️ Dirty Tracking Apenas para Anexos

**Problema:** Só anexos têm dirty tracking (`attachmentsDirty`). Equipamentos, iniciais e retorno são salvos toda vez.

**Impacto:**

- Anexos são pesados (base64) → dirty tracking faz sentido
- Equipamentos são leves → dirty tracking não é necessário
- Mas a inconsistência é confusa

**Pergunta:** Deveria haver dirty tracking para tudo? Ou nenhum?

---

### 2.4 ⚠️ `_resolveCreatedAt()` Faz Query Assíncrona no Save

**Problema:** `saveState()` chama `_resolveCreatedAt()` que faz uma query ao IndexedDB para buscar o `createdAt` se não estiver no state.

**Código:**

```js
async function _resolveCreatedAt(uuid) {
  if (state._createdAt) return state._createdAt;
  try {
    const existing = await getRecord(uuid);
    if (existing?.createdAt) {
      state._createdAt = existing.createdAt;
      return state._createdAt;
    }
  } catch (_) {
    console.error('getRecord in saveState:', _);
  }
  state._createdAt = new Date().toISOString();
  return state._createdAt;
}
```

**Risco:**

- Toda vez que um novo registro é salvo, há uma query extra ao IndexedDB
- Se a query falhar, um novo `createdAt` é gerado (perda de timestamp original)

**Mitigação:** `applyRecord()` seta `state._createdAt = record.createdAt`

**Crítica:** O `createdAt` deveria ser parte do state desde o início, não resolvido no save.

---

### 2.5 ⚠️ `state.js` Re-exporta de `persistence.js`

**Problema:** `state.js` re-exporta funções de `persistence.js`:

```js
export {
  setCurrentUUID,
  clearCurrentUUID,
  saveState,
  debouncedSave,
  getCurrentUUID,
  markAttachmentsDirty,
} from './persistence.js';
```

**Razão:** Quebrar ciclo de dependência:

- `state.js` importa de `storage.js` (para `getRawUUID`)
- `persistence.js` importa de `state.js` (para `state`)
- `storage.js` não tem dependências

**Crítica:** Funciona, mas é confuso. `state.js` não é apenas "state", é também um "facade" para persistence.

---

### 2.6 ⚠️ `validation.js` Tem Cache Interno

**Problema:** `validation.js` tem um cache `_validatedData` que armazena dados validados para evitar re-leitura do DOM.

**Código:**

```js
const _validatedData = {};

export function collectSectionData(n) {
  if (n === 1) {
    if (_validatedData[1] && typeof _validatedData[1] === 'object' && _validatedData[1].lider) {
      state.iniciais = _validatedData[1];
      delete _validatedData[1];
    } else {
      state.iniciais = getIniciaisData();
    }
  }
  // ...
}
```

**Risco:**

- Cache pode ficar stale se não for limpo corretamente
- Lógica complexa: "se tem cache, usa; senão, lê do DOM"

**Crítica:** Otimização prematura? Por que não ler do DOM sempre?

---

### 2.7 ⚠️ `renderEquipamentos()` Chama `addEquip()` com `silent=true`

**Problema:** `renderEquipamentos()` passa `silent=true` para `addEquip()` para evitar saves redundantes.

**Código:**

```js
export function renderEquipamentos() {
  DOM.equipList.innerHTML = '';
  if (state.equipamentos.length === 0) {
    showEmptyEquip();
  } else {
    state.equipamentos.forEach(eq => addEquip(eq, true)); // silent!
  }
}
```

**Crítica:** Parâmetro `silent` é um "hack" para evitar saves durante restore. Seria melhor ter uma função separada `renderEquipRow()` que não salva.

---

### 2.8 ⚠️ `handleTipoChange()` Chama `saveState()` Diretamente

**Problema:** Quando o tipo de ordem muda, `handleTipoChange()` chama `saveState()` diretamente (não `debouncedSave()`).

**Código:**

```js
export function handleTipoChange() {
  const tipo = DOM.tipoOrdem?.value || '';
  if (tipo === state.lastTipoOrdem) return;
  state.lastTipoOrdem = tipo;
  state.retorno = {};
  DOM.retornoCampos.innerHTML = '';
  renderRetorno();
  saveState(); // ← save imediato!
}
```

**Risco:** Save síncrono pode causar race conditions com outros saves debounce.

---

### 2.9 ⚠️ `lastTipoOrdem` é Redundante

**Problema:** `state.lastTipoOrdem` é salvo no registro, mas não é usado no restore. `applyRecord()` usa `record.tipoOrdem` em vez de `record.lastTipoOrdem`.

**Código:**

```js
// persistence.js: saveState()
const data = {
  // ...
  lastTipoOrdem: state.lastTipoOrdem, // ← salvo
  // ...
};

// restore.js: applyRecord()
state.lastTipoOrdem = record.tipoOrdem || ''; // ← usa tipoOrdem, não lastTipoOrdem!
```

**Crítica:** Campo redundante que pode causar confusão.

---

### 2.10 ⚠️ `resetForm()` Não Chama `updateLivePreview()`

**Problema:** `resetForm()` limpa o preview manualmente (`DOM.previewCorpo.textContent = "—"`), mas não chama `updateLivePreview()`.

**Código:**

```js
export function resetForm() {
  // ...
  DOM.previewCorpo.textContent = '—'; // ← hardcoded
  // ...
}
```

**Crítica:** Inconsistente com `applyRecord()` que chama `updateLivePreview()`.

---

## 3. Problemas de Organização

### 3.1 Separação de Responsabilidades

| Módulo           | Responsabilidade Atual             | Problema                    |
| ---------------- | ---------------------------------- | --------------------------- |
| `state.js`       | State + re-exporta persistence     | Confuso                     |
| `persistence.js` | Save + UUID + dirty tracking       | Muitas responsabilidades    |
| `restore.js`     | Restore + sync state/DOM + preview | Muitas responsabilidades    |
| `equipment.js`   | Render + collect + save            | Acoplamento com persistence |

### 3.2 Nomes Enganosos

- `state.js` não é apenas state, é um facade
- `persistence.js` não é apenas persistence, também gerencia UUID
- `collectEquipamentos()` não "coleta" nada, atualiza o state

### 3.3 Acoplamento Oculto

- `saveState()` depende de `getIniciaisData()` e `getRetornoData()` (lê do DOM)
- `saveState()` depende de `state.equipamentos` (lê do state)
- Essa diferença de comportamento não é óbvia

---

## 4. Sugestões de Melhoria

### 4.1 🎯 Unificar Fonte de Verdade

**Opção A: State como fonte de verdade**

- Todos os setters atualizam o state
- `saveState()` lê apenas do state
- DOM é apenas uma "view" do state

**Opção B: DOM como fonte de verdade**

- `saveState()` lê tudo do DOM
- State é apenas cache para operações rápidas

**Recomendação:** Opção A (state como fonte de verdade) é mais robusta e testável.

### 4.2 🎯 Separar UUID em Módulo Próprio

```
uuid.js
  - generateUUID()
  - getCurrentUUID()
  - setCurrentUUID()
  - clearCurrentUUID()
```

Isso tiraria responsabilidade de `persistence.js` e `state.js`.

### 4.3 🎯 Criar `record.js` para Operações de Registro

```
record.js
  - createRecord()
  - updateRecord()
  - deleteRecord()
  - getRecord()
  - getAllRecords()
```

Isso unificaria operações que hoje estão espalhadas entre `db.js`, `persistence.js` e `sidebar.js`.

### 4.4 🎯 Padronizar Coleta de Dados

Criar um módulo `collectors.js`:

```js
export function collectAllData() {
  return {
    iniciais: collectIniciais(),
    retorno: collectRetorno(),
    equipamentos: collectEquipamentos(),
    attachments: state.attachments,
  };
}
```

Isso eliminaria a inconsistência entre DOM e state.

### 4.5 🎯 Remover `lastTipoOrdem` Redundante

Se `lastTipoOrdem` não é usado no restore, não precisa ser salvo. Ou renomear para algo mais claro como `previousTipoOrdem` e usar apenas em memória.

### 4.6 🎯 Simplificar `validation.js` Cache

Remover o cache `_validatedData` e ler do DOM sempre. A otimização não é necessária para o volume de dados.

### 4.7 🎯 Separar `renderEquipRow()` de `addEquip()`

```js
// Cria e renderiza uma linha de equipamento (sem save)
export function renderEquipRow(data) { ... }

// Adiciona nova linha de equipamento (com save)
export function addEquip(data) {
  renderEquipRow(data);
  saveState();
}
```

Isso eliminaria o parâmetro `silent`.

---

## 5. Avaliação Geral

### 5.1 O que está bom

- ✅ Separação clara entre `db.js` (IndexedDB) e `persistence.js` (lógica de save)
- ✅ Dirty tracking para anexos (evita re-serialização)
- ✅ Debounce no save (evita saves excessivos)
- ✅ Migração transparente v2→v3 para anexos
- ✅ Transações atômicas no IndexedDB
- ✅ Tratamento de erro `QuotaExceededError`

### 5.2 O que precisa melhorar

- ⚠️ Fonte de dados dupla (DOM vs State)
- ⚠️ `state.js` como facade (confuso)
- ⚠️ `lastTipoOrdem` redundante
- ⚠️ Cache em `validation.js` (complexidade desnecessária)
- ⚠️ Parâmetro `silent` em `addEquip()` (hack)
- ⚠️ `resetForm()` não chama `updateLivePreview()`

### 5.3 Nota Final

| Critério         | Nota       |
| ---------------- | ---------- |
| Funcionalidade   | 9/10       |
| Organização      | 7/10       |
| Consistência     | 6/10       |
| Manutenibilidade | 7/10       |
| Testabilidade    | 8/10       |
| **Geral**        | **7.4/10** |

**Conclusão:** O sistema funciona corretamente e tem boa cobertura de testes, mas tem inconsistências arquiteturais que podem causar bugs sutis. As sugestões de melhoria focam em unificar a fonte de verdade e simplificar o fluxo de dados.
