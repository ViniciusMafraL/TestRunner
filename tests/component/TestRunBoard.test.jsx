import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { TestRun } from '../../src/pages/TestRun/TestRun.jsx';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

function createDataTransfer() {
  const data = {};
  return {
    setData: (key, value) => {
      data[key] = value;
    },
    getData: (key) => data[key],
  };
}

describe('TestRun board (componente)', () => {
  it('mostra as 3 colunas com contadores e cartões', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<TestRun />);

    expect(await screen.findByText('build-214')).toBeInTheDocument();
    expect(screen.getByText('Pendente (1)')).toBeInTheDocument();
    expect(screen.getByText('Em andamento (1)')).toBeInTheDocument();
    expect(screen.getByText('Finalizado (1)')).toBeInTheDocument();
  });

  it('não exibe mais nenhum seletor de status nos cartões', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<TestRun />);

    await screen.findByText('build-214');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('move um cartão para outra coluna ao arrastar e soltar', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<TestRun />);

    await screen.findByText('build-214');
    const card = screen.getByText('build-214').closest('[data-testid="test-run-card"]');
    const targetColumn = screen.getByText('Finalizado (1)').closest('.card');

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.dragOver(targetColumn, { dataTransfer });
    fireEvent.drop(targetColumn, { dataTransfer });

    await waitFor(() => expect(screen.getAllByText(/Finalizado \(\d+\)/)[0]).toHaveTextContent('Finalizado (2)'));
  });

  it('convidado não vê o botão de nova demanda e não consegue arrastar cartões', async () => {
    seedSession({ kind: 'guest', displayName: 'Visitante', canWrite: false });
    renderWithProviders(<TestRun />);
    expect(screen.queryByRole('button', { name: 'Nova demanda' })).not.toBeInTheDocument();

    await screen.findByText('build-214');
    const card = screen.getByText('build-214').closest('[data-testid="test-run-card"]');
    expect(card).toHaveAttribute('draggable', 'false');
  });

  it('reverte a coluna e avisa o usuário quando a gravação falha (RUN-002 simula conflito)', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderWithProviders(<TestRun />);

    await screen.findByText('build-213');
    const card = screen.getByText('build-213').closest('[data-testid="test-run-card"]');
    const targetColumn = screen.getByText('Finalizado (1)').closest('.card');

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.dragOver(targetColumn, { dataTransfer });
    fireEvent.drop(targetColumn, { dataTransfer });

    expect(await screen.findByRole('alert')).toHaveTextContent(/Não foi possível salvar/);
    await waitFor(() => expect(screen.getByText('Em andamento (1)')).toBeInTheDocument());
    expect(screen.getByText('Finalizado (1)')).toBeInTheDocument();
  });
});
