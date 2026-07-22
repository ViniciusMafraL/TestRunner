import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { IssueTracker } from '../../src/pages/IssueTracker/IssueTracker.jsx';
import { resetStore } from '../../src/api/mock/store.js';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

function renderTracker(route) {
  return renderWithProviders(
    <Routes>
      <Route path="/issue-tracker/:issueId?" element={<IssueTracker />} />
    </Routes>,
    { route },
  );
}

describe('IssueTracker - responsável + log ao mudar status', () => {
  beforeEach(() => resetStore());

  it('developer move Open→In progress no modal: preenche Responsible e registra no log', async () => {
    seedSession({ kind: 'google', displayName: 'Karen', role: 'developer', canWrite: false, operations: 'sportia', token: 't', epoch: 1 });
    renderTracker('/issue-tracker/BUG-001');

    const dialog = await screen.findByRole('dialog', { name: 'Detalhes da issue BUG-001' });
    // Antes: sem responsável.
    expect(within(dialog).getByText('Responsible').closest('.field-row')).toHaveTextContent('—');

    // Muda o status pelo seletor do modal (dev vê In progress/To review).
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Status' }));
    await userEvent.click(screen.getByRole('option', { name: 'In progress' }));

    // Responsável passa a ser quem alterou.
    const responsibleRow = within(dialog).getByText('Responsible').closest('.field-row');
    expect(await within(responsibleRow).findByText('Karen')).toBeInTheDocument();

    // O log ganha a linha "Karen · In progress".
    expect(await within(dialog).findByText('Karen · In progress')).toBeInTheDocument();
    // A entrada base de criação continua lá.
    expect(within(dialog).getByText('Report criado')).toBeInTheDocument();
  });
});
