const DB_NAME = 'mail-mvp';
const DB_VERSION = 3;
const STORE_RECORDS = 'records';
const STORE_ATTACHMENTS = 'attachments';

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
    const result = fn(tx);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

// Compatibilidade: withStore para operações em um único store
async function withStore(mode, fn) {
  return withTransaction(STORE_RECORDS, mode, tx => fn(tx.objectStore(STORE_RECORDS), tx));
}

async function readFromStore(fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECORDS, 'readonly');
    const req = fn(tx.objectStore(STORE_RECORDS));
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// ── Records CRUD ─────────────────────────────────────────────────────────────

export function saveDraft(record) {
  return withStore('readwrite', store => store.put(record));
}

export function getRecord(uuid) {
  return readFromStore(store => store.get(uuid));
}

export function getAllRecords() {
  return readFromStore(store => store.getAll()).then(r => r || []);
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

export function updateRecordStatus(uuid, sentData) {
  return withStore('readwrite', (store, _tx) => {
    const req = store.get(uuid);
    req.onsuccess = () => {
      const record = req.result;
      if (record) {
        record.status = 'sent';
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

    // Deletar anexos antigos e depois inserir novos na mesma transação.
    // Usamos uma flag para garantir que os puts só acontecem após o cursor terminar.
    let _deletesDone = false;
    const _pendingPuts = [];

    const cursorReq = index.openCursor(IDBKeyRange.only(uuid));
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        // Cursor terminou — agora inserir novos anexos
        _deletesDone = true;
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
 * Busca todos os anexos de um registro pelo UUID.
 * @param {string} uuid
 * @returns {Promise<Array<{name: string, type: string, data: string}>>}
 */
export function getAttachmentsByUuid(uuid) {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const tx = db.transaction(STORE_ATTACHMENTS, 'readonly');
    const store = tx.objectStore(STORE_ATTACHMENTS);
    const index = store.index('uuid');
    const req = index.getAll(IDBKeyRange.only(uuid));
    req.onsuccess = () => {
      const results = (req.result || []).sort((a, b) => a.index - b.index);
      resolve(results.map(({ name, type, data }) => ({ name, type, data })));
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Deleta todos os anexos de um registro pelo UUID.
 */
export function deleteAttachmentsByUuid(uuid) {
  return withTransaction(STORE_ATTACHMENTS, 'readwrite', tx => {
    const store = tx.objectStore(STORE_ATTACHMENTS);
    const index = store.index('uuid');
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
