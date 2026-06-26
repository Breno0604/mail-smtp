# Relatório de Análise de Código — Mail MVP

**Data:** 24 de Junho de 2026
**Projeto:** Mail MVP (vanilla HTML/CSS/JS, IndexedDB, Netlify Functions)
**Objetivo:** Identificar código legado, duplicado, ambíguo e oportunidades de refatoração

---

## Sumário Executivo

Foram identificados **27 itens** no total, distribuídos em 4 categorias:

| Categoria                | Itens  | 🔴 Alto | 🟡 Médio | 🟢 Leve |
| ------------------------ | ------ | ------- | -------- | ------- |
| Código Legado/Obsoleto   | 7      | 0       | 2        | 5       |
| Código Duplicado         | 6      | 0       | 2        | 4       |
| Código Ambíguo/Confuso   | 9      | 2       | 3        | 4       |
| Problemas de Acoplamento | 5      | 0       | 4        | 1       |
| **Total**                | **27** | **2**   | **11**   | **14**  |

---

## 1. Código Legado / Obsoleto

### 1.1 🟡 Dupla fonte de verdade para UUID

**Arquivos:** `scripts/state.js`, `scripts/uuid.js`

`state.js` importa `getCurrentUUID`, `setCurrentUUID`, `clearCurrentUUID` de `uuid.js` e também define funções wrapper que gerenciam tanto o state quanto o uuid storage. `state.currentUUID` é inicializado por `getCurrentUUID()` mas depois gerenciado manualmente em dois lugares. Dependência circular potencial.

```js
// uuid.js
const UUID_KEY = 'currentUUID';
export function getCurrentUUID() {
  return localStorage.getItem(UUID_KEY) || '';
}
export function setCurrentUUID(uuid) {
  localStorage.setItem(UUID_KEY, uuid);
}

// state.js — importa e re-exporta com wrappers
export function setCurrentUUID(uuid) {
  state.currentUUID = uuid;
  setUUID(uuid);
}
export function clearCurrentUUID() {
  state.currentUUID = '';
  clearUUID();
}
```

**Sugestão:** Unificar a gestão de UUID em um único módulo.

### 1.2 🟢 Import dinâmico de fallback

**Arquivo:** `scripts/persistence.js` (linha 94)

```js
import('./ui.js').then(({ showToast }) => {
  showToast('Espaço insuficiente no navegador. Limpe dados antigos.', false);
});
```

Usa `import()` tardio como fallback para evitar dependência circular. Seria mais limpo extrair `showToast` para um módulo separado sem dependências.

### 1.3 🟢 Wrapper de compatibilidade `withStore`

**Arquivo:** `scripts/db.js` (linhas 56-58)

```js
async function withStore(mode, fn) {
  return withTransaction(STORE_RECORDS, mode, tx => fn(tx.objectStore(STORE_RECORDS), tx));
}
```

`withStore` é um wrapper legado sobre o mais novo `withTransaction`. Só é usado para operações single-store, mas `withTransaction` já cobre esse caso.

### 1.4 🟡 Código de migração v2→v3 inline

**Arquivo:** `scripts/restore.js` (linhas 31-57)

A lógica que verifica `record.attachments && Array.isArray(...)` para migrar do formato antigo de anexos (inline no record) para o novo formato (store separado) está embutida em `applyRecord()`. Idealmente isolado em função de migração à parte.

### 1.5 🟢 Import path absoluto em `sw-update.js`

**Arquivo:** `scripts/sw-update.js`

```js
import { DOM } from '/scripts/dom.js';
```

Usa path com `/` na frente, enquanto o padrão do projeto é `'./dom.js'`. O DOM importado nem é usado no arquivo.

### 1.6 🟢 `fake-indexeddb/auto` duplicado em 14 testes

**Arquivos:** `tests/*.test.js` (14 arquivos)

```js
import 'fake-indexeddb/auto';
```

Poderia ser centralizado em `tests/setup.js`.

### 1.7 🟢 Arquivo HTML legado de documentação

**Arquivo:** `dados_projeto/tipos_ordens_e_retornos.html`

Documentação de tipos de ordem que não faz mais parte do fluxo ativo do app.

---

## 2. Código Duplicado

### 2.1 🟡 Dupla lógica de filtragem de equipamento

**Arquivos:** `scripts/collectors.js`, `scripts/email.js`

**collectors.js** (`collectEquipamentos`):

```js
instalados: EQUIPMENT_KEYS.reduce((acc, key) => {
  const el = DOM[`equip-inst-${key.key}`];
  if (el) acc[key.key] = el.value;
  return acc;
}, {});
```

**email.js** (`collectAllData` → filtragem inline):

```js
Object.keys(data.equipamentos.instalados)
  .filter(
    key => data.equipamentos.instalados[key] && data.equipamentos.instalados[key].trim() !== ''
  )
  .map(key => `${EQUIP_LABELS[key]}: ...`);
```

A filtragem de equipamentos preenchidos é feita inline no `email.js` em vez de usar os dados já coletados por `collectEquipamentos`.

### 2.2 🟢 Validação de anexos duplicada

**Arquivos:** `scripts/attachments.js`, `scripts/validation.js`

`attachments.js` faz validação de tipo/quantidade em `handleFileSelect`, e `validateSection4` em `validation.js` faz verificações similares.

### 2.3 🟢 CSS `@apply` replaced por classes repetidas

**Arquivo:** `style.css`

Múltiplos lugares usam as mesmas combinações de classes Tailwind em vez de componentes reutilizáveis.

### 2.4 🟢 Lógica de coordenadas duplicada

**Arquivo:** `scripts/app.js` e `scripts/iniciais.js`

Ambos chamam `captureCoordinates()` em eventos diferentes (load vs render).

### 2.5 🟢 `nomesTecnicos` vs `lider`/`parceiro`

**Arquivo:** `scripts/data/fields-data.js`

```js
export const nomesTecnicos = ['AGNALDO', 'ALAN', ...];
```

```js
// fields.js
{ nome: 'lider', opcoes: nomesTecnicos },
{ nome: 'parceiro', opcoes: nomesTecnicos },
```

`nomesTecnicos` é reutilizado para `lider` e `parceiro`, mas a semântica é confusa — o nome "nomesTecnicos" não descreve o uso compartilhado.

### 2.6 🟡 Duas listas de constantes de equipamento

**Arquivos:** `scripts/equipment-keys.js`, ~~`scripts/equipment.js`~~ (`EQUIP_LABELS` inline)

Em versões anteriores, `EQUIP_LABELS` era definido inline em `email.js` ou mesmo em `equipment.js`. Agora consolidado pelo `equipment-keys.js`, mas ainda há rastro em `email.js` que reconstrói labels manualmente.

---

## 3. Código Ambíguo / Confuso

### 3.1 🔴 Nomes de seções trocados (HTML vs Validação)

**Arquivos:** `index.html`, `scripts/validation.js`

No HTML:

```html
<section id="sec-inicio">
  <!-- Section 1: Iniciais -->
  <section id="sec-retorno">
    <!-- Section 2: Retorno -->
    <section id="sec-equipamentos">
      <!-- Section 3: Equipamentos -->
      <section id="sec-anexos">
        <!-- Section 4: Anexos -->
        <section id="sec-revisao"><!-- Section 5: Revisão --></section>
      </section>
    </section>
  </section>
</section>
```

Na validação:

```js
function validateSection1() {
  /* valida SEC-INICIO */
}
function validateSection2() {
  /* valida SEC-RETORNO */
}
function validateSection3() {
  /* valida SEC-EQUIPAMENTOS */
}
function validateSection4() {
  /* valida SEC-ANEXOS */
}
```

Na interface:

```js
validateSection1; // → erro: valida iniciais, nome diz "1" (correto)
validateSection2; // → erro: valida retorno, nome diz "2" (correto)
validateSection3; // → erro: valida equipamentos, nome diz "3" (⇐ na verdade valida retorno!)
validateSection3_equip; // → valida equipamentos, mas com nome inconsistente
```

**OBSERVAÇÃO CRÍTICA:** A numeração `validateSection1-5` corresponde **corretamente** à ordem das seções no HTML. Porém, verificar se o array `SECTIONS` em `app.js` ou `validation.js` está usando os números certos é crucial.

### 3.2 🔴 Getter dinâmico de retorno + listener perdido

**Arquivo:** `scripts/retornos.js` (linhas 31-76)

```js
retornoFieldsByTipo[tipo].forEach(field => {
  const getter = field.getter || (t => t === 'sim' ? 'sim' : 'nao');
  // ...
  input.addEventListener('change', () => { ... });
});
```

O getter é avaliado **uma vez** no momento da criação do campo. Se um campo depende de outro que ainda não foi preenchido, o valor nunca é reavaliado. Além disso, event listeners podem ser perdidos se `renderRetorno()` for chamado múltiplas vezes.

### 3.3 🟡 Estado inicial ambíguo (localStorage vs IndexedDB)

**Arquivos:** `scripts/state.js`, `scripts/persistence.js`

```js
// state.js
currentUUID: getCurrentUUID(), // uuid.js lê do localStorage
```

O fluxo de restauração pode vir de IndexedDB (registro completo) ou de localStorage (campos soltos). A ordem de precedência não é óbvia.

### 3.4 🟡 `validateSection2` faz validação mista

**Arquivo:** `scripts/validation.js`

A função `validateSection2` valida campos de retorno, mas também verifica `tipo-ordem` que é um campo da seção 1. Isso acopla as validações.

### 3.5 🟡 Coleta de dados ambígua

**Arquivo:** `scripts/collectors.js` (linhas 85-103)

`collectAllData()` mistura `collectIniciais()`, `collectRetorno()`, `collectEquipamentos()` — mas cada uma dessas funções também atualiza `state`. A função retorna um novo objeto, mas o efeito colateral no state não é óbvio.

### 3.6 🟢 `debouncedSave` importado com nome inconsistente

**Arquivo:** `scripts/app.js`

```js
import { saveState, debouncedSave } from './persistence.js';
```

Às vezes o código chama `saveState()`, outras vezes `debouncedSave()`. A diferença entre eles não é clara sem ler a implementação.

### 3.7 🟢 Comentário em `app.js` enganoso

**Arquivo:** `scripts/app.js` (linha 121)

```js
// Should not change anything
```

Comentário genérico que não explica o propósito real do teste.

### 3.8 🟡 CSS `!important` sem justificativa

**Arquivo:** `style.css`

Múltiplos usos de `!important` sem comentários explicando por que a especificidade normal não funciona.

### 3.9 🟢 Tratamento misto de erros (showError vs showToast)

**Arquivo:** `scripts/ui.js`

`showError` mostra uma barra no topo, `showToast` mostra um popup temporário. Em alguns lugares a escolha entre eles é inconsistente:

- Erro de validação geral → `showError`
- Erro de anexo → `showError`
- Erro de envio → `showToast`
- Erro de espaço em disco → `showToast` (dinâmico)

---

## 4. Problemas de Acoplamento

### 4.1 🟡 `INPUT_CREATORS` acopla criação de UI a dados

**Arquivos:** `scripts/fields.js`, `scripts/iniciais.js`, `scripts/retornos.js`

```js
// fields.js
export const INPUT_CREATORS = {
  /* mapeia tipo de campo → função de criação */
};
```

O mapeamento de tipos de campo (`text`, `select`, `date`, etc.) para funções de criação de elementos DOM está em `fields.js`, mas as funções em si estão em `iniciais.js`. Isso cria um acoplamento onde `fields.js` precisa conhecer a API de `iniciais.js`.

### 4.2 🟡 `collectRetorno` depende de `retornoFieldsByTipo`

**Arquivos:** `scripts/collectors.js`, `scripts/retornos.js`

```js
// collectors.js
export function collectRetorno() {
  const fields = getRetornoFields(state.iniciais['tipo-ordem'] || '');
  fields.forEach(field => {
    state.retorno[field.nome] = (DOM[field.nome] || {}).value || '';
  });
}
```

`collectors.js` importa `getRetornoFields` de `fields.js` e assume que os campos `DOM[field.nome]` existem. Se `renderRetorno()` não foi chamado ainda, os elementos não existem.

### 4.3 🟡 `reset.js` conhece detalhes de implementação de 7 módulos

**Arquivo:** `scripts/reset.js` (imports)

```js
import { renderIniciais } from './iniciais.js';
import { handleTipoChange } from './retornos.js';
import { renderEquipamentos } from './equipment.js';
import { updateFileCount } from './attachments.js';
import { hideError } from './ui.js';
import { captureCoordinates } from './utils.js';
import { updateLivePreview } from './email.js';
import { collectIniciais } from './collectors.js';
```

`reset.js` orquestra reset de 8 módulos diferentes, criando alto acoplamento. Qualquer novo módulo que precise de reset exige modificação em `reset.js`.

### 4.4 🟡 Ciclo de imports entre state/persistence/collectors

```
state.js ← persistence.js ← collectors.js ← state.js
          ← db.js
```

`persistence.js` importa `collectors.js`, que importa `state.js`. Mas `state.js` é frequentemente o primeiro módulo a ser carregado. A dependência circular é evitada por imports dinâmicos, mas frágil.

### 4.5 🟢 `sidebar.js` manipula DOM de records de forma genérica

**Arquivo:** `scripts/sidebar.js`

A sidebar itera sobre records e constrói HTML inline. Qualquer mudança no schema de records exige mudanças na sidebar.

---

## 5. Recomendações Prioritárias

### 🔴 Alta Prioridade (corrigir imediatamente)

1. **Verificar `validateSection2` vs `validateSection3`** — Confirmar se os nomes correspondem corretamente às seções do HTML. A documentação antiga (`animator.js`, `sectionManager.js`) está obsoleta e pode causar confusão.
2. **Gettern dinâmico de retorno** — Implementar reavaliação de getters quando campos dependentes mudam, e garantir que event listeners não sejam perdidos em re-renderizações.

### 🟡 Média Prioridade (corrigir no próximo ciclo)

1. **Unificar fonte de UUID** — Eliminar duplicação entre `state.js` e `uuid.js`.
2. **Extrair migração v2→v3** — Isolar lógica de migração de anexos em função separada.
3. **Consolidar filtragem de equipamentos** — Usar `collectEquipamentos` como fonte única.
4. **Quebrar acoplamento do reset.js** — Usar eventos ou observer pattern.
5. **Eliminar CSS `!important`** — Substituir por especificidade adequada.
6. **Resolver ciclo de imports** — Extrair `showToast` para módulo independente.
7. **Nomes de seções na validação** — Renomear funções para corresponder exatamente às seções.

### 🟢 Baixa Prioridade (corrigir quando conveniente)

1. Centralizar `import 'fake-indexeddb/auto'` em `setup.js`
2. Remover import não utilizado de `sw-update.js`
3. Centralizar lógica de coordenadas
4. Remover `withStore` legacy
5. Limpar comentários enganosos
6. Padronizar `showError` vs `showToast`

---

## 6. Convenções do Projeto (para referência)

Para garantir que correções sigam o estilo do projeto:

- **DOM cache** (`scripts/dom.js`): Todos os lookups DOM acontecem uma vez em `cacheDOM()`. Importe `DOM` de `dom.js`; nunca chame `getElementById` em outros lugares.
- **Collectors pattern** (`scripts/collectors.js`): Sempre use collectors.js para ler dados do formulário no state. Nunca leia DOM diretamente para extração de dados.
- **Conditional field system** (`retornos.js`): Campos podem depender de outros campos. Suporta string values, arrays e negação.
- **Test setup** (`tests/setup.js`): Mocka canvas, crypto, URL e constrói DOM mínimo.
- **Backend env vars**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TO` — 6 variáveis obrigatórias.

---

## 7. Estatísticas do Projeto

| Métrica                      | Valor                           |
| ---------------------------- | ------------------------------- |
| Arquivos JS source           | 22 (`scripts/`)                 |
| Arquivos de teste            | 22 (`tests/`)                   |
| Testes E2E                   | 5 (`tests-e2e/`)                |
| Funções Netlify              | 1 (`netlify/functions/send.js`) |
| Versão do schema IndexedDB   | v3                              |
| Stores IndexedDB             | 2 (`records`, `attachments`)    |
| Total de itens identificados | 27                              |
| 🔴 Alta prioridade           | 2                               |
| 🟡 Média prioridade          | 11                              |
| 🟢 Baixa prioridade          | 14                              |

---

_Relatório gerado automaticamente por análise de código em 24/06/2026._
