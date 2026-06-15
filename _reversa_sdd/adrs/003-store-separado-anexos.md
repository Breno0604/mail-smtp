# ADR 003: Store Separado para Anexos no IndexedDB (v2 → v3)

**Data:** 2026-06-10
**Confiança:** 🟢 CONFIRMADO

## Contexto

Originalmente (v1 e v2 do IndexedDB), os anexos eram armazenados como array inline dentro do registro principal (`record.attachments[]`). Isso causava dois problemas:
1. O registro ficava muito grande, lentificando `getAllRecords()` (usado na sidebar)
2. Não era possível fazer CRUD seletivo de anexos — para atualizar um anexo, precisava ler/escrever o registro inteiro

## Decisão

Criar um **segundo store** no IndexedDB (`attachments`) com chave primária composta `{uuid}_{index}` e índice secundário por `uuid`. O registro principal passou a armazenar apenas `attachmentCount` (contagem) para referência.

## Alternativas Consideradas

- **Opção A (escolhida)**: Store separado no IndexedDB
- **Opção B**: Armazenar anexos como arquivos no Cache API do Service Worker — rejeitado por complexidade
- **Opção C**: Manter inline mas com compressão mais agressiva — rejeitado porque não resolve o problema de performance na sidebar

## Consequências

- Positivas:
  - Sidebar rápida — não precisa carregar anexos para listar registros
  - Transação atômica para deleção (record + attachments)
  - Migração transparente: registros v2 com anexos inline são detectados e convertidos no restore
- Negativas:
  - Complexidade adicional no CRUD (2 stores)
  - Dirty tracking necessário para evitar re-serialização desnecessária

## Commits Relacionados

- `7cc080e` feat: store separado para anexos no IndexedDB (Opcao A)
- `restore.js:27-47` migração transparente v2→v3
