import { afterEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IssueTracker } from '../../src/pages/IssueTracker/IssueTracker.jsx';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

function seedDeveloper() {
  seedSession({ kind: 'google', displayName: 'Dev', role: 'developer', canWrite: false, operations: 'sportia', token: 't', epoch: 1 });
}

describe('IssueTracker — editor de status do desenvolvedor', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('em issue Open, o dev vê seletor só com In progress e To review', async () => {
    seedDeveloper();
    renderWithProviders(<IssueTracker />);

    const openRow = (await screen.findByText('Crash ao abrir o Hub em dispositivos Android')).closest('tr');
    const combobox = within(openRow).getByRole('combobox');
    await userEvent.click(combobox);

    expect(screen.getByRole('option', { name: 'In progress' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'To review' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Fixed' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Closed' })).not.toBeInTheDocument();
  });

  it('em issue que não está Open, o status é somente leitura (sem seletor)', async () => {
    seedDeveloper();
    renderWithProviders(<IssueTracker />);

    const inProgressRow = (await screen.findByText('Placar não atualiza em tempo real')).closest('tr');
    expect(within(inProgressRow).queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('mover uma issue Open para In progress persiste (não some do tracker)', async () => {
    seedDeveloper();
    renderWithProviders(<IssueTracker />);

    const openRow = (await screen.findByText('Crash ao abrir o Hub em dispositivos Android')).closest('tr');
    await userEvent.click(within(openRow).getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'In progress' }));

    // A issue continua visível; agora na seção In progress (status somente leitura).
    const movedRow = (await screen.findByText('Crash ao abrir o Hub em dispositivos Android')).closest('tr');
    expect(within(movedRow).queryByRole('combobox')).not.toBeInTheDocument();
  });
});
