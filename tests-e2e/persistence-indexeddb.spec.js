// tests-e2e/persistence-indexeddb.spec.js
import { test, expect } from '@playwright/test';
import {
  readIndexedDB,
  readAttachments,
  clearIndexedDB,
  fillCompleteForm,
  fillMinimal,
  addEquipRow,
  waitForSave,
  createPngBuffer,
} from './helpers/persistence.js';

test.describe('Persistence — IndexedDB', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#uc');
    await clearIndexedDB(page);
    await page.goto('/');
    await page.waitForSelector('#uc');
  });

  test('2a — database schema is correct (v3, records + attachments stores)', async ({ page }) => {
    const dbInfo = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open('mail-mvp', 3);
        req.onsuccess = () => {
          const db = req.result;
          resolve({
            name: db.name,
            version: db.version,
            stores: Array.from(db.objectStoreNames),
          });
        };
        req.onerror = () => reject(req.error);
      });
    });

    expect(dbInfo.name).toBe('mail-mvp');
    expect(dbInfo.version).toBe(3);
    expect(dbInfo.stores).toContain('records');
    expect(dbInfo.stores).toContain('attachments');
  });

  test('2b — saved content is correct in IndexedDB', async ({ page }) => {
    await fillCompleteForm(page);
    await page.selectOption('#tipo-ordem', 'CORTE POR FALTA DE PAGAMENTO');
    await page.waitForSelector('#situacao_corte');
    await page.selectOption('#situacao_corte', 'CLIENTE CORTADO');
    await addEquipRow(page, 'Instalado', 'Medidor', '99999');
    await page.fill('#complemento-corpo', 'Teste IndexedDB');
    await waitForSave(page);

    const records = await readIndexedDB(page);
    expect(records).toHaveLength(1);

    const record = records[0];
    expect(record.iniciais.uc).toBe('11111');
    expect(record.iniciais['tipo-ordem']).toBe('CORTE POR FALTA DE PAGAMENTO');
    expect(record.retorno.situacao_corte).toBe('CLIENTE CORTADO');
    expect(record.composicao.complementoCorpo).toBe('Teste IndexedDB');
    expect(record.uuid).toBeTruthy();
    expect(record.uuid.length).toBe(36);
    expect(record.createdAt).toBeTruthy();
    expect(record.updatedAt).toBeTruthy();
    expect(record.equipamentos).toHaveLength(1);
    expect(record.equipamentos[0].numero).toBe('99999');
  });

  test('2c — attachmentCount and attachment data are correct', async ({ page }) => {
    await fillMinimal(page, '11111', '22222');

    const buf = createPngBuffer();
    await page.setInputFiles('#file-input', [
      { name: 'a.png', mimeType: 'image/png', buffer: buf },
      { name: 'b.png', mimeType: 'image/png', buffer: buf },
    ]);
    await page.waitForSelector('.preview-item', { timeout: 5000 });
    await waitForSave(page);

    const records = await readIndexedDB(page);
    expect(records).toHaveLength(1);
    expect(records[0].attachmentCount).toBe(2);

    const attachments = await readAttachments(page, records[0].uuid);
    expect(attachments).toHaveLength(2);
    expect(attachments[0].name).toBe('a.png');
    expect(attachments[1].name).toBe('b.png');
  });

  test('2d — each record has a unique UUID', async ({ page }) => {
    await fillMinimal(page, '11111', '22222');
    await waitForSave(page);

    let records = await readIndexedDB(page);
    expect(records).toHaveLength(1);
    const uuid1 = records[0].uuid;

    // Create new record
    await page.click('#btn-novo-form');
    await fillMinimal(page, '33333', '44444');
    await waitForSave(page);

    records = await readIndexedDB(page);
    expect(records).toHaveLength(2);
    const uuid2 = records.find((r) => r.iniciais.uc === '33333').uuid;
    expect(uuid2).not.toBe(uuid1);
  });

});
