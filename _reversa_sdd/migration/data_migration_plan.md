---
schemaVersion: 1
generatedAt: 2026-06-15T18:10:00-03:00
reversa:
  version: "1.2.43"
  kind: data_migration_plan
  producedBy: designer
  hash: "sha256:placeholder"
---

# Data Migration Plan

> Plano de migração dos dados do legado para o sistema novo.
> Contexto: IndexedDB client-side (browser). Não há banco servidor para migrar.

## Resumo

- **Volume estimado**: Variável por usuário. Tipicamente 50-500 registros por técnico, com 0-12 anexos cada (alguns KB a alguns MB por registro).
- **Janela de migração**: Imediata — o novo schema é compatível com o legado (v3). O corte acontece no refresh da página após o deploy.
- **Estratégia**: Compatibilidade de schema → sem ETL. O IndexedDB existente no browser é reaberto pela nova versão sem migração.

## Contexto crítico

O IndexedDB é **armazenamento local no browser do usuário**. Não há banco central, servidor ou dados compartilhados entre usuários. A "migração" consiste em garantir que:

1. A nova aplicação abre o mesmo database (`mail-mvp`, v3) que a legada
2. O schema é compatível — mesmas stores, mesmos keyPaths, mesmos índices
3. Registros existentes continuam legíveis após o deploy

Como o schema novo é **idêntico ao legado** (mesmo nome de banco, versão 3, stores `records` + `attachments` com mesmos keyPaths e índices), **nenhuma migração de dados é necessária**.

## Mapeamento legado → novo

| Origem (IndexedDB v3 legado) | Destino (IndexedDB v3 novo) | Tipo | Notas |
|---|---|---|---|
| `mail-mvp` database → `records` store | `mail-mvp` database → `records` store | preservado | Mesmo nome, versão, store, keyPath |
| `mail-mvp` database → `attachments` store | `mail-mvp` database → `attachments` store | preservado | Mesmo nome, versão, store, keyPath |
| `records[].iniciais` | `records[].iniciais` | preservado | Schema idêntico |
| `records[].retorno` | `records[].retorno` | preservado | Schema idêntico |
| `records[].tipoOrdem` | `records[].tipoOrdem` | preservado | Schema idêntico |
| `records[].equipamentos[].numero` | `records[].equipamentos[].numero` | preservado | Schema idêntico |
| `localStorage` chave `mail_form_estado` | `localStorage` chave `mail_form_estado` | preservado | Mesmo schema |
| `localStorage` chave `_mail_form_estado` | `localStorage` chave `_mail_form_estado` | preservado | Backup automático |

## Transformações

**Nenhuma transformação é necessária.** O schema v3 do legado é idêntico ao schema v3 do novo. Os dados existentes continuam funcionando sem conversão.

### Transformação T-01: Renomeação de campos para camelCase (apenas código)
- **Aplica em**: Apenas na interface TypeScript — o IndexedDB armazena os mesmos nomes
- **Regra**: No código TypeScript, os campos do legado (snake_case ou kebab-case) são mapeados como camelCase nas interfaces, mas a serialização para IndexedDB mantém os nomes originais para compatibilidade
- **Tratamento de inválidos**: N/A — não há transformação runtime
- **Origem da regra**: `paradigm_decision.md` — TypeScript strict

## Estratégia de ETL

- **Ferramenta**: Nenhuma — não há ETL
- **Fluxo**: O IndexedDB existente é reaberto com `indexedDB.open('mail-mvp', 3)`. Como a versão não mudou, `onupgradeneeded` não é chamado. Os dados existentes permanecem intactos.
- **Idempotência**: A operação de abertura do banco é idempotente por construção (IndexedDB gerencia versões)
- **Throughput esperado**: N/A

## Backfill e delta

- **Backfill**: Não aplicável — dados já estão no IndexedDB do usuário
- **Captura de delta**: Não aplicável — o IndexedDB é o storage primário; não há delta a capturar
- **Reconciliação periódica**: Não aplicável

## Cutover de dados

> Ver também `cutover_plan.md` na raiz da migração. Aqui apenas a parte específica de dados.

- **Janela**: Instantânea — o corte de dados acontece quando o usuário abre a nova versão
- **Sequência de corte**:
  1. Usuário faz refresh na página (após deploy do novo sistema)
  2. Service Worker (vite-plugin-pwa) baixa novo app shell
  3. Vue app inicializa → abre IndexedDB `mail-mvp` v3
  4. Registros existentes são carregados e exibidos na sidebar
  5. Rolback: 1 clique no Netlify reverte ao deploy anterior (IndexedDB não é afetado)
- **Verificação pós-corte**:
  - **Contagens**: Sidebar mostra mesma lista de registros que antes
  - **Dados**: Ao clicar em um registro, o formulário é preenchido com os mesmos dados

## Validação de qualidade

| Métrica | Alvo | Fonte de medição |
|---|---|---|
| Contagem de registros na sidebar | igual ao legado (pré-deploy) | Comparação visual |
| Campos preservados (UC, OS, tipo, etc.) | 100% idêntico | Restaurar registro e comparar |
| Anexos preservados | 100% | Preview de anexo → confirmação visual |
| Status preservado (draft/sent) | 100% | Badge de status na sidebar |
| Timestamps preservados | 100% | createdAt, updatedAt, sentAt |

## Riscos específicos de dados

- **RISK-003 (Perda de dados no IndexedDB)**: Schema idêntico minimiza risco. O maior risco é o usuário limpar dados do navegador (fora do controle do app).
- **RISK-001 (Regressão de funcionalidade)**: Se o novo código abrir o banco com versão incorreta ou schema diferente, os registros podem ficar inacessíveis. Mitigação: testes de abertura de banco com mock IndexedDB.

## Notas

- A migração v2→v3 foi aplicada no legado e não precisa refazer. Registros v2 com anexos inline foram migrados para store separado.
- `onupgradeneeded` no novo código deve tratar gracefulmente o caso de um database v2 existente (backward compatibility), mesmo que improvável.
- localStorage é usado como backup do formulário atual — compatibilidade total.
- Não há plano de migração para dados do backend porque o backend não persiste dados (apenas relay SMTP).
