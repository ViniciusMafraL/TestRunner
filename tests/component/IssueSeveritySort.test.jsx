import { afterEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IssueTracker } from '../../src/pages/IssueTracker/IssueTracker.jsx';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

const CRITICAL_TITLE = 'Crash ao abrir o Hub em dispositivos Android'; // BUG-001, Critical, Open
const NORMAL_TITLE = 'Issue reaberta com versão malformada'; // BUG-008, Normal, Reopen (dobra na seção Open)

// Ordem dos títulos no primeiro grupo de status (Open) da primeira tabela.
function openGroupTitles(container) {
  const firstTable = container.querySelector('table');
  return within(firstTable)
    .getAllByRole('row')
    .slice(1) // pula o cabeçalho
    .map((row) => row.textContent);
}

function titleIndex(titles, needle) {
  return titles.findIndex((text) => text.includes(needle));
}

describe('IssueTracker - ordenação por severidade', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('o botão de sort cicla os glifos »« → » → « → »«', async () => {
    seedSession({ kind: 'google', displayName: 'Carlos', role: 'admin', canWrite: true, token: 't', epoch: 1 });
    const { container } = renderWithProviders(<IssueTracker />);
    await screen.findByText(CRITICAL_TITLE);

    const sortButton = container.querySelector('.col-sort-btn');
    expect(sortButton.textContent).toBe('»«');
    expect(sortButton.className).not.toContain('col-sort-btn--active');

    await userEvent.click(sortButton);
    expect(container.querySelector('.col-sort-btn').textContent).toBe('»');
    expect(container.querySelector('.col-sort-btn').className).toContain('col-sort-btn--active');

    await userEvent.click(container.querySelector('.col-sort-btn'));
    expect(container.querySelector('.col-sort-btn').textContent).toBe('«');

    await userEvent.click(container.querySelector('.col-sort-btn'));
    expect(container.querySelector('.col-sort-btn').textContent).toBe('»«');
    expect(container.querySelector('.col-sort-btn').className).not.toContain('col-sort-btn--active');
  });

  it('modo « (menos crítico primeiro) reordena as linhas do grupo', async () => {
    seedSession({ kind: 'google', displayName: 'Carlos', role: 'admin', canWrite: true, token: 't', epoch: 1 });
    const { container } = renderWithProviders(<IssueTracker />);
    await screen.findByText(CRITICAL_TITLE);

    // Padrão (por id): BUG-001 (Critical) antes de BUG-008 (Normal).
    const defaultTitles = openGroupTitles(container);
    expect(titleIndex(defaultTitles, CRITICAL_TITLE)).toBeLessThan(titleIndex(defaultTitles, NORMAL_TITLE));

    const sortButton = container.querySelector('.col-sort-btn');
    await userEvent.click(sortButton); // »  mais crítico primeiro
    await userEvent.click(container.querySelector('.col-sort-btn')); // «  menos crítico primeiro

    const leastTitles = openGroupTitles(container);
    expect(titleIndex(leastTitles, NORMAL_TITLE)).toBeLessThan(titleIndex(leastTitles, CRITICAL_TITLE));
  });

  it('mantém o nome acessível do cabeçalho Severity intacto (botão aria-hidden)', async () => {
    seedSession({ kind: 'google', displayName: 'Carlos', role: 'admin', canWrite: true, token: 't', epoch: 1 });
    renderWithProviders(<IssueTracker />);
    await screen.findByText(CRITICAL_TITLE);

    expect(screen.getAllByRole('columnheader', { name: 'Severity' }).length).toBeGreaterThan(0);
  });
});
