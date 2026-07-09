import { expect, test } from '@playwright/test';

test.describe('User Story 4 - Registro de nova issue via Reporter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Entrar com Google' }).click();
    await page.getByRole('link', { name: 'Report', exact: true }).click();
  });

  test('bloqueia envio sem campos obrigatórios', async ({ page }) => {
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.getByText('Title é obrigatório')).toBeVisible();
  });

  test('cria issue completa e ela aparece na Home', async ({ page }) => {
    await page.getByLabel(/Title/).fill('Issue via e2e');
    await page.getByLabel(/Version/).fill('4.0.0');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.getByText(/criada com status Open/)).toBeVisible();
  });
});
