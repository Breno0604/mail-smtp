# Fluxograma — Persistence: Save State

```mermaid
flowchart TD
    A[saveState] --> B{iniciaisValido?}
    B -->|não| C[return]
    B -->|sim| D[getIniciaisData]
    D --> E{Tem dados mínimos?}
    E -->|não| F[return]
    E -->|sim| G[_ensureUUID]
    G --> H[_resolveCreatedAt]
    H --> I[Montar objeto data]
    I --> J[saveDraft data → IndexedDB records]
    J --> K{attachmentsDirty?}
    K -->|não| L[fim]
    K -->|sim| M[attachmentsDirty = false]
    M --> N[_serializeAndSaveAttachments]
    N --> L
```

## Fluxo — applyRecord (Restore)

```mermaid
flowchart TD
    A[applyRecord record] --> B[setCurrentUUID]
    B --> C[state.iniciaisValido = true]
    C --> D[Restaurar equipamentos, lastTipoOrdem, iniciais, retorno]
    D --> E{record.attachments array?}
    E -->|sim v2| F[Migrar inline → File objects]
    E -->|não| G{attachmentCount > 0?}
    G -->|sim v3| H[getAttachmentsByUuid → File objects]
    G -->|não| I[attachments = []]
    F --> J[markAttachmentsDirty]
    H --> J
    I --> J
    J --> K[renderIniciais]
    K --> L[Re-attach tipoOrdem listener]
    L --> M[Restaurar campos iniciais]
    M --> N{record.tipoOrdem?}
    N -->|sim| O[renderRetorno + setRetornoData]
    N -->|não| P[pula]
    O --> Q[renderEquipamentos]
    P --> Q
    Q --> R[renderPreviews]
    R --> S[Restaurar complementoCorpo]
```

## Fluxo — deleteRecord (Atômico)

```mermaid
flowchart TD
    A[deleteRecord uuid] --> B[Transação: records + attachments]
    B --> C[recordStore.delete uuid]
    C --> D[index.openCursor uuid]
    D --> E{Cursor?}
    E -->|sim| F[cursor.delete + continue]
    F --> E
    E -->|não| G[Transação completa]
```
