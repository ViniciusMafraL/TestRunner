import { afterEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FtueOperationGate } from '../../src/components/FtueOperationGate/FtueOperationGate.jsx';
import { readStoredSession } from '../../src/auth/sessionStorage.js';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

describe('FtueOperationGate — primeira operação do desenvolvedor', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('developer sem operação vê o modal "Selecione sua operação"', async () => {
    seedSession({ kind: 'google', displayName: 'Dev', role: 'developer', canWrite: false, operations: '', token: 't', epoch: 1 });
    renderWithProviders(<FtueOperationGate />);

    expect(await screen.findByText('Selecione sua operação')).toBeInTheDocument();
  });

  it('confirmar anexa a operação, reemite a sessão e fecha o modal', async () => {
    seedSession({ kind: 'google', displayName: 'Dev', role: 'developer', canWrite: false, operations: '', token: 't', epoch: 1 });
    renderWithProviders(<FtueOperationGate />);

    await screen.findByText('Selecione sua operação');
    await userEvent.click(await screen.findByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(screen.queryByText('Selecione sua operação')).not.toBeInTheDocument();
    });
    // A sessão persistida passou a ter uma operação anexada.
    expect(readStoredSession().operations).toBeTruthy();
  });

  it('não aparece para quem já tem operação (nem para admin)', async () => {
    seedSession({ kind: 'google', displayName: 'Carlos', role: 'admin', canWrite: true, operations: '*', token: 't', epoch: 1 });
    renderWithProviders(<FtueOperationGate />);

    expect(screen.queryByText('Selecione sua operação')).not.toBeInTheDocument();
  });
});
