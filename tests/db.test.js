import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  saveDraft,
  getRecord,
  getAllRecords,
  deleteRecord,
  updateRecordStatus,
  saveAttachments,
  getAttachmentsByUuid,
} from '../scripts/db.js';

describe('db', () => {
  const sampleRecord = {
    uuid: 'test-uuid-1',
    status: 'draft',
    createdAt: '2024-03-15T10:00:00.000Z',
    updatedAt: '2024-03-15T10:00:00.000Z',
    currentSection: 1,
    iniciais: { uc: '12345', os: '67890' },
    equipamentos: [],
    attachments: [],
    retorno: {},
  };

  // Clean all records between tests
  afterEach(async () => {
    const all = await getAllRecords();
    for (const r of all) {
      await deleteRecord(r.uuid);
    }
  });

  describe('saveDraft', () => {
    it('should save a record', async () => {
      await saveDraft(sampleRecord);
      const retrieved = await getRecord('test-uuid-1');
      expect(retrieved).toBeTruthy();
      expect(retrieved.uuid).toBe('test-uuid-1');
    });

    it('should update existing record on save', async () => {
      await saveDraft(sampleRecord);
      const updated = { ...sampleRecord, status: 'sent' };
      await saveDraft(updated);
      const retrieved = await getRecord('test-uuid-1');
      expect(retrieved.status).toBe('sent');
    });

    it('should allow saving multiple records', async () => {
      const record1 = { ...sampleRecord, uuid: 'uuid-1', iniciais: { uc: '111' } };
      const record2 = { ...sampleRecord, uuid: 'uuid-2', iniciais: { uc: '222' } };
      await saveDraft(record1);
      await saveDraft(record2);
      const all = await getAllRecords();
      expect(all).toHaveLength(2);
    });
  });

  describe('getRecord', () => {
    it('should retrieve a saved record by UUID', async () => {
      await saveDraft(sampleRecord);
      const record = await getRecord('test-uuid-1');
      expect(record.uuid).toBe('test-uuid-1');
      expect(record.iniciais.uc).toBe('12345');
    });

    it('should return null for non-existent UUID', async () => {
      const record = await getRecord('non-existent');
      expect(record).toBeNull();
    });

    it('should preserve all fields of the saved record', async () => {
      const fullRecord = {
        ...sampleRecord,
        retorno: { descricao: 'test description' },
        lastTipoOrdem: 'ADEQUACAO SMF',
        visitedRetorno: true,
        sentData: null,
      };
      await saveDraft(fullRecord);
      const retrieved = await getRecord('test-uuid-1');
      expect(retrieved.retorno.descricao).toBe('test description');
      expect(retrieved.lastTipoOrdem).toBe('ADEQUACAO SMF');
      expect(retrieved.visitedRetorno).toBe(true);
    });
  });

  describe('getAllRecords', () => {
    it('should return empty array when no records exist', async () => {
      const records = await getAllRecords();
      expect(records).toEqual([]);
    });

    it('should return all saved records', async () => {
      await saveDraft({ ...sampleRecord, uuid: 'a' });
      await saveDraft({ ...sampleRecord, uuid: 'b' });
      await saveDraft({ ...sampleRecord, uuid: 'c' });
      const records = await getAllRecords();
      expect(records).toHaveLength(3);
      const uuids = records.map(r => r.uuid).sort();
      expect(uuids).toEqual(['a', 'b', 'c']);
    });
  });

  describe('deleteRecord', () => {
    it('should delete a record by UUID', async () => {
      await saveDraft(sampleRecord);
      await deleteRecord('test-uuid-1');
      const record = await getRecord('test-uuid-1');
      expect(record).toBeNull();
    });

    it('should not throw when deleting non-existent UUID', async () => {
      await expect(deleteRecord('non-existent')).resolves.toBeUndefined();
    });

    it('should only delete the specified record', async () => {
      await saveDraft({ ...sampleRecord, uuid: 'keep' });
      await saveDraft({ ...sampleRecord, uuid: 'delete' });
      await deleteRecord('delete');
      const records = await getAllRecords();
      expect(records).toHaveLength(1);
      expect(records[0].uuid).toBe('keep');
    });
  });

  describe('updateRecordStatus', () => {
    const sentData = {
      to: ['test@example.com'],
      subject: 'Test Subject',
      sentAt: '2024-03-15T12:00:00.000Z',
    };

    it('should update record status to "sent"', async () => {
      await saveDraft(sampleRecord);
      await updateRecordStatus('test-uuid-1', sentData);
      const record = await getRecord('test-uuid-1');
      expect(record.status).toBe('sent');
    });

    it('should store sentData on the record', async () => {
      await saveDraft(sampleRecord);
      await updateRecordStatus('test-uuid-1', sentData);
      const record = await getRecord('test-uuid-1');
      expect(record.sentData).toEqual(sentData);
    });

    it('should update updatedAt timestamp', async () => {
      await saveDraft(sampleRecord);
      const before = Date.now();
      await updateRecordStatus('test-uuid-1', sentData);
      const record = await getRecord('test-uuid-1');
      expect(new Date(record.updatedAt).getTime()).toBeGreaterThanOrEqual(before);
    });

    it('should not throw when record does not exist', async () => {
      await expect(updateRecordStatus('non-existent', sentData)).resolves.toBeUndefined();
    });
  });

  describe('saveAttachments', () => {
    it('should save attachments for a record', async () => {
      const attachments = [
        { name: 'photo1.jpg', type: 'image/jpeg', data: 'base64data1' },
        { name: 'photo2.jpg', type: 'image/jpeg', data: 'base64data2' },
      ];
      await saveAttachments('test-uuid-1', attachments);
      const retrieved = await getAttachmentsByUuid('test-uuid-1');
      expect(retrieved).toHaveLength(2);
      expect(retrieved[0].name).toBe('photo1.jpg');
      expect(retrieved[1].name).toBe('photo2.jpg');
    });

    it('should replace existing attachments on re-save', async () => {
      const attachments1 = [{ name: 'old.jpg', type: 'image/jpeg', data: 'olddata' }];
      await saveAttachments('test-uuid-1', attachments1);

      const attachments2 = [{ name: 'new.jpg', type: 'image/jpeg', data: 'newdata' }];
      await saveAttachments('test-uuid-1', attachments2);

      const retrieved = await getAttachmentsByUuid('test-uuid-1');
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].name).toBe('new.jpg');
    });

    it('should handle empty attachments array', async () => {
      await saveAttachments('test-uuid-1', []);
      const retrieved = await getAttachmentsByUuid('test-uuid-1');
      expect(retrieved).toHaveLength(0);
    });
  });

  describe('getAttachmentsByUuid', () => {
    it('should return empty array when no attachments exist', async () => {
      const retrieved = await getAttachmentsByUuid('non-existent');
      expect(retrieved).toEqual([]);
    });

    it('should return attachments in correct order', async () => {
      const attachments = [
        { name: 'first.jpg', type: 'image/jpeg', data: 'data1' },
        { name: 'second.jpg', type: 'image/jpeg', data: 'data2' },
        { name: 'third.jpg', type: 'image/jpeg', data: 'data3' },
      ];
      await saveAttachments('test-uuid-1', attachments);
      const retrieved = await getAttachmentsByUuid('test-uuid-1');
      expect(retrieved.map(a => a.name)).toEqual(['first.jpg', 'second.jpg', 'third.jpg']);
    });

    it('should only return attachments for specific UUID', async () => {
      await saveAttachments('uuid-1', [{ name: 'a.jpg', type: 'image/jpeg', data: 'data1' }]);
      await saveAttachments('uuid-2', [{ name: 'b.jpg', type: 'image/jpeg', data: 'data2' }]);

      const retrieved1 = await getAttachmentsByUuid('uuid-1');
      const retrieved2 = await getAttachmentsByUuid('uuid-2');

      expect(retrieved1).toHaveLength(1);
      expect(retrieved1[0].name).toBe('a.jpg');
      expect(retrieved2).toHaveLength(1);
      expect(retrieved2[0].name).toBe('b.jpg');
    });
  });

  describe('deleteRecord with attachments', () => {
    it('should delete both record and its attachments', async () => {
      await saveDraft(sampleRecord);
      await saveAttachments('test-uuid-1', [
        { name: 'photo.jpg', type: 'image/jpeg', data: 'data1' },
      ]);

      await deleteRecord('test-uuid-1');

      const record = await getRecord('test-uuid-1');
      const attachments = await getAttachmentsByUuid('test-uuid-1');

      expect(record).toBeNull();
      expect(attachments).toHaveLength(0);
    });
  });
});
