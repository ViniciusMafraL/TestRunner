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

  it('em issue Open, o dev vê In progress, To review e Fixed For Next Build', async () => {
    seedDeveloper();
    renderWithProviders(<IssueTracker />);

    const openRow = (await screen.findByText('Crash ao abrir o Hub em dispositivos Android')).closest('tr');
    const combobox = within(openRow).getByRole('combobox');
    await userEvent.click(combobox);

    expect(screen.getByRole('option', { name: 'In progress' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'To review' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Fixed For Next Build' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Fixed' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Closed' })).not.toBeInTheDocument();
  });

  it('em issue In progress, o dev só pode marcar Fixed For Next Build', async () => {
    seedDeveloper();
    renderWithProviders(<IssueTracker />);

    const inProgressRow = (await screen.findByText('Placar não atualiza em tempo real')).closest('tr');
    await userEvent.click(within(inProgressRow).getByRole('combobox'));

    expect(screen.getByRole('option', { name: 'Fixed For Next Build' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'To review' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Fixed' })).not.toBeInTheDocument();
  });

  it('depois de marcar Fixed For Next Build, o dev ainda pode devolver ao QA (To review)', async () => {
    seedDeveloper();
    renderWithProviders(<IssueTracker />);

    const openRow = (await screen.findByText('Crash ao abrir o Hub em dispositivos Android')).closest('tr');
    await userEvent.click(within(openRow).getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Fixed For Next Build' }));

    // Quando a build sai, ele manda para o QA retestar — e só isso.
    const movedRow = (await screen.findByText('Crash ao abrir o Hub em dispositivos Android')).closest('tr');
    const combobox = within(movedRow).getByRole('combobox');
    expect(combobox).toHaveTextContent('Fixed For Next Build');
    await userEvent.click(combobox);
    expect(screen.getByRole('option', { name: 'To review' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Fixed' })).not.toBeInTheDocument();
  });

  it('em issue já concluída (Fixed), o status é somente leitura para o dev', async () => {
    seedDeveloper();
    renderWithProviders(<IssueTracker />);

    const fixedRow = (await screen.findByText('Ícone do Hub com cor errada')).closest('tr');
    expect(within(fixedRow).queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('mover uma issue Open para In progress persiste (não some do tracker)', async () => {
    seedDeveloper();
    renderWithProviders(<IssueTracker />);

    const openRow = (await screen.findByText('Crash ao abrir o Hub em dispositivos Android')).closest('tr');
    await userEvent.click(within(openRow).getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'In progress' }));

    // A issue continua visível, agora na seção In progress — onde o dev ainda
    // pode avançá-la para Fixed For Next Build (e só para isso).
    const movedRow = (await screen.findByText('Crash ao abrir o Hub em dispositivos Android')).closest('tr');
    const movedCombobox = within(movedRow).getByRole('combobox');
    expect(movedCombobox).toHaveTextContent('In progress');
    await userEvent.click(movedCombobox);
    expect(screen.getByRole('option', { name: 'Fixed For Next Build' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'To review' })).not.toBeInTheDocument();
  });
});
