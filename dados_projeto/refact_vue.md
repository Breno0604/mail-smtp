# Planejamento de Refatoração: Vue 3 + Vite + Dexie.js + TypeScript

**Data:** 14/06/2026
**Versão atual:** mail-mvp v1.1.0
**Objetivo:** Migrar de vanilla JS (ES6 modules) para Vue 3 (Composition API) + Vite + Dexie.js + Vue Router + Pinia + **TypeScript**, mantendo e melhorando o suporte offline-first para Android mobile. Preparar a arquitetura para expansão futura de páginas.

---

## 1. Situação Atual — Análise Completa

### 1.1 Arquitetura Atual

| Aspecto | Detalhe |
|---------|---------|
| **Frontend** | Vanilla HTML/CSS/JS (ES6 modules), sem bundler, sem framework |
| **Estilização** | Tailwind CSS (build estático via `tailwindcss` CLI) + CSS custom (`style.css`) |
| **Backend** | Netlify Function (`netlify/functions/send.js`) — Node.js + nodemailer |
| **Persistência** | IndexedDB bruto (`scripts/db.js` — DB `mail-mvp` v3) + localStorage (UUID) |
| **PWA** | Service Worker handwritten (`sw.js`) — cache-first com fallback network |
| **Build** | `npm install` (apenas instala deps), `tailwindcss` CLI para CSS. Sem bundler JS |
| **Deploy** | `git push` → Netlify auto-deploy. Diretório publish = raiz (`.`) |
| **Testes** | Vitest + jsdom, 24 arquivos de teste, 394 testes, setup em `tests/setup.js` |
| **Testes E2E** | Playwright configurado (`playwright.config.js`) |

### 1.2 Módulos do Frontend (scripts/)

| Arquivo | Linhas | Responsabilidade |
|---------|--------|------------------|
| `app.js` | 144 | Bootstrap: initEvents, input/change delegation, checkInitialPersistence |
| `dom.js` | 73 | Cache DOM de todos os elementos (cacheDOM()一次性) |
| `state.js` | 34 | Objeto global `state` — single source of truth |
| `fields.js` | 126 | Definição declarativa de campos (iniciaisFields, retornoFieldsByTipo) |
| `iniciais.js` | 187 | Render dinâmico de campos de "Início" + INPUT_CREATORS |
| `retornos.js` | 154 | Render de campos de retorno + sistema condicional + handleTipoChange |
| `equipment.js` | 100 | CRUD de linhas de equipamento dinâmicas |
| `collectors.js` | 78 | Lê DOM → state (collectIniciais, collectRetorno, collectEquipamentos, collectAllData) |
| `persistence.js` | 137 | saveState, debouncedSave, markAttachmentsDirty, serializeAndSaveAttachments |
| `db.js` | 203 | IndexedDB CRUD (raw API) — records + attachments stores, v3 com migração |
| `email.js` | 52 | composeEmail (normaliza texto), updateLivePreview |
| `send.js` | 56 | sendEmail (valida → checkDuplicate → compress → fetch /api/send) |
| `validation.js` | 255 | Validação por seção (1-4), addBlurValidation, SECTION_VALIDATORS |
| `attachments.js` | 91 | Upload, preview, remove, lightbox, Object URL tracking |
| `reset.js` | 53 | resetForm — limpa state, re-renderiza tudo |
| `restore.js` | 100 | applyRecord — restaura registro completo (migração v2→v3) |
| `sidebar.js` | 131 | Sidebar de registros (listar, filtrar, editar, excluir) |
| `duplicate.js` | 40 | checkDuplicate — modal de confirmação para reenvio |
| `ui.js` | 61 | showError, hideError, showToast, setFieldError, showConfirm |
| `utils.js` | 71 | toBase64, blobToBase64, loadImage, formatDate, base64ToBlob, captureCoordinates |
| `compress.js` | 51 | compressAttachments (canvas resize, quality loop) |
| `uuid.js` | 43 | generateUUID, getCurrentUUID, setCurrentUUID, clearCurrentUUID |
| `styles.js` | 8 | Constantes CSS class (INPUT_CLASS, SELECT_CLASS) |
| `sw-update.js` | 36 | Service Worker registration + update modal |

### 1.3 Fluxo de Dados Atual

```
DOM (inputs/selects/textareas)
  ↓ (event delegation: input/change)
syncIniciaisField(el) → state.iniciais[field.nome]
collectEquipamentos() → state.equipamentos
  ↓
debouncedSave() → saveState()
  ↓
collectIniciais() + collectRetorno() + collectEquipamentos()
  ↓ (state → record object)
saveDraft(record) → IndexedDB
saveAttachments(uuid, serialized) → IndexedDB

updateLivePreview() → composeEmail(collectAllData()) → DOM.previewCorpo
```

**Problema central:** O fluxo é DOM → state → IDB, mas `collectors.js` lê do DOM para atualizar o state. Isso é um "duo-source" — o state depende de leitura DOM para se manter consistente. Vue elimina isso com v-model/reactive.

### 1.4 Service Worker Atual

- `sw.js` gerenciado manualmente, cache name `retorno-v69`
- **Cache-first** para assets estáticos, com fallback network
- **Network-first** para navigation (HTML)
- **Skip para `/api/`** (POST de email não é cacheado)
- **Lista de assets hardcoded** (`STATIC_ASSETS`) — precisa atualizar manualmente a cada mudança
- `sw-update.js` registra SW, detecta `controllerchange`, mostra modal de atualização

### 1.5 IndexedDB Atual

- DB `mail-mvp`, versão 3
- Store `records` (keyPath: `uuid`) — dados do registro
- Store `attachments` (keyPath: `id`, index em `uuid`) — anexos separados desde v3
- Migração transparente v2→v3 em `restore.js` (anexos inline → store separado)
- **Sem observables** — leituras são one-shot (`getAllRecords`, `getRecord`)

### 1.6 PWA/Manifest

- `manifest.json` — standalone, portrait, ícones 192/512
- Orientation overlay (landscape warning)
- Meta tags para iOS (apple-mobile-web-app-capable, status-bar-style)

### 1.7 Mobile Android — Uso Atual

- Formulário de campo, usado em Android Chrome
- Muitas vezes **sem conexão** durante preenchimento
- Auto-save debounced (1s) ao IndexedDB
- Geolocalização via `navigator.geolocation`
- Camera/upload de imagens
- Orientação bloqueada em portrait (overlay)

### 1.8 Testes Atuais

- **24 arquivos** de teste, ~394 testes unitários
- Setup em `tests/setup.js` — constrói DOM mínimo, mocka canvas, crypto, URL, Image
- **Todos os testes** usam jsdom, importam módulos diretamente
- `vitest.config.js` — coverage v8, inclui `scripts/**/*.js`, exclui `sw-update.js`
- Testes NÃO cobrem `send.js` (SMTP não disponível em CI)
- `fake-indexeddb` como mock de IndexedDB

---

## 2. Pontos de Atenção — ANTES da Refatoração

### 2.1 Críticos — Podem Bloquear ou Quebrar a Aplicação

| # | Ponto | Detalhe | Mitigação |
|---|-------|---------|-----------|
| **C1** | **Netlify publish directory** | Atual: `publish = "."` (raiz). Com Vite, o output vai para `dist/`. O `netlify.toml` DEVE ser atualizado para `publish = "dist"` e `command = "npm run build"` | Atualizar netlify.toml ANTES do primeiro deploy |
| **C2** | **Service Worker manual** | `sw.js` lista assets hardcoded. Com Vite (hash nos filenames), a lista fica inválida a cada build. O SW manual é incompatível com Vite | Usar `vite-plugin-pwa` (Workbox) que gera SW automaticamente com manifest de assets |
| **C3** | **IndexedDB raw API** | `db.js` usa raw IndexedDB (promises manuais, transações manuais). Migração para Dexie.js requer mapeamento completo do schema v3, migração de dados existentes de usuários | Implementar migration Dexie com `upgrader` que lê o DB antigo e migra |
| **C4** | **localStorage como backup** | `uuid.js` usa localStorage. Com Vue, o UUID pode ser reactive state, mas localStorage ainda é necessário para persistência entre sessions | Manter localStorage como backing store, mas sincronizar com reactive state |
| **C5** | **DOM cache pattern** | `dom.js` faz `getElementById` em `cacheDOM()`. Com Vue, refs/template refs substituem isso completamente. O cache DOM inteiro será eliminado | <care> Não remover até que os componentes Vue estejam funcionais. Migração incremental |
| **C6** | **Event delegation em document** | `app.js` escuta `input`/`change` em `document`. Vue's `v-model` e `@input` substituem isso, mas a transição precisa ser completa por seção | Migrar seção a seção, mantendo ambos funcionando durante a transição |
| **C7** | **Netlify Function** | `netlify/functions/send.js` usa `require("nodemailer")`. Com Vite, a function não é processada pelo bundler — continua independent. MAS o deploy muda para `dist/` | Verificar que o diretório de functions no netlify.toml continua apontando para `netlify/functions` |
| **C8** | **Tailwind CSS** | Atual: `tailwindcss` CLI gera `tailwind.css` estático. Com Vite, usar `@tailwindcss/vite` ou PostCSS plugin para processamento HMR | Configurar Tailwind como plugin Vite para HMR durante dev |
| **C9** | **Formato dos testes** | 394 testes unitários importam módulos vanilla diretamente (DOM-based). Com Vue, os testes precisarão importar componentes Vue e usar `@vue/test-utils` ou composables diretamente | Decidir estratégia: (a) reescrever tudo para testes de componentes Vue, ou (b) testar composables (lógica) separadamente da UI |

### 2.2 Importantes — Afetam Qualidade e Manutenibilidade

| # | Ponto | Detalhe | Mitigação |
|---|-------|---------|-----------|
| **I1** | **Duo-source state** | State é atualizado via collectors (DOM→state) E via event listeners (state→DOM). Vue reactive elimina isso | v-model com reactive state — state é a única fonte de verdade |
| **I2** | **Campo dinâmico tipo-ordem** | `DOM.tipoOrdem` é criado por `renderIniciais()` e atribuído manualmente fora de `cacheDOM()`. É uma exceção ao cache pattern | No Vue, `tipo-ordem` será um `<select>` com `v-model` — a exceção desaparece |
| **I3** | **Campos condicionais** | `retornos.js` controla visibilidade via `group.style.display = "none"`. Com Vue, `v-show`/`v-if` substituem isso naturalmente | Converter `condicional` em computed/watch — reatividade automática |
| **I4** | **Compressão de imagens** | `compress.js` usa canvas para redimensionar. Isso é puro DOM API — funciona em Vue mas precisa ser exportado como composable/utility | Criar `useCompress()` composable ou importar utilitário diretamente |
| **I5** | **Geolocalização** | `captureCoordinates()` lê `document.getElementById("coordenadas")`. Com Vue, usar template ref | Criar `useGeolocation()` composable |
| **I6** | **Sidebar + registros** | `sidebar.js` lê IndexedDB via `getAllRecords()`, renderiza lista, permite editar/excluir. Com Vue, vira componente com reactive data | Componente `<Sidebar>` com Dexie live queries |
| **I7** | **Dup check** | `duplicate.js` usa modal DOM manual. Com Vue, vira componente `<DuplicateModal>` | Usar `<Teleport>` para modais |
| **I8** | **Object URL leaks** | `attachments.js` rastreia `previewObjectUrls` manualmente para revoke. Com Vue, `onUnmounted` + `watchEffect` | Composable `useAttachments()` com cleanup automático |
| **I9** | **Constantes de classes CSS** | `styles.js` exporta strings de classes Tailwind. Em Vue, classes ficam nos templates SFC | Eliminar `styles.js` — classes direto nos templates |
| **I10** | **is-filled class** | `app.js` adiciona/remove `.is-filled` via JS. Em Vue, `:class="{ 'is-filled': valor }"` | Binding reativo — elimina o `updateAllFilledClasses()` |

### 2.3 Secundários — Afetam DX e Pós-Migração

| # | Ponto | Detalhe | Mitigação |
|---|-------|---------|-----------|
| **S1** | **CACHE_NAME manual** | Toda mudança de asset exige bump de `CACHE_NAME` no SW. `vite-plugin-pwa` gera precache manifest automaticamente | `vite-plugin-pwa` resolve isso totalmente |
| **S2** | **Sem HMR** | Atualmente não há hot reload — edita arquivo, refresh browser. Vite traz HMR nativo | Vite dev server com HMR — grande ganho de DX |
| **S3** | **Documentação arquitetura** | `AGENTS.md` e docs de arquitetura precisam ser atualizados após a migração | Atualizar AGENTS.md ao final da refatoração |
| **S4** | **Playwright E2E** | Configurado mas status desconhecido. Mudança de estrutura pode quebrar seletores | Reescrever seletores E2E para usar `data-testid` |
| **S5** | **manifest.json** | Atualmente na raiz. Com Vite, vai para `public/` | Mover para `public/manifest.json` |
| **S6** | **Ícones PWA** | `icons/` na raiz. Com Vite, mover para `public/icons/` | Copiar para `public/icons/` |
| **S7** | **Font externa** | `style.css` importa `fonts.googleapis.com`. Em offline, a fonte pode não carregar | Pré-carregar fonte ou usar `@fontsource/inter` como npm package |
| **S8** | **AGENTS.md** | Documentação de arquitetura precisa ser atualizada após a migração | Atualizar AGENTS.md ao final da refatoração |

---

## 3. Pontos de Atenção — DURANTE a Refatoração

### 3.1 Ordem de Migração (Sequência Crítica)

A ordem abaixo é recomendada para minimizar breakage e permitir testes incrementais:

```
Fase 1: Infraestrutura (sem mudança de comportamento)
  ├── 1.1 Instalar Vite + Vue 3 + Vue Router + Pinia + Dexie.js + vite-plugin-pwa + TypeScript
  ├── 1.2 Configurar vite.config.ts (Tailwind, PWA, build output)
  ├── 1.3 Configurar tsconfig.json (strict mode, path aliases @/)
  ├── 1.4 Configurar router (1 rota: /) e Pinia (2 stores: form, ui)
  ├── 1.5 Mover assets estáticos para public/
  ├── 1.6 Configurar netlify.toml para dist/
  └── 1.7 Garantir que `npm run dev` funciona com app vanilla ainda

Fase 2: Vue scaffold básico
  ├── 2.1 Criar App.vue com layout (sidebar, router-view, modais globais)
  ├── 2.2 Criar FormPage.vue (rota "/") com template equivalente ao conteúdo atual
  ├── 2.3 Criar main.ts (createApp, use(router), use(pinia), mount)
  ├── 2.4 Configurar router/index.ts com createWebHistory + 1 rota
  ├── 2.5 Criar stores/form.ts e stores/ui.ts (Pinia typed stores)
  └── 2.6 Garantir que o app renderiza idêntico ao original

Fase 3: Migrar estado para Pinia stores + TypeScript
  ├── 3.1 stores/form.ts — estado do formulário tipado (iniciais, retorno, equipamentos, etc.)
  ├── 3.2 stores/ui.ts — estado de UI tipado (toasts, modais, sidebar, erros)
  ├── 3.3 Composable useFields.ts — dados declarativos dos campos (tipados)
  ├── 3.4 Composable useIniciais.ts — lógica de campos iniciais + validação
  ├── 3.5 Composable useRetorno.ts — campos condicionais
  ├── 3.6 Composable useEquipamentos.ts — CRUD de equipamentos
  ├── 3.7 Composable useAttachments.ts — upload, preview, compress
  ├── 3.8 Composable useGeolocation.ts — coordenadas
  ├── 3.9 Composable useValidation.ts — validação por seção
  ├── 3.10 Composable useEmail.ts — composeEmail + preview
  ├── 3.11 Composable useSend.ts — fluxo de envio + duplicate + fila offline
  └── 3.12 Composable useOfflineQueue.ts — fila de envio offline
  └── 3.13 Composable useOnlineStatus.ts — detecta online/offline

Fase 4: Migrar persistência (Dexie.js + TypeScript)
  ├── 4.1 Definir schema Dexie tipado (records, attachments, pendingSends)
  ├── 4.2 Implementar migração v3→Dexie (upgrader) em db/migrations.ts
  ├── 4.3 Integrar formStore.saveDraft() com Dexie tipado
  ├── 4.4 Substituir db.js e persistence.js por db/index.ts
  └── 4.5 Testar migração de dados de DBs existentes

Fase 5: Componentes Vue + TypeScript (<script setup lang="ts">)
  ├── 5.1 FormPage.vue (página rota "/") — orquestra as 5 seções
  ├── 5.2 SecaoInicio.vue
  ├── 5.3 SecaoRetorno.vue
  ├── 5.4 SecaoEquipamentos.vue
  ├── 5.5 SecaoAnexos.vue
  ├── 5.6 SecaoRevisao.vue
  ├── 5.7 Sidebar.vue
  ├── 5.8 Modais (DuplicateModal, ConfirmModal, UpdateModal)
  ├── 5.9 Toast.vue
  ├── 5.10 Lightbox.vue
  ├── 5.11 FieldError.vue — slot reutilizável para erros de campo
  ├── 5.12 AppHeader.vue — header com hamburger + novo formulário
  └── 5.13 ErrorBanner.vue — banner de erro global

Fase 6: PWA com vite-plugin-pwa
  ├── 6.1 Configurar vite-plugin-pwa (workbox, manifest)
  ├── 6.2 Eliminar sw.js manual
  ├── 6.3 Testar install/update flow
  └── 6.4 Garantir que API calls (POST /api/send) não são cacheadas

Fase 7: Testes + TypeScript
  ├── 7.1 Configurar vitest para Vue + TypeScript (@vue/test-utils + @pinia/testing + tsconfig.test.json)
  ├── 7.2 Reescrever testes de Pinia stores (form, ui) em .test.ts
  ├── 7.3 Reescrever testes de composables (lógica pura) em .test.ts
  ├── 7.4 Reescrever testes de componentes (mount + interações) em .test.ts
  ├── 7.5 Garantir 394+ testes passando
  └── 7.6 Atualizar coverage config

Fase 8: Limpeza + Documentação
  ├── 8.1 Remover scripts/ antigos
  ├── 8.2 Remover dom.js, styles.js, sw-update.js
  ├── 8.3 Atualizar AGENTS.md
  ├── 8.4 Validar tsconfig.json sem erros (npm run typecheck)
  └── 8.5 Deploy de validação no Netlify
```

### 3.2 Riscos e Mitigações por Fase

#### Fase 1 — Infraestrutura

| Risco | Mitigação |
|-------|-----------|
| Vite dev server não serve Netlify Functions | Usar `vite-plugin-netlify` ou proxy manual `/api/send` → `localhost:8888/.netlify/functions/send` durante dev. Manter `netlify dev` como alternativa |
| Tailwind para de funcionar no Vite | Instalar `@tailwindcss/vite` (v4) ou configurar PostCSS no Vite (v3) |
| `npm run build` gera output em `dist/` mas Netlify ainda publica raiz | **ATUALIZAR netlify.toml PRIMEIRO** — senão deploy quebra |
| TypeScript strict mode quebra build inicial | Começar com `strict: false`, habilitar progressivamente por arquivo. Usar `any` temporário só onde necessário |

#### Fase 2 — Vue Scaffold

| Risco | Mitigação |
|-------|-----------|
| HTML inline com emojis e classes longas fica difícil de manter em SFC | Considerar organizar em sub-componentes menores |
| CSS custom (`style.css`) conflita com Tailwind | Migrar para `<style>` scoped nos componentes, ou manter CSS global importado no `main.ts` |
| Tipagem de Pinia stores com `defineStore` | Usar `defineStore('form', () => { ... })` com `ref<T>()` e `computed<() => T>` para inferência automática |

#### Fase 3 — Composables

| Risco | Mitigação |
|-------|-----------|
| `collectors.js` lê DOM — não existe mais com Vue | Todos os dados ficam em `reactive()` — collectors desaparecem. O state é atualizado por v-model automaticamente |
| Geolocalização continua assíncrona | Composable `useGeolocation()` retorna `{ coords, loading, refresh }` reativos |
| Compressão de imagens usa canvas — não é reativo | Utility pura `compressAttachment(file)` — sem reatividade necessária |

#### Fase 4 — Dexie.js

| Risco | Mitigação |
|-------|-----------|
| Usuários existentes têm dados no IndexedDB v3 (raw) | Implementar `upgrader` no Dexie que detecta stores antigos e migra |
| Schema Dexie não suporta `keyPath: "uuid"` natamente na mesma forma | Dexie v4 usa `++id` ou `&uuid` (primary key). Mapear: `records: "&uuid"` e `attachments: "++id, uuid"` |
| `saveAttachments` delete-and-reinsert tem race condition | Dexie tem `where('uuid').equals(uuid).delete()` + `bulkAdd()` — mais limpo |
| `fake-indexeddb` pode não funcionar com Dexie | Dexie v4 suporta `fake-indexeddb` via `indexedDB` global. Verificar compatibilidade nos testes |

#### Fase 5 — Componentes

| Risco | Mitigação |
|-------|-----------|
| Campos condicionais (retornos.js) precisam de reatividade automática | `v-if`/`v-show` com computed baseado no valor do campo pai — elimina `updateConditionalFields()` |
| Event listeners manuais (blur, input, change) | Vue's `@blur`, `@input`, `@change` + `v-model` com `lazy` modifier |
| Re-renderização de campos ao trocar tipo-ordem | Computed na lista de campos + `v-for` com `:key` — Vue re-renderiza automaticamente |
| Modais com `classList.add/remove('hidden')` | `v-model` booleano para controlar visibilidade: `<DuplicateModal v-model="showDuplicate" />` |

#### Fase 6 — PWA

| Risco | Mitigação |
|-------|-----------|
| Workbox gera SW diferente do manual — quebra cache existente | Na primeira migração, o Workbox limpa caches antigos automaticamente via `cleanupOutdatedCaches: true` |
| `navigateFallback` pode cachear a API | Configurar `runtimeCaching` com exclusão de `/api/` |
| Assets com hash nos filenames não são cacheáveis por URL fixa | Workbox usa precache manifest com revision hashes — resolvido nativamente |
| Font Google não funciona offline | Migrar para `@fontsource/inter` (npm) ou pré-cachear no Workbox |

#### Fase 7 — Testes

| Risco | Mitigação |
|-------|-----------|
| 394 testes existentes quebram 100% | Estratégia: (1) manter testes de lógica pura (utils, fields, compress) adaptados, (2) reescrever testes DOM para testes de componentes, (3) testar composables isoladamente |
| `tests/setup.js` constrói DOM mínimo — não serve para Vue | Novo setup importa `@vue/test-utils`, `createTestingPinia` (se usar Pinia), ou monta componentes com `mount()` |
| Coverage cai durante migração | Aceitar queda temporária e recuperar na Fase 7 |

#### Fase 8 — Limpeza

| Risco | Mitigação |
|-------|-----------|
| Remover código velho quebra imports não detectados | TypeScript compiler (`tsc --noEmit`) detecta imports órfãos automaticamente |
| Tipos órfãos no tsconfig | Rodar `npm run typecheck` antes do deploy final |

### 3.3 Offline-First — Pontos Críticos

| # | Ponto | Solução |
|---|-------|---------|
| **O1** | **Auto-save para IndexedDB** | Dexie `db.records.put()` + `watchEffect()` no Vue — salva automaticamente quando state muda |
| **O2** | **Envio de email offline** | Atualmente falha com "Erro de conexão". **Novo:** Implementar fila de envio offline — salvar `pendingSend` no Dexie, tentar enviar quando voltar online via `navigator.onLine` + `online` event |
| **O3** | **Service Worker cache** | `vite-plugin-pwa` com `registerType: 'promptUpdate'` — mantém offline, avisa sobre updates |
| **O4** | **Geolocalização offline** | Manter `captureCoordinates()` — funciona offline se GPS disponível, fallback "Não disponível" |
| **O5** | **Câmera/upload offline** | Funciona nativamente — `input[type=file][accept=image/*]` não requer rede |
| **O6** | **Fontes offline** | Migrar de Google Fonts para `@fontsource/inter` (npm) — funciona offline |
| **O7** | **Imagens de preview** | Object URLs (blob:) funcionam offline — sem mudança |
| **O8** | **Dados de registros** | Dexie vive no IndexedDB — 100% offline. Live queries para sidebar reativa |
| **O9** | **Quota de IndexedDB** | Manter lógica de QuotaExceededError. Dexie propaga o mesmo erro |
| **O10** | **Compression de anexos** | Canvas API funciona offline — sem mudança, apenas empacotar como composable |

### 3.4 Mobile Android — Pontos Específicos

| # | Ponto | Detalhe |
|---|-------|---------|
| **M1** | **Viewport mobile** | Vue SFC não afeta meta viewport — manter `meta viewport` no `index.html` |
| **M2** | **Touch events** | Vue suporta `@touchstart`, `@touchend` etc. Melhor que addEventListener manual |
| **M3** | **Soft keyboard** | `inputmode="numeric"` para UC, `type="tel"` para numeros — manter |
| **M4** | **Scroll para erro** | Manter `scrollIntoView` na validação — usar template refs com `el.scrollIntoView()` |
| **M5** | **Orientation lock** | `manifest.json` com `"orientation": "portrait"` + CSS overlay — sem mudança |
| **M6** | **Status bar** | Meta tags `apple-mobile-web-app-capable` — manter |
| **M7** | **Pull-to-refresh** | PWA em standalone não tem pull-to-refresh nativo —(valor atual). Manter |
| **M8** | **Back button Android** | PWA standalone intercepta back button. Vue Router resolve isso nativamente — `router.go(-1)` ou transição de rota funciona como esperado |
| **M9** | **Instalação PWA** | `manifest.json` em `public/` — Vite serve automaticamente |
| **M10** | **Background sync** | Workbox Background Sync pode ser usado para fila de envio (O2) |

---

## 4. Arquitetura Proposta

### 4.1 Estrutura de Diretórios

```
mail/
├── public/
│   ├── manifest.json
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
├── src/
│   ├── App.vue                        # Layout raiz: sidebar + router-view + modais globais
│   ├── main.ts                        # createApp + plugins (router, pinia, pwa)
│   ├── router/
│   │   └── index.ts                   # Definição de rotas
│   ├── stores/
│   │   ├── form.ts                    # Pinia store — estado do formulário (substitui state.js)
│   │   └── ui.ts                      # Pinia store — estado de UI (toasts, modais, sidebar)
│   ├── composables/
│   │   ├── useFields.ts               # Dados declarativos (iniciaisFields, retornoFieldsByTipo)
│   │   ├── useIniciais.ts             # Lógica de campos iniciais + v-model
│   │   ├── useRetorno.ts              # Campos condicionais de retorno
│   │   ├── useEquipamentos.ts         # CRUD de equipamentos
│   │   ├── useAttachments.ts          # Upload, preview, compress, cleanup
│   │   ├── useGeolocation.ts          # Coordenadas reativas
│   │   ├── useValidation.ts           # Validação por seção
│   │   ├── useEmail.ts                # composeEmail + preview
│   │   ├── useSend.ts                 # Fluxo de envio + duplicate + fila offline
│   │   ├── useOfflineQueue.ts         # Fila de envio offline (pendingSends + flush)
│   │   └── useOnlineStatus.ts         # Detecta online/offline via navigator.onLine
│   ├── pages/
│   │   ├── FormPage.vue               # Rota "/" — formulário principal (5 seções)
│   │   └── RegistrosPage.vue          # Rota "/registros" — listagem de registros (futuro)
│   ├── components/
│   │   ├── SecaoInicio.vue
│   │   ├── SecaoRetorno.vue
│   │   ├── SecaoEquipamentos.vue
│   │   ├── SecaoAnexos.vue
│   │   ├── SecaoRevisao.vue
│   │   ├── Sidebar.vue
│   │   ├── DuplicateModal.vue
│   │   ├── ConfirmModal.vue
│   │   ├── UpdateModal.vue
│   │   ├── OrientationOverlay.vue
│   │   ├── Toast.vue
│   │   ├── Lightbox.vue
│   │   ├── FieldError.vue             # Slot reutilizável para erros de campo
│   │   ├── AppHeader.vue              # Header com hamburger + novo formulário
│   │   └── ErrorBanner.vue            # Banner de erro global
│   ├── db/
│   │   ├── index.ts                   # Dexie instance + schema + upgrades
│   │   └── migrations.ts              # Upgraders (v3→Dexie)
│   ├── utils/
│   │   ├── compress.ts                # Compressão de imagens (pura, sem DOM)
│   │   ├── format.ts                  # formatDate
│   │   ├── base64.ts                  # toBase64, blobToBase64, base64ToBlob
│   │   └── coordinates.ts             # captureCoordinates (DOM dependency — composable friendly)
│   ├── styles/
│   │   └── main.css                   # Tailwind imports + CSS custom global
│   └── constants/
│       └── fields.ts                  # iniciaisFields, retornoFieldsByTipo, nomesTecnicos
├── netlify/
│   └── functions/
│       └── send.js                     # Inalterado (Node.js CommonJS)
├── tests/
│   ├── setup.ts                        # Novo setup Vue + jsdom + fake-indexeddb + pinia
│   ├── composables/
│   │   ├── useFields.test.ts
│   │   ├── useValidation.test.ts
│   │   ├── useEmail.test.ts
│   │   └── ...
│   ├── components/
│   │   ├── SecaoInicio.test.ts
│   │   ├── SecaoRetorno.test.ts
│   │   └── ...
│   ├── stores/
│   │   ├── form.test.ts
│   │   └── ui.test.ts
│   └── utils/
│       ├── compress.test.ts
│       └── format.test.ts
├── index.html                          # Entry point (Vite)
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── tsconfig.test.json
├── tailwind.config.js
├── postcss.config.js
├── netlify.toml
└── package.json
```

### 4.2 Tecnologias — Versões e Dependências

```json
{
  "dependencies": {
    "vue": "^3.5",
    "vue-router": "^4.5",
    "pinia": "^3.0",
    "dexie": "^4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2",
    "vite": "^6.0",
    "vite-plugin-pwa": "^1.0",
    "@vue/test-utils": "^2.4",
    "@pinia/testing": "^1.0",
    "@tailwindcss/vite": "^4.0",
    "vitest": "^3.0",
    "jsdom": "^25.0",
    "fake-indexeddb": "^6.0",
    "@fontsource/inter": "^5.0",
    "typescript": "^5.5",
    "vue-tsc": "^2.0",
    "@types/node": "^20.0"
  }
}
```

### 4.3 Vue Router — Configuração Proposta

```ts
// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import FormPage from '@/pages/FormPage.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'form',
    component: FormPage,
  },
  // Futuro: páginas novas adicionadas aqui
  // {
  //   path: '/registros',
  //   name: 'registros',
  //   component: () => import('@/pages/RegistrosPage.vue'),
  // },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
```

**Por que Vue Router agora se hoje é só 1 rota?**

 Hoje o app funciona como single-view (5 seções visíveis simultaneamente).
 Mas a decisão de adicionar Router **agora** reflete:

 1. **Back button Android** — PWA standalone intercepta o back button.
    Com Router, o botão "voltar" do Android funciona naturalmente
    (ex: voltar do formulário para uma futura página de registros).
 2. **Preparação para páginas novas** — Quando adicionar `/registros`,
 `/config`, etc., a estrutura já está pronta. Sem Router, você teria
 que reestruturar toda a hierarquia de componentes (App.vue → RouterView).
 3. **Custo incremental baixo** — Adicionar Router + configurar 1 rota
 inicial leva ~30 min. Adicionar depois exige rewiring de App.vue,
 stores que dependiam de hierarquia flat, e possivelmente migração
 de `reactive()` local para Pinia stores acessíveis entre rotas.
 4. **Lazy loading grátis** — `() => import('@/pages/X.vue')` permite
 code-split automático para páginas futuras sem custo.

### 4.4 Pinia — Stores Propostos

**Por que Pinia se o app é pequeno?**

 Com Vue Router, as seções do formulário deixam de ser componentes
 sempre-montados e passam a ser páginas desmontáveis. Quando o usuário
 navega para `/registros` e volta para `/`, o `FormPage.vue` é
 desmontado e remontado. Se o estado do formulário vive em
 `reactive()` local, ele é destruído na navegação.

 Pinia resolve isso: stores são singletons que sobrevivem a
 desmontagens. O estado do formulário persiste entre rotas.

#### Store: form.ts (estado do formulário)

```ts
// src/stores/form.ts
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { db } from '@/db';
import type { RecordData, IniciaisData, RetornoData, EquipamentoData, AttachmentData } from '@/types';

export const useFormStore = defineStore('form', () => {
  // ── State ──
  const iniciais = ref<IniciaisData>({});
  const equipamentos = ref<EquipamentoData[]>([]);
  const attachments = ref<AttachmentData[]>([]);
  const lastTipoOrdem = ref<string>('');
  const retorno = ref<RetornoData>({});
  const currentUUID = ref<string>(localStorage.getItem('currentUUID') || '');
  const composicao = ref<{ complementoCorpo: string }>({ complementoCorpo: '' });
  const _createdAt = ref<string | null>(null);

  // ── Computed ──
  const iniciaisValido = computed(() =>
    !!iniciais.value.uc?.trim() && !!iniciais.value.os?.trim()
  );

  const tipoOrdem = computed({
    get: () => iniciais.value['tipo-ordem'] || '',
    set: (val: string) => { iniciais.value['tipo-ordem'] = val; },
  });

  // ── Auto-save (debounced 1s) ──
  let saveTimer: ReturnType<typeof setTimeout>;
  watch(
    () => ({
      iniciais: { ...iniciais.value },
      retorno: { ...retorno.value },
      equipamentos: [...equipamentos.value],
      attachments: attachments.value.length,
    }),
    () => {
      if (!iniciaisValido.value) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => saveDraft(), 1000);
    },
    { deep: true }
  );

  async function saveDraft() {
    if (!iniciaisValido.value) return;
    if (!currentUUID.value) {
      currentUUID.value = crypto.randomUUID();
      localStorage.setItem('currentUUID', currentUUID.value);
    }
    const createdAt = _createdAt.value
      || (await db.records.get(currentUUID.value))?.createdAt
      || new Date().toISOString();
    _createdAt.value = createdAt;

    const record: RecordData = {
      uuid: currentUUID.value,
      status: 'draft',
      createdAt,
      updatedAt: new Date().toISOString(),
      iniciais: { ...iniciais.value },
      retorno: { ...retorno.value },
      tipoOrdem: iniciais.value['tipo-ordem'] || '',
      equipamentos: [...equipamentos.value],
      composicao: { ...composicao.value },
      attachmentCount: attachments.value.length,
      sentData: null,
    };

    await db.records.put(record);
  }

  async function loadRecord(uuid: string) {
    const record = await db.records.get(uuid);
    if (!record) return;
    
    iniciais.value = record.iniciais;
    retorno.value = record.retorno;
    equipamentos.value = record.equipamentos;
    currentUUID.value = record.uuid;
    _createdAt.value = record.createdAt;
    composicao.value = record.composicao;
    
    const storedAttachments = await db.attachments
      .where('uuid').equals(uuid)
      .toArray();
    attachments.value = storedAttachments.map(a => new File([a.data], a.name, { type: a.type }));
  }

  function resetForm() {
    iniciais.value = {};
    equipamentos.value = [];
    attachments.value = [];
    retorno.value = {};
    lastTipoOrdem.value = '';
    currentUUID.value = '';
    _createdAt.value = null;
    composicao.value = { complementoCorpo: '' };
    localStorage.removeItem('currentUUID');
  }

  return {
    iniciais, equipamentos, attachments, lastTipoOrdem,
    retorno, currentUUID, composicao, _createdAt,
    iniciaisValido, tipoOrdem,
    saveDraft, loadRecord, resetForm,
  };
});
```

#### Store: ui.ts (estado global de UI)

```ts
// src/stores/ui.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUIStore = defineStore('ui', () => {
  const sidebarOpen = ref<boolean>(false);
  const toastMessage = ref<string>('');
  const toastSuccess = ref<boolean>(false);
  const toastVisible = ref<boolean>(false);
  const confirmMessage = ref<string>('');
  const confirmOpen = ref<boolean>(false);
  const showDuplicateModal = ref<boolean>(false);
  const showUpdateModal = ref<boolean>(false);
  const errorMessage = ref<string>('');
  const errorVisible = ref<boolean>(false);

  let confirmResolve: ((result: boolean) => void) | null = null;

  function showToast(msg: string, success = false) {
    toastMessage.value = msg;
    toastSuccess.value = success;
    toastVisible.value = true;
    setTimeout(() => { toastVisible.value = false; }, 3500);
  }

  function showError(msg: string) {
    errorMessage.value = msg;
    errorVisible.value = true;
  }

  function hideError() {
    errorVisible.value = false;
    errorMessage.value = '';
  }

  function showConfirm(msg: string): Promise<boolean> {
    confirmMessage.value = msg;
    confirmOpen.value = true;
    return new Promise((resolve) => { confirmResolve = resolve; });
  }

  function resolveConfirm(result: boolean) {
    if (confirmResolve) {
      confirmResolve(result);
      confirmResolve = null;
    }
    confirmOpen.value = false;
  }

  return {
    sidebarOpen, toastMessage, toastSuccess, toastVisible,
    confirmMessage, confirmOpen, showDuplicateModal,
    showUpdateModal, errorMessage, errorVisible,
    showToast, showError, hideError, showConfirm, resolveConfirm,
  };
});
```

### 4.5 Dexie.js — Schema Proposto (TypeScript)

```ts
// src/db/index.ts
import Dexie, { type Table } from 'dexie';
import type { RecordData, AttachmentData, PendingSendData } from '@/types';

export class MailDB extends Dexie {
  records!: Table<RecordData, string>;
  attachments!: Table<AttachmentData, number>;
  pendingSends!: Table<PendingSendData, number>;

  constructor() {
    super('mail-mvp');

    this.version(4).stores({
      records: 'uuid, status, tipoOrdem, updatedAt',
      attachments: '++id, uuid',
      pendingSends: '++id, uuid'
    }).upgrade(tx => {
      // Migração v3 (raw IDB) → v4 (Dexie)
      // O Dexie usa o mesmo IndexedDB físico.
      // As stores 'records' e 'attachments' já existem (v3).
      // A store 'pendingSends' é nova — criada vazia.
    });
  }
}

export const db = new MailDB();
```

### 4.6 Vue State — Substituição de state.js

O estado MIGRA de `reactive()` local para **Pinia stores** porque:

1. Com Vue Router, componentes são desmontados ao navegar — `reactive()` local morre
2. Pinia stores são singletons globais que sobrevivem a navegação
3. Stores são acessíveis de qualquer componente/composable via `useFormStore()`
4. DevTools Vue mostra estado dos stores para debug
5. HMR preserva estado dos stores durante dev
6. **TypeScript** fornece autocomplete e type safety em todo o estado

```ts
// ANTES (state.js) — objeto global, importável diretamente:
export const state = {
  iniciais: {},
  equipamentos: [],
  attachments: [],
  lastTipoOrdem: '',
  retorno: {},
  currentUUID: getCurrentUUID(),
  composicao: { complementoCorpo: '' },
  iniciaisValido: false,
  _createdAt: null,
};

// DEPOIS — Pinia store tipado (ver seção 4.4 para versão completa):
// src/stores/form.ts
// Acessível de qualquer componente via:
import { useFormStore } from '@/stores/form';
const form = useFormStore();
// form.iniciais, form.equipamentos, form.tipoOrdem — todos tipados!
```

### 4.7 Campos Condicionais — Delegação ao Vue (TypeScript)

```vue
<!-- ANTES (retornos.js): group.style.display = "none" manualmente -->
<!-- DEPOIS: -->
<script setup lang="ts">
import { computed } from 'vue';
import { useFields } from '@/composables/useFields';
import { useFormStore } from '@/stores/form';
import type { FieldDefinition } from '@/types';

const form = useFormStore();
const { getRetornoFields } = useFields();

const activeRetornoFields = computed((): FieldDefinition[] => {
  const tipo = form.iniciais['tipo-ordem'];
  const allFields = getRetornoFields(tipo);
  return allFields.filter((field: FieldDefinition) => {
    if (!field.condicional) return true;
    const controlValue = form.retorno[field.condicional.campoRef] ?? form.iniciais[field.condicional.campoRef];
    const valores = Array.isArray(field.condicional.valor)
      ? field.condicional.valor
      : [field.condicional.valor];
    const match = valores.includes(controlValue);
    return field.condicional.negado ? !match : match;
  });
});
</script>

<template>
  <div v-for="field in activeRetornoFields" :key="field.nome">
    <label :for="field.nome">{{ field.label }}</label>
    <component :is="inputComponent(field.tipo)" v-model="form.retorno[field.nome]" />
  </div>
</template>
```

### 4.8 Fila de Envio Offline — Novo (TypeScript)

```ts
// composables/useOfflineQueue.ts
import { db } from '@/db';
import { useOnlineStatus } from './useOnlineStatus';
import type { PendingSendData } from '@/types';

export function useOfflineQueue() {
  const { isOnline } = useOnlineStatus();

  async function queueSend(recordUuid: string, payload: Record<string, unknown>) {
    const pendingSend: PendingSendData = {
      uuid: recordUuid,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };
    await db.pendingSends.put(pendingSend);
  }

  async function flushQueue() {
    if (!isOnline.value) return;
    const pending = await db.pendingSends.toArray();
    for (const item of pending) {
      try {
        const res = await fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload),
        });
        if (res.ok) {
          await db.pendingSends.delete(item.id!);
          await db.records.update(item.uuid, { status: 'sent' });
        } else {
          await db.pendingSends.update(item.id!, { attempts: item.attempts + 1 });
        }
      } catch {
        await db.pendingSends.update(item.id!, { attempts: item.attempts + 1 });
      }
    }
  }

  return { queueSend, flushQueue };
}
```

### 4.9 Composable: useOnlineStatus — Detecção de Conectividade (TypeScript)

```ts
// composables/useOnlineStatus.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useOnlineStatus() {
  const isOnline = ref<boolean>(navigator.onLine);

  function updateOnlineStatus() {
    isOnline.value = navigator.onLine;
    if (isOnline.value) {
      // Trigger flush da fila offline ao reconectar
      import('./useOfflineQueue').then(({ useOfflineQueue }) => {
        useOfflineQueue().flushQueue();
      });
    }
  }

  onMounted(() => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  });

  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
  });

  return { isOnline };
}
```

### 4.10 App.vue — Layout Raiz com Router (TypeScript)

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useFormStore } from '@/stores/form';
import { useUIStore } from '@/stores/ui';
import AppHeader from '@/components/AppHeader.vue';
import ErrorBanner from '@/components/ErrorBanner.vue';
import Sidebar from '@/components/Sidebar.vue';
import Toast from '@/components/Toast.vue';
import DuplicateModal from '@/components/DuplicateModal.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import UpdateModal from '@/components/UpdateModal.vue';
import Lightbox from '@/components/Lightbox.vue';
import OrientationOverlay from '@/components/OrientationOverlay.vue';

const form = useFormStore();
const ui = useUIStore();
const router = useRouter();

function handleNewForm() {
  form.saveDraft();
  form.resetForm();
  router.push('/');
}

function resolveConfirm(result: boolean) {
  ui.resolveConfirm(result);
}
</script>

<template>
  <div class="font-sans bg-gradient-to-br from-slate-100 to-blue-50 flex justify-center items-start min-h-screen p-0">
    <div class="container bg-white rounded-[20px] shadow-sm border border-slate-200/50 w-full max-w-[640px] relative">
      <AppHeader @toggle-sidebar="ui.sidebarOpen = true" @new-form="handleNewForm" />
      <ErrorBanner />
      <router-view />
    </div>

    <Sidebar v-model:open="ui.sidebarOpen" />
    <Toast />
    <DuplicateModal v-model:open="ui.showDuplicateModal" />
    <ConfirmModal v-model:open="ui.confirmOpen" @resolve="resolveConfirm" />
    <UpdateModal v-model:open="ui.showUpdateModal" />
    <Lightbox />
    <OrientationOverlay />
  </div>
</template>
```

### 4.10 PWA — Configuração proposta

```js
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        runtimeCaching: [
          // NÃO cachear /api/ — POST não é cacheável
        ],
      },
      manifest: {
        name: 'Retorno - Formulário de Envio',
        short_name: 'Retorno',
        description: 'Formulário de retorno para serviços de campo',
        start_url: '/',
        display: 'standalone',
        background_color: '#e5e7eb',
        theme_color: '#2563eb',
        orientation: 'portrait',
        lang: 'pt-BR',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
    },
  },
});
```

### 4.11 main.ts — Bootstrap da Aplicação

```ts
// src/main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from '@/router';
import App from '@/App.vue';
import '@/styles/main.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
```

### 4.12 tsconfig.json — Configuração TypeScript

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue", "tests/**/*.ts"],
  "references": [{ "path": "./tsconfig.test.json" }]
}
```

```json
// tsconfig.test.json
{
  "compilerOptions": {
    "composite": true,
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "types": ["vitest/globals", "@vue/test-utils", "@pinia/testing"]
  },
  "include": ["tests/**/*.ts", "vitest.config.ts"]
}
```

### 4.13 netlify.toml — SPA Redirect + Functions

```toml
# netlify.toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  # Necessário para Vue Router com createWebHistory (SPA fallback)

[[redirects]]
  from = "/api/send"
  to = "/.netlify/functions/send"
  status = 200

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Cache-Control = "public, max-age=3600"

[[headers]]
  for = "/icons/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

## 5. Checklist de Validação por Fase

### Fase 1 — Infraestrutura
- [ ] `npm run dev` inicia Vite dev server
- [ ] Tailwind CSS funciona no Vite (HMR)
- [ ] `npm run build` gera `dist/`
- [ ] `netlify.toml` atualizado: `publish = "dist"`, `command = "npm run build"`
- [ ] Netlify Functions ainda acessíveis em `/.netlify/functions/send`
- [ ] Assets estáticos (icons, manifest) servidos de `public/`
- [ ] TypeScript configurado: `tsconfig.json` + `tsconfig.test.json` (strict mode)
- [ ] `npm run typecheck` passa sem erros (`vue-tsc --noEmit`)
- [ ] Path aliases `@/*` funcionando

### Fase 2 — Vue Scaffold + Router + Pinia + TypeScript
- [ ] Vue Router configurado com `createWebHistory` + 1 rota (`/`) em `router/index.ts`
- [ ] Pinia instalado e registrado no `main.ts`
- [ ] Store `form.ts` criada com estado do formulário tipado (substitui `state.js`)
- [ ] Store `ui.ts` criada com estado de UI tipado (toasts, modais, sidebar)
- [ ] App.vue com `<router-view>` + modais globais + Sidebar (`<script setup lang="ts">`)
- [ ] App renderiza visualmente idêntico ao original
- [ ] CSS custom + Tailwind sem conflitos
- [ ] Meta tags PWA preservadas
- [ ] `npm run typecheck` passa sem erros

### Fase 3 — Composables + Stores (TypeScript)
- [ ] `formStore.saveDraft()` substitui `persistence.js` (tipado)
- [ ] Store `formStore.loadRecord()` substitui `restore.js` (tipado)
- [ ] `formStore.resetForm()` substitui `reset.js`
- [ ] `uiStore` substitui `ui.js` (toasts, modais, erros) (tipado)
- [ ] `useOnlineStatus()` detecta online/offline + trigger flush (tipado)
- [ ] `useOfflineQueue()` gerencia pendingSends + flush ao reconectar (tipado)
- [ ] Cada composable em `.ts` com tipos explícitos, testável isoladamente
- [ ] `useValidation()` cobre todas as regras existentes (tipado)
- [ ] `useEmail()` gera texto idêntico ao `composeEmail()` atual (tipado)
- [ ] `npm run typecheck` passa sem erros

### Fase 4 — Dexie.js
- [ ] DB `mail-mvp` v4 criado com schema Dexie
- [ ] Dados de DB v3 existente são migrados sem perda
- [ ] CRUD completo (save/get/delete records + attachments)
- [ ] QuotaExceededError tratado

### Fase 5 — Componentes Vue + TypeScript (`<script setup lang="ts">`)
- [ ] FormPage.vue orquestra as 5 seções na rota `/`
- [ ] 5 seções renderizam corretamente
- [ ] Campos condicionais funcionam com reatividade (computed + v-if)
- [ ] Sidebar lista, filtra, edita, exclui registros (via `formStore`)
- [ ] Modais funcionam com `v-model` + `uiStore`
- [ ] v-model em todos os inputs conectados à `formStore`
- [ ] is-filled class reativa (`:class` computado)
- [ ] Anexos: upload, preview, remove, lightbox
- [ ] Todos componentes usam `<script setup lang="ts">` com props/events tipados
- [ ] `npm run typecheck` passa sem erros

### Fase 6 — PWA
- [ ] Service Worker gerado por Workbox
- [ ] App funciona 100% offline (exceto envio)
- [ ] Caches antigos são limpos na atualização
- [ ] Update prompt funciona
- [ ] `/api/send` NÃO é cacheado

### Fase 7 — Testes + TypeScript
- [ ] Todos os composables com testes unitários em `.test.ts`
- [ ] Componentes key com testes de renderização + interação em `.test.ts`
- [ ] Coverage ≥ 80% dos composables
- [ ] Compressão, base64, format: testes de utils mantidos
- [ ] `npm run typecheck` passa nos testes também

### Fase 8 — Limpeza
- [ ] Nenhum arquivo `scripts/*.js` remanescente
- [ ] Nenhum `getElementById` fora de componentes Vue
- [ ] `sw.js` manual removido
- [ ] `dom.js` removido
- [ ] `styles.js` removido
- [ ] `AGENTS.md` atualizado
- [ ] `npm run typecheck` passa sem erros

---

## 6. Dependências entre Fases (O Que Bloqueia O Quê)

```
Fase 1 → Fase 2 (precisa de Vite+Vue instalados)
Fase 1 → Fase 3 (precisa de Pinia stores configuradas)
Fase 2 → Fase 5 (App.vue com router-view → FormPage.vue)
Fase 3 → Fase 5 (composables + stores são usados nos componentes)
Fase 4 → Fase 3 (formStore.saveDraft precisa de Dexie)
Fase 5 → Fase 6 (PWA precisa dos componentes buildados)
Fase 5 → Fase 7 (testes de componentes precisam dos componentes)
Fase 6+7 → Fase 8 (limpeza só após tudo funcionando)
```

**Ordem recomendada revisada:**
1. Fase 1 (Infra)
2. Fase 4 (Dexie — independe do Vue, mas necessário para save)
3. Fase 2 (Vue scaffold com Router + Pinia)
4. Fase 3 (Stores + Composables — pode usar Dexie já pronto)
5. Fase 5 (Componentes)
6. Fase 6 (PWA)
7. Fase 7 (Testes)
8. Fase 8 (Limpeza)

---

## 7. Estimativa de Esforço

| Fase | Complexidade | Arquivos Criados | Arquivos Modificados | Arquivos Removidos |
|------|-------------|------------------|---------------------|-------------------|
| 1 | Média | 3-4 | 3-4 | 0 |
| 2 | Média | 4-5 (router, stores, App, FormPage, main) | 1 | 0 |
| 3 | Alta | 10-12 (composables) | 2 (stores já criadas) | 0 |
| 4 | Alta | 2-3 (db/index, migrations) | 1 (store form) | 0 |
| 5 | Alta | 11-12 (componentes) | 0 | 0 |
| 6 | Média | 0 | 1 (vite.config) | 1 (sw.js) |
| 7 | Alta | 26+ (testes) | 1 (setup.js) | 0 |
| 8 | Baixa | 1 (AGENTS.md) | 2 | 24 (scripts/*) |
| **Total** | | **~58 novos** | **~12 mod** | **~25 rem** |

---

## 8. Decisões Pendentes (A Confirmar Antes de Iniciar)

| # | Decisão | Opções | Recomendação |
|---|---------|--------|--------------|
| **D1** | TypeScript ou JavaScript? | (a) JS puro, (b) TS com strict, (c) TS gradual | **(b)** — TS strict desde o início. Configuração `strict: true` no tsconfig.json, tipos para Vue/Dexie/Pinia. Habilita type-safety completa. |
| **D2** | State management | (a) reactive() local, (b) Pinia, (c) provide/inject | **(b)** — Pinia, porque Vue Router desmonta componentes. Store singleton sobrevive à navegação. DevTools integrado |
| **D3** | Vue Router | (a) Sem router, (b) Vue Router | **(b)** — Router incluído desde o início. Back button Android funciona, preparação para múltiplas páginas, custo incremental baixo agora |
| **D4** | Testes E2E | (a) Manter Playwright, (b) Remover | **(a)** — Manter, mas atualizar seletores para `data-testid` |
| **D5** | Estratégia de migração de testes | (a) Reescrever tudo de uma vez, (b) Manter testes antigos durante migração | **(b)** — Manter testes de `utils/` (compress, format, base64) inalterados. Reescrever testes DOM para testes de composables/componentes |
| **D6** | Fonte offline | (a) @fontsource/inter (npm), (b) Pré-cache Google Fonts no SW, (c) System fonts | **(a)** — @fontsource é mais confiável e não depende de cache |
| **D7** | Dexie v3 ou v4? | (a) v3 (estável), (b) v4 (nova API) | **(b)** — v4 está estável (2026), melhor TypeScript, API mais limpa |
| **D8** | Tailwind v3 ou v4? | (a) v3 (PostCSS atual), (b) v4 (@tailwindcss/vite) | **(b)** — v4 estável (2026), integração nativa com Vite, HMR |

---

## 9. Métricas de Sucesso

| Métrica | Antes | Depois |
|---------|-------|--------|
| **Funciona offline** | Sim (SW manual) | Sim (Workbox) |
| **HMR em dev** | Não (refresh manual) | Sim (Vite) |
| **Auto-save** | Debounced 1s (DOM→state→IDB) | watchEffect(debounced) (state→IDB) — elimina DOM→state |
| **Fila de envio offline** | Não (falha silenciosa) | Sim (pendingSends + flush quando online) |
| **Testes** | 394 (DOM-based) | 394+ (composable + component) |
| **SW maintenance** | Manual (CACHE_NAME bump) | Automático (Workbox precache) |
| **Campos condicionais** | JS manual (style.display) | Vue v-if/computed (reativo) |
| **Lines of code** | ~2,324 (scripts/) | ~2,000-2,500 (src/) — similar, mas mais organizado e tipado |
| **DX** | Refresh manual, sem TS, sem HMR | HMR, opcional TS, Vite dev server |
| **Coverage** | ? (vitest --coverage) | ≥80% composables |

---

## 10. Riscos Não Resolvidos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| IndexedDB v3→Dexie migração perde dados | Baixa | Crítico | Testar em dev com DB v3 populado antes de deploy |
| Performance no Android com Vue vs vanilla | Baixa | Médio | Benchmark: Vue 3 é ~1.5KB gzip runtime. DOM updates são mais eficientes com VDom |
| Workbox SW gera bugs em Android WebView | Baixa | Alto | Testar em Chrome Android real, não apenas emulador |
| Playwright E2E quebra com SPA + Router | Média | Médio | Atualizar para `data-testid`, usar `waitForNavigation` nas transições |
| Dexie + fake-indexeddb incompatibilidade | Média | Médio | Verificar antes na Fase 4; usar `Dexie.unstable()` se necessário |
| Build size aumenta com Vue + Router + Pinia | Baixa | Baixo | Vue ~33KB + Router ~14KB + Pinia ~6KB = ~53KB gzip. Aceitável para mobile |
| Pinia store vazada entre rotas (estado residual) | Média | Médio | Limpar stores ao resetar formulário. `$reset()` no formStore ao criar novo registro |
| Vue Router `createWebHistory` precisa configuração no Netlify | Alta | Alto | Adicionar redirect no `netlify.toml`: `/* /index.html 200` para SPA fallback |
| Preview de imagens com Object URLs persiste entre rotas | Baixa | Baixo | `onUnmounted` nos componentes de preview revoga URLs automaticamente |

---

## 11. Timeline Sugerida

| Semana | Fase | Entregável |
|--------|------|------------|
| 1 | Fase 1 + Fase 4 | Vite instalado, Dexie funcionando com migração |
| 2 | Fase 2 + Fase 3 (parcial) | App.vue monta com Router + Pinia + 5 stores/composables prontos |
| 3 | Fase 3 (completa) + Fase 5 (parcial) | Todos composables, 3-4 componentes |
| 4 | Fase 5 (completa) + Fase 6 | Todos componentes, PWA com Workbox |
| 5 | Fase 7 | Testes completos (stores, composables, componentes) |
| 6 | Fase 8 + Buffer | Limpeza, documentação, testes finais, deploy |

---

*Este planejamento é um documento vivo — deve ser atualizado conforme decisões são tomadas e a migração avança.*
