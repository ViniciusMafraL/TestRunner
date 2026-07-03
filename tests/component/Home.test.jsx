import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Home } from '../../src/pages/Home/Home.jsx';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

describe('Home (componente)', () => {
  it('mostra o indicador de carregamento padronizado antes dos dados chegarem', () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<Home />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('mostra os 3 contadores centralizados e a tabela de issues abertas da versão mais recente, sem coluna ID', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<Home />);
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    expect(screen.getByText('Abertas')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Crash ao abrir o Hub em dispositivos Android')).toBeInTheDocument();

    const abertasBox = screen.getByText('Abertas').closest('.card');
    expect(abertasBox).toHaveStyle({ textAlign: 'center' });

    const headerRow = document.querySelector('table thead tr');
    const headers = within(headerRow)
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent);
    expect(headers).not.toContain('ID');
    expect(headers.filter((text) => ['Status', 'Title', 'Severity', 'Found By', 'Version', 'Tag'].includes(text))).toEqual([
      'Status',
      'Title',
      'Severity',
      'Found By',
      'Version',
      'Tag',
    ]);
  });

  it('não exibe mais a caixa de cabeçalho superior', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<Home />);
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    expect(document.querySelector('.page-header-stat')).not.toBeInTheDocument();
  });

  it('abre o modal de detalhes ao clicar em uma linha', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<Home />);
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    await userEvent.click(screen.getByText('Crash ao abrir o Hub em dispositivos Android'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
