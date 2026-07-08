# Plano de Migração: Vanilla JS → Vue 3 + Vite + TypeScript

> **Data:** 2026-06-24 (revisado)
> **Projeto:** Mail MVP — Formulário de Retorno de Ordens
> **Stack atual:** Vanilla HTML/CSS/JS (ES6 modules), Tailwind CSS estático, Netlify Functions
> **Stack destino:** Vue 3 (Composition API + `<script setup>`), Vite, TypeScript, Pinia, Vitest
> **Vue Router:** ⏱️ Postergado (não necessário para MVP — single-page funciona)
> **Estratégia:** 🏗️ Migração incremental com dois projetos coexistentes

---

## 🔄 Mudanças desta Revisão

A revisão altera:

| Aspecto              | Versão anterior          | Versão revisada                                 |
| -------------------- | ------------------------ | ----------------------------------------------- |
| **Estimativa total** | 38h                      | **46h**                                         |
| **Fases**            | 8 fases                  | **5 fases** (merge + eliminação)                |
| **Vue Router**       | Fase separada            | **Removido** — postergado                       |
| **Testes**           | Fase final isolada       | **Integrado em cada fase**                      |
| **Estratégia**       | Big-bang                 | **Incremental** (projeto paralelo)              |
| **Collectors**       | Remover                  | **Manter como adapter** entre store e schema DB |
| **Risco principal**  | Perda de dados IndexedDB | **Simulacro de migração** obrigatório           |

---

## 1. Estratégia: Migração Incremental com Dois Projetos

### 1.1 Por que não big-bang?

Uma migração big-bang (reescrever tudo e trocar o deploy) com 95+ arquivos e 30 scripts JS → TS é arriscada porque:

- O app atual está em produção com dados reais de usuários no IndexedDB
- Campos condicionais de retorno têm lógica complexa (43 tipos de ordem)
- Regressões visuais são difíceis de detectar sem comparativo

### 1.2 Abordagem Incremental

```
Semana 1-2:   Projeto Vue paralelo (não afeta produção)
Semana 3:     Feature flags + deploy gradual
Semana 4:     Remover código legado
```

**Paralelismo:**

```
/mail-vue/          ← Novo projeto Vue (npm create vite)
/mail/              ← Projeto atual intacto (produção)
```

O projeto Vue consome os mesmos dados (IndexedDB schema v3), mesmas Netlify Functions (send.ts), mesmo Service Worker. Durante a migração:

1. Ambos os projetos rodam em portas diferentes (`:8888` para atual, `:5173` para Vue)
2. Testes E2E Playwright rodam contra ambos
3. Deploy do Vue é feito em staging primeiro, depois produção

---

## 2. Estrutura de Diretórios (Destino Final)

```
mail-vue/
├── index.html
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── package.json
├── tailwind.config.ts / postcss.config.js
├── netlify.toml
├── netlify/functions/send.ts      # Migrado para TS
├── public/
│   ├── manifest.json
│   ├── icons/
│   └── sw.js                      # Permanece vanilla
├── src/
│   ├── main.ts                    # createApp + Pinia
│   ├── App.vue
│   │
│   ├── types/
│   │   ├── record.ts              # Record, SentData
│   │   ├── field.ts               # FieldDef
│   │   ├── state.ts               # IniciaisData, RetornoData, EquipamentosState
│   │   ├── equipment.ts           # EquipmentValues
│   │   └── email.ts               # EmailPayload
│   │
│   ├── data/                      # Dados estáticos (antes fields-data.js)
│   │   ├── nomes-tecnicos.ts
│   │   ├── municipios.ts
│   │   ├── placas.ts
│   │   ├── tipo-ordem-options.ts
│   │   ├── retorno-fields.ts      # Grupos de campos por tipo de ordem
│   │   └── equipment-keys.ts
│   │
│   ├── config/fields.ts           # iniciaisFields + getRetornoFields
│   │
│   ├── stores/
│   │   ├── form.ts                # Pinia: formulário ativo
│   │   ├── sidebar.ts             # Pinia: registros + filtro
│   │   └── ui.ts                  # Pinia: toast, error, modais
│   │
│   ├── composables/
│   │   ├── usePersistence.ts      # saveState/loadRecord/debouncedSave
│   │   ├── useValidation.ts       # validateSection/validateAll
│   │   ├── useCoordinates.ts      # Geolocation
│   │   ├── useAttachments.ts      # File handling + preview
│   │   ├── useDuplicate.ts        # Duplicate check
│   │   ├── useEmail.ts            # composeEmail + preview
│   │   ├── useSend.ts             # Send flow
│   │   └── useSWUpdate.ts         # SW registration
│   │
│   ├── services/
│   │   ├── db.ts                  # IndexedDB CRUD
│   │   ├── compress.ts            # Image compression (canvas)
│   │   └── api.ts                 # fetch para Netlify Function
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppHeader.vue
│   │   │   ├── AppSidebar.vue
│   │   │   └── SidebarItem.vue
│   │   │
│   │   ├── sections/              # 5 seções do formulário (mapeiam aos SectionCard)
│   │   │   ├── SectionInicio.vue
│   │   │   ├── SectionRetorno.vue
│   │   │   ├── SectionEquipamentos.vue
│   │   │   ├── SectionAnexos.vue
│   │   │   └── SectionRevisao.vue
│   │   │
│   │   ├── form/                  # Componentes de campo reutilizáveis
│   │   │   ├── FormField.vue      # Genérico: label + input + error
│   │   │   ├── CoordenadasField.vue
│   │   │   ├── RetornoField.vue
│   │   │   ├── EquipmentCheckbox.vue
│   │   │   └── EquipmentField.vue
│   │   │
│   │   ├── ui/
│   │   │   ├── ErrorMessage.vue
│   │   │   ├── ToastNotification.vue
│   │   │   ├── ConfirmModal.vue
│   │   │   ├── DuplicateModal.vue
│   │   │   └── Lightbox.vue
│   │   │
│   │   └── shared/
│   │       ├── SectionCard.vue
│   │       ├── FieldError.vue
│   │       ├── FileUploadArea.vue
│   │       └── PreviewItem.vue
│   │
│   └── utils/
│       ├── format.ts
│       ├── uuid.ts
│       ├── base64.ts
│       └── image.ts
│
├── tests/
│   ├── unit/                      # Vitest
│   └── e2e/                       # Playwright (já existe, ajustar URLs)
│
└── tools/                         # Ferramentas CLI (intocadas)
    ├── generate-icons.mjs
    └── gerar-planilha.mjs
```

> **Mudança nesta revisão:** Reduzi de 26 para ~18 componentes. Vários componentes "wrapper" foram inlinados (ex: `EmailPreview.vue` dentro de `SectionRevisao.vue`, `FieldError.vue` dentro de `FormField.vue`).

---

## 3. Plano em 5 Fases

### 🏗️ Fase 0 — Setup + Tipos + Dados Estáticos (~5h)

**O que fazer:**

1. `npm create vite@latest mail-vue -- --template vue-ts`
2. Adicionar deps: `pinia`, `tailwindcss`, `postcss`, `autoprefixer`, `vitest`, `@vue/test-utils`, `jsdom`, `fake-indexeddb`, `eslint`, `prettier`, `@playwright/test`
3. Configurar `vite.config.ts` (alias `@/` + manual chunks)
4. Copiar `tailwind.config.ts` (content aponta para `./src/**/*.vue`), `postcss.config.js`, `style.css`, `netlify.toml`, `manifest.json`, `sw.js`, `icons/`
5. Criar `src/types/` com **todas** as interfaces (record.ts, field.ts, state.ts, equipment.ts, email.ts)
6. Migrar `scripts/data/fields-data.js` → `src/data/*.ts` (arrays tipados)
7. Migrar `scripts/fields.js` → `src/config/fields.ts` (iniciaisFields + getRetornoFields)
8. Migrar `scripts/equipment-keys.js` → `src/data/equipment-keys.ts`
9. Migrar `scripts/styles.js` → `src/utils/` (constantes)
10. Migrar `scripts/uuid.js` → `src/utils/uuid.ts`
11. Migrar `scripts/utils.js` → `src/utils/format.ts` + `base64.ts` + `image.ts`

**Entregável:** `npx tsc --noEmit` passa. `npm run dev` abre página em branco sem erros.

**Testes nesta fase:** `npx tsc --noEmit` + verificar se `src/config/fields.ts` exporta os mesmos dados que `scripts/fields.js`

---

### 🧠 Fase 1 — Serviços + Stores (~8h)

**O que fazer:**

1. Migrar `scripts/db.js` → `src/services/db.ts`
   - Manter schema IndexedDB v3 idêntico (DB_NAME, DB_VERSION, stores)
   - Tipar todos os retornos
   - ⚠️ **Crítico:** não mudar o schema — dados de usuários reais dependem dele
2. Migrar `scripts/compress.js` → `src/services/compress.ts` (service puro, sem Vue)
3. Criar `src/services/api.ts` (fetch para /api/send, tipar request/response)
4. Migrar `netlify/functions/send.js` → `netlify/functions/send.ts` (adicionar tipos nodemailer)
5. Criar `src/stores/form.ts` (Pinia — estado do formulário ativo)
6. Criar `src/stores/sidebar.ts` (Pinia — registros + filtro)
7. Criar `src/stores/ui.ts` (Pinia — toast, error, modais)
8. Criar **adapter**: `src/services/collectors.ts`
   - Mantido como adapter entre o formato do IndexedDB e a store
   - `collectIniciaisFromRecord(record)` → normaliza dados para a store
   - `buildRecordFromStore(store)` → monta objeto para salvar no DB
   - ⚠️ **Mudança:** collectors não leem mais do DOM, apenas transformam dados

**Entregável:** Stores funcionam com dados mock. `services/db.test.ts` passa.

**Testes nesta fase:**

- `tests/unit/services/db.test.ts` — migrar `db.test.js`
- `tests/unit/stores/form.test.ts` — estado inicial, reset, set/clear UUID
- `tests/unit/stores/sidebar.test.ts` — CRUD de registros na store

---

### ⚙️ Fase 2 — Composables (~8h)

**O que fazer:**

1. `usePersistence.ts` — `saveState()`, `loadRecord(uuid)`, `resetForm()`, `debouncedSave()`
   - `saveState()` lê da Pinia store (não do DOM)
   - `loadRecord()` popula a store a partir de um record do DB
   - `resetForm()` limpa a store e chama `clearCurrentUUID()`
2. `useValidation.ts` — `validateSection(n)`, `validateAll()`, field errors
   - Valida campos da store (não do DOM)
   - Erros armazenados em `ref<Record<string, string>>` (reativo)
   - `validateAll()` retorna boolean e popula erros
3. `useCoordinates.ts` — `captureCoordinates()` com `navigator.geolocation`
4. `useAttachments.ts` — `handleFileChange()`, `removeFile()`, `renderPreviews()`
   - Manipula `formStore.attachments` (Array<File>)
   - Cria/revoga Object URLs para preview
5. `useDuplicate.ts` — `checkDuplicate()`: busca record, retorna boolean
6. `useEmail.ts` — `composeEmail(data)` (função pura), `updateLivePreview()`
7. `useSend.ts` — `sendEmail()`: valida → duplicate → confirma altered → comprime → envia
   - Chama `useValidation`, `useDuplicate`, `usePersistence`, `services/api`
8. `useSWUpdate.ts` — Registra SW, escuta `controllerchange`, mostra modal de atualização

**Entregável:** Composables testáveis isoladamente com store mock. `useValidation` + `usePersistence` + `useDuplicate` têm 90%+ da lógica de negócio.

**Testes nesta fase:**

- `tests/unit/composables/usePersistence.test.ts` (migrar `persistence.test.js`)
- `tests/unit/composables/useValidation.test.ts` (migrar `validation.test.js`)
- `tests/unit/composables/useAttachments.test.ts` (migrar `attachments.test.js`)
- `tests/unit/composables/useEmail.test.ts` (migrar `email.test.js`)
- `tests/unit/composables/useSend.test.ts` (migrar `send.test.js`)
- `tests/unit/composables/useDuplicate.test.ts` (migrar `duplicate.test.js`)
- `tests/unit/services/compress.test.ts` (migrar `compress.test.js`)

---

### 🎨 Fase 3 — Componentes Vue (~16h)

**Maior fase.** 18 componentes, do mais interno ao mais externo.

**Ordem de implementação (cada um com teste):**

| Ordem | Componente                | Depends On                        | Testes                                |
| ----- | ------------------------- | --------------------------------- | ------------------------------------- |
| 1     | `SectionCard.vue`         | —                                 | Renderização com slot                 |
| 2     | `FieldError.vue`          | —                                 | Exibição condicional                  |
| 3     | `FormField.vue`           | FieldError                        | v-model + error state + tipos         |
| 4     | `CoordenadasField.vue`    | FormField                         | Botão refresh + geolocation mock      |
| 5     | `EquipmentCheckbox.vue`   | —                                 | Check/uncheck + label                 |
| 6     | `EquipmentField.vue`      | FormField                         | Input numérico                        |
| 7     | `FileUploadArea.vue`      | —                                 | Click handler                         |
| 8     | `PreviewItem.vue`         | —                                 | Render imagem + remover               |
| 9     | `Lightbox.vue`            | —                                 | Teleport + overlay                    |
| 10    | `ErrorMessage.vue`        | uiStore                           | Exibição condicional                  |
| 11    | `ToastNotification.vue`   | uiStore                           | Transição + auto-hide                 |
| 12    | `ConfirmModal.vue`        | uiStore                           | Promise-based, teleport               |
| 13    | `DuplicateModal.vue`      | uiStore                           | Promise-based, teleport               |
| 14    | `RetornoField.vue`        | FormField                         | Condicionais (v-if), cascata          |
| 15    | `SectionInicio.vue`       | FormField, CoordenadasField       | Grid layout, v-for fields             |
| 16    | `SectionRetorno.vue`      | RetornoField                      | Placeholder ↔ campos, tipoOrdem watch |
| 17    | `SectionEquipamentos.vue` | EquipmentCheckbox, EquipmentField | Dois selects + seções                 |
| 18    | `SectionAnexos.vue`       | FileUploadArea, PreviewItem       | Upload + grid                         |
| 19    | `SectionRevisao.vue`      | —                                 | Preview do email                      |
| 20    | `AppHeader.vue`           | uiStore                           | Hamburger + título + btn-novo         |
| 21    | `SidebarItem.vue`         | —                                 | Status badge + ações                  |
| 22    | `AppSidebar.vue`          | SidebarItem, sidebarStore         | Filtro + lista                        |
| 23    | `App.vue`                 | Todos acima                       | Composição final + setup              |

**Entregável:** App.vue renderiza o formulário completo, com todas as seções funcionando.

**Testes nesta fase (6 principais, ~2h cada):**

- `SectionInicio.test.ts` — renderiza campos, v-model funciona
- `SectionRetorno.test.ts` — placeholder vazio → campos com tipo selecionado, condicionais
- `SectionEquipamentos.test.ts` — selects SIM/NAO, checkboxes, inputs
- `SectionAnexos.test.ts` — upload, preview, remoção
- `AppSidebar.test.ts` — lista registros, filtro, editar/excluir
- `SectionCard.test.ts` — estrutura sec-card → sec-head → sec-body

---

### 🧪 Fase 4 — Testes de Integração + E2E + Estabilização (~9h)

**O que fazer:**

1. Migrar testes de integração (alta prioridade):
   - `gaps-edge-cases.test.js` → `tests/unit/gaps-edge-cases.test.ts`
   - `integration.test.js` → `tests/unit/integration.test.ts`
   - `complete-fill.test.js` → `tests/unit/complete-fill.test.ts`
2. Migrar testes de utilitários:
   - `utils.test.js` → `utils/format.test.ts` + `uuid.test.ts` + `base64.test.ts`
   - `fields.test.js` → `config/fields.test.ts`
3. Migrar testes de UI/components:
   - `ui.test.js` → `components/ConfirmModal.test.ts`
   - `sidebar.test.js` → `stores/sidebar.test.ts` + `SidebarItem.test.ts`
   - `state.test.js` → `stores/form.test.ts` (já feito na Fase 1)
   - `reset.test.js` → `stores/form.test.ts` (testar action reset)
   - `restore.test.js` → `composables/usePersistence.test.ts`
   - `equipment-checkbox.test.js` → `EquipmentCheckbox.test.ts`
   - `iniciais.test.js` → `SectionInicio.test.ts` (já feito na Fase 3)
   - `retornos.test.js` → `SectionRetorno.test.ts` (já feito na Fase 3)
   - `equipment.test.js` → `SectionEquipamentos.test.ts` (já feito na Fase 3)
4. Remover testes obsoletos:
   - `collectors.test.js` (substituído por stores + adapter)
   - `dom.test.js` (DOM cache não existe mais)
   - `app-init.test.js` (sem DOMContentLoaded no Vue)
   - `styles.test.js` (constantes em TS)
5. **Simulacro de migração de dados:** Copiar IndexedDB real de produção para ambiente de teste, rodar restore/applyRecord, verificar se todos os campos são restaurados corretamente
6. Ajustar E2E Playwright (`tests-e2e/`) para apontar para o novo projeto

**Entregável:** `npm test` = 500+ testes. `npm run test:e2e` = verde. `npx tsc --noEmit` = 0 erros.

**Testes excluídos definitivamente (6):**
| Arquivo | Motivo |
|---------|--------|
| `collectors.test.js` | Lógica movida para stores |
| `dom.test.js` | DOM cache não existe |
| `app-init.test.js` | Iniciação via main.ts + App.vue onMounted |
| `styles.test.js` | Constantes em TS, sem lógica |
| `app.test.js` | Coberto por integration.test.ts + complete-fill.test.ts |
| `persistence-flow.test.js` | Coberto por usePersistence.test.ts |

---

## 4. Mapeamento Arquivo por Arquivo (Revisado)

| Atual                         | Destino                                                          | Tipo                           |
| ----------------------------- | ---------------------------------------------------------------- | ------------------------------ |
| `index.html`                  | `index.html`                                                     | 🔄 Novo (entry Vite)           |
| `style.css`                   | `src/assets/style.css`                                           | 📋 Copiar                      |
| `scripts/app.js`              | `src/main.ts` + `App.vue`                                        | 🔄 Dividir                     |
| `scripts/dom.js`              | 🔥 **Remover**                                                   | —                              |
| `scripts/state.js`            | `src/stores/form.ts`                                             | 🔄 Store Pinia                 |
| `scripts/db.js`               | `src/services/db.ts`                                             | 🔄 Migrar TS                   |
| `scripts/persistence.js`      | `src/composables/usePersistence.ts`                              | 🔄 Composable                  |
| `scripts/collectors.js`       | `src/services/collectors.ts`                                     | 🔄 Adapter (lê store, não DOM) |
| `scripts/fields.js`           | `src/config/fields.ts`                                           | 🔄 Migrar TS                   |
| `scripts/data/fields-data.js` | `src/data/*.ts`                                                  | 🔄 Dividir                     |
| `scripts/iniciais.js`         | `src/components/sections/SectionInicio.vue`                      | 🔄 Vue SFC                     |
| `scripts/retornos.js`         | `src/components/sections/SectionRetorno.vue`                     | 🔄 Vue SFC                     |
| `scripts/equipment.js`        | `src/components/sections/SectionEquipamentos.vue`                | 🔄 Vue SFC                     |
| `scripts/validation.js`       | `src/composables/useValidation.ts`                               | 🔄 Composable                  |
| `scripts/email.js`            | `src/composables/useEmail.ts`                                    | 🔄 Composable                  |
| `scripts/send.js`             | `src/composables/useSend.ts`                                     | 🔄 Composable                  |
| `scripts/sidebar.js`          | `src/components/layout/AppSidebar.vue` + `src/stores/sidebar.ts` | 🔄 Dividir                     |
| `scripts/duplicate.js`        | `src/composables/useDuplicate.ts`                                | 🔄 Composable                  |
| `scripts/attachments.js`      | `src/composables/useAttachments.ts`                              | 🔄 Composable                  |
| `scripts/compress.js`         | `src/services/compress.ts`                                       | 📋 Copiar (quase unchanged)    |
| `scripts/ui.js`               | `src/stores/ui.ts` + componentes                                 | 🔄 Store + SFCs                |
| `scripts/utils.js`            | `src/utils/*.ts`                                                 | 🔄 Dividir                     |
| `scripts/uuid.js`             | `src/utils/uuid.ts`                                              | 📋 Copiar                      |
| `scripts/styles.js`           | `src/utils/styles.ts`                                            | 📋 Copiar                      |
| `scripts/equipment-keys.js`   | `src/data/equipment-keys.ts`                                     | 📋 Copiar                      |
| `scripts/sw-update.js`        | `src/composables/useSWUpdate.ts`                                 | 🔄 Composable                  |
| `scripts/reset.js`            | `src/stores/form.ts` (action)                                    | 🔄 Inline na store             |
| `scripts/restore.js`          | `src/composables/usePersistence.ts` (loadRecord)                 | 🔄 Inline no composable        |
| `netlify/functions/send.js`   | `netlify/functions/send.ts`                                      | 🔄 Migrar TS                   |
| `sw.js`                       | `public/sw.js`                                                   | 📋 Copiar                      |

---

## 5. Estimativa Detalhada (Revisada: 46h)

| Fase | Descrição               | Arquivos | h      | Quem |
| ---- | ----------------------- | -------- | ------ | ---- |
| 0    | Setup + Tipos + Dados   | ~15      | 5      | Solo |
| 1    | Serviços + Stores       | ~8       | 8      | Solo |
| 2    | Composables             | ~8       | 8      | Solo |
| 3    | Componentes Vue         | ~22      | 16     | Solo |
| 4    | Testes integração + E2E | ~15      | 9      | Solo |
|      | **Total**               | **~68**  | **46** |      |

> **Redução de 95 → 68 arquivos** porque:
>
> - Merge de vários `src/data/*.ts` em menos arquivos
> - 4 componentes eliminados (inlinados nos pais)
> - 6 testes removidos (obsoletos na nova arquitetura)
> - Utilitários consolidados

**Distribuição por dificuldade:**

| Dificuldade              | Arquivos | h   | Exemplos                              |
| ------------------------ | -------- | --- | ------------------------------------- |
| 🔵 Fácil (cópia + tipos) | ~20      | 6   | data/, utils/, styles.ts              |
| 🟡 Médio (adaptação)     | ~25      | 16  | services/db.ts, stores/, composables/ |
| 🔴 Difícil (reescrita)   | ~23      | 24  | Componentes, condicionais, testes     |

---

## 6. Riscos e Mitigações (Detalhados)

### Risco #1: Perda de dados no IndexedDB (🔴 Alto)

**Cenário:** O schema do IndexedDB muda durante a migração e usuários perdem rascunhos salvos.
**Mitigação:**

- ❗**Não mudar** `DB_NAME`, `DB_VERSION`, nomes de stores (records, attachments) nem keyPaths
- Manter `db.ts` como cópia tipada de `db.js`, sem alterar lógica de upgrade
- Criar script de teste que copia um record real do IndexedDB de produção, roda `loadRecord()`, verifica se todos os campos batem

### Risco #2: Regressão em campos condicionais de retorno (🔴 Alto)

**Cenário:** 43 tipos de ordem, cada um com seu conjunto de campos + condicionais em cascata. Um erro de lógica no `computed` do Vue faz campos sumirem ou aparecerem incorretamente.
**Mitigação:**

- Testar CADA tipo de ordem individualmente (não amostragem)
- Usar dados de teste do `retornos.test.js` (68 testes existentes)
- E2E Playwright com screenshot diff para cada tipo de ordem

### Risco #3: v-model não capturar todos os pathways de input (🟡 Médio)

**Cenário:** No Vue, `v-model` captura `input` e `change`. Mas o código atual tem listeners manuais em `blur`, `pointerdown`, e events delegados no document.
**Mitigação:**

- Mapear todos os 12+ event listeners em `app.js` → `initEvents()`
- Garantir que cada um tem equivalente no Vue (ex: `@blur` para validação, watcher para `debouncedSave`)
- Usar `watch(store, { deep: true })` para `saveState()` em vez de event listeners individuais

### Risco #4: Perda de cobertura de testes (🟡 Médio)

**Cenário:** Dos 500 testes atuais, alguns dependem de jsdom + DOM manipulation que não se traduzem diretamente para `@vue/test-utils`.
**Mitigação:**

- Manter testes JS legados rodando em paralelo (CI roda ambos)
- Só remover teste JS quando equivalente TS passar
- Usar `COVERAGE_FILE` no Vitest para comparar cobertura antes/depois

### Risco #5: Regressão visual (🟡 Médio)

**Cenário:** O CSS custom (`style.css`) + Tailwind produzem o layout atual. No Vue, o escopo de estilos (`<style scoped>`) pode mudar especificidade.
**Mitigação:**

- Manter `style.css` como global importado em `main.ts`
- Usar `<style scoped>` apenas para componentes novos
- E2E com `percy.io` ou screenshot diff manual antes do deploy

---

## 7. Estratégia de Deploy Gradual

```
Dia 1:   git checkout -b feat/vue-migration
         Fase 0 concluída (setup + tipos)
         → npm run dev abre página em branco

Dia 3:   Fase 1 concluída (services + stores)
         → npm test roda 50+ testes novos

Dia 5:   Fase 2 concluída (composables)
         → npm test roda 200+ testes

Dia 8:   Fase 3 concluída (componentes)
         → npm run dev mostra formulário completo
         → Playwright testa fluxo completo

Dia 10:  Fase 4 concluída (testes finais)
         → npm test = 500+
         → npx netlify deploy --prod --alias vue-staging
         → Teste manual em staging

Dia 11:  Deploy para produção
         → git checkout main
         → git merge feat/vue-migration
         → git push
```

---

## 8. Checklist de Qualidade

- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npm run lint` — 0 errors
- [ ] `npm test` — 500+ tests pass
- [ ] `npm run test:e2e` — Playwright green
- [ ] `npm run build` — Vite build sem warnings
- [ ] **Simulacro de migração:** Copiar IndexedDB real → restaurar cada record → verificar campos
- [ ] **Testar 43 tipos de ordem:** Cada tipo renderiza campos corretos, condicionais funcionam
- [ ] **Testar mobile:** PWA, landscape blocker, touch events, preview de fotos
- [ ] **Comparar cobertura:** Linha por linha com o código legado
- [ ] **Deploy staging:** Teste manual completo antes de produção

---

## 9. Resumo das Mudanças desta Revisão

| O que mudou     | Antes                      | Depois                             |
| --------------- | -------------------------- | ---------------------------------- |
| Estratégia      | Big-bang (reescrever tudo) | Incremental (2 projetos paralelos) |
| Fases           | 8 fases                    | 5 fases                            |
| Arquivos totais | ~95                        | ~68 (-28%)                         |
| Estimativa      | 38h                        | **46h** (+21%)                     |
| Vue Router      | Fase separada              | ❌ Postergado                      |
| Testes          | Fase isolada no final      | ✅ Integrado em cada fase          |
| Collectors      | Remover completamente      | Manter como adapter store↔DB       |
| SW update       | Não mencionado             | Adicionado como useSWUpdate        |
| Risco principal | Mencionado sem detalhes    | Mitigação detalhada                |
| Deploy          | Troca abrupta              | Feature flag + staging             |
