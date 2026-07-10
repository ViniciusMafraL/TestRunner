import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SessionProvider } from '../../src/auth/SessionContext.jsx';
import { Layout } from '../../src/components/Layout/Layout.jsx';
import { IssueTracker } from '../../src/pages/IssueTracker/IssueTracker.jsx';
import { resetStore } from '../../src/api/mock/store.js';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

function renderWithLayout(route = '/issue-tracker') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <SessionProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/issue-tracker/:issueId?" element={<IssueTracker />} />
          </Route>
        </Routes>
      </SessionProvider>
    </MemoryRouter>,
  );
}

describe('Multi-operação (componente)', () => {
  beforeEach(() => {
    resetStore();
    localStorage.clear();
  });

  it('o seletor da sidebar troca a operação e atualiza os dados', async () => {
    seedSession({ kind: 'google', displayName: 'Carlos', role: 'admin', canWrite: true });
    renderWithLayout();

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');

    await userEvent.click(screen.getByRole('combobox', { name: 'Operação' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Roblox' }));

    await screen.findByText('Lobby do mini-game X não carrega skins');
    expect(screen.queryByText('Crash ao abrir o Hub em dispositivos Android')).not.toBeInTheDocument();
  });

  it('filtra as issues por tag (Sportia, projeto único)', async () => {
    seedSession({ kind: 'google', displayName: 'Carlos', role: 'qa', canWrite: true });
    renderWithProviders(<IssueTracker />);

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');

    await userEvent.click(screen.getByRole('combobox', { name: 'Filtrar por tag' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Futebol' }));

    await waitFor(() => {
      expect(screen.queryByText('Crash ao abrir o Hub em dispositivos Android')).not.toBeInTheDocument();
    });
    // Issue com tag Futebol permanece.
    expect(screen.getByText('Placar não atualiza em tempo real')).toBeInTheDocument();
  });

  it('deep-link com ?op e ?project abre a issue na aba certa', async () => {
    seedSession({ kind: 'google', displayName: 'Carlos', role: 'qa', canWrite: true });
    renderWithProviders(
      <Routes>
        <Route path="/issue-tracker/:issueId?" element={<IssueTracker />} />
      </Routes>,
      { route: '/issue-tracker/BUG-001?op=roblox&project=Mini-game Y' },
    );

    const dialog = await screen.findByRole('dialog', { name: 'Detalhes da issue BUG-001' });
    expect(within(dialog).getByRole('heading', { name: 'Botão de compra sobreposto no mini-game Y' })).toBeInTheDocument();
  });
});
