const DB_NAME = "mail-mvp";
const DB_VERSION = 2;
const STORE_NAME = "records";

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (db.objectStoreNames.contains("sent_emails")) {
        db.deleteObjectStore("sent_emails");
      }
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "uuid" });
      }
    };
    req.onsuccess = () => {
      _db = req.result;
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
  });
}

// Helper privado: abre uma transação e executa fn(store, tx).
// Resolve quando a transação completa, rejeita em erro.
async function withStore(mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    fn(tx.objectStore(STORE_NAME), tx);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Helper privado: lê um registro e resolve com o resultado (ou null).
async function readFromStore(fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = fn(tx.objectStore(STORE_NAME));
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export function saveDraft(record) {
  return withStore("readwrite", (store) => store.put(record));
}

export function getRecord(uuid) {
  return readFromStore((store) => store.get(uuid));
}

export function getAllRecords() {
  return readFromStore((store) => store.getAll()).then((r) => r || []);
}

export function deleteRecord(uuid) {
  return withStore("readwrite", (store) => store.delete(uuid));
}

export function updateRecordStatus(uuid, sentData) {
  return withStore("readwrite", (store, tx) => {
    const req = store.get(uuid);
    req.onsuccess = () => {
      const record = req.result;
      if (record) {
        record.status = "sent";
        record.sentData = sentData;
        record.updatedAt = new Date().toISOString();
        store.put(record);
      }
    };
    req.onerror = () => {}; // propagado pelo tx.onerror
  });
}
