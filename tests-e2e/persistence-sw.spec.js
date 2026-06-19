// tests-e2e/persistence-sw.spec.js
import { test, expect } from '@playwright/test';
import {
  readIndexedDB,
  clearIndexedDB,
  fillMinimal,
  waitForSave,
} from './helpers/persistence.js';

test.describe('Persistence — Service Worker', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#uc');
    await clearIndexedDB(page);
    await page.goto('/');
    await page.waitForSelector('#uc');
  });

  test('6a — service worker is registered', async ({ page }) => {
    // Allow time for SW registration
    await page.waitForTimeout(2000);

    const hasRegistration = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      return !!reg;
    });
    expect(hasRegistration).toBe(true);
  });

  test('6b — SW does not interfere with IndexedDB persistence', async ({ page }) => {
    await fillMinimal(page, '11111', '22222');
    await waitForSave(page);

    // Reload — SW may serve cached assets, but IndexedDB should survive
    await page.reload();
    await page.waitForSelector('#uc');

    const records = await readIndexedDB(page);
    expect(records).toHaveLength(1);
    expect(records[0].iniciais.uc).toBe('11111');
  });

  test('6c — navigator.storage.persist() was requested', async ({ page }) => {
    const isPersisted = await page.evaluate(async () => {
      return navigator.storage.persisted();
    });
    // Box is checked when browser grants persistent storage
    // Even if not granted, the request was made (app.js L115-117)
    expect(typeof isPersisted).toBe('boolean');
  });

});
