import { expect, test } from '@playwright/test';

test.describe('User Story 1 - Login e navegação protegida', () => {
  test('redireciona para o login quando não autenticado', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login fixo dá acesso completo ao menu com 5 seções', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page).toHaveURL(/\/home/);
    for (const section of ['Home', 'Test Run', 'Test Plan', 'Issue Tracker', 'Reporter']) {
      await expect(page.getByRole('link', { name: section })).toBeVisible();
    }
  });

  test('login como convidado não mostra ações de escrita', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/Ou entre como convidado/).fill('Visitante');
    await page.getByRole('button', { name: 'Entrar como convidado' }).click();
    await expect(page).toHaveURL(/\/home/);
    await page.getByRole('link', { name: 'Reporter' }).click();
    await expect(page.getByRole('button', { name: 'Enviar' })).toHaveCount(0);
  });

  test('sessão persiste após reload', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page).toHaveURL(/\/home/);
    await page.reload();
    await expect(page).toHaveURL(/\/home/);
  });
});
