import { expect, test } from '@playwright/test';

test.describe('User Story 2 - Visão geral na Home', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  });

  test('mostra os 3 contadores', async ({ page }) => {
    await expect(page.getByText('Abertas', { exact: true })).toBeVisible();
    await expect(page.getByText('Concluídas', { exact: true })).toBeVisible();
    await expect(page.getByText('Fechadas', { exact: true })).toBeVisible();
  });

  test('abre modal de detalhes ao clicar em uma linha', async ({ page }) => {
    await page.getByText('Crash ao abrir o Hub em dispositivos Android').click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('tabela de issues abertas não exibe a coluna ID e segue a ordem Status/Title/Severity/Found By/Version/Tag', async ({
    page,
  }) => {
    await page.getByText('Crash ao abrir o Hub em dispositivos Android').waitFor();
    const headerRow = page.locator('table thead tr');
    await expect(headerRow.getByRole('columnheader', { name: 'ID', exact: true })).toHaveCount(0);

    const headers = await headerRow.getByRole('columnheader').allTextContents();
    const expectedOrder = ['Status', 'Title', 'Severity', 'Found By', 'Version', 'Tag'];
    expect(headers.filter((text) => expectedOrder.includes(text))).toEqual(expectedOrder);
  });

  test('não exibe mais a caixa de cabeçalho superior', async ({ page }) => {
    await expect(page.locator('.page-header-stat')).toHaveCount(0);
  });
});
