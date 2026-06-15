---
schemaVersion: 1
generatedAt: 2026-06-15T18:30:00-03:00
reversa:
  version: "1.2.43"
  kind: parity_specs
  producedBy: inspector
  hash: "sha256:placeholder"
---

# Parity Specs

> Estratégia de validação de equivalência comportamental entre legado e sistema novo, adaptada ao paradigma escolhido em `paradigm_decision.md` (Opção 1 — Component-based reativo).

## Estratégia geral
- **Modos de validação aplicáveis**:
  - [ ] Shadow mode (espelhamento de tráfego com comparação assíncrona)
  - [x] Characterization tests (suíte derivada do comportamento atual do legado)
  - [x] Contract tests (interfaces externas — Netlify Function SMTP)
  - [ ] Data parity (snapshots e checksums)
  - [x] Contract test de tela (modernizado — hierarquia de componentes, eventos, estados)

### Justificativa da escolha
- **Characterization tests**: O legado tem 334 testes existentes — derivar cenários Gherkin que capturem o comportamento observável de cada fluxo crítico.
- **Contract tests**: A interface com a Netlify Function (`POST /api/send` com JSON) precisa ser validada como contrato — entrada/saída da função serverless.
- **Contract test de tela**: Modo modernizado exige validação semântica (hierarquia de componentes, eventos, estados), não comparação visual pixel-a-pixel.

## Critérios de "paridade aceita"
- **Métrica primária**: divergência funcional < 1% em 7 dias consecutivos de uso (sistema interno baixa criticidade)
- **Critério de bloqueio**: divergência em campos obrigatórios do contrato SMTP (subject, text) bloqueia cutover

## Cobertura adaptada ao paradigma

### Mudança procedural → Component-based reativo (Vue 3 + Pinia)

| Dimensão | Critério |
|---|---|
| **Invariantes em aggregates** | Record.uuid único, status ∈ {draft, sent}, timestamps monotônicos, equipamentos sem número duplicado |
| **Validação em construtores** | Zod schemas nos composables disparam mesmas regras que validation.js do legado |
| **Comportamento de estado** | Pinia stores propagam mutações de forma equivalente a state.js (mesmo estado final para mesma sequência de ações) |
| **Composição de email** | `composeEmail()` produz mesmas strings subject + text que o legado para mesmos dados de entrada |
| **Campos condicionais** | `useConditionalFields()` avalia visibilidade equivalentemente a `updateConditionalFields()` do legado |

## Validação de telas (modo modernizado)

Para cada tela em `target_screens.md`, a implementação deve respeitar:

1. **Hierarquia de componentes**: a árvore de componentes Vue (pai→filho) deve corresponder à especificação YAML
2. **Eventos declarados**: `@change`, `@submit`, `@click` mapeiam para as ações especificadas
3. **Conteúdo textual**: labels, placeholders e mensagens preservados literalmente (zero diff ignorando espaços)
4. **Estados**: idle, loading, error, success quando especificados — cada estado exibe o conteúdo declarado

Não há comparação byte-a-byte. A validação é semântica (contrato).

## Tipos de teste a aplicar
- **Funcionais**: Vitest + @testing-library/vue — testar fluxos completos (preencher form, enviar, restaurar)
- **Contrato**: Teste isolado de `composeEmail()` (função pura sem SMTP) + teste de `netlify/functions/send.ts` com nodemailer mock
- **Carga / performance**: Não aplicável (sistema single-user, 1.889 LOC)
- **Resiliência**: Captura de erro de rede ao enviar email (toast de erro + registro permanece como draft)

## Reuso de characterization_specs do time de descoberta
- **Origem**: `_reversa_sdd/characterization_specs/` — não existe (nunca foi gerado)
- **Adaptações necessárias**: A partir de `_reversa_sdd/code-analysis.md` + `target_business_rules.md` + 334 testes legados, derivar 8 fluxos críticos como `.feature` files

## Fluxos cobertos

| ID | Fluxo | Origem | Tag |
|---|---|---|---|
| PT-001 | Preenchimento e validação do formulário | BR-MIGRAR-001 a BR-MIGRAR-010, BR-MIGRAR-026 a BR-MIGRAR-036 | `@paridade` `@invariante` `@critico` |
| PT-002 | Envio de email | BR-MIGRAR-020 a BR-MIGRAR-025, BR-HUMANA-002 | `@paridade` `@contrato` `@critico` |
| PT-003 | Persistência e restauração (IndexedDB) | BR-MIGRAR-037 a BR-MIGRAR-042, BR-MIGRAR-058 a BR-MIGRAR-060 | `@paridade` `@invariante` |
| PT-004 | Campos condicionais de retorno | BR-MIGRAR-001 a BR-MIGRAR-003, BR-MIGRAR-009 | `@paridade` `@invariante` |
| PT-005 | Anexos com compressão | BR-MIGRAR-011 a BR-MIGRAR-016 | `@paridade` |
| PT-006 | CRUD de equipamentos | BR-MIGRAR-017 a BR-MIGRAR-019 | `@paridade` `@invariante` |
| PT-007 | Sidebar (listar, filtrar, duplicar, excluir, restaurar) | BR-MIGRAR-043 a BR-MIGRAR-048 | `@paridade` |
| PT-008 | Mudança de tipo de ordem | BR-MIGRAR-001, BR-MIGRAR-009, BR-MIGRAR-014 (RNI14) | `@paridade` `@invariante` |

## Saídas
- `parity_tests/PT-001-formulario.feature`
- `parity_tests/PT-002-email.feature`
- `parity_tests/PT-003-persistencia.feature`
- `parity_tests/PT-004-condicionais.feature`
- `parity_tests/PT-005-anexos.feature`
- `parity_tests/PT-006-equipamentos.feature`
- `parity_tests/PT-007-sidebar.feature`
- `parity_tests/PT-008-tipo-ordem.feature`

## Exceções

> Deviations aprovadas do `screen_deviation_log.md` que afetam a paridade.

Nenhuma deviation registrada. Modo modernizado sem divergências.

## Notas
- O contrato SMTP (Netlify Function) permanece idêntico ao legado — testes de contrato devem verificar que o payload JSON enviado pelo frontend novo é compatível com o backend legado.
- A função `composeEmail()` extraída como pura deve ser testada isoladamente (BR-HUMANA-002, Opção C).
- 334 testes existentes no legado servem como base para os cenários Gherkin — não precisam ser copiados, apenas referenciados como comportamento esperado.
