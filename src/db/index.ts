// src/db/index.ts
import Dexie, { type Table } from 'dexie';
import type { RecordData, StoredAttachment, PendingSendData } from '@/types';

export class MailDB extends Dexie {
  records!: Table<RecordData, string>;
  attachments!: Table<StoredAttachment, number>;
  pendingSends!: Table<PendingSendData, number>;

  constructor() {
    super('mail-mvp');
    this.version(4).stores({
      records: 'uuid, status, tipoOrdem, updatedAt',
      attachments: '++id, uuid',
      pendingSends: '++id, uuid',
    });
  }
}

export const db = new MailDB();