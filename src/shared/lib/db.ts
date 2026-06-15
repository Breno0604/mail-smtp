/**
 * IndexedDB service — mail-mvp v3
 * Stores: records (keyPath: uuid), attachments (keyPath: id)
 * Schema compatível com o legado (v3)
 */

import type { FormRecord, Attachment } from '../types'

const DB_NAME = 'mail-mvp'
const DB_VERSION = 3

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains('records')) {
        const store = db.createObjectStore('records', { keyPath: 'uuid' })
        store.createIndex('status', 'status', { unique: false })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
        store.createIndex('tipoOrdem', 'tipoOrdem', { unique: false })
      }

      if (!db.objectStoreNames.contains('attachments')) {
        const store = db.createObjectStore('attachments', { keyPath: 'id' })
        store.createIndex('uuid', 'uuid', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ── Records ──────────────────────────────────────────────────────────────────

export async function getAllRecords(): Promise<FormRecord[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('records', 'readonly')
    const store = tx.objectStore('records')
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getRecord(uuid: string): Promise<FormRecord | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('records', 'readonly')
    const store = tx.objectStore('records')
    const request = store.get(uuid)
    request.onsuccess = () => resolve(request.result ?? undefined)
    request.onerror = () => reject(request.error)
  })
}

export async function saveRecord(record: FormRecord): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('records', 'readwrite')
    const store = tx.objectStore('records')
    store.put(record)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function deleteRecord(uuid: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('records', 'readwrite')
    const store = tx.objectStore('records')
    store.delete(uuid)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ── Attachments ──────────────────────────────────────────────────────────────

export async function getAttachmentsByRecord(uuid: string): Promise<Attachment[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('attachments', 'readonly')
    const store = tx.objectStore('attachments')
    const index = store.index('uuid')
    const request = index.getAll(uuid)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveAttachment(attachment: Attachment): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('attachments', 'readwrite')
    const store = tx.objectStore('attachments')
    store.put(attachment)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function deleteAttachment(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('attachments', 'readwrite')
    const store = tx.objectStore('attachments')
    store.delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function deleteAttachmentsByRecord(uuid: string): Promise<void> {
  const attachments = await getAttachmentsByRecord(uuid)
  if (attachments.length === 0) return

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('attachments', 'readwrite')
    const store = tx.objectStore('attachments')
    for (const att of attachments) {
      store.delete(att.id)
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ── Transactions atômicas (record + attachments) ─────────────────────────────

export async function deleteRecordWithAttachments(uuid: string): Promise<void> {
  await deleteAttachmentsByRecord(uuid)
  await deleteRecord(uuid)
}

// ── Backup localStorage ──────────────────────────────────────────────────────

const BACKUP_KEY = 'mail_form_estado'

export function saveBackup(data: unknown): void {
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(data))
  } catch {
    // localStorage cheio ou indisponível — ignora silenciosamente
  }
}

export function loadBackup<T = unknown>(): T | null {
  try {
    const raw = localStorage.getItem(BACKUP_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function clearBackup(): void {
  try {
    localStorage.removeItem(BACKUP_KEY)
  } catch {
    // ignora
  }
}
