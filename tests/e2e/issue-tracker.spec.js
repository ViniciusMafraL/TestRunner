import { expect, test } from '@playwright/test';

test.describe('User Story 3 - Gestão de status no Issue Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Entrar com Google' }).click();
    await page.getByRole('link', { name: 'Issue Tracker' }).click();
  });

  test('mostra a seção de status não reconhecido', async ({ page }) => {
    await expect(page.getByText(/Não reconhecido/)).toBeVisible();
  });

  test('reverte status ao anterior quando a gravação falha', async ({ page }) => {
    const row = page.getByRole('row').filter({ hasText: 'Placar não atualiza em tempo real' });
    await row.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Done' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(row.getByRole('combobox')).toContainText('In progress');
  });

  test('menu lateral mostra Issue Tracker acima de Test Plan', async ({ page }) => {
    const labels = await page.locator('.app-nav-link').allTextContents();
    const issueTrackerIndex = labels.findIndex((text) => text.includes('Issue Tracker'));
    const testPlanIndex = labels.findIndex((text) => text.includes('Test Plan'));
    expect(issueTrackerIndex).toBeGreaterThanOrEqual(0);
    expect(issueTrackerIndex).toBeLessThan(testPlanIndex);
  });

  test('busca filtra as issues visíveis por Title ou ID', async ({ page }) => {
    await page.getByPlaceholder('Buscar por Title ou ID').fill('placar');
    await expect(page.getByText('Placar não atualiza em tempo real')).toBeVisible();
    await expect(page.getByText('Crash ao abrir o Hub em dispositivos Android')).not.toBeVisible();
  });

  test('alternar uma coluna no seletor persiste após reload', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'Store' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Columns' }).click();
    await page.getByRole('checkbox', { name: 'Store' }).uncheck();
    await page.getByRole('button', { name: 'Fechar' }).click();
    await expect(page.getByRole('columnheader', { name: 'Store' })).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole('columnheader', { name: 'Store' })).toHaveCount(0);
  });

  test('ativar muitas colunas aciona rolagem horizontal na tabela', async ({ page }) => {
    await page.getByRole('button', { name: 'Columns' }).click();
    for (const field of ['ID', 'Tag', 'Platform', 'Description', 'Attachment', 'Created In']) {
      await page.getByRole('checkbox', { name: field }).check();
    }
    await page.getByRole('button', { name: 'Fechar' }).click();

    const wrapper = page.locator('.table-scroll-wrapper').first();
    const { scrollWidth, clientWidth } = await wrapper.evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(scrollWidth).toBeGreaterThan(clientWidth);
  });

  test('botão flutuante "New Report" navega para a tela de Reporter', async ({ page }) => {
    await expect(page.locator('a.fab')).toHaveText('New Report');
    await page.locator('a.fab').click();
    await expect(page).toHaveURL(/\/reporter/);
  });
});
