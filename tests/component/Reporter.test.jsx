import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Reporter } from '../../src/pages/Reporter/Reporter.jsx';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

describe('Reporter (componente)', () => {
  it('bloqueia o envio sem Title ou Version', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<Reporter />);

    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('Title é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('Version é obrigatório')).toBeInTheDocument();
  });

  it('cria a issue com sucesso quando Title e Version estão preenchidos', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<Reporter />);

    await userEvent.type(screen.getByLabelText(/Title/), 'Bug no login');
    await userEvent.type(screen.getByLabelText(/Version/), '3.0.0');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText(/criada com status Open/)).toBeInTheDocument();
  });

  it('convidado vê mensagem de somente leitura em vez do formulário', () => {
    seedSession({ kind: 'guest', displayName: 'Visitante', canWrite: false });
    renderWithProviders(<Reporter />);

    expect(screen.getByText(/somente leitura/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar' })).not.toBeInTheDocument();
  });
});
