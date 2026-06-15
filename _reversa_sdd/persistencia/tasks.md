# Persistência, Tarefas de Implementação

> Gerado pelo Redator em 2026-06-15

---

## Pré-requisitos

- [ ] Módulo `dom.js` com `DOM.tipoOrdem`, `DOM.complementoCorpo`
- [ ] Módulo `iniciais.js` com `getIniciaisData()`
- [ ] Módulo `retornos.js` com `getRetornoData()`
- [ ] Módulo `utils.js` com `toBase64()`, `base64ToBlob()`
- [ ] Módulo `attachments.js` com `renderPreviews()`
- [ ] Módulo `equipment.js` com `renderEquipamentos()`
- [ ] Módulo `ui.js` com `showToast()`

## Tarefas

- [ ] T-01, Implementar `storage.js` — operações puras de localStorage
  - Origem no legado: `scripts/storage.js`
  - Critério de pronto: `getRawUUID()`, `storeUUID()`, `removeUUID()` sem dependências
  - Confiança: 🟢

- [ ] T-02, Implementar `state.js` — objeto de estado global + re-exports
  - Origem no legado: `scripts/state.js`
  - Critério de pronto: `state` com todos os campos, re-exporta funções de persistence.js
  - Confiança: 🟢

- [ ] T-03, Implementar `openDB()` com migração v1→v2→v3
  - Origem no legado: `scripts/db.js:8-38`
  - Critério de pronto: Abre/cria DB `mail-mvp` v3, com stores `records` e `attachments`, deleta `sent_emails` se existir
  - Confiança: 🟢

- [ ] T-04, Implementar helpers genéricos `withTransaction()`, `withStore()`, `readFromStore()`
  - Origem no legado: `scripts/db.js:46-69`
  - Critério de pronto: Abstraem repetição de boilerplate do IndexedDB
  - Confiança: 🟢

- [ ] T-05, Implementar CRUD de records (`saveDraft`, `getRecord`, `getAllRecords`, `deleteRecord`)
  - Origem no legado: `scripts/db.js:73-107`
  - Critério de pronto: Operações básicas de leitura/escrita no store `records`
  - Confiança: 🟢

- [ ] T-06, Implementar `updateRecordStatus(uuid, sentData)`
  - Origem no legado: `scripts/db.js:109-123`
  - Critério de pronto: Busca registro, altera status para "sent", salva sentData
  - Confiança: 🟢

- [ ] T-07, Implementar CRUD de anexos (`saveAttachments`, `getAttachmentsByUuid`, `deleteAttachmentsByUuid`)
  - Origem no legado: `scripts/db.js:133-203`
  - Critério de pronto: Deleta antigos, insere novos no store attachments; busca por uuid index; deleta por uuid
  - Confiança: 🟢

- [ ] T-08, Implementar `_ensureUUID()` com crypto.randomUUID() e fallback
  - Origem no legado: `scripts/persistence.js:94-102`
  - Critério de pronto: Gera UUID, seta em state e localStorage
  - Confiança: 🟢

- [ ] T-09, Implementar `_resolveCreatedAt()` preservando createdAt entre saves
  - Origem no legado: `scripts/persistence.js:104-117`
  - Critério de pronto: Usa state._createdAt se existir, senão busca do DB, senão gera novo
  - Confiança: 🟢

- [ ] T-10, Implementar `saveState()` com guards e dirty tracking
  - Origem no legado: `scripts/persistence.js:40-85`
  - Critério de pronto: Não salva se iniciaisValido false; não salva se sem dados; salva records; salva anexos se dirty; catch QuotaExceededError
  - Confiança: 🟢

- [ ] T-11, Implementar `debouncedSave()` com setTimeout 1000ms
  - Origem no legado: `scripts/persistence.js:87-90`
  - Critério de pronto: Cancela timer anterior, agenda novo saveState
  - Confiança: 🟢

- [ ] T-12, Implementar `_serializeAndSaveAttachments()` com toBase64
  - Origem no legado: `scripts/persistence.js:119-135`
  - Critério de pronto: Serializa File[] para base64, limpa anexos se array vazio
  - Confiança: 🟢

- [ ] T-13, Implementar `applyRecord()` com migração v2→v3
  - Origem no legado: `scripts/restore.js`
  - Critério de pronto: Restaura UUID, iniciais, retorno, equipamentos, anexos (v2 inline ou v3 store), re-renderiza tudo, re-attach listener tipoOrdem
  - Confiança: 🟢

## Tarefas de Teste

- [ ] TT-01, Testar storage.js (get/set/remove no localStorage)
- [ ] TT-02, Testar state.js (valores iniciais corretos)
- [ ] TT-03, Testar openDB() com cria stores
- [ ] TT-04, Testar saveDraft + getRecord (round-trip)
- [ ] TT-05, Testar getAllRecords (lista vazia e com registros)
- [ ] TT-06, Testar deleteRecord (remove registro + anexos)
- [ ] TT-07, Testar updateRecordStatus
- [ ] TT-08, Testar saveAttachments + getAttachmentsByUuid
- [ ] TT-09, Testar _ensureUUID() gera UUID
- [ ] TT-10, Testar saveState guards (iniciaisValido false, sem dados)
- [ ] TT-11, Testar debouncedSave (só salva após 1s)
- [ ] TT-12, Testar dirty tracking (anexos não re-serializados se não dirty)
- [ ] TT-13, Testar applyRecord com v3 (store separado)
- [ ] TT-14, Testar applyRecord com v2 (anexos inline)
- [ ] TT-15, Testar applyRecord com tipo-ordem trigger retorno

## Ordem Sugerida

1. T-01, T-02 (storage + state) — fundação
2. T-03, T-04, T-05 (db.js base) — CRUD records
3. T-07 (db.js attachments) — CRUD anexos
4. T-08, T-09, T-10, T-11, T-12 (persistence.js) — salvamento automático
5. T-13 (restore.js) — restauração
6. T-06 (updateRecordStatus) — atualização de status
7. Testes na ordem correspondente

## Lacunas Pendentes (🔴)

Nenhuma.

---

*Fim das tarefas de persistência.*
