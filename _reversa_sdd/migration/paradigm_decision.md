---
schemaVersion: 1
generatedAt: 2026-06-15T17:30:00-03:00
reversa:
  version: "1.2.43"
kind: paradigm_decision
producedBy: paradigm_advisor
hash: "sha256:7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7"
---

# Paradigm Decision

> Decisão consciente sobre como tratar a mudança de paradigma entre o legado e a stack alvo.
> **Leitura obrigatória primeiro** para qualquer agente posterior e para o agente de codificação.

## Paradigma do legado detectado

- **Paradigma principal**: Procedural
- **Confiança**: 🟢 CONFIRMADO
- **Evidências**:
  - Funções top-level exportadas em 23 módulos, sem classes ou herança (`_reversa_sdd/code-analysis.md` — seção Estrutura)
  - Estado global como objeto literal mutável em `state.js` (15 LOC) (`_reversa_sdd/state-machines.md` — Estado global)
  - Manipulação direta do DOM via `document.getElementById` e `innerHTML` (`_reversa_sdd/architecture.md` — seção DOM Cache)
  - 0 ciclos de dependência — grafo acíclico direcionado de funções (`_reversa_sdd/dependencies.md`)
  - Validação procedural percorre DOM e gerencia cache manualmente (`_reversa_sdd/flowcharts/form.md`)
- **Variações observadas** (híbrido): Nenhuma — 100% procedural puro

## Stack alvo declarada

- **Linguagem**: TypeScript strict
- **Framework**: Vue 3 (Composition API) + Vite + Pinia + Vue Router
- **CSS**: Tailwind CSS via PostCSS
- **Testes**: Vitest + @testing-library/vue
- **Persistência**: IndexedDB (mantido, sem Supabase)
- **Backend**: Netlify Functions (Node.js + nodemailer, mantido)
- **PWA**: vite-plugin-pwa + Workbox
- **Deploy**: Netlify (mantido)

## Paradigma natural inferido

- **Paradigma**: Component-based com Reatividade Declarativa
- **Justificativa**: Vue 3 + Composition API é construído sobre reatividade declarativa — componentes com escopo próprio, templates reativos, composição via composables. Pinia estende o padrão com stores reativas. TypeScript adiciona segurança de tipos sem mudar o paradigma.
- **Alternativas viáveis**: Procedural com Vue (possível mas antinatural — perde os benefícios da reatividade e dos templates SFC)

## Gap identificado

- **Severidade**: Médio
- **Implicações concretas** (com exemplos do legado):

  1. **Manipulação DOM → Templates declarativos**
     - Legado: `renderIniciais()` em `iniciais.js` constrói 12 campos com `innerHTML` + `document.createElement` + `appendChild`
     - Alvo: `<FormIniciais.vue>` com `v-for="field in iniciaisFields"`, `v-model`, `@change`
     - Impacto: 58 LOC de `dom.js` desaparecem; cache manual de elementos some

  2. **Estado global mutável → Stores reativas (Pinia)**
     - Legado: `state.js` exporta objeto mutável; qualquer módulo altera `state.iniciais`, `state.retorno` diretamente
     - Alvo: Pinia store com `state`, `getters`, `actions` — mutações explícitas e rastreáveis
     - Impacto: risco de mutação silenciosa eliminado; migração de schema do IndexedDB encapsulada

  3. **Validação procedural → Schemas declarativos**
     - Legado: `validation.js` (251 LOC, complexidade 8.4) percorre DOM com `getElementById`, seta classes `.error`, gerencia `_validatedData` cache
     - Alvo: Zod schemas + VeeValidate — regras declarativas, mensagens automáticas, tipadas
     - Impacto: lógica de negócio separada da camada de UI; testável sem DOM

  4. **Event listeners manuais → Event bindings do framework**
     - Legado: `addEventListener('change', handleTipoChange)` + `addBlurValidation()` para cada input
     - Alvo: `@change="handleTipoChange"` no template; VeeValidate gerencia blur automaticamente
     - Impacto: sem vazamento de listeners; sem preocupação com re-attach após render

## Opções apresentadas ao usuário

1. **Adotar paradigma natural da stack** (transformacional) ✅ **ESCOLHIDA**
   - Consequências: Código 54% menor; elimina dívida técnica de DOM cache + validação procedural; ecossistema Vue usado por completo; usuário não nota diferença
2. **Forçar paradigma procedural** (conservador)
   - Consequências: "Vue escrito por quem odeia Vue"; dívida técnica mantida; novos campos e páginas continuam custando caro
3. **Híbrido** (equilibrado)
   - Consequências: Componentes Vue para UI + regras de validação como funções TypeScript puras em composable

## Decisão do usuário

- **Escolha**: 1 — Adotar paradigma natural da stack (transformacional)
- **Justificativa do usuário**: Quer adicionar novas páginas e funcionalidades no futuro; a stack procedural atual limita escalabilidade. Concorda que forçar procedural na stack alvo manteria a dívida técnica.
- **Decidido em**: 2026-06-15T17:30:00-03:00

## Apetite derivado

- `derived_appetite`: **transformational**

## Implicações pendentes para próximos agentes

| Agente | Implicação | Como honrar |
|---|---|---|
| **Curator** | Regras de validação viram Zod schemas | Incluir no `target_business_rules.md` que as 51 regras de `validation.js` devem ser portadas como schemas TypeScript + Zod, não como funções procedurais |
| **Strategist** | Risco: adotar paradigma novo pode aumentar tempo de aprendizado | Considerar na estratégia: fases iniciais focadas em scaffold + componentes isolados antes de tocar na lógica complexa |
| **Designer** | Estado global → Pinia stores; DOM cache desaparece | Topologia alvo: `dom.js` não existe mais; componente `FormIniciais` + store `useFormStore` substituem `state.js` + `dom.js` + `iniciais.js` |
| **Inspector** | Validação muda de procedural para declarativa | Testes de paridade devem verificar que as mesmas 51 regras disparam com os mesmos inputs — independente da implementação ser Zod vs manual |

## Notas

- A decisão transformacional se alinha com todos os 3 objetivos do usuário: adicionar novas páginas, manter o usuário sem notar diferença, e eliminar dívida técnica
- validation.js (8.4 de complexidade ciclomática) é o módulo que mais se beneficia da migração e deve ser tratado como prioridade na portabilidade das regras
- A recomendação concreta do Paradigm Advisor: usar Zod para schemas + VeeValidate para UI de validação — a lógica pura de validação deve viver em funções TypeScript puras dentro de um composable `useValidacao`
