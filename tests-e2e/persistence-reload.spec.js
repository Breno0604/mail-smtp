// tests-e2e/persistence-reload.spec.js
import { test, expect } from '@playwright/test';
import {
  readIndexedDB,
  clearIndexedDB,
  fillCompleteForm,
  fillMinimal,
  addEquipRow,
  restoreViaSidebar,
  waitForSave,
} from './helpers/persistence.js';

test.describe('Persistence — Reload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#uc');
    await clearIndexedDB(page);
    await page.goto('/');
    await page.waitForSelector('#uc');
  });

  test('1a — complete form survives F5 and is restorable via sidebar', async ({ page }) => {
    // Fill full form
    await fillCompleteForm(page);
    await page.selectOption('#tipo-ordem', 'CORTE POR FALTA DE PAGAMENTO');
    await page.waitForSelector('#situacao_corte');
    await page.selectOption('#situacao_corte', 'CLIENTE CORTADO');
    await addEquipRow(page, 'Instalado', 'Medidor', '99999');
    await page.fill('#complemento-corpo', 'Teste E2E persistência');
    await waitForSave(page);

    // Reload
    await page.reload();
    await page.waitForSelector('#uc');

    // Form is empty after reload (clearCurrentUUID)
    await expect(page.locator('#uc')).toHaveValue('');

    // Data survived in IndexedDB
    const records = await readIndexedDB(page);
    expect(records).toHaveLength(1);
    expect(records[0].iniciais.uc).toBe('11111');

    // Restore via sidebar
    await restoreViaSidebar(page, '11111-22222');

    // Verify all fields restored
    await expect(page.locator('#uc')).toHaveValue('11111');
    await expect(page.locator('#os')).toHaveValue('22222');
    await expect(page.locator('#lider')).toHaveValue('ANDRE DE SOUSA CARVALHO');
    await expect(page.locator('#complemento-corpo')).toHaveValue('Teste E2E persistência');

    // Verify equipment restored
    const equipRows = page.locator('.equip-row');
    await expect(equipRows).toHaveCount(1);

    // Verify preview includes key data
    const previewText = await page.locator('#preview-corpo').innerText();
    expect(previewText).toContain('11111');
    expect(previewText).toContain('CLIENTE CORTADO');
  });

  test('1b — data survives closing and reopening tab', async ({ page, context }) => {
    await fillCompleteForm(page);
    await page.selectOption('#tipo-ordem', 'ADEQUACAO SMF');
    await waitForSave(page);

    // Close page, open new one in same context
    await page.close();
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.waitForSelector('#uc');

    // Data exists in IndexedDB
    const records = await readIndexedDB(page2);
    expect(records).toHaveLength(1);
    expect(records[0].iniciais.uc).toBe('11111');

    // Restore via sidebar
    await restoreViaSidebar(page2, '11111-22222');
    await expect(page2.locator('#uc')).toHaveValue('11111');

    await page2.close();
  });

  test('1c — abrupt navigation during debounce does not crash', async ({ page }) => {
    await fillMinimal(page, '99999', '88888');

    // Navigate away immediately (before 1s debounce completes)
    await page.goto('/');
    await page.waitForSelector('#uc');

    // Page loaded without errors — fill again and verify
    await fillMinimal(page, '99999', '88888');
    await waitForSave(page);

    const previewText = await page.locator('#preview-corpo').innerText();
    expect(previewText).toContain('99999');
  });

  test('1d — progressive auto-save survives multiple reloads', async ({ page }) => {
    // First save with minimal fields
    await fillMinimal(page, '33333', '44444');
    await waitForSave(page);

    // Reload 1
    await page.reload();
    await page.waitForSelector('#uc');

    const records1 = await readIndexedDB(page);
    expect(records1).toHaveLength(1);
    expect(records1[0].iniciais.uc).toBe('33333');

    // Restore, add more data
    await restoreViaSidebar(page, '33333-44444');
    await page.selectOption('#lider', { label: 'ANDRE DE SOUSA CARVALHO' });
    await waitForSave(page);

    // Reload 2
    await page.reload();
    await page.waitForSelector('#uc');

    // Restore again
    await restoreViaSidebar(page, '33333-44444');
    await expect(page.locator('#uc')).toHaveValue('33333');
    await expect(page.locator('#lider')).toHaveValue('ANDRE DE SOUSA CARVALHO');
  });
});
