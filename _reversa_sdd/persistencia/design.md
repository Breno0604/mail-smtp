# Persistência, Design

> Gerado pelo Redator em 2026-06-15

---

## Arquitetura de Persistência

```
┌─────────────────────────────────────────────────────────────────────┐
│  state.js                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ state = { iniciais, equipamentos, attachments,              │   │
│  │           lastTipoOrdem, retorno, currentUUID, composicao,  │   │
│  │           iniciaisValido }                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  Re-exporta: saveState, debouncedSave, markAttachmentsDirty,      │
│              setCurrentUUID, clearCurrentUUID, getCurrentUUID      │
└──────────────────┬──────────────────────────────────────────────────┘
                   │ importa
                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  persistence.js                                                       │
│  - saveState() — salva no IndexedDB (se iniciaisValido e tem dados)  │
│  - debouncedSave() — setTimeout 1000ms → saveState()                 │
│  - markAttachmentsDirty() — flag para re-serializar anexos          │
│  - _ensureUUID() — gera UUID via crypto ou fallback timestamp        │
│  - _resolveCreatedAt() — preserva createdAt entre saves              │
│  - _serializeAndSaveAttachments() — toBase64 + saveAttachments()     │
└──────────────────┬────────────────────────────────────────────────────┘
                   │ importa
                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  db.js (IndexedDB)                                                    │
│  DB: mail-mvp v3                                                      │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐        │
│  │ records (keyPath: uuid) │  │ attachments (keyPath: id)   │        │
│  │ status: "draft"|"sent"  │  │ id: "{uuid}_{index}"       │        │
│  │ createdAt               │  │ uuid: string (index)        │        │
│  │ updatedAt               │  │ index: number               │        │
│  │ iniciais: object        │  │ name: string                │        │
│  │ retorno: object         │  │ type: string                │        │
│  │ tipoOrdem: string       │  │ data: string (base64)       │        │
│  │ equipamentos: array     │  └─────────────────────────────┘        │
│  │ attachmentCount: number │                                         │
│  │ composicao: object      │                                         │
│  │ sentData: object|null   │                                         │
│  └─────────────────────────┘                                         │
└──────────────────┬────────────────────────────────────────────────────┘
                   │ importa
                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  storage.js (localStorage)                                           │
│  Chave: currentUUID → string UUID                                    │
│  Propósito: quebrar ciclo state→persistence→state                    │
│             + restaurar UUID entre sessões                           │
└──────────────────────────────────────────────────────────────────────┘
```

## Ciclo de Salvamento

```
[Usuário modifica campo no formulário]
         │
         ▼
  debouncedSave()  ← chamado via event listeners (input, change)
         │
         ├─ clearTimeout(saveTimer)
         └─ saveTimer = setTimeout(saveState, 1000)
                                  │
                                  ▼
                          saveState()
                                  │
                                  ├─ if (!state.iniciaisValido) return
                                  ├─ if (sem dados) return
                                  │
                                  ├─ _ensureUUID()
                                  │   ├─ if currentUUID existe → ok
                                  │   └─ senão → crypto.randomUUID()
                                  │              ou fallback Date.now()
                                  │
                                  ├─ _resolveCreatedAt()
                                  │   ├─ if _createdAt existe → usa
                                  │   ├─ senão busca do IndexedDB
                                  │   └─ senão → new Date().toISOString()
                                  │
                                  ├─ saveDraft(data) → IndexedDB.records
                                  │   └─ catch QuotaExceededError → toast
                                  │
                                  └─ if (attachmentsDirty)
                                      ├─ attachmentsDirty = false
                                      ├─ _serializeAndSaveAttachments()
                                      │   └─ toBase64 cada file
                                      │      └─ saveAttachments() → IndexedDB.attachments
                                      └─ catch → attachmentsDirty = true
```

## Ciclo de Restauração

```
applyRecord(record)
  │
  ├─ setCurrentUUID(record.uuid)
  ├─ state.iniciaisValido = true
  ├─ state.equipamentos = record.equipamentos || []
  ├─ state.lastTipoOrdem = record.lastTipoOrdem
  ├─ state.iniciais = record.iniciais
  ├─ state.retorno = record.retorno
  │
  ├─ Restaurar anexos:
  │   ├─ se record.attachments (v2) → map + base64ToBlob → File[]
  │   ├─ se record.attachmentCount > 0 → getAttachmentsByUuid → File[]
  │   └─ senão → []
  │
  ├─ markAttachmentsDirty()
  │
  ├─ renderIniciais()
  ├─ re-attach event listener tipoOrdem
  ├─ set tipoOrdem.value e iniciaisFields
  │
  ├─ renderRetorno() + setRetornoData()
  ├─ renderEquipamentos()
  ├─ renderPreviews()
  └─ restore complementoCorpo
```

## Estrutura do Registro (`records` store)

| Campo | Tipo | Exemplo |
|-------|------|---------|
| `uuid` | string (keyPath) | `"a1b2c3d4-..."` |
| `status` | string | `"draft"` ou `"sent"` |
| `createdAt` | string (ISO) | `"2026-06-15T10:00:00.000Z"` |
| `updatedAt` | string (ISO) | `"2026-06-15T12:30:00.000Z"` |
| `iniciais` | object | `{ "tipo-ordem": "LIGACAO NOVA", "data": "2026-06-15", ... }` |
| `retorno` | object | `{ "situacao_corte": "LIGADO", ... }` |
| `tipoOrdem` | string | `"LIGACAO NOVA"` |
| `equipamentos` | array | `[{tipo, categoria, numero}]` |
| `attachmentCount` | number | `3` |
| `lastTipoOrdem` | string | `"LIGACAO NOVA"` |
| `composicao` | object | `{ complementoCorpo: "..." }` |
| `sentData` | object|null | `{ sentAt, to }` (se enviado) |

## Estrutura de Anexo (`attachments` store)

| Campo | Tipo | Exemplo |
|-------|------|---------|
| `id` | string (keyPath) | `"a1b2c3d4-_0"` |
| `uuid` | string (index) | `"a1b2c3d4-..."` |
| `index` | number | `0` |
| `name` | string | `"foto_red.jpg"` |
| `type` | string | `"image/jpeg"` |
| `data` | string | `"base64encoded..."` |

## Migração IndexedDB

```
v1 (original)          v2                    v3 (atual)
┌──────────────┐     ┌──────────────┐      ┌──────────────┐
│ records      │     │ records      │      │ records      │
│ sent_emails  │ →   │ records      │  →   │ attachments  │
└──────────────┘     └──────────────┘      └──────────────┘
                         (remove         (cria store
                       sent_emails)     attachments com
                                        index em uuid)
```

## UUID Management

```
localStorage (currentUUID) ◄──── state.currentUUID
                                      │
                                  saveState()
                                      │
                                  _ensureUUID()
                                      │
                                  crypto.randomUUID()
                                  (fallback: Date.now(36) + Math.random(36))
```

## Ciclo de Importação

```
state.js ──import──▶ persistence.js ──import──▶ db.js
     │                                            │
     └──import──▶ storage.js ◀────import──────────┘
                    (sem imports)
```

`storage.js` não importa nada — quebra o ciclo `state → persistence → state`.

## API Pública

| Módulo | Função | Parâmetros | Retorno | Descrição |
|--------|--------|-----------|---------|-----------|
| `persistence.js` | `saveState()` | `void` | `Promise<void>` | Salva estado no IndexedDB |
| `persistence.js` | `debouncedSave()` | `void` | `void` | Agenda save em 1s |
| `persistence.js` | `markAttachmentsDirty()` | `void` | `void` | Marca anexos para re-serializar |
| `persistence.js` | `getCurrentUUID()` | `void` | `string` | Retorna UUID atual |
| `persistence.js` | `setCurrentUUID(uuid)` | `string` | `void` | Seta UUID + localStorage |
| `persistence.js` | `clearCurrentUUID()` | `void` | `void` | Limpa UUID + localStorage |
| `db.js` | `saveDraft(record)` | object | `Promise<void>` | Persiste registro |
| `db.js` | `getRecord(uuid)` | string | `Promise<object>` | Busca registro |
| `db.js` | `getAllRecords()` | `void` | `Promise<array>` | Lista todos registros |
| `db.js` | `deleteRecord(uuid)` | string | `Promise<void>` | Deleta registro + anexos |
| `db.js` | `updateRecordStatus(uuid, sentData)` | string, object | `Promise<void>` | Marca como sent |
| `db.js` | `saveAttachments(uuid, attachments)` | string, array | `Promise<void>` | Salva anexos (substitui) |
| `db.js` | `getAttachmentsByUuid(uuid)` | string | `Promise<array>` | Busca anexos |
| `db.js` | `deleteAttachmentsByUuid(uuid)` | string | `Promise<void>` | Deleta anexos |
| `storage.js` | `getRawUUID()` | `void` | `string` | Lê UUID do localStorage |
| `storage.js` | `storeUUID(uuid)` | string | `void` | Salva UUID no localStorage |
| `storage.js` | `removeUUID()` | `void` | `void` | Remove UUID do localStorage |
| `restore.js` | `applyRecord(record)` | object | `Promise<void>` | Restaura formulário |

---

*Fim do design de persistência.*
