import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from '../../src/pages/Login/Login.jsx';
import { renderWithProviders } from '../testUtils.jsx';

describe('Login (componente)', () => {
  it('entra com um login fixo válido e não mostra erro', async () => {
    renderWithProviders(<Login />);
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => {
      expect(localStorage.getItem('workflow_session')).toContain('"canWrite":true');
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('entra como convidado informando um nome e ganha sessão somente leitura', async () => {
    renderWithProviders(<Login />);
    await userEvent.type(screen.getByLabelText(/Ou entre como convidado/), 'Fulano');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar como convidado' }));
    await waitFor(() => {
      expect(localStorage.getItem('workflow_session')).toContain('"canWrite":false');
    });
  });

  it('bloqueia o login como convidado sem nome', async () => {
    renderWithProviders(<Login />);
    await userEvent.click(screen.getByRole('button', { name: 'Entrar como convidado' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/nome/i);
  });
});
