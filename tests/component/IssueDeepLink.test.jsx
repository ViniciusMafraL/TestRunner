import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { IssueTracker } from '../../src/pages/IssueTracker/IssueTracker.jsx';
import { resetStore } from '../../src/api/mock/store.js';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

function renderTracker(route) {
  return renderWithProviders(
    <Routes>
      <Route path="/issue-tracker/:issueId?" element={<IssueTracker />} />
    </Routes>,
    { route },
  );
}

describe('IssueTracker - issue aberta pela URL (deep link)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('abre o modal da issue direto pela URL /issue-tracker/:issueId', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderTracker('/issue-tracker/BUG-001');

    const dialog = await screen.findByRole('dialog', { name: 'Detalhes da issue BUG-001' });
    expect(within(dialog).getByRole('heading', { name: 'Crash ao abrir o Hub em dispositivos Android' })).toBeInTheDocument();
  });

  it('fechar o modal volta para a lista (/issue-tracker)', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderTracker('/issue-tracker/BUG-001');

    const dialog = await screen.findByRole('dialog', { name: 'Detalhes da issue BUG-001' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Fechar' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    // A lista continua renderizada por trás.
    expect(screen.getByText('Crash ao abrir o Hub em dispositivos Android')).toBeInTheDocument();
  });

  it('clicar em uma issue coloca o id na URL (link compartilhável)', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderTracker('/issue-tracker');

    await screen.findByText('Texto cortado no menu de configurações');
    await userEvent.click(screen.getByText('Texto cortado no menu de configurações'));

    // O modal abre a partir do parâmetro da rota, não de estado local.
    expect(await screen.findByRole('dialog', { name: 'Detalhes da issue BUG-003' })).toBeInTheDocument();
  });

  it('avisa quando o id da URL não existe, sem quebrar a lista', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderTracker('/issue-tracker/BUG-999');

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');
    expect(screen.getByRole('alert')).toHaveTextContent('Issue BUG-999 não encontrada');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
