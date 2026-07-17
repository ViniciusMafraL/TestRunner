import { afterEach, describe, expect, it } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Layout } from '../../src/components/Layout/Layout.jsx';
import { PublishUpdateButton } from '../../src/components/PublishUpdateButton/PublishUpdateButton.jsx';
import { notifyOutdatedSession } from '../../src/api/outdatedSession.js';
import { MOCK_EPOCH_KEY } from '../../src/api/mock/system.js';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

describe('Force update (versionamento de sessão)', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('sessão de época antiga cai no aviso bloqueante ao carregar', async () => {
    // Save local antigo: sessão da época 1 com o "servidor" já na 2.
    seedSession({ kind: 'google', displayName: 'Carlos', role: 'admin', canWrite: true, token: 't', epoch: 1 });
    localStorage.setItem(MOCK_EPOCH_KEY, '2');
    renderWithProviders(<Layout />);

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Nova versão disponível')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Relogar' })).toBeInTheDocument();
  });

  it('sessão da época atual não mostra o aviso', async () => {
    seedSession({ kind: 'google', displayName: 'Carlos', role: 'admin', canWrite: true, token: 't', epoch: 1 });
    renderWithProviders(<Layout />);

    await screen.findByRole('navigation');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('o aviso aparece quando a camada de API sinaliza sessão desatualizada (modo real)', async () => {
    seedSession({ kind: 'google', displayName: 'Carlos', role: 'admin', canWrite: true, token: 't', epoch: 1 });
    renderWithProviders(<Layout />);
    await screen.findByRole('navigation');

    act(() => notifyOutdatedSession());

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  });

  it('"Relogar" encerra a sessão', async () => {
    seedSession({ kind: 'google', displayName: 'Carlos', role: 'admin', canWrite: true, token: 't', epoch: 1 });
    localStorage.setItem(MOCK_EPOCH_KEY, '2');
    renderWithProviders(<Layout />);

    await userEvent.click(await screen.findByRole('button', { name: 'Relogar' }));

    await waitFor(() => expect(localStorage.getItem('workflow_session')).toBeNull());
  });

  it('admin publica atualização, avança a época e mantém a própria sessão válida', async () => {
    seedSession({ kind: 'google', displayName: 'Carlos', role: 'admin', canWrite: true, token: 't', epoch: 1 });
    renderWithProviders(<PublishUpdateButton />);

    await userEvent.click(screen.getByRole('button', { name: /Publicar atualização/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(/versão 2/);
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(MOCK_EPOCH_KEY))).toBe(2);
    });
    // Quem publicou não pode se autodeslogar: a sessão é re-carimbada.
    expect(JSON.parse(localStorage.getItem('workflow_session')).epoch).toBe(2);
  });

  it('não-admin não vê a ferramenta de publicar', () => {
    seedSession({ kind: 'google', displayName: 'Visitante', role: 'viewer', canWrite: false, token: 't', epoch: 1 });
    renderWithProviders(<PublishUpdateButton />);

    expect(screen.queryByRole('button', { name: /Publicar atualização/ })).not.toBeInTheDocument();
  });
});
