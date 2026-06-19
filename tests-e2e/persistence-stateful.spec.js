// tests-e2e/persistence-stateful.spec.js
import { test, expect } from '@playwright/test';
import {
  readIndexedDB,
  clearIndexedDB,
  fillMinimal,
  restoreViaSidebar,
  waitForSave,
} from './helpers/persistence.js';

test.describe('Persistence — Stateful Flows', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#uc');
    await clearIndexedDB(page);
    await page.goto('/');
    await page.waitForSelector('#uc');
  });

  test('5a — tipo-ordem change clears retorno and persists in IndexedDB', async ({ page }) => {
    await fillMinimal(page, '11111', '22222');

    // Select first tipo-ordem and fill retorno
    await page.selectOption('#tipo-ordem', 'VISTORIA DA UC');
    await page.waitForSelector('#resultado');
    await page.selectOption('#resultado', 'Regular');
    await waitForSave(page);

    // Switch to a different tipo-ordem
    await page.selectOption('#tipo-ordem', 'CORTE POR FALTA DE PAGAMENTO');
    await page.waitForSelector('#situacao_corte');

    // Old retorno field should be gone from DOM
    await expect(page.locator('#resultado')).toHaveCount(0);

    await waitForSave(page);

    // Check IndexedDB: retorno should not have old fields
    const records = await readIndexedDB(page);
    expect(records).toHaveLength(1);
    expect(records[0].retorno.resultado).toBeUndefined();
    // New field should be present (empty — not selected yet)
  });

  test('5b — 5+ records in sidebar with no data leakage', async ({ page }) => {
    test.setTimeout(120000);
    for (let i = 1; i <= 5; i++) {
      if (i > 1) {
        await page.click('#btn-novo-form');
      }
      const uc = String(i).repeat(5);
      const os = `OS-${i}`;
      await fillMinimal(page, uc, os);
      await waitForSave(page);
    }

    // Verify 5 records in IndexedDB
    const records = await readIndexedDB(page);
    expect(records).toHaveLength(5);

    // Verify each record restores correctly (no leakage)
    for (let i = 1; i <= 5; i++) {
      const uc = String(i).repeat(5);
      const os = `OS-${i}`;
      await restoreViaSidebar(page, `${uc}-${os}`);
      await expect(page.locator('#uc')).toHaveValue(uc);
      await expect(page.locator('#os')).toHaveValue(os);
    }

    // All UUIDs are unique
    const uuids = records.map((r) => r.uuid);
    const uniqueUuids = new Set(uuids);
    expect(uniqueUuids.size).toBe(5);
  });

  test('5c — Novo + restore full cycle', async ({ page }) => {
    await fillMinimal(page, '11111', '22222');
    await page.selectOption('#lider', { label: 'ANDRE DE SOUSA CARVALHO' });
    await waitForSave(page);

    // Click Novo — form resets
    await page.click('#btn-novo-form');
    await expect(page.locator('#uc')).toHaveValue('');
    await expect(page.locator('#os')).toHaveValue('');

    // Restore the saved record
    await restoreViaSidebar(page, '11111-22222');
    await expect(page.locator('#uc')).toHaveValue('11111');
    await expect(page.locator('#lider')).toHaveValue('ANDRE DE SOUSA CARVALHO');
  });

  test('5d — edit after restore then reload preserves changes', async ({ page }) => {
    await fillMinimal(page, '11111', '22222');
    await waitForSave(page);

    // Reload and restore
    await page.reload();
    await page.waitForSelector('#uc');
    await restoreViaSidebar(page, '11111-22222');

    // Edit UC
    await page.fill('#uc', '99999');
    await waitForSave(page);

    // Reload again
    await page.reload();
    await page.waitForSelector('#uc');

    // Restore — summary now uses "99999"
    await restoreViaSidebar(page, '99999-22222');
    await expect(page.locator('#uc')).toHaveValue('99999');
  });

});
