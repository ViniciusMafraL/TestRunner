import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IssueTracker } from '../../src/pages/IssueTracker/IssueTracker.jsx';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

describe('IssueTracker (componente)', () => {
  it('mostra issues agrupadas por status, incluindo a seção não reconhecido', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<IssueTracker />);

    expect(await screen.findByText(/Não reconhecido/)).toBeInTheDocument();
    expect(screen.getByText('Issue de exemplo com status fora do enum conhecido')).toBeInTheDocument();
  });

  it('não exibe a coluna ID por padrão', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<IssueTracker />);

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');
    expect(screen.queryByRole('columnheader', { name: 'ID' })).not.toBeInTheDocument();
  });

  it('convidado não vê seletor de status, apenas o texto', async () => {
    seedSession({ kind: 'guest', displayName: 'Visitante', canWrite: false });
    renderWithProviders(<IssueTracker />);

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');
    const row = screen.getByText('Crash ao abrir o Hub em dispositivos Android').closest('tr');
    expect(within(row).queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('busca filtra issues por Title', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<IssueTracker />);

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');
    await userEvent.type(screen.getByRole('searchbox'), 'placar');

    expect(screen.getByText('Placar não atualiza em tempo real')).toBeInTheDocument();
    expect(screen.queryByText('Crash ao abrir o Hub em dispositivos Android')).not.toBeInTheDocument();
  });

  it('busca filtra issues por ID', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<IssueTracker />);

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');
    await userEvent.type(screen.getByRole('searchbox'), 'BUG-002');

    expect(screen.getByText('Placar não atualiza em tempo real')).toBeInTheDocument();
    expect(screen.queryByText('Crash ao abrir o Hub em dispositivos Android')).not.toBeInTheDocument();
  });

  it('permite alternar a visibilidade de uma coluna via o seletor de colunas', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<IssueTracker />);

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');
    expect(screen.queryByRole('columnheader', { name: 'ID' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Columns' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'ID' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(screen.getAllByRole('columnheader', { name: 'ID' })[0]).toBeInTheDocument();
  });

  it('exibe o botão flutuante "New Report" apontando para /reporter', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<IssueTracker />);

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');
    const fab = screen.getByRole('link', { name: 'New Report' });
    expect(fab).toHaveAttribute('href', '/reporter');
  });
});
