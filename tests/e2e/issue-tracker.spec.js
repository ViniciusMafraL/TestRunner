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

  test('redimensionar coluna pela alça reflete em todos os grupos e persiste', async ({ page }) => {
    const firstStatusTh = page.locator('table th[data-field="status"]').first();
    const before = await firstStatusTh.boundingBox();

    const handle = firstStatusTh.locator('.col-resize-handle');
    const handleBox = await handle.boundingBox();
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + handleBox.width / 2 + 60, handleBox.y + handleBox.height / 2, { steps: 5 });
    await page.mouse.up();

    const after = await firstStatusTh.boundingBox();
    expect(after.width).toBeGreaterThan(before.width + 40);

    // Mesma largura na segunda tabela de grupo (vars compartilhadas no container).
    const secondTableTh = page.locator('table th[data-field="status"]').nth(1);
    const second = await secondTableTh.boundingBox();
    expect(Math.abs(second.width - after.width)).toBeLessThan(2);

    await page.reload();
    const persisted = await page.locator('table th[data-field="status"]').first().boundingBox();
    expect(Math.abs(persisted.width - after.width)).toBeLessThan(2);
  });

  test('segurar e arrastar um cabeçalho reordena a coluna e persiste', async ({ page }) => {
    const headerLabels = () =>
      page
        .locator('table')
        .first()
        .locator('th[data-field]')
        .allTextContents();

    expect((await headerLabels()).slice(0, 2)).toEqual(['Status', 'Project']);

    const statusTh = page.locator('table th[data-field="status"]').first();
    const titleTh = page.locator('table th[data-field="title"]').first();
    const statusBox = await statusTh.boundingBox();
    const titleBox = await titleTh.boundingBox();

    await page.mouse.move(statusBox.x + statusBox.width / 2, statusBox.y + statusBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(300); // hold > 200ms ativa o modo de mover
    await page.mouse.move(titleBox.x + titleBox.width - 4, titleBox.y + titleBox.height / 2, { steps: 8 });
    await page.mouse.up();

    expect((await headerLabels()).slice(0, 3)).toEqual(['Project', 'Title', 'Status']);

    await page.reload();
    expect((await headerLabels()).slice(0, 3)).toEqual(['Project', 'Title', 'Status']);
  });

  test('"Restaurar padrão" no menu Columns desfaz ordem e larguras customizadas', async ({ page }) => {
    // Customiza: move Status para o fim da primeira posição via drag.
    const statusTh = page.locator('table th[data-field="status"]').first();
    const projectTh = page.locator('table th[data-field="project"]').first();
    const statusBox = await statusTh.boundingBox();
    const projectBox = await projectTh.boundingBox();
    await page.mouse.move(statusBox.x + statusBox.width / 2, statusBox.y + statusBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.move(projectBox.x + projectBox.width - 4, projectBox.y + projectBox.height / 2, { steps: 5 });
    await page.mouse.up();

    const labels = await page.locator('table').first().locator('th[data-field]').allTextContents();
    expect(labels[0]).toBe('Project');

    await page.getByRole('button', { name: 'Columns' }).click();
    await page.getByRole('button', { name: 'Restaurar padrão' }).click();
    await page.getByRole('button', { name: 'Fechar' }).click();

    const restored = await page.locator('table').first().locator('th[data-field]').allTextContents();
    expect(restored.slice(0, 2)).toEqual(['Status', 'Project']);
  });
});
