// tests/app-cleanup.test.js
// P10 — limpeza de enviados antigos só com confirmação do usuário.

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTestDOM } from './helpers/dom-fixture.js';
import { state, setCurrentUUID } from '../scripts/state.js';
import { saveDraft, getAllRecords, deleteRecord } from '../scripts/db.js';
import { offerCleanupOldRecords } from '../scripts/app.js';
import { showConfirm } from '../scripts/ui.js';

vi.mock('../scripts/ui.js', async () => {
  const actual = await vi.importActual('../scripts/ui.js');
  return { ...actual, showConfirm: vi.fn() };
});

const DAY = 24 * 60 * 60 * 1000;

function expiredRecord(uuid) {
  return {
    uuid,
    status: 'sent',
    createdAt: new Date(Date.now() - 200 * DAY).toISOString(),
    updatedAt: new Date(Date.now() - 200 * DAY).toISOString(),
    sentData: { sentAt: new Date(Date.now() - 200 * DAY).toISOString() },
    iniciais: { uc: '1', os: '2' },
    retorno: {},
  };
}

async function clearDB() {
  for (const r of await getAllRecords()) await deleteRecord(r.uuid);
}

describe('offerCleanupOldRecords', () => {
  beforeEach(async () => {
    createTestDOM();
    state.currentUUID = '';
    localStorage.clear();
    await clearDB();
    showConfirm.mockReset();
  });

  afterEach(clearDB);

  it('remove os enviados antigos após confirmação, preservando o registro aberto', async () => {
    await saveDraft(expiredRecord('antigo-1'));
    await saveDraft(expiredRecord('antigo-2'));
    await saveDraft(expiredRecord('aberto'));
    setCurrentUUID('aberto');
    showConfirm.mockResolvedValue(true);

    await offerCleanupOldRecords();

    const remaining = (await getAllRecords()).map(r => r.uuid);
    expect(remaining).toContain('aberto');
    expect(remaining).not.toContain('antigo-1');
    expect(remaining).not.toContain('antigo-2');
  });

  it('não remove nada quando o usuário recusa', async () => {
    await saveDraft(expiredRecord('antigo-1'));
    showConfirm.mockResolvedValue(false);

    await offerCleanupOldRecords();

    expect((await getAllRecords()).map(r => r.uuid)).toEqual(['antigo-1']);
  });

  it('nem pergunta quando não há registros expirados', async () => {
    await offerCleanupOldRecords();

    expect(showConfirm).not.toHaveBeenCalled();
  });
});
