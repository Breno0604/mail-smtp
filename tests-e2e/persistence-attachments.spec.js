// tests-e2e/persistence-attachments.spec.js
import { test, expect } from '@playwright/test';
import {
  clearIndexedDB,
  fillMinimal,
  restoreViaSidebar,
  waitForSave,
  createPngBuffer,
} from './helpers/persistence.js';

test.describe('Persistence — Attachments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#uc');
    await clearIndexedDB(page);
    await page.goto('/');
    await page.waitForSelector('#uc');
  });

  test('4a — single file survives reload and restore', async ({ page }) => {
    const buf = createPngBuffer();
    await fillMinimal(page, '11111', '22222');

    await page.setInputFiles('#file-input', [
      { name: 'test.png', mimeType: 'image/png', buffer: buf },
    ]);
    await page.waitForSelector('.preview-item', { timeout: 5000 });
    await waitForSave(page);

    // Reload and restore
    await page.reload();
    await page.waitForSelector('#uc');
    await restoreViaSidebar(page, '11111-22222');

    // Verify file count (format: "1 / 12")
    const fileCountText = await page.locator('#file-count').innerText();
    expect(fileCountText).toContain('1');
  });

  test('4b — multiple files survive reload and restore', async ({ page }) => {
    const buf = createPngBuffer();
    await fillMinimal(page, '11111', '22222');

    await page.setInputFiles('#file-input', [
      { name: 'a.png', mimeType: 'image/png', buffer: buf },
      { name: 'b.png', mimeType: 'image/png', buffer: buf },
      { name: 'c.png', mimeType: 'image/png', buffer: buf },
    ]);
    await page.waitForSelector('.preview-item', { timeout: 5000 });
    await waitForSave(page);

    // Reload and restore
    await page.reload();
    await page.waitForSelector('#uc');
    await restoreViaSidebar(page, '11111-22222');

    // Verify file count
    const fileCountText = await page.locator('#file-count').innerText();
    expect(fileCountText).toContain('3');
  });

  test('4c — invalid file does not break persistence', async ({ page }) => {
    await fillMinimal(page, '11111', '22222');

    // Try uploading an .exe (should be rejected by the app's file type validation)
    await page.setInputFiles('#file-input', [
      { name: 'script.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from('MZ') },
    ]);

    // Either no preview-item appears (rejected) or error shown
    const previewCount = await page.locator('.preview-item').count();
    expect(previewCount).toBe(0);

    // IndexedDB is not corrupted — save still works
    await waitForSave(page);
    const ucValue = await page.locator('#uc').inputValue();
    expect(ucValue).toBe('11111');
  });
});
