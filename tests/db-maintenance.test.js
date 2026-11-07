// tests/db-maintenance.test.js
// P10 (retenção de enviados) e P11 (anexos órfãos).

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveDraft,
  saveAttachments,
  getAllRecords,
  getAttachmentsByUuid,
  deleteRecord,
  getExpiredSentRecords,
  cleanupOrphanedAttachments,
} from '../scripts/db.js';

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = days => new Date(Date.now() - days * DAY).toISOString();

function makeRecord(uuid, overrides = {}) {
  return {
    uuid,
    status: 'sent',
    createdAt: daysAgo(200),
    updatedAt: daysAgo(200),
    iniciais: { uc: '1', os: '2' },
    retorno: {},
    ...overrides,
  };
}

describe('P10 — registros enviados expirados', () => {
  beforeEach(async () => {
    for (const r of await getAllRecords()) await deleteRecord(r.uuid);
  });

  it('inclui enviado com sentAt antigo', async () => {
    await saveDraft(makeRecord('velho', { sentData: { sentAt: daysAgo(91) } }));
    const expired = await getExpiredSentRecords();
    expect(expired.map(r => r.uuid)).toEqual(['velho']);
  });

  it('inclui enviado legado sem sentData usando updatedAt', async () => {
    await saveDraft(makeRecord('legado', { updatedAt: daysAgo(120) }));
    const expired = await getExpiredSentRecords();
    expect(expired.map(r => r.uuid)).toEqual(['legado']);
  });

  it('exclui enviado recente e rascunho antigo', async () => {
    await saveDraft(makeRecord('recente', { sentData: { sentAt: daysAgo(2) } }));
    await saveDraft(makeRecord('rascunho', { status: 'draft' }));

    const expired = await getExpiredSentRecords();
    expect(expired).toEqual([]);
  });
});

describe('P11 — anexos órfãos', () => {
  beforeEach(async () => {
    for (const r of await getAllRecords()) await deleteRecord(r.uuid);
  });

  it('remove anexo cujo registro não existe e mantém o vinculado', async () => {
    await saveDraft(makeRecord('vivo', { status: 'draft' }));
    await saveAttachments('vivo', [{ name: 'ok.txt', type: 'text/plain', data: 'x' }]);
    await saveAttachments('fantasma', [{ name: 'orf.txt', type: 'text/plain', data: 'y' }]);

    const removed = await cleanupOrphanedAttachments();

    expect(removed).toBe(1);
    expect(await getAttachmentsByUuid('vivo')).toHaveLength(1);
    expect(await getAttachmentsByUuid('fantasma')).toHaveLength(0);
  });
});
