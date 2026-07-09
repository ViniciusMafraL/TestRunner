import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from '../../src/pages/Login/Login.jsx';
import { renderWithProviders } from '../testUtils.jsx';

describe('Login (componente)', () => {
  it('entra com o Google (simulado no mock) e ganha sessão com escrita, papel e token', async () => {
    renderWithProviders(<Login />);
    await userEvent.click(screen.getByRole('button', { name: 'Entrar com Google' }));
    await waitFor(() => {
      expect(localStorage.getItem('workflow_session')).toContain('"canWrite":true');
    });
    expect(localStorage.getItem('workflow_session')).toContain('"role":"admin"');
    expect(localStorage.getItem('workflow_session')).toContain('"token"');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('não oferece mais login como convidado (removido por segurança)', () => {
    renderWithProviders(<Login />);
    expect(screen.queryByText(/convidado/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /convidado/i })).not.toBeInTheDocument();
  });
});
