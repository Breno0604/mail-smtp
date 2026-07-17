export const DB_NAME = 'mail-mvp';
export const DB_VERSION = 3;
export const STORE_RECORDS = 'records';
export const STORE_ATTACHMENTS = 'attachments';

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;

      // Migração v1→v2: remover store legado
      if (db.objectStoreNames.contains('sent_emails')) {
        db.deleteObjectStore('sent_emails');
      }

      // Store de registros (sempre presente desde v1)
      if (!db.objectStoreNames.contains(STORE_RECORDS)) {
        db.createObjectStore(STORE_RECORDS, { keyPath: 'uuid' });
      }

      // Store de anexos (novo em v3): chave composta uuid+index
      if (!db.objectStoreNames.contains(STORE_ATTACHMENTS)) {
        const attStore = db.createObjectStore(STORE_ATTACHMENTS, { keyPath: 'id' });
        attStore.createIndex('uuid', 'uuid', { unique: false });
      }
    };
    req.onsuccess = () => {
      _db = req.result;
      _db.onclose = () => {
        _db = null;
      };
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
  });
}

// ── Helpers genéricos ────────────────────────────────────────────────────────

/**
 * Executa fn(store, tx) em uma transação com os stores especificados.
 * Suporta um único nome de store (string) ou array de nomes.
 */
async function withTransaction(stores, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, mode);
    const req = fn(tx);
    tx.oncomplete = () => {
      // Se fn retornou um IDBRequest, retornar .result; senão retornar o valor direto
      resolve(req instanceof IDBRequest ? req.result : req);
    };
    tx.onerror = () => reject(tx.error);
  });
}

// Compatibilidade: withStore para operações em um único store
async function withStore(mode, fn) {
  return withTransaction(STORE_RECORDS, mode, tx => fn(tx.objectStore(STORE_RECORDS), tx));
}

// ── Records CRUD ─────────────────────────────────────────────────────────────

export function saveDraft(record) {
  return withStore('readwrite', store => store.put(record));
}

/**
 * Busca um registro pelo UUID.
 * O IDBRequest retornado por store.get() tem seu .result populado quando a transação completa.
 */
export function getRecord(uuid) {
  return withStore('readonly', store => store.get(uuid)).then(result => result || null);
}

/**
 * Busca todos os registros.
 * O IDBRequest retornado por store.getAll() tem seu .result populado quando a transação completa.
 */
export function getAllRecords() {
  return withStore('readonly', store => store.getAll()).then(result => result || []);
}

/**
 * Deleta um registro E seus anexos em transação atômica.
 */
export function deleteRecord(uuid) {
  return withTransaction([STORE_RECORDS, STORE_ATTACHMENTS], 'readwrite', tx => {
    const recordStore = tx.objectStore(STORE_RECORDS);
    const attStore = tx.objectStore(STORE_ATTACHMENTS);

    // Deletar registro principal
    recordStore.delete(uuid);

    // Deletar todos os anexos associados via index
    const index = attStore.index('uuid');
    const cursorReq = index.openCursor(IDBKeyRange.only(uuid));
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  });
}

export function updateRecordStatus(uuid, sentData, status = 'sent') {
  return withStore('readwrite', (store, _tx) => {
    const req = store.get(uuid);
    req.onsuccess = () => {
      const record = req.result;
      if (record) {
        record.status = status;
        record.sentData = sentData;
        record.updatedAt = new Date().toISOString();
        store.put(record);
      }
    };
    req.onerror = () => {}; // propagado pelo _tx.onerror
  });
}

// ── Attachments CRUD ─────────────────────────────────────────────────────────

/**
 * Salva anexos no store separado.
 * Primeiro deleta anexos antigos do uuid, depois insere os novos.
 * @param {string} uuid - UUID do registro pai
 * @param {Array<{name: string, type: string, data: string}>} attachments - Anexos serializados
 */
export function saveAttachments(uuid, attachments) {
  return withTransaction(STORE_ATTACHMENTS, 'readwrite', tx => {
    const store = tx.objectStore(STORE_ATTACHMENTS);
    const index = store.index('uuid');

    const cursorReq = index.openCursor(IDBKeyRange.only(uuid));
    cursorReq.onerror = () => {}; // erro já propagado por tx.onerror, mas evita "Unhandled error" no console
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        // Cursor terminou — agora inserir novos anexos
        attachments.forEach((att, i) => {
          store.put({
            id: `${uuid}_${i}`,
            uuid: uuid,
            index: i,
            name: att.name,
            type: att.type,
            data: att.data,
          });
        });
      }
    };
  });
}

/**
 * Salva registro e anexos em uma única transação atômica.
 * Se qualquer operação falhar, tudo é revertido (rollback implícito do IndexedDB).
 *
 * @param {string} uuid - UUID do registro
 * @param {object} record - Dados do registro (colocados no store 'records')
 * @param {Array<{name: string, type: string, data: string}>} serializedAttachments - Anexos já serializados em base64
 */
export function saveRecordAtomic(uuid, record, serializedAttachments) {
  return withTransaction([STORE_RECORDS, STORE_ATTACHMENTS], 'readwrite', tx => {
    const recordStore = tx.objectStore(STORE_RECORDS);
    const attStore = tx.objectStore(STORE_ATTACHMENTS);

    // 1. Gravar registro principal
    recordStore.put(record);

    // 2. Deletar anexos antigos do uuid via cursor e depois inserir os novos
    const index = attStore.index('uuid');
    const cursorReq = index.openCursor(IDBKeyRange.only(uuid));
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        // Cursor terminou — inserir novos anexos
        serializedAttachments.forEach((att, i) => {
          attStore.put({
            id: `${uuid}_${i}`,
            uuid: uuid,
            index: i,
            name: att.name,
            type: att.type,
            data: att.data,
          });
        });
      }
    };
  });
}

/**
 * Busca todos os anexos de um registro pelo UUID.
 * @param {string} uuid
 * @returns {Promise<Array<{name: string, type: string, data: string}>>}
 */
export function getAttachmentsByUuid(uuid) {
  return withTransaction(STORE_ATTACHMENTS, 'readonly', tx => {
    const store = tx.objectStore(STORE_ATTACHMENTS);
    const index = store.index('uuid');
    return index.getAll(IDBKeyRange.only(uuid));
  }).then(results => {
    if (!results) return [];
    return results
      .sort((a, b) => a.index - b.index)
      .map(({ name, type, data }) => ({ name, type, data }));
  });
}

// ── Cleanup ─────────────────────────────────────────────────────────────────

const RETENTION_DAYS = 90;

/**
 * Remove registros enviados (status 'sent') com mais de RETENTION_DAYS dias.
 * Fire-and-forget, chamada na inicialização do app.
 */
export async function cleanupOldSentRecords() {
  const records = await getAllRecords();
  const now = Date.now();
  const cutoff = now - RETENTION_DAYS * 24 * 60 * 60 * 1000;

  for (const record of records) {
    if (record.status !== 'sent') continue;
    const sentAt = record.sentData?.sentAt;
    if (!sentAt) continue;
    if (new Date(sentAt).getTime() < cutoff) {
      await deleteRecord(record.uuid);
    }
  }
}
