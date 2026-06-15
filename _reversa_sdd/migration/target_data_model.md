---
schemaVersion: 1
generatedAt: 2026-06-15T18:10:00-03:00
reversa:
  version: "1.2.43"
  kind: target_data_model
  producedBy: designer
  hash: "sha256:placeholder"
---

# Target Data Model

> Modelo de dados do sistema novo — schema IndexedDB v3, stores, relacionamentos e restrições.
> Banco: IndexedDB (client-side, no browser). Nenhum banco servidor.

## Visão geral

O sistema mantém o **IndexedDB v3** como storage primário, com dois object stores (`records` e `attachments`), idêntico ao legado. Não há banco servidor — o único backend é a Netlify Function de relay SMTP. O schema do IndexedDB é compatível com o legado (v3), garantindo que registros existentes no browser do usuário continuem funcionando sem migração.

## Entidades de dados

| Entidade | Object store | Aggregate dono | PK | Bounded context |
|---|---|---|---|---|
| Record | `records` | AGG-Record | `uuid` (string) | entities/record/ |
| Attachment | `attachments` | AGG-Attachment | `id` (string: `{uuid}_{index}`) | entities/attachment/ |

## Schema (DDL IndexedDB)

### Database: `mail-mvp` (v3)

```js
// Abertura do banco — compatível com v3 do legado
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mail-mvp', 3);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store records (mesmo schema do legado)
      if (!db.objectStoreNames.contains('records')) {
        const store = db.createObjectStore('records', { keyPath: 'uuid' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('tipoOrdem', 'tipoOrdem', { unique: false });
      }

      // Store attachments (separado desde v3)
      if (!db.objectStoreNames.contains('attachments')) {
        const store = db.createObjectStore('attachments', { keyPath: 'id' });
        store.createIndex('uuid', 'uuid', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
```

### Record schema (object store `records`)

```typescript
interface Record {
  uuid: string;               // PK — crypto.randomUUID()
  status: 'draft' | 'sent';   // Indexed
  createdAt: string;           // ISO 8601
  updatedAt: string;           // ISO 8601, Indexed
  iniciais: {
    uc: string;
    os: string;
    tipoOrdem: string;
    parceiroLider: string;
    municipio: string;
    placa: string;
    data: string;              // YYYY-MM-DD
    horaInicio: string;        // HH:mm
    horaFim: string;           // HH:mm
    coordenadas: string;       // "lat, lon" ou "Não disponível"
    notificado: 'SIM' | 'NÃO';
    complemento: string;
  };
  retorno: Record<string, string>;  // Chave-valor dinâmico
  tipoOrdem: string;           // Indexed
  lastTipoOrdem: string;
  equipamentos: Array<{
    status: 'Instalado' | 'Retirado';
    categoria: 'Medidor' | 'Display' | 'Conjunto' | 'TC' | 'TP';
    numero: string;
  }>;
  composicao: {
    complementoCorpo: string;
  };
  attachmentCount: number;
  sentData: {
    sentAt: string;            // ISO 8601
    response: string;
  } | null;
}
```

### Attachment schema (object store `attachments`)

```typescript
interface Attachment {
  id: string;                  // PK — "{uuid}_{index}"
  uuid: string;                // FK → records.uuid, Indexed
  index: number;               // Ordem do anexo (0-based)
  name: string;                // Nome original do arquivo
  type: string;                // MIME type
  data: string;                // Base64 (após compressão)
}
```

## Relacionamentos

| Origem | Destino | Cardinalidade | Integridade | Notas |
|---|---|---|---|---|
| attachments.uuid | records.uuid | N:1 | Aplicação (não há FK nativa no IndexedDB) | Exclusão em cascata via transação atômica |
| records.equipamentos | — | array embutido | — | Equipamentos são serializados inline no Record |

## Restrições

- **Unicidade**:
  - `records.uuid`: único por definição do keyPath
  - `attachments.id`: único (composto por uuid + index)
  - `records.equipamentos[].numero`: único dentro do mesmo registro (validação na camada de aplicação)
- **Integridade referencial**: Mantida na camada de aplicação — ao deletar um record, a store de attachments é varrida para remover anexos com mesmo uuid (transação atômica)
- **Particionamento / sharding**: Não aplicável (IndexedDB local no browser)
- **Índices críticos**:
  - `records.status`: filtro sidebar por draft/sent
  - `records.updatedAt`: ordenação sidebar (mais recente primeiro)
  - `records.tipoOrdem`: filtro sidebar por tipo
  - `attachments.uuid`: lookup de anexos por registro

## Considerações específicas do paradigma alvo

- Component-based reativo: sem implicações diretas no modelo de dados (mantém schema legado)
- TypeScript: interfaces acima são os tipos — garantem type safety sem mudar o schema runtime
- A compressão de imagens continua lossy (JPEG) — o dado armazenado é o resultado da compressão, não o original
- Não há outbox table (não há fila de eventos)
- Não há event store (paradigma não é event-driven)

## Origem no legado

| Store nova | Origem no legado | Transformação |
|---|---|---|
| `records` | `scripts/db.js` (store `records` na v3) | Idêntico — schema compatível |
| `attachments` | `scripts/db.js` (store `attachments` na v3) | Idêntico — schema compatível |
| `records.iniciais` | `scripts/state.js` § `iniciais` | Renomeação de campos para camelCase (TypeScript) |
| `records.retorno` | `scripts/state.js` § `retorno` | Idêntico |
| `records.tipoOrdem` | `scripts/state.js` § `tipoOrdem` | Idêntico |
| `records.equipamentos` | `scripts/state.js` § `equipamentos` | Idêntico |
| `records.composicao` | `scripts/state.js` § `composicao` | Idêntico |
| `records.sentData` | `scripts/state.js` § `sentData` | Idêntico |
| `records.attachmentCount` | `scripts/state.js` § `attachmentCount` | Idêntico |
| `records.lastTipoOrdem` | `scripts/state.js` § `lastTipoOrdem` | Idêntico |
| `attachments.id` | `scripts/db.js` § `"{uuid}_{index}"` | Idêntico |
| `attachments.data` | `scripts/compress.js` (base64) | Idêntico |

## Notas
- O schema é **100% compatível com a v3 do legado**. Nenhuma transformação de dados é necessária para registros existentes.
- A migração v2→v3 (separar attachments em store próprio) já foi aplicada no legado — não precisa refazer.
- `localStorage` continua sendo usado como backup do formulário atual (chave `mail_form_estado`), mesmo schema.
- Equipamentos são serializados inline no record (não têm store próprio).
- Não há schema de banco no backend — a Netlify Function só lê os dados enviados via POST, não persiste nada.
