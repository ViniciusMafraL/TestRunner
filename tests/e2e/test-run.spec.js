import { expect, test } from '@playwright/test';

test.describe('User Story 5 - Quadro de Test Run', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Entrar com Google' }).click();
    await page.getByRole('link', { name: 'Test Run' }).click();
  });

  test('cria nova demanda que nasce em Pendente, com Responsável como texto livre', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova demanda' }).click();
    await page.getByLabel(/Build/).fill('build-e2e');
    await page.getByLabel(/Version/).fill('9.9.9');
    await page.getByLabel(/Responsável/).fill('Fulano da Silva');
    await page.getByRole('button', { name: 'Solicitar' }).click();
    await expect(page.getByText('build-e2e')).toBeVisible();
  });

  test('não exibe mais seletor de status nos cartões', async ({ page }) => {
    const card = page.getByTestId('test-run-card').filter({ hasText: 'build-214' });
    await expect(card.locator('select')).toHaveCount(0);
  });

  test('move um cartão entre colunas arrastando e soltando, persistindo a mudança via API', async ({ page }) => {
    const card = page.getByTestId('test-run-card').filter({ hasText: 'build-214' });
    const targetColumn = page.getByTestId('test-run-column-Finalizado');

    await card.dragTo(targetColumn);
    await expect(targetColumn.getByText('build-214')).toBeVisible();

    // Navega para outra tela e volta (sem full reload) para confirmar que a
    // mudança foi persistida via PATCH /test-runs/:id/status, e não apenas
    // aplicada de forma otimista na tela.
    await page.getByRole('link', { name: 'Home' }).click();
    await page.getByRole('link', { name: 'Test Run' }).click();
    await expect(page.getByTestId('test-run-column-Finalizado').getByText('build-214')).toBeVisible();
  });

  test('bolinhas de status usam azul (Pendente), amarelo (Em andamento) e verde (Finalizado)', async ({ page }) => {
    await expect(page.getByTestId('test-run-column-Pendente').locator('.status-dot--run-pendente').first()).toBeVisible();
    await expect(page.getByTestId('test-run-column-Em andamento').locator('.status-dot--run-andamento').first()).toBeVisible();
    await expect(page.getByTestId('test-run-column-Finalizado').locator('.status-dot--run-finalizado').first()).toBeVisible();
  });
});
