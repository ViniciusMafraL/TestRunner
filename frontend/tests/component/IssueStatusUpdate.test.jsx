import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IssueTracker } from '../../src/pages/IssueTracker/IssueTracker.jsx';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

describe('IssueTracker - atualização otimista (componente)', () => {
  it('reflete a mudança de status imediatamente', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<IssueTracker />);

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');
    const row = screen.getByText('Crash ao abrir o Hub em dispositivos Android').closest('tr');
    const select = within(row).getByRole('combobox');

    await userEvent.selectOptions(select, 'In progress');
    expect(select).toHaveValue('In progress');
  });

  it('reverte o status ao estado anterior quando a gravação falha (BUG-002 simula 409)', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<IssueTracker />);

    await screen.findByText('Placar não atualiza em tempo real');
    const initialRow = screen.getByText('Placar não atualiza em tempo real').closest('tr');
    await userEvent.selectOptions(within(initialRow).getByRole('combobox'), 'Done');

    // A issue muda de seção (In progress -> Done) assim que a atualização
    // otimista é aplicada, então a linha/select originais são desmontados;
    // é preciso reconsultar o DOM em vez de reusar a referência antiga.
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    await waitFor(() => {
      const revertedRow = screen.getByText('Placar não atualiza em tempo real').closest('tr');
      expect(within(revertedRow).getByRole('combobox')).toHaveValue('In progress');
    });
  });
});
