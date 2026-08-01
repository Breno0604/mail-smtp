---
name: feature-development-guide
description: Use quando o usuário pedir uma feature nova (seção, componente, validação, store IndexedDB, event listener, API) que não se encaixa em retorno-fields-guide, order-types-guide, ui-text-guide, ou email-composition-guide. Sintomas: 'nova seção', 'novo componente', 'nova validação', 'novo módulo'.
---

# Guia de Desenvolvimento de Features

## Quando usar

Use esta skill quando:

- O usuário pedir para adicionar uma nova funcionalidade ao sistema
- A tarefa não se encaixa nas skills específicas (campos de retorno, tipos de ordem, textos de UI, email)
- O usuário mencionar "nova seção", "novo componente", "nova validação", "nova API", "novo módulo"
- A feature toca múltiplos arquivos e camadas da arquitetura

## Arquitetura do Projeto

O projeto segue uma arquitetura em 5 camadas com ES6 modules, sem bundler.

```
┌─────────────────────────────────┐
│ Entry Points                    │  index.html, app.js, sw.js
├─────────────────────────────────┤
│ Orchestration                   │  app.js, send.js, reset.js, restore.js, sidebar.js
├─────────────────────────────────┤
│ Cross-Cutting                   │  persistence.js, email.js, validation.js, collectors.js, ui.js
├─────────────────────────────────┤
│ Feature Modules                 │  iniciais.js, retornos.js, equipment.js, attachments.js
├─────────────────────────────────┤
│ Infrastructure                  │  state.js, dom.js, db.js, uuid.js, utils.js, styles.js
├─────────────────────────────────┤
│ Data                            │  fields-data.js, retorno-templates.js, equipment-keys.js
└─────────────────────────────────┘
```

### Camadas em detalhe

| Camada              | Arquivos                                                                | Responsabilidade                                    |
| ------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- |
| **Entry Points**    | `index.html`, `app.js`, `sw.js`                                         | Inicialização da aplicação, service worker          |
| **Orchestration**   | `send.js`, `reset.js`, `restore.js`, `sidebar.js`                       | Fluxos completos (envio, reset, restore, navegação) |
| **Cross-Cutting**   | `persistence.js`, `email.js`, `validation.js`, `collectors.js`, `ui.js` | Serviços transversais usados por múltiplos módulos  |
| **Feature Modules** | `iniciais.js`, `retornos.js`, `equipment.js`, `attachments.js`          | Renderização + eventos de seções específicas        |
| **Infrastructure**  | `state.js`, `dom.js`, `db.js`, `uuid.js`, `utils.js`, `styles.js`       | Serviços base: estado, DOM, banco, utilidades       |
| **Data**            | `fields-data.js`, `retorno-templates.js`, `equipment-keys.js`           | Dados estáticos, sem imports de outros módulos      |

### Grafo de dependências (quem importa quem)

```
app.js ← dom, state, persistence, fields, iniciais, db, equipment,
         retornos, attachments, reset, sidebar, utils, send, email, filled-state

send.js ← dom, state, db, ui, duplicate, compress, validation, collectors, email, persistence
reset.js ← dom, state, persistence, iniciais, retornos, equipment, attachments, ui, utils, email, collectors
restore.js ← dom, state, persistence, iniciais, fields, retornos, equipment, attachments, utils, db, email, collectors, filled-state
sidebar.js ← dom, state, db, utils, restore, reset, ui

persistence.js ← state, db, utils, uuid, collectors
email.js ← dom, fields, collectors, equipment-keys, utils, retorno-templates
validation.js ← dom, state, ui, collectors, fields
collectors.js ← dom, state, fields
ui.js ← dom

iniciais.js ← dom, persistence, validation, ui, fields, utils, styles
retornos.js ← dom, state, persistence, validation, fields, iniciais
equipment.js ← state, persistence, styles, equipment-keys
attachments.js ← dom, state, persistence, ui

state.js ← uuid, equipment-keys
fields.js ← fields-data
db.js ← (IndexedDB nativo)
```

Não há dependências circulares (a única que existia foi quebrada extraindo `filled-state.js`).

### Convenções para novos módulos

| Regra                                | Detalhe                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| **ES6 modules**                      | `export function` / `export const` — sem bundler                                      |
| **DOM via proxy**                    | Importar `DOM` de `dom.js`; nunca `getElementById` fora de `cacheDOM()`               |
| **State mutável**                    | Importar `state` de `state.js`; mutar diretamente                                     |
| **Persistência**                     | Chamar `debouncedSave()` após mudanças de state; `markAttachmentsDirty()` para anexos |
| **CSS via constantes**               | `INPUT_CLASS`, `SELECT_CLASS` de `styles.js`                                          |
| **Nomes PT/EN**                      | Domínio/negócio em português; infraestrutura/utilitários em inglês                    |
| **Um módulo = uma responsabilidade** | Não criar arquivos monolíticos                                                        |

---

## Checklist geral para qualquer feature

### Antes de implementar

- [ ] Identificar o cenário (A-F) que mais se aproxima da feature
- [ ] Verificar se a feature já existe parcialmente (evitar duplicação)
- [ ] Listar todos os arquivos que serão tocados

### Durante

- [ ] Criar/editar arquivos na ordem: data → infrastructure → feature → cross-cutting → orchestration → entry points
- [ ] Seguir o padrão de imports existente no módulo mais similar
- [ ] Se criar novo módulo, adicionar ao `STATIC_ASSETS` no `sw.js`

### Após

- [ ] Rodar `npm test` — todos os testes devem passar
- [ ] Verificar no navegador (`npx netlify dev`)
- [ ] Husky bumpa `CACHE_NAME` automaticamente

---

## Cenário A: Nova seção de formulário

**Exemplo prático:** adicionar "6 Observações" com campo de texto livre.

**Complexidade:** Alta (~14 arquivos)

### Checklist

| #   | Arquivo                  | O que fazer                                                                                                                                                    |
| --- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `index.html`             | Adicionar `<section id="sec-observacoes">` com `.sec-card`, `.sec-head` (título), `.sec-body` (campos)                                                         |
| 2   | `scripts/dom.js`         | Cachear container em `cacheDOM()`: `fresh.secObservacoes = document.getElementById('sec-observacoes')`                                                         |
| 3   | Novo módulo              | Criar `scripts/observacoes.js` com `renderObservacoes()` + event bindings. Seguir padrão de `iniciais.js`: criar inputs dinâmicos, `debouncedSave()` no change |
| 4   | `scripts/state.js`       | Adicionar `observacoes: {}` no objeto `state`                                                                                                                  |
| 5   | `scripts/collectors.js`  | Criar `collectObservacoes()` — ler DOM → `state.observacoes`. Exportar e usar em `collectAllData()`                                                            |
| 6   | `scripts/validation.js`  | Criar `validateObservacoes()` com `markError()`/`clearError()`. Registrar no array `SECTION_VALIDATORS` e em `validateAll()`                                   |
| 7   | `scripts/persistence.js` | Em `saveState()`, chamar `collectObservacoes()` junto com os outros collectors — busca por `collectIniciais(); collectRetorno(); collectEquipamentos()`        |
| 8   | `scripts/app.js`         | Em `DOMContentLoaded`: chamar `renderObservacoes()`. Em `initEvents()`: listener se necessário                                                                 |
| 9   | `scripts/reset.js`       | Em `resetForm()`: limpar `state.observacoes` + DOM da seção                                                                                                    |
| 10  | `scripts/restore.js`     | Em `applyRecord()`: restaurar `state.observacoes` e re-renderizar                                                                                              |
| 11  | `scripts/email.js`       | Em `composeEmail()`: adicionar seção com os dados de `data.observacoes`                                                                                        |
| 12  | `sw.js`                  | Adicionar `/scripts/observacoes.js` ao array `STATIC_ASSETS`                                                                                                   |
| 13  | `tests/`                 | Criar `tests/observacoes.test.js` + verificar se `tests/integration.test.js` precisa de update                                                                 |

### Padrão de HTML para nova seção

```html
<section id="sec-observacoes" class="sec-card">
  <div class="sec-head">
    <h2>6 Observações</h2>
  </div>
  <div class="sec-body">
    <!-- campos aqui -->
  </div>
</section>
```

### Padrão de módulo para nova seção

```js
import { DOM } from './dom.js';
import { state } from './state.js';
import { debouncedSave } from './persistence.js';
import { INPUT_CLASS } from './styles.js';

export function renderObservacoes() {
  const container = DOM.secObservacoes.querySelector('.sec-body');
  // Criar inputs dinamicamente
  // Anexar event listeners (input/change → state + debouncedSave)
}
```

---

## Cenário B: Novo componente de UI

**Exemplo prático:** adicionar uma toolbar, status bar, ou widget visual.

**Complexidade:** Média (~5 arquivos)

### Checklist

| #   | Arquivo          | O que fazer                                                                                 |
| --- | ---------------- | ------------------------------------------------------------------------------------------- |
| 1   | `index.html`     | Adicionar HTML do componente (div, botões, etc.)                                            |
| 2   | `scripts/dom.js` | Cachear elementos em `cacheDOM()`                                                           |
| 3   | Novo módulo      | Criar script com `init()` + event handlers                                                  |
| 4   | `scripts/app.js` | Importar módulo, chamar `init()` no `DOMContentLoaded`, registrar eventos em `initEvents()` |
| 5   | `sw.js`          | Adicionar script ao `STATIC_ASSETS`                                                         |

### Se for um modal

Usar o sistema de modais existente em `ui.js`:

- `showModalElements(overlay, body, confirmBtn, cancelBtn, content)` — modal genérico — busca por `export function showModalElements(`
- `showConfirm(message)` → `Promise<boolean>` — confirmação simples — busca por `export function showConfirm(`
- `showModal(modalId, message)` — modal informativo com botão fechar

Padrão: criar HTML no `index.html` seguindo o modelo de `dup-modal` ou `confirm-modal`, cachear elementos no `dom.js`.

### Se for um componente inline (toolbar/status bar)

Padrão: adicionar HTML fixo no `index.html`, cachear no `dom.js`, criar módulo de controle com `init()` + listeners.

---

## Cenário C: Nova regra de validação

**Exemplo prático:** validar que UC tem prefixo específico, ou que data não é domingo.

**Complexidade:** Baixa (~2-3 arquivos)

### Checklist

| #   | Arquivo                    | O que fazer                                              |
| --- | -------------------------- | -------------------------------------------------------- |
| 1   | `scripts/validation.js`    | Adicionar regra no local correto                         |
| 2   | `scripts/validation.js`    | Se for regra de seção nova, registrar em `validateAll()` |
| 3   | `tests/validation.test.js` | Testar a nova regra                                      |

### Locais para adicionar validação

| Local                | Onde buscar                               | Quando usar                                       |
| -------------------- | ----------------------------------------- | ------------------------------------------------- |
| `FIELD_VALIDATIONS`  | busca por `const FIELD_VALIDATIONS = {`   | Regras de min/max length para campos específicos  |
| `validateSection1()` | busca por `function validateSection1()`   | Validação de campos iniciais (UC, OS, data, hora) |
| `validateSection3()` | busca por `function validateSection3()`   | Validação de equipamentos e campos de retorno     |
| `SECTION_VALIDATORS` | busca por `const SECTION_VALIDATORS = {`  | Registrar nova função de validação de seção       |
| `validateAll()`      | busca por `export function validateAll()` | Fluxo completo de validação — ordem importa       |

### Padrão de validação

```js
function validateMeuCampo() {
  const el = document.getElementById('meu_campo');
  if (!el || el.closest('.form-group')?.style.display === 'none') return null;
  const value = el.value.trim();
  if (!value) {
    markError(el, 'Campo obrigatório');
    return 'Campo obrigatório';
  }
  clearError(el);
  return null;
}
```

**Regras:**

- Campos ocultos (`display: none`) devem ser pulados
- Usar `markError(el, message)` / `clearError(el)` para feedback visual
- Retornar mensagem de erro ou `null` (sucesso)
- Validação em `validateAll()` para no primeiro erro

---

## Cenário D: Nova store no IndexedDB

**Exemplo prático:** armazenar configurações do usuário, cache de dados externos.

**Complexidade:** Média (~3-4 arquivos)

### Checklist

| #   | Arquivo                  | O que fazer                                                                                                |
| --- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 1   | `scripts/db.js`          | Bump `DB_VERSION`. No `onupgradeneeded`, criar store com `db.createObjectStore('nome', { keyPath: 'id' })` |
| 2   | `scripts/db.js`          | Adicionar métodos CRUD usando `withTransaction()`                                                          |
| 3   | `scripts/persistence.js` | Se integrado ao fluxo de save, incluir no `saveRecordAtomic()`                                             |
| 4   | `tests/db.test.js`       | Testar nova store                                                                                          |

### Padrão de upgrade no `onupgradeneeded`

```js
request.onupgradeneeded = event => {
  const db = event.target.result;
  // ... migrações existentes ...
  if (event.oldVersion < 4) {
    if (!db.objectStoreNames.contains('config')) {
      db.createObjectStore('config', { keyPath: 'id' });
    }
  }
};
```

### Padrão de método CRUD

```js
export async function saveConfig(key, value) {
  const db = await openDB();
  return withStore('config', 'readwrite', store => store.put({ id: key, value }));
}

export async function getConfig(key) {
  const db = await openDB();
  return withStore('config', 'readonly', store => store.get(key));
}
```

**Regras:**

- `DB_VERSION` deve ser incrementado a cada mudança de schema
- Store name exportado como constante (ex: `export const STORE_CONFIG = 'config'`)
- Sempre verificar `!db.objectStoreNames.contains('nome')` antes de criar

---

## Cenário E: Novo event listener

**Exemplo prático:** atalho de teclado, gesture, evento customizado.

**Complexidade:** Baixa (~1-2 arquivos)

### Checklist

| #   | Arquivo                         | O que fazer                                        |
| --- | ------------------------------- | -------------------------------------------------- |
| 1   | `scripts/app.js` `initEvents()` | Adicionar listener                                 |
| 2   | Handler                         | Definir no módulo da feature ou inline no `app.js` |

### Tipos de listener e onde registrar

| Tipo                      | Padrão                                                               | Exemplo no código                                                                  |
| ------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Elemento cached**       | `DOM.elemento.addEventListener('event', handler)`                    | `initEvents()` — busca por `DOM.btnEnviar.addEventListener('click', sendEmail)`    |
| **Delegação no document** | `document.addEventListener('event', e => { if (match) handler(e) })` | `initEvents()` — busca por `document.addEventListener('input', handleFieldChange)` |
| **Classe CSS**            | `e.target.classList.contains('classe')`                              | `initEvents()` — busca por `e.target.classList.contains('equip-checkbox')`         |
| **Seletor CSS**           | `e.target.matches('seletor')`                                        | `initEvents()` — busca por `e.target.matches('#campos-instalados input')`          |

### Padrão para handler com state

```js
function handleMeuEvento(e) {
  // 1. Mutar state
  state.meuDado = e.target.value;

  // 2. Persistir (com debounce para inputs)
  debouncedSave();

  // 3. Atualizar UI
  updateLivePreview();
}
```

---

## Cenário F: Novo data source / API

**Exemplo prático:** buscar lista de municípios de uma API externa, enviar dados para um webhook.

**Complexidade:** Média (~4-5 arquivos)

### Checklist

| #   | Arquivo            | O que fazer                                                                                                                                        |
| --- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Novo módulo        | Criar `scripts/api-service.js` com `fetch()` wrapper + tratamento de erro                                                                          |
| 2   | `scripts/state.js` | Adicionar propriedades para cachear os dados                                                                                                       |
| 3   | `scripts/app.js`   | Chamar a API no `DOMContentLoaded` ou sob demanda                                                                                                  |
| 4   | `sw.js`            | Se a API está em `/api/`, já é excluída do cache — busca por `event.request.url.includes('/api/')` no fetch handler. Se for URL externa, verificar |
| 5   | `tests/`           | Mockar `fetch` com `vi.fn()`                                                                                                                       |

### Padrão de módulo API

```js
const API_BASE = '/api';

export async function fetchDados() {
  try {
    const response = await fetch(`${API_BASE}/dados`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    if (!navigator.onLine) {
      throw new Error('Sem internet');
    }
    throw new Error('Erro ao buscar dados');
  }
}
```

**Regras:**

- Sempre verificar `navigator.onLine` para mensagens de erro amigáveis
- Timeout + retry para chamadas críticas (padrão do `send.js`)
- Dados cacheados no `state` para acesso offline
- Rotas `/api/*` são automaticamente bypass do service worker

---

## Resumo: complexidade por cenário

| Cenário | Descrição                | Arquivos tocados | Complexidade |
| ------- | ------------------------ | ---------------- | ------------ |
| A       | Nova seção de formulário | ~14              | Alta         |
| B       | Novo componente UI       | ~5               | Média        |
| C       | Nova regra de validação  | ~3               | Baixa        |
| D       | Nova store IndexedDB     | ~4               | Média        |
| E       | Novo event listener      | ~2               | Baixa        |
| F       | Novo data source / API   | ~5               | Média        |

---

## Situações a evitar

- ❌ Criar módulo sem adicionar ao `STATIC_ASSETS` no `sw.js` — o service worker não vai cachear
- ❌ Usar `getElementById` fora de `cacheDOM()` ou de coletores/validadores de campos dinâmicos
- ❌ Mutar state sem chamar `debouncedSave()` — dados não persistem
- ❌ Adicionar campo ao state sem atualizar `collectors.js` — campo não aparece no save
- ❌ Adicionar seção sem atualizar `reset.js` — reset deixa dados fantasmas
- ❌ Adicionar seção sem atualizar `restore.js` — registro restaurado perde dados da seção
- ❌ Criar dependência circular entre módulos — extrair para módulo separado (padrão `filled-state.js`)
- ❌ Bump `DB_VERSION` sem adicionar migração no `onupgradeneeded` — browsers com versão antiga quebram
- ❌ Handler de evento que faz `saveState()` direto em vez de `debouncedSave()` — performance em inputs
