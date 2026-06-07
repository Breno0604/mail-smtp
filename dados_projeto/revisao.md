# Revisão Arquitetural — mail-smtp
> Análise sob os critérios: Modularidade, Dependências Circulares, Código Obsoleto e Código Duplicado/Ambíguo.

---

## 1. Modularidade

### M1 — `navigation.js` acumula responsabilidades demais (God Module)

**Impacto:** O módulo importa 10 dependências e mistura três responsabilidades distintas: transição de UI (animações, indicadores de step), orquestração de renders por seção e disparo de envio de e-mail. Isso viola o princípio de responsabilidade única (SRP) e aumenta o acoplamento: qualquer mudança em qualquer seção obriga uma alteração em `navigation.js`.

**Sugestão:**
```
navigation.js     → apenas: animação, step-indicator, botões
section-hooks.js  → novo módulo: onEnterSection(n) com os renders por seção
nextSection()     → move para app.js ou um controller.js dedicado
```

---

### M2 — `send.js` contém lógica de compressão de imagem inline

**Impacto:** A função `sendEmail` em `send.js` incorpora um algoritmo de compressão iterativa via Canvas (10 tentativas, fallback de qualidade) diretamente no fluxo de envio. Isso viola o SRP e impede reutilização ou teste isolado da compressão.

**Sugestão:** Extrair para `compress.js` (ou dentro de `utils.js`):
```javascript
// compress.js
export async function compressAttachments(files) { ... }
```
E em `send.js`:
```javascript
import { compressAttachments } from "./compress.js";
const attachments = await compressAttachments(state.attachments);
```

---

### M3 — `DOM.tipoOrdem` é reatribuído em três módulos distintos

**Impacto:** `DOM.tipoOrdem = document.getElementById("tipo-ordem")` aparece em `app.js`, `navigation.js` e `sidebar.js`. Isso acontece porque `renderIniciais()` reconstrói o DOM da seção 1, invalidando a referência cacheada em `cacheDOM()`. O sintoma é um objeto DOM singleton (`DOM`) com uma propriedade instável.

**Sugestão:** Não cachear `tipoOrdem` no singleton `DOM`, pois ele é recriado. Usar sempre `document.getElementById("tipo-ordem")` localmente, ou fazer `cacheDOM()` ser chamado após cada `renderIniciais()`:
```javascript
// navigation.js — ao entrar na seção 1
renderIniciais();
DOM.tipoOrdem = document.getElementById("tipo-ordem");
// remover as reatribuições dos outros módulos
```

---

### M4 — `state.js` conhece detalhes do DOM de Iniciais

**Impacto:** `saveState()` chama `getIniciaisData()` de `iniciais.js`, acoplando a camada de estado a um módulo de UI específico. O estado deveria ser alimentado pelos módulos de UI, não buscá-los ativamente.

**Sugestão:** Inverter o fluxo — os módulos de UI chamam `saveState()` passando os dados como parâmetro:
```javascript
// state.js
export async function saveState(overrides = {}) {
  const data = { ...buildStateSnapshot(), ...overrides };
  saveDraft(data);
}
// iniciais.js / navigation.js
saveState({ iniciais: getIniciaisData() });
```

---

## 2. Dependências Circulares

### C1 — Ciclo direto: `iniciais.js` ↔ `validation.js`

**Impacto:** `iniciais.js` importa `addBlurValidation` de `validation.js`. `validation.js` importa `iniciaisFields` e `getIniciaisData` de `iniciais.js`. É um ciclo direto que os motores JS resolvem por hoisting de módulos, mas pode causar valores `undefined` em imports dependendo da ordem de avaliação, especialmente em ambientes de bundling.

**Sugestão:** Quebrar o ciclo extraindo as definições de campo para um módulo sem dependências:
```
fields.js  →  apenas: iniciaisFields, retornoFields (dados puros, sem imports)
iniciais.js  →  importa de fields.js, renderiza
validation.js  →  importa de fields.js, valida
```

---

### C2 — Ciclo indireto: `state.js` → `iniciais.js` → `validation.js` → `state.js`

**Impacto:** `state.js` importa `getIniciaisData` de `iniciais.js`. `iniciais.js` importa `addBlurValidation` de `validation.js`. `validation.js` importa `state` de `state.js`. Essa cadeia forma um ciclo de três módulos, tornando o grafo de dependências não-acíclico (viola DAG). Em runtime o JS ESM tolera isso, mas em qualquer pipeline de bundling (Vite, Rollup, esbuild) isso gera warnings e pode produzir comportamento indeterminado.

**Sugestão:** Aplicar a mesma solução de C1 (extrair `fields.js`) elimina o elo `iniciais.js → validation.js`, quebrando também este ciclo indiretamente. Adicionalmente, `validation.js` não deveria precisar de `state` — remover essa dependência e receber os dados necessários por parâmetro:
```javascript
// validation.js
export function validateSection(n, { equipamentos } = state) { ... }
```

---

## 3. Código Obsoleto / Más Práticas

### O1 — `confirm()` nativo bloqueante em três locais

**Impacto:** `window.confirm()` é uma API bloqueante que congela o event loop, tem aparência inconsistente entre navegadores/SO, e em alguns contextos (iframes, PWA em standalone) pode ser suprimido ou se comportar de forma inesperada. Aparece em `app.js` (restore), `app.js` (limpar tudo) e `sidebar.js` (excluir).

**Sugestão:** Substituir pelos modais customizados já existentes no projeto (`#modal-tipo`, `#dup-modal`). O padrão já está implementado — basta criar um modal genérico de confirmação reutilizável:
```javascript
// ui.js
export function showConfirm(message) {
  return new Promise((resolve) => {
    DOM.confirmModal.querySelector("p").textContent = message;
    DOM.confirmModal.classList.remove("hidden");
    DOM.confirmOk.onclick = () => { DOM.confirmModal.classList.add("hidden"); resolve(true); };
    DOM.confirmCancel.onclick = () => { DOM.confirmModal.classList.add("hidden"); resolve(false); };
  });
}
```

---

### O2 — `openDB()` é chamado a cada operação sem singleton

**Impacto:** Em `db.js`, todas as funções (`saveDraft`, `getRecord`, `getAllRecords`, `deleteRecord`, `updateRecordStatus`) chamam `openDB()` individualmente. Cada chamada dispara `indexedDB.open()`, que gera uma nova conexão (ou reutiliza uma existente no pool do browser, com overhead de resolução de Promise). Em operações sequenciais rápidas (ex.: save durante typing), isso cria múltiplas aberturas desnecessárias.

**Sugestão:** Implementar um singleton de conexão:
```javascript
let _db = null;
function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => { /* ... */ };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}
```

---

### O3 — `STORAGE_KEY` exportado mas nunca utilizado

**Impacto:** `state.js` exporta `export const STORAGE_KEY = "mail_form_estado"` mas essa constante não é importada em nenhum outro módulo e não é usada internamente (o projeto usa IndexedDB, não `localStorage`). É um resíduo de uma implementação anterior com `localStorage`. Gera confusão sobre qual mecanismo de persistência está ativo.

**Sugestão:** Remover a constante. Se for documentar a chave do IndexedDB, fazê-lo como comentário ou como constante interna não exportada em `db.js`:
```javascript
// db.js
const DB_NAME = "mail-mvp";  // já existe — suficiente
```

---

### O4 — `innerHTML` com dados interpolados do usuário/IndexedDB

**Impacto:** Em `duplicate.js` e `retornos.js`, strings vindas do IndexedDB ou de `select` do DOM são interpoladas diretamente em `innerHTML`. Embora os valores venham de `<select>` controlados (não input livre), é uma prática de risco que pode evoluir para XSS se os dados forem expandidos para campos de texto livre.

```javascript
// duplicate.js — risco
DOM.dupModalBody.innerHTML = `Este registro (OS #${os}) já foi enviado...`;

// retornos.js — risco
DOM.retornoDesc.innerHTML = `... para <strong>${tipoLabel}</strong>.`;
```

**Sugestão:** Usar `textContent` para dados dinâmicos e criar os elementos `<strong>` programaticamente:
```javascript
// retornos.js
DOM.retornoDesc.textContent = "Preencha as informações de retorno para ";
const strong = document.createElement("strong");
strong.textContent = tipoLabel;
DOM.retornoDesc.appendChild(strong);
```

---

## 4. Código Duplicado / Ambíguo

### D1 — Função `formatDate` duplicada em `duplicate.js` e `sidebar.js`

**Impacto:** Implementação idêntica em dois módulos. Violação direta do princípio DRY. Qualquer mudança de formato de data exige alteração em dois lugares.

```javascript
// duplicate.js linha 5 — idêntica à sidebar.js linha 10
function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ...`;
}
```

**Sugestão:** Mover para `utils.js` e importar nos dois módulos:
```javascript
// utils.js
export function formatDate(iso) { ... }

// duplicate.js e sidebar.js
import { formatDate } from "./utils.js";
```

---

### D2 — Lógica de restore de registro duplicada em `app.js` e `sidebar.js`

**Impacto:** `restoreSavedState()` em `app.js` e `loadRecord()` em `sidebar.js` fazem essencialmente o mesmo trabalho: receber um `record` do IndexedDB, popular `state`, re-renderizar `renderIniciais()`, reatribuir `DOM.tipoOrdem`, restaurar campos e chamar `showSection()`. A diferença é apenas contextual (confirm dialog no restore automático). Manter dois blocos de código sinônimos garante divergência futura.

**Sugestão:** Criar uma função compartilhada `applyRecord(record)` em um módulo neutro (ex.: `state.js` ou um novo `restore.js`) e reutilizá-la nos dois contextos:
```javascript
// restore.js
export function applyRecord(record) {
  state.currentUUID = record.uuid;
  state.equipamentos = record.equipamentos || [];
  state.lastTipoOrdem = record.lastTipoOrdem || "";
  state.visitedRetorno = record.visitedRetorno || false;
  state.iniciais = record.iniciais || {};
  renderIniciais();
  DOM.tipoOrdem = document.getElementById("tipo-ordem");
  if (record.tipoOrdem) DOM.tipoOrdem.value = record.tipoOrdem;
  iniciaisFields.forEach((f) => {
    const el = document.getElementById(f.nome);
    if (el) el.value = record.iniciais?.[f.nome] || "";
  });
  if (record.composicao?.complementoCorpo && DOM.complementoCorpo)
    DOM.complementoCorpo.value = record.composicao.complementoCorpo;
  showSection(record.currentSection || 1, "next", true);
}
```

---

### D3 — Constante de CSS `inputClass` duplicada em `iniciais.js` e `retornos.js`

**Impacto:** A string de classes Tailwind do campo input (`"w-full px-3 py-2.5 border border-gray-300..."`) é idêntica em ambos os módulos. Mudança visual exige atualização em dois lugares.

**Sugestão:** Mover para `ui.js` ou um arquivo `styles.js`:
```javascript
// ui.js
export const INPUT_CLASS = "w-full px-3 py-2.5 border border-gray-300 rounded-lg ...";
export const SELECT_CLASS = INPUT_CLASS + " py-3";
```

---

### D4 — `sessionStorage` acessado diretamente em 5 módulos diferentes

**Impacto:** A chave `"currentUUID"` é lida e escrita diretamente em `state.js`, `app.js`, `sidebar.js` e `reset.js`. Não há abstração. Se a chave ou o mecanismo de storage mudar, serão 8 linhas em 4 arquivos para atualizar.

**Sugestão:** Centralizar em `state.js` com funções auxiliares:
```javascript
// state.js
export const getCurrentUUID = () => sessionStorage.getItem("currentUUID") || "";
export const setCurrentUUID = (uuid) => {
  state.currentUUID = uuid;
  sessionStorage.setItem("currentUUID", uuid);
};
export const clearCurrentUUID = () => {
  state.currentUUID = "";
  sessionStorage.removeItem("currentUUID");
};
```

---

### D5 — `getSectionName()` em `navigation.js` nunca é usada

**Impacto:** A função `getSectionName(n)` está definida em `navigation.js` mas não é chamada em nenhum lugar do codebase. É dead code que polui o módulo.

**Sugestão:** Remover. Se for necessária no futuro para acessibilidade (`aria-label`), reintroduzir quando houver uso concreto.

---

## Resumo por Critério

| # | Problema | Critério | Severidade |
|---|----------|----------|-----------|
| C1 | Ciclo direto `iniciais` ↔ `validation` | Dependência Circular | 🔴 Alta |
| C2 | Ciclo indireto `state → iniciais → validation → state` | Dependência Circular | 🔴 Alta |
| D2 | Lógica de restore duplicada em `app.js` e `sidebar.js` | Código Duplicado | 🟠 Média |
| M1 | `navigation.js` como God Module (10 imports, 3 responsabilidades) | Modularidade | 🟠 Média |
| M2 | Compressão de imagem acoplada ao `sendEmail` | Modularidade | 🟠 Média |
| M3 | `DOM.tipoOrdem` reatribuído em 3 módulos | Modularidade | 🟠 Média |
| O1 | `confirm()` nativo bloqueante em 3 locais | Código Obsoleto | 🟠 Média |
| O2 | `openDB()` sem singleton | Código Obsoleto | 🟡 Baixa |
| D1 | `formatDate` duplicada em `duplicate.js` e `sidebar.js` | Código Duplicado | 🟡 Baixa |
| D4 | `sessionStorage` acessado direto em 4 módulos | Código Duplicado | 🟡 Baixa |
| D3 | `inputClass` CSS duplicada em `iniciais.js` e `retornos.js` | Código Duplicado | 🟡 Baixa |
| M4 | `state.js` conhece detalhes do DOM de Iniciais | Modularidade | 🟡 Baixa |
| O4 | `innerHTML` com dados interpolados do usuário | Código Obsoleto | 🟡 Baixa |
| O3 | `STORAGE_KEY` exportado mas nunca usado | Código Obsoleto | 🔵 Info |
| D5 | `getSectionName()` definida mas nunca chamada (dead code) | Código Duplicado | 🔵 Info |
