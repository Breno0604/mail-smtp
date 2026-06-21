import { test, expect } from '@playwright/test';

test.describe('Form Fill and Preview E2E', () => {
  test('should fill the form and verify email preview and dynamic fields', async ({ page }) => {
    // Navigate to the local server
    await page.goto('/');

    // Wait for initial elements to load
    await page.waitForSelector('#uc');

    // Fill Initial Fields
    await page.fill('#uc', '123456');
    await page.fill('#os', '987654321');
    await page.selectOption('#lider', { label: 'ANDRE DE SOUSA CARVALHO' });
    await page.selectOption('#parceiro', { label: 'JOSE DOGIVAN DA SILVA' });
    await page.selectOption('#municipio', { label: 'FORTALEZA' });
    await page.selectOption('#notificado', { label: 'SIM' });
    await page.selectOption('#placa', { label: 'RHS6G02' });

    // Fill Date/Time fields
    await page.fill('#data', '2026-06-13');
    await page.fill('#hora_inicio', '08:00');
    await page.fill('#hora_fim', '17:00');

    // Verify initially that retorno-placeholder is visible
    await expect(page.locator('#retorno-placeholder')).toBeVisible();

    // Select Tipo de Ordem
    await page.selectOption('#tipo-ordem', 'CORTE POR FALTA DE PAGAMENTO');

    // Verify retorno-campos has loaded the situacao_corte field
    await page.waitForSelector('#situacao_corte');
    await expect(page.locator('#retorno-placeholder')).not.toBeVisible();

    // Fill Retorno Field
    await page.selectOption('#situacao_corte', 'CLIENTE CORTADO');

    // Add Equipment
    await page.click('#btn-add-equip');

    // Wait for the equipment row to appear
    await page.waitForSelector('.equip-row');

    // Fill equipment row
    const statusSelect = page.locator('.equip-row select').first();
    const catSelect = page.locator('.equip-row select').nth(1);
    const numInput = page.locator('.equip-row input.equip-numero').first();

    await statusSelect.selectOption('Instalado');
    await catSelect.selectOption('Medidor');
    await numInput.fill('99999');

    // Fill Complemento
    await page.fill('#complemento-corpo', 'Complemento E2E de teste automatizado');

    // Check Live Preview
    const preview = page.locator('#preview-corpo');
    await expect(preview).toBeVisible();

    // Get text content of preview
    const previewText = await preview.innerText();
    expect(previewText).toContain('123456');
    expect(previewText).toContain('987654321');
    expect(previewText).toContain('ANDRE DE SOUSA CARVALHO');
    expect(previewText).toContain('CLIENTE CORTADO');
    expect(previewText).toContain('99999');

    // Verify complemento-corpo value directly
    await expect(page.locator('#complemento-corpo')).toHaveValue(
      'Complemento E2E de teste automatizado'
    );

    // Keep browser open so user can inspect the final state
    // Pressione F8 ou clique em "Resume" no Playwright Inspector para fechar
    await page.pause();
  });
});
