import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { IssueTracker } from '../../src/pages/IssueTracker/IssueTracker.jsx';
import { resetStore } from '../../src/api/mock/store.js';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

/* A issue aberta vive na URL, então o IssueTracker precisa da rota com :issueId. */
function renderTracker(route = '/issue-tracker') {
  return renderWithProviders(
    <Routes>
      <Route path="/issue-tracker/:issueId?" element={<IssueTracker />} />
    </Routes>,
    { route },
  );
}

async function openIssueModal(title) {
  await screen.findByText(title);
  await userEvent.click(screen.getByText(title));
  return screen.getByRole('dialog');
}

describe('IssueDetailModal - edição de issue (componente)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('QA administrador edita title e severity pela janela de detalhes', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderTracker();

    const dialog = await openIssueModal('Crash ao abrir o Hub em dispositivos Android');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Editar' }));

    const titleInput = within(dialog).getByRole('textbox', { name: 'Title' });
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Crash corrigido no Hub');

    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Severity' }));
    await userEvent.click(screen.getByRole('option', { name: 'Low' }));

    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    // Volta ao modo de visualização já com os valores persistidos.
    await waitFor(() => {
      expect(within(dialog).getByRole('heading', { name: 'Crash corrigido no Hub' })).toBeInTheDocument();
    });
    expect(within(dialog).getByText('Low')).toBeInTheDocument();
    // A tabela reflete a edição sem recarregar a página.
    expect(screen.getAllByText('Crash corrigido no Hub').length).toBeGreaterThan(0);
    expect(screen.queryByText('Crash ao abrir o Hub em dispositivos Android')).not.toBeInTheDocument();
  });

  it('valida Title obrigatório e permanece no modo de edição', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderTracker();

    const dialog = await openIssueModal('Texto cortado no menu de configurações');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Editar' }));

    await userEvent.clear(within(dialog).getByRole('textbox', { name: 'Title' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    expect(within(dialog).getByRole('alert')).toHaveTextContent('Title é obrigatório');
    expect(within(dialog).getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
  });

  it('mostra o erro no modal e mantém a edição quando a gravação falha (BUG-002 simula 409)', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderTracker();

    const dialog = await openIssueModal('Placar não atualiza em tempo real');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Editar' }));

    const titleInput = within(dialog).getByRole('textbox', { name: 'Title' });
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Tentativa de edição');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(within(dialog).getByRole('alert')).toHaveTextContent('Não foi possível salvar a alteração');
    });
    // Continua no modo de edição, sem aplicar a mudança na tabela.
    expect(within(dialog).getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
    expect(screen.getByText('Placar não atualiza em tempo real')).toBeInTheDocument();
  });

  it('convidado (somente leitura) não vê o botão Editar', async () => {
    seedSession({ kind: 'guest', displayName: 'Visitante', canWrite: false });
    renderTracker();

    const dialog = await openIssueModal('Crash ao abrir o Hub em dispositivos Android');
    expect(within(dialog).queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });
});
