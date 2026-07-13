/**
 * Export IndexedDB — Ferramenta de validação para migração Vue.
 *
 * Uso no browser:
 *   1. Abra o formulário no navegador (localhost:8888 ou produção)
 *   2. Abra o console (F12)
 *   3. Copie e cole o conteúdo deste arquivo
 *   4. Digite: exportIndexedDB().then(d => downloadJSON(d, 'mail-mvp-backup.json'))
 *   5. Um arquivo JSON será baixado com todos os registros e anexos
 *
 * Uso programático (testes):
 *   import { exportIndexedDB, validateMigration } from './export-indexeddb.js';
 *   const backup = await exportIndexedDB();  // só funciona com fake-indexeddb em testes
 *
 * Formato do arquivo exportado:
 * {
 *   version: 3,
 *   exportedAt: "2026-06-24T...",
 *   records: [{ uuid, status, createdAt, updatedAt, iniciais, retorno,
 *               tipoOrdem, equipamentos, attachmentCount, sentData }],
 *   attachments: [{ id, uuid, index, name, type, data }]
 * }
 */

const DB_NAME = 'mail-mvp';
const DB_VERSION = 3;
const STORE_RECORDS = 'records';
const STORE_ATTACHMENTS = 'attachments';

/**
 * Abre a conexão com o IndexedDB.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB não está disponível neste ambiente.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      // Apenas abrir — nunca modificar schema durante export
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Lê todos os registros de um object store.
 * @param {IDBDatabase} db
 * @param {string} storeName
 * @returns {Promise<Array>}
 */
function readAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Exporta todos os dados do IndexedDB para um objeto serializável.
 * @returns {Promise<object>}
 */
export async function exportIndexedDB() {
  const db = await openDB();
  const records = await readAllFromStore(db, STORE_RECORDS);
  const attachments = await readAllFromStore(db, STORE_ATTACHMENTS);
  db.close();

  return {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    recordCount: records.length,
    attachmentCount: attachments.length,
    records: records.map(serializeRecord),
    attachments: attachments.map(serializeAttachment),
  };
}

/**
 * Serializa um registro para JSON (garante que campos opcionais existam).
 * A propriedade `attachments` só é incluída se o registro tiver anexos inline
 * (formato v2). Para registros v3 (store separado), a propriedade é omitida.
 * @param {object} record - Record do IndexedDB
 * @returns {object}
 */
function serializeRecord(record) {
  const result = {
    uuid: record.uuid,
    status: record.status || 'draft',
    createdAt: record.createdAt || null,
    updatedAt: record.updatedAt || null,
    iniciais: record.iniciais || {},
    retorno: record.retorno || {},
    tipoOrdem: record.tipoOrdem || '',
    equipamentos: record.equipamentos || null,
    attachmentCount: record.attachmentCount || 0,
    sentData: record.sentData || null,
  };
  // Só inclui attachments inline se existirem (formato v2)
  if (record.attachments && Array.isArray(record.attachments) && record.attachments.length > 0) {
    result.attachments = record.attachments;
  }
  return result;
}

/**
 * Serializa um anexo para JSON.
 * @param {object} att - Attachment do IndexedDB
 * @returns {object}
 */
function serializeAttachment(att) {
  return {
    id: att.id,
    uuid: att.uuid,
    index: att.index,
    name: att.name,
    type: att.type,
    data: att.data, // base64
  };
}

/**
 * Valida se os dados exportados podem ser restaurados corretamente.
 * Verifica estrutura de cada record e attachment.
 * @param {object} backup - Objeto retornado por exportIndexedDB()
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateBackup(backup) {
  const errors = [];

  if (!backup || typeof backup !== 'object') {
    return { valid: false, errors: ['Backup inválido: não é um objeto'] };
  }

  if (backup.version !== 3) {
    errors.push(`Versão do schema: ${backup.version} (esperado: 3)`);
  }

  if (!Array.isArray(backup.records)) {
    errors.push('records não é um array');
  } else {
    backup.records.forEach((r, i) => {
      if (!r.uuid) errors.push(`records[${i}]: uuid ausente`);
      if (!r.status) errors.push(`records[${i}]: status ausente`);
      if (typeof r.iniciais !== 'object') errors.push(`records[${i}]: iniciais inválido`);
      if (r.attachmentCount > 0 && !r.attachments && !hasAttachments(backup, r.uuid)) {
        errors.push(`records[${i}]: ${r.attachmentCount} anexos declarados mas não encontrados`);
      }
    });
  }

  if (!Array.isArray(backup.attachments)) {
    errors.push('attachments não é um array');
  } else {
    backup.attachments.forEach((a, i) => {
      if (!a.id) errors.push(`attachments[${i}]: id ausente`);
      if (!a.uuid) errors.push(`attachments[${i}]: uuid ausente`);
      if (!a.name) errors.push(`attachments[${i}]: name ausente`);
      if (!a.data) errors.push(`attachments[${i}]: data (base64) ausente`);
    });
  }

  return { valid: errors.length === 0, errors };
}

function hasAttachments(backup, uuid) {
  return backup.attachments.some(a => a.uuid === uuid);
}

/**
 * Função para download do JSON no browser.
 * @param {object} data - Dados exportados
 * @param {string} filename - Nome do arquivo
 */
export function downloadJSON(data, filename = 'mail-mvp-backup.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Versão para uso direto no console do browser:
 *
 *   // Opção 1: Exportar e baixar
 *   exportIndexedDB().then(d => downloadJSON(d))
 *
 *   // Opção 2: Exportar e validar
 *   exportIndexedDB().then(d => { console.log(validateBackup(d)); downloadJSON(d); })
 *
 *   // Opção 3: Apenas validar estrutura
 *   exportIndexedDB().then(d => console.table(d.records.map(r => ({
 *     uuid: r.uuid.slice(0,8), status: r.status, os: r.iniciais?.os, uc: r.iniciais?.uc
 *   }))))
 */

// Tornar disponível no escopo global se executado no browser
if (typeof window !== 'undefined') {
  window.exportIndexedDB = exportIndexedDB;
  window.downloadJSON = downloadJSON;
  window.validateBackup = validateBackup;
}
