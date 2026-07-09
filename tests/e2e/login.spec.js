import { expect, test } from '@playwright/test';

test.describe('User Story 1 - Login e navegação protegida', () => {
  test('redireciona para o login quando não autenticado', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login fixo dá acesso completo ao menu com 5 seções', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Entrar com Google' }).click();
    await expect(page).toHaveURL(/\/home/);
    for (const section of ['Home', 'Test Run', 'Test Plan', 'Issue Tracker', 'Report']) {
      await expect(page.getByRole('link', { name: section })).toBeVisible();
    }
  });

  test('não oferece mais login como convidado (removido por segurança)', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/convidado/i)).toHaveCount(0);
  });

  test('sessão persiste após reload', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Entrar com Google' }).click();
    await expect(page).toHaveURL(/\/home/);
    await page.reload();
    await expect(page).toHaveURL(/\/home/);
  });
});
