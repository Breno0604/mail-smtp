---
schemaVersion: 1
generatedAt: 2026-06-15T17:35:00-03:00
reversa:
  version: "1.2.43"
kind: discard_log
producedBy: curator
hash: "sha256:d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4"
---

# Discard Log

> Registro completo do que foi descartado da migração e por quê.
> Decisão baseada em `paradigm_decision.md` (Opção 1 — Transformacional: Procedural → Component-based reativo).

---

## Itens descartados

### BR-DESCARTAR-001
- **Origem**: `_reversa_sdd/globals/design.md` — DOM Cache (`scripts/dom.js`)
- **Descrição**: Cache manual de elementos DOM via `document.getElementById()` em módulo centralizado `dom.js` (58 LOC)
- **Justificativa**: Vue fornece template refs automáticos (`ref="nome"` no template + `this.$refs.nome` / `ref()` no setup) — não precisa de cache manual
- **Vinculado a paradigma**: sim — mecanismo do paradigma procedural para compensar falta de binding declarativo
  - **Paradigma alvo absorve**: Vue SFC com `ref` binding no template; DOM não é consultado diretamente
- **Reposição no sistema novo**: `ref()` no script setup + `v-model` nos inputs
- **Risco de descartar**: baixo — todo template Vue tem acesso direto aos elementos por ref

### BR-DESCARTAR-002
- **Origem**: `_reversa_sdd/validacao/design.md` — `addBlurValidation()` em cada input
- **Descrição**: Adição manual de event listeners `blur` e `input`/`change` para validação inline
- **Justificativa**: VeeValidate oferece `<Field>` component com validação on-blur automática
- **Vinculado a paradigma**: sim — mecanismo procedural para conectar DOM → validação
- **Reposição no sistema novo**: `<Field name="uc" rules="required|digits" />` do VeeValidate
- **Risco de descartar**: baixo

### BR-DESCARTAR-003
- **Origem**: `_reversa_sdd/formulario/design.md` — `addEventListener()` manual
- **Descrição**: Listeners manuais para `change`, `input`, `click` em elementos do DOM
- **Justificativa**: Vue oferece event bindings no template: `@change`, `@input`, `@click`
- **Vinculado a paradigma**: sim — mecanismo procedural
- **Reposição no sistema novo**: `@change="handleTipoChange"` no template SFC
- **Risco de descartar**: baixo

### BR-DESCARTAR-004
- **Origem**: `_reversa_sdd/formulario/design.md` — `innerHTML` para renderizar campos
- **Descrição**: Construção de HTML via template strings + `innerHTML`/`appendChild`
- **Justificativa**: Vue SFC usa templates declarativos com `v-for`, `v-if`, `v-model`
- **Vinculado a paradigma**: sim — renderização imperativa
- **Reposição no sistema novo**: `<component :is="..." v-for="field in fields" :key="field.nome">`
- **Risco de descartar**: baixo

### BR-DESCARTAR-005
- **Origem**: `_reversa_sdd/formulario/design.md` — `document.getElementById()` para leitura de dados
- **Descrição**: Leitura de valores do DOM via `document.getElementById(field.nome).value`
- **Justificativa**: Vue `v-model` mantém estado do formulário sincronizado com o data reativo
- **Vinculado a paradigma**: sim — leitura imperativa vs. binding bidirecional
- **Reposição no sistema novo**: `v-model="formState.uc"` no template
- **Risco de descartar**: baixo

### BR-DESCARTAR-006
- **Origem**: `_reversa_sdd/validacao/design.md` — Cache `_validatedData` manual
- **Descrição**: Cache de dados validados em `validation.js` para evitar re-leitura do DOM
- **Justificativa**: Com Vue + Pinia, os dados já estão no estado reativo — não precisa de cache paralelo
- **Vinculado a paradigma**: sim — cache por ineficiência do paradigma procedural
- **Reposição no sistema novo**: Zod schema + computed property derivada do store
- **Risco de descartar**: baixo

### BR-DESCARTAR-007
- **Origem**: `_reversa_sdd/validacao/design.md` — Classes `.error` setadas manualmente
- **Descrição**: Adição/remoção de classes CSS `.error` via `classList.add()`/`remove()`
- **Justificativa**: VeeValidate gerencia classes de erro automaticamente (`.is-invalid`, mensagens)
- **Vinculado a paradigma**: sim — feedback visual imperativo vs. declarativo
- **Reposição no sistema novo**: `<ErrorMessage name="uc" />` + classe automática do VeeValidate
- **Risco de descartar**: baixo

### BR-DESCARTAR-008
- **Origem**: `_reversa_sdd/persistencia/design.md` — `debouncedSave()` manual
- **Descrição**: Função de save com debounce implementada manualmente com `setTimeout`/`clearTimeout`
- **Justificativa**: Pinia `$subscribe` + `debounce` do lodash ou VueUse `watchDebounced`
- **Vinculado a paradigma**: parcial — conceito de debounce ainda existe, mas implementação é nativa
- **Reposição no sistema novo**: `watchDebounced(formState, saveState, 300)` do VueUse
- **Risco de descartar**: baixo

### BR-DESCARTAR-009
- **Origem**: `_reversa_sdd/persistencia/design.md` — `saveState()` guard manual
- **Descrição**: Checagem manual de `state.iniciaisValido` + estado vazio antes de salvar
- **Justificativa**: Pinia plugin de persistência pode ter guard conditionais nativos
- **Vinculado a paradigma**: parcial — guard continua existindo, mas implementado via Pinia
- **Reposição no sistema novo**: Pinia `$subscribe` com condicional + `localStorage` plugin
- **Risco de descartar**: baixo

### BR-DESCARTAR-010
- **Origem**: `_reversa_sdd/validacao/design.md` — `_resetValidationCache()`
- **Descrição**: Função para limpar cache de validação entre execuções de teste
- **Justificativa**: Zod schema não tem cache — cada validação é fresh. `_resetValidationCache()` não é necessário
- **Vinculado a paradigma**: sim — artefato do cache procedural
- **Reposição no sistema novo**: nenhuma — Zod não precisa de reset de cache
- **Risco de descartar**: baixo

### BR-DESCARTAR-011
- **Origem**: `_reversa_sdd/validacao/requirements.md` § RN11
- **Descrição**: Seção 5 (Revisão) sempre retorna `true` — sem campos para validar
- **Justificativa**: Template de revisão é apenas exibição. No Vue, componente de revisão não tem validação
- **Vinculado a paradigma**: não — é uma particularidade do legado, mas o conceito se mantém
- **Reposição no sistema novo**: Componente `SecaoRevisao.vue` sem validação — apenas exibe dados
- **Risco de descartar**: baixo

### BR-DESCARTAR-012
- **Origem**: `_reversa_sdd/anexos/design.md` — `markAttachmentsDirty()`
- **Descrição**: Flag manual de dirty tracking para attachments no state
- **Justificativa**: Pinia store com array reativo de attachments detecta mudanças automaticamente
- **Vinculado a paradigma**: sim — dirty tracking manual vs. reatividade automática
- **Reposição no sistema novo**: Pinia `$subscribe` ou `watch` no array de attachments
- **Risco de descartar**: baixo

### BR-DESCARTAR-013
- **Origem**: `_reversa_sdd/anexos/design.md` — Object URLs revogadas manualmente
- **Descrição**: `URL.revokeObjectURL()` chamado manualmente para evitar memory leak
- **Justificativa**: Vue `onUnmounted()` hook + `watch` pode limpar URLs automaticamente no ciclo de vida do componente
- **Vinculado a paradigma**: sim — gerenciamento manual de recursos vs. lifecycle hooks
- **Reposição no sistema novo**: `onUnmounted(() => urls.forEach(URL.revokeObjectURL))` no composable
- **Risco de descartar**: baixo

### BR-DESCARTAR-014
- **Origem**: `_reversa_sdd/ferramentas/design.md` — CACHE_NAME manual no sw.js
- **Descrição**: Bump manual de constante `CACHE_NAME` em mudanças de static assets
- **Justificativa**: vite-plugin-pwa + Workbox gerencia cache versionamento automaticamente
- **Vinculado a paradigma**: parcial — conceito de cache persiste, mas gestão manual some
- **Reposição no sistema novo**: vite-plugin-pwa config com `registerSW()` auto-versionado
- **Risco de descartar**: baixo

### BR-DESCARTAR-015
- **Origem**: `_reversa_sdd/formulario/design.md` — DOM.tipoOrdem cacheado manualmente (exceção)
- **Descrição**: `DOM.tipoOrdem = input` após `renderIniciais()` — exceção à regra de cache do dom.js
- **Justificativa**: Vue template ref `ref="tipoOrdem"` substitui — sem necessidade de cache manual pós-render
- **Vinculado a paradigma**: sim — exceção que só existe por causa do DOM cache manual
- **Reposição no sistema novo**: `const tipoOrdem = ref<HTMLSelectElement>()` no script setup
- **Risco de descartar**: baixo

### BR-DESCARTAR-016
- **Origem**: `_reversa_sdd/formulario/design.md` — `data-required` atributo manual
- **Descrição**: Atributo `data-required` adicionado manualmente a cada campo obrigatório para validação
- **Justificativa**: VeeValidate prop `rules="required"` substitui — sem necessidade de data attributes
- **Vinculado a paradigma**: sim — marcador manual vs. schema declarativo
- **Reposição no sistema novo**: Zod `.required()` + VeeValidate `rules="required"`
- **Risco de descartar**: baixo

---

## Itens descartados por mudança de paradigma (subseção dedicada)

| ID | Origem | Paradigma legado | Substituto no paradigma alvo |
|---|---|---|---|
| BR-DESCARTAR-001 | `dom.js` (58 LOC cache DOM) | Procedural — getElementById manual | Vue template refs |
| BR-DESCARTAR-002 | `addBlurValidation()` | Procedural — listener manual | VeeValidate field component |
| BR-DESCARTAR-003 | `addEventListener()` | Procedural — evento manual | `@event` no template |
| BR-DESCARTAR-004 | `innerHTML` | Procedural — template string | SFC template + v-for/v-if |
| BR-DESCARTAR-005 | `getElementById().value` | Procedural — leitura manual | `v-model` bidirecional |
| BR-DESCARTAR-006 | `_validatedData` cache | Procedural — cache manual | Computed reactivo |
| BR-DESCARTAR-007 | `.error` class manual | Procedural — CSS imperativo | VeeValidate classes automáticas |
| BR-DESCARTAR-012 | `markAttachmentsDirty()` | Procedural — flag manual | Pinia reatividade |
| BR-DESCARTAR-013 | `revokeObjectURL()` manual | Procedural — cleanup manual | `onUnmounted()` |
| BR-DESCARTAR-015 | DOM.tipoOrdem exceção | Procedural — cache manual | Template ref |
| BR-DESCARTAR-016 | `data-required` manual | Procedural — marcador manual | Zod schema |

## Notas

- Nenhum item descartado representa perda de funcionalidade para o usuário final. Todos são **mecanismos internos** que o paradigma procedural exigia e o paradigma component-based reativo absorve por construção.
- O total de 16 itens descartados representa uma economia estimada de **~150 LOC** que simplesmente desaparecem (dom.js, cache de validação, listeners manuais, dirty tracking manual).
- Os itens BR-DESCARTAR-008, BR-DESCARTAR-009 e BR-DESCARTAR-014 são descartes parciais: a função de negócio continua existindo (debounce, guard de save, cache versionamento), mas a implementação manual é substituída por bibliotecas do ecossistema Vue.
