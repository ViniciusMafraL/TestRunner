import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IssueTracker } from '../../src/pages/IssueTracker/IssueTracker.jsx';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(window.navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  return writeText;
}

describe('IssueTracker - seleção em lote (componente)', () => {
  it('checkboxes das linhas ficam ocultos até habilitar no header', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<IssueTracker />);

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');
    expect(screen.queryByRole('checkbox', { name: 'Selecionar issue BUG-001' })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Selecionar todas as issues do grupo Open' })).toBeInTheDocument();
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New Report' })).toBeInTheDocument();
  });

  it('header liga o modo, seleciona o grupo e mostra a barra flutuante', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<IssueTracker />);

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Selecionar todas as issues do grupo Open' }));

    const toolbar = screen.getByRole('toolbar');
    expect(within(toolbar).getByText('2 selecionadas')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Selecionar issue BUG-001' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Selecionar issue BUG-008' })).toBeChecked();
    // Linhas de outros grupos ficam habilitadas para seleção individual.
    expect(screen.getByRole('checkbox', { name: 'Selecionar issue BUG-003' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'Selecionar issue BUG-003' })).not.toBeChecked();
    // O botão New Report dá lugar à barra.
    expect(screen.queryByRole('link', { name: 'New Report' })).not.toBeInTheDocument();
  });

  it('Copiar links envia os deep links das selecionadas para a área de transferência', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    const writeText = mockClipboard();
    renderWithProviders(<IssueTracker />);

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Selecionar todas as issues do grupo Open' }));
    await userEvent.click(screen.getByRole('button', { name: 'Copiar links' }));

    const base = `${window.location.origin}${window.location.pathname}`;
    expect(writeText).toHaveBeenCalledWith(
      [
        `${base}#/issue-tracker/BUG-001?op=sportia&project=Sportia`,
        `${base}#/issue-tracker/BUG-008?op=sportia&project=Sportia`,
      ].join('\n'),
    );
    expect(await screen.findByText('2 links copiados')).toBeInTheDocument();
  });

  it('Arquivar muda o status para "Arquivado" e as issues caem em Não reconhecido', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<IssueTracker />);

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Selecionar todas as issues do grupo Open' }));
    await userEvent.click(screen.getByRole('button', { name: 'Arquivar' }));

    expect(await screen.findByText('2 issues arquivadas')).toBeInTheDocument();
    const row = screen.getByText('Crash ao abrir o Hub em dispositivos Android').closest('tr');
    expect(within(row).getByRole('combobox')).toHaveTextContent('Arquivado');
  });

  it('falha parcial mantém a issue que falhou selecionada e reporta na barra (BUG-002 simula 409)', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<IssueTracker />);

    await screen.findByText('Placar não atualiza em tempo real');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Selecionar todas as issues do grupo In progress' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Selecionar issue BUG-003' }));
    await userEvent.click(screen.getByRole('button', { name: 'Arquivar' }));

    expect(await screen.findByText('1 arquivada(s); falhou em: BUG-002')).toBeInTheDocument();
    // A que falhou continua no status original e selecionada para nova tentativa.
    const failedRow = screen.getByText('Placar não atualiza em tempo real').closest('tr');
    expect(within(failedRow).getByRole('combobox')).toHaveTextContent('In progress');
    expect(screen.getByRole('checkbox', { name: 'Selecionar issue BUG-002' })).toBeChecked();
    // A que deu certo foi arquivada.
    const archivedRow = screen.getByText('Texto cortado no menu de configurações').closest('tr');
    expect(within(archivedRow).getByRole('combobox')).toHaveTextContent('Arquivado');
  });

  it('convidado pode copiar links, mas não vê Arquivar', async () => {
    seedSession({ kind: 'guest', displayName: 'Visitante', canWrite: false });
    renderWithProviders(<IssueTracker />);

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Selecionar todas as issues do grupo Open' }));

    expect(screen.getByRole('button', { name: 'Copiar links' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Arquivar' })).not.toBeInTheDocument();
  });

  it('Cancelar sai do modo de seleção e esconde os checkboxes de novo', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<IssueTracker />);

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Selecionar todas as issues do grupo Open' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => {
      expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    });
    expect(screen.queryByRole('checkbox', { name: 'Selecionar issue BUG-001' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'New Report' })).toBeInTheDocument();
  });
});
