import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Reporter } from '../../src/pages/Reporter/Reporter.jsx';
import { getIssueById, resetStore } from '../../src/api/mock/store.js';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

describe('Reporter - Found By múltiplo (componente)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('permite selecionar mais de um QA registrado e grava separado por vírgula', async () => {
    seedSession({ kind: 'google', displayName: 'Carlos', role: 'admin', canWrite: true });
    renderWithProviders(<Reporter />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Title' }), 'Bug encontrado em dupla');
    await userEvent.type(screen.getByLabelText(/Version/), '2.0.0');

    await userEvent.click(screen.getByRole('button', { name: 'Found By' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Carlos' }));
    // O popup continua aberto para marcar mais pessoas.
    await userEvent.click(screen.getByRole('option', { name: 'Karen' }));
    await userEvent.keyboard('{Escape}');

    // O gatilho resume as seleções.
    expect(screen.getByRole('button', { name: 'Found By' })).toHaveTextContent('Carlos, Karen');

    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await screen.findByText(/criada com status Open/);
    expect(getIssueById('BUG-009').foundBy).toBe('Carlos, Karen');
  });

  it('desmarcar uma pessoa remove da seleção', async () => {
    seedSession({ kind: 'google', displayName: 'Carlos', role: 'admin', canWrite: true });
    renderWithProviders(<Reporter />);

    await userEvent.click(screen.getByRole('button', { name: 'Found By' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Carlos' }));
    await userEvent.click(screen.getByRole('option', { name: 'Karen' }));
    await userEvent.click(screen.getByRole('option', { name: 'Carlos' }));
    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Found By' })).toHaveTextContent('Karen');
  });
});
