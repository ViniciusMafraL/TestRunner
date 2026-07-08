import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Reporter } from '../../src/pages/Reporter/Reporter.jsx';
import { getIssueById, resetStore } from '../../src/api/mock/store.js';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

describe('Reporter - Keywords múltiplas (componente)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('permite selecionar várias keywords, como na planilha', async () => {
    seedSession({ kind: 'google', displayName: 'Carlos', role: 'admin', canWrite: true });
    renderWithProviders(<Reporter />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Title' }), 'Bug com várias keywords');
    await userEvent.type(screen.getByLabelText(/Version/), '2.0.0');

    await userEvent.click(screen.getByRole('button', { name: /Mais campos/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Keywords' }));
    await userEvent.click(await screen.findByRole('option', { name: 'UX' }));
    await userEvent.click(screen.getByRole('option', { name: 'Bug' }));
    await userEvent.click(screen.getByRole('option', { name: 'Incomplete' }));
    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Keywords' })).toHaveTextContent('UX, Bug, Incomplete');

    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await screen.findByText(/criada com status Open/);
    expect(getIssueById('BUG-009').keywords).toBe('UX, Bug, Incomplete');
  });
});
