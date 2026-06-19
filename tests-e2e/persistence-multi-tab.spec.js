// tests-e2e/persistence-multi-tab.spec.js
import { test, expect } from '@playwright/test';
import {
  readIndexedDB,
  clearIndexedDB,
  fillMinimal,
  restoreViaSidebar,
  deleteViaSidebar,
  waitForSave,
} from './helpers/persistence.js';

test.describe('Persistence — Multi-Tab', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#uc');
    await clearIndexedDB(page);
    await page.goto('/');
    await page.waitForSelector('#uc');
  });

  test('3a — tab B sees data saved by tab A', async ({ page, context }) => {
    // Tab A fills and saves
    await fillMinimal(page, '11111', '22222');
    await waitForSave(page);

    // Tab B opens
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.waitForSelector('#uc');

    // Tab B can read the data from IndexedDB
    const records = await readIndexedDB(page2);
    expect(records).toHaveLength(1);
    expect(records[0].iniciais.uc).toBe('11111');

    // Tab B opens sidebar and sees the record
    await page2.click('#hamburger');
    await page2.waitForSelector('#sidebar-list .sidebar-item');
    const item = page2.locator('#sidebar-list .sidebar-item', { hasText: '11111' });
    await expect(item).toBeVisible();

    await page2.close();
  });

  test('3b — tab A edits, tab B reload sees the update', async ({ page, context }) => {
    // Both tabs start with the same data
    await fillMinimal(page, '11111', '22222');
    await waitForSave(page);

    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.waitForSelector('#uc');

    // Tab A adds more data
    await page.selectOption('#lider', { label: 'ANDRE DE SOUSA CARVALHO' });
    await waitForSave(page);

    // Tab B reloads and restores
    await page2.reload();
    await page2.waitForSelector('#uc');
    await restoreViaSidebar(page2, '11111-22222');
    await expect(page2.locator('#lider')).toHaveValue('ANDRE DE SOUSA CARVALHO');

    await page2.close();
  });

  test('3c — tab B deletes record, tab A creates new without crash', async ({ page, context }) => {
    // Tab A saves
    await fillMinimal(page, '55555', '66666');
    await waitForSave(page);

    // Tab B deletes the record
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.waitForSelector('#uc');
    await deleteViaSidebar(page2, '55555-66666');
    await waitForSave(page2);

    // Verify record is gone from IndexedDB
    const records = await readIndexedDB(page2);
    expect(records).toHaveLength(0);

    // Tab A continues working — fills new data (gets new UUID since old was deleted)
    await page.selectOption('#lider', { label: 'ANDRE DE SOUSA CARVALHO' });
    await waitForSave(page);

    // Tab A didn't crash and saved new data
    await expect(page.locator('#lider')).toHaveValue('ANDRE DE SOUSA CARVALHO');
    const recordsFinal = await readIndexedDB(page);
    expect(recordsFinal.length).toBeGreaterThanOrEqual(1);

    await page2.close();
  });

});
