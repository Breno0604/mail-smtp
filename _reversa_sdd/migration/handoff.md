---
schemaVersion: 1
generatedAt: 2026-06-15T18:35:00-03:00
reversa:
  version: "1.2.43"
  kind: handoff
  producedBy: reversa-migrate
  pipelineStatus: completed
  hash: "sha256:placeholder"
---

# Handoff — Migração mail-mvp para Vue 3 + Vite + TypeScript

> Pipeline de migração concluído em 2026-06-15. Todos os 6 agentes executados com sucesso.
> Sistema legado: mail-mvp (vanilla HTML/CSS/JS, 1.889 LOC, ~334 testes)
> Sistema alvo: Vue 3 + Vite + TypeScript strict + Pinia + Vue Router + Tailwind CSS + Vitest + @testing-library/vue + vite-plugin-pwa

## Resumo da Migração

| Agente | Status | Artefatos |
|---|---|---|
| Paradigm Advisor | ✅ Completo | `paradigm_decision.md` — Opção 1 Transformacional (Component-based reativo) |
| Curator | ✅ Completo | `target_business_rules.md` (72 MIGRAR, 16 DESCARTAR, 2 RESOLVIDAS), `discard_log.md` |
| Strategist | ✅ Completo | `migration_strategy.md` (Big Bang), `risk_register.md` (6 riscos), `cutover_plan.md` |
| Designer | ✅ Completo | `topology_decision.md` (FSD), `target_architecture.md`, `target_domain_model.md`, `target_data_model.md`, `data_migration_plan.md` |
| Screen Translator | ✅ Completo | `screen_modernization_decision.md` (modernizado), `target_screens.md` (9 telas), `screen_deviation_log.md` (0 deviations) |
| Inspector | ✅ Completo | `parity_specs.md`, 8 `.feature` files em `parity_tests/` |

## Decisões Acumuladas

### Paradigma
- **Opção 1 — Transformacional**: código 100% novo na stack alvo (Vue 3 + Composition API + TypeScript)
- Paradigma alvo: Component-based com Reatividade Declarativa
- Nada híbrido: todos os 23 módulos frontend + função backend são migrados

### Autenticação
- **BR-HUMANA-001: Opção A** — Manter single-user sem auth (igual ao legado)

### Testes Backend
- **BR-HUMANA-002: Opção C** — Extrair `composeEmail()` como função pura TypeScript testável

### Estratégia
- **Big Bang** — desenvolver tudo na nova stack, substituir deploy de uma vez (+ Parallel Run opcional via preview Netlify)
- Rollback: 1 clique no Netlify

### Topologia
- **Feature-Sliced Design (FSD) simplificado**: `app/`, `pages/`, `features/` (6), `entities/` (3), `shared/`

### Telas
- **Modernizado**: cada seção como componente Vue independente, scoped CSS, composables para lógica

## Stack Alvo Detalhada

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Vue 3 (Composition API) | ~3.5.x |
| Build | Vite | ~6.x |
| Linguagem | TypeScript strict | ~5.7 |
| Estado | Pinia | ~3.x |
| Roteamento | Vue Router | ~4.x |
| CSS | Tailwind CSS (PostCSS) | ~3.4.x |
| Testes unitários | Vitest + @testing-library/vue | ~3.x |
| PWA | vite-plugin-pwa (Workbox) | ~0.x |
| Backend | Netlify Functions (Node.js + nodemailer) | — |
| Banco | IndexedDB v3 (client-side) | — |

## Estrutura de Pastas Alvo

```
src/
├── app/
│   ├── App.vue
│   ├── main.ts
│   ├── router/index.ts
│   └── providers/sw-update.ts
├── pages/
│   └── FormPage.vue
├── features/
│   ├── inicio/          # 12 campos fixos
│   ├── retorno/         # Campos dinâmicos por tipo de ordem
│   ├── equipamentos/    # CRUD equipamentos
│   ├── anexos/          # Upload + compressão
│   ├── email/           # Composição + envio
│   └── sidebar/         # Lista de registros
├── entities/
│   ├── record/          # Interface Record + IndexedDB
│   ├── attachment/      # Interface Attachment + IndexedDB
│   └── equipment/       # Interface Equipment
├── shared/
│   ├── ui/              # Toast, Modal, ErrorBar
│   ├── lib/             # db.ts, storage.ts, compress.ts
│   ├── utils/           # formatDate, geoLocation, base64
│   └── types/           # TipoOrdem, FieldDefinition, etc.
└── netlify/functions/
    └── send.ts          # Relay SMTP (nodemailer)
```

## Regras de Negócio Migradas

- **72 regras MIGRAR** → implementar conforme `target_business_rules.md`
- **16 regras DESCARTAR** → mecanismos substituídos pelo Vue/Zod/VeeValidate/Pinia (ver `discard_log.md`)
- **0 regras com ambiguidade** — todas resolvidas

## Riscos Críticos

| ID | Risco | Severidade | Mitigação |
|---|---|---|---|
| RISK-001 | Regressão de funcionalidade | 🔴 Alta | 8 parity tests `.feature` + suíte Vitest |
| RISK-002 | Curva de aprendizado do stack | 🟡 Média | Scaffold inicial + componentes isolados primeiro |
| RISK-003 | Perda de dados no IndexedDB | 🔴 Alta | Schema compatível v3; testes de abertura de banco |
| RISK-004 | Overhead de estrutura FSD | 🟡 Média | ~1.889 LOC — estrutura gerenciável |
| RISK-005 | Complexidade da compressão de imagens | 🟢 Baixa | Composable `useImageCompression()` herdado do legado |
| RISK-006 | Envio de email quebra no backend | 🔴 Alta | `composeEmail()` testável; nodemailer mock |

## Plano de Cutover (Resumo)

1. Desenvolver toda a aplicação Vue
2. Rodar suíte de testes completa
3. Verificar parity tests manualmente no browser
4. Build + commit + push para Netlify
5. Rollback: 1 clique (deploy anterior) — 10 minutos
6. Se rollback, restaurar IndexedDB v3 (compatível)
7. Go/no-go: testes passando + parity checks ok

## Guia de Prioridade para Codificação

### Fase 1 — Scaffold (dia 1-2)
1. `npm create vite@latest` + Vue + TypeScript
2. Configurar Tailwind CSS, Vue Router, Pinia
3. Criar estrutura FSD de pastas
4. Configurar vitest-plugin-pwa
5. Portar `tailwind.config.js`, `postcss.config.js`, `netlify.toml`, `package.json`

### Fase 2 — Core (dia 3-7)
6. Implementar `entities/record/` + `entities/attachment/` + `shared/lib/db.ts` (IndexedDB)
7. Implementar `shared/utils/` (formatDate, geoLocation, base64)
8. Implementar `shared/ui/` (Toast, Modal, ErrorBar como componentes Vue)
9. Implementar `features/inicio/` (componentes + store + validação Zod)
10. Implementar `features/retorno/` (componentes + condicionais + store)

### Fase 3 — Features (dia 8-12)
11. Implementar `features/equipamentos/` (CRUD + validação)
12. Implementar `features/anexos/` (upload + compressão + store)
13. Implementar `features/email/` (composição + envio)
14. Implementar `features/sidebar/` (lista + filtros + CRUD)

### Fase 4 — App Shell (dia 13-14)
15. Implementar `app/main.ts` + `app/App.vue` + `app/router/`
16. Implementar `pages/FormPage.vue` com layout de 5 seções
17. Implementar `app/providers/sw-update.ts`

### Fase 5 — Backend (dia 15-16)
18. Portar `netlify/functions/send.js` → `send.ts` com TypeScript
19. Extrair `composeEmail()` como função pura testável
20. Configurar variáveis de ambiente no Netlify

### Fase 6 — Testes (dia 17-19)
21. Escrever testes Vitest para cada feature
22. Implementar parity tests Gherkin como testes reais
23. Verificar contrato SMTP com nodemailer mock

### Fase 7 — Deploy (dia 20-21)
24. Build + testes finais
25. Deploy via `git push`
26. Verificação pós-deploy
27. Go/no-go

## Ambiguity Log

**Nenhuma ambiguidade pendente.** Todas as questões foram resolvidas durante o pipeline:

| # | Questão | Agente | Resolução |
|---|---|---|---|
| 1 | Autenticação no SW | Curator (BR-HUMANA-001) | Manter single-user sem auth (Opção A) |
| 2 | Testes backend sem SMTP | Curator (BR-HUMANA-002) | Extrair composeEmail() como função pura (Opção C) |

## Arquivos Gerados no Pipeline

```
_reversa_sdd/migration/
├── migration_brief.md
├── paradigm_decision.md
├── target_business_rules.md
├── discard_log.md
├── migration_strategy.md
├── risk_register.md
├── cutover_plan.md
├── topology_decision.md
├── target_architecture.md
├── target_domain_model.md
├── target_data_model.md
├── data_migration_plan.md
├── screen_modernization_decision.md
├── target_screens.md
├── screen_deviation_log.md
├── parity_specs.md
├── handoff.md
├── parity_tests/
│   ├── PT-001-formulario.feature
│   ├── PT-002-email.feature
│   ├── PT-003-persistencia.feature
│   ├── PT-004-condicionais.feature
│   ├── PT-005-anexos.feature
│   ├── PT-006-equipamentos.feature
│   ├── PT-007-sidebar.feature
│   └── PT-008-tipo-ordem.feature
├── .state.json

_reversa_sdd/
├── design-system/tokens-derived.md
├── screens/inventory.json
├── screens/golden/manifest.yaml
```

## Notas Finais

- O IndexedDB v3 tem schema **100% compatível** com o legado — registros existentes não precisam de migração.
- A função `composeEmail()` extraída como pura é a prioridade de teste (BR-HUMANA-002).
- O Service Worker passa de manual (sw.js) para automatizado (vite-plugin-pwa + Workbox).
- A compressão de imagens continua usando canvas API — portar como `useImageCompression()` composable.
- Todos os labels, placeholders e mensagens foram preservados literalmente (zero revisão linguística).
- O prazo estimado é **21 dias** (Big Bang). Rollback em 10 minutos.
- Próximo passo: iniciar a codificação seguindo o guia de prioridade acima.
