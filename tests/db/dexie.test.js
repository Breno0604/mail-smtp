// tests/db/dexie.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../src/db/index';
import { RecordData, StoredAttachment, PendingSendData } from '../../src/types';

describe('Dexie MailDB', () => {
  beforeEach(async () => {
    await db.records.clear();
    await db.attachments.clear();
    await db.pendingSends.clear();
  });

  it('should have records store with uuid primary key', async () => {
    const record = {
      uuid: 'test-uuid-1', status: 'draft',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      iniciais: { uc: '123', os: '456' }, retorno: {},
      tipoOrdem: 'VISTORIA DA UC', equipamentos: [],
      composicao: { complementoCorpo: '' }, attachmentCount: 0, sentData: null,
    };
    await db.records.put(record);
    const fetched = await db.records.get('test-uuid-1');
    expect(fetched).toBeDefined();
    expect(fetched.uuid).toBe('test-uuid-1');
  });

  it('should have attachments store with uuid index', async () => {
    const att = {
      uuid: 'test-uuid-1', index: 0,
      name: 'photo.jpg', type: 'image/jpeg', data: 'base64data',
    };
    await db.attachments.put(att);
    const byUuid = await db.attachments.where('uuid').equals('test-uuid-1').toArray();
    expect(byUuid).toHaveLength(1);
  });

  it('should have pendingSends store', async () => {
    const pending = {
      uuid: 'test-uuid-1', payload: { test: true },
      createdAt: new Date().toISOString(), attempts: 0,
    };
    await db.pendingSends.put(pending);
    const all = await db.pendingSends.toArray();
    expect(all).toHaveLength(1);
  });

  it('should support CRUD on records', async () => {
    const record = {
      uuid: 'crud-uuid', status: 'draft',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      iniciais: {}, retorno: {}, tipoOrdem: '',
      equipamentos: [], composicao: { complementoCorpo: '' },
      attachmentCount: 0, sentData: null,
    };
    await db.records.put(record);
    expect(await db.records.get('crud-uuid')).toBeDefined();

    await db.records.update('crud-uuid', { status: 'sent' });
    expect((await db.records.get('crud-uuid')).status).toBe('sent');

    await db.records.delete('crud-uuid');
    expect(await db.records.get('crud-uuid')).toBeUndefined();
  });

  it('should delete attachments by uuid', async () => {
    await db.attachments.bulkAdd([
      { uuid: 'del-uuid', index: 0, name: 'a.jpg', type: 'image/jpeg', data: '' },
      { uuid: 'del-uuid', index: 1, name: 'b.jpg', type: 'image/jpeg', data: '' },
      { uuid: 'other-uuid', index: 0, name: 'c.jpg', type: 'image/jpeg', data: '' },
    ]);
    await db.attachments.where('uuid').equals('del-uuid').delete();
    expect(await db.attachments.where('uuid').equals('del-uuid').count()).toBe(0);
    expect(await db.attachments.where('uuid').equals('other-uuid').count()).toBe(1);
  });
});