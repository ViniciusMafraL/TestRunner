import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { IssueTracker } from '../../src/pages/IssueTracker/IssueTracker.jsx';
import { getIssueById, resetStore } from '../../src/api/mock/store.js';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

// BUG-003 (Sportia) está em "To review"; BUG-001 está em "Open".
const IN_REVIEW = 'BUG-003';

function renderTracker(id) {
  return renderWithProviders(
    <Routes>
      <Route path="/issue-tracker/:issueId?" element={<IssueTracker />} />
    </Routes>,
    { route: `/issue-tracker/${id}` },
  );
}

function seedQa() {
  seedSession({ kind: 'google', displayName: 'Karen', role: 'qa', canWrite: true, operations: 'sportia', token: 't', epoch: 1 });
}

describe('IssueDetailModal — reteste do QA (Aprovar / Reprovar)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('QA vê Aprovar e Reprovar numa issue em To review', async () => {
    seedQa();
    renderTracker(IN_REVIEW);

    const dialog = await screen.findByRole('dialog', { name: `Detalhes da issue ${IN_REVIEW}` });
    expect(within(dialog).getByRole('button', { name: 'Aprovar' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Reprovar' })).toBeInTheDocument();
  });

  it('em issue que não está em To review, os botões não aparecem', async () => {
    seedQa();
    renderTracker('BUG-001');

    const dialog = await screen.findByRole('dialog', { name: 'Detalhes da issue BUG-001' });
    expect(within(dialog).queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Reprovar' })).not.toBeInTheDocument();
  });

  it('developer não valida reteste, mesmo com a issue em To review', async () => {
    seedSession({ kind: 'google', displayName: 'Dev', role: 'developer', canWrite: false, operations: 'sportia', token: 't', epoch: 1 });
    renderTracker(IN_REVIEW);

    const dialog = await screen.findByRole('dialog', { name: `Detalhes da issue ${IN_REVIEW}` });
    expect(within(dialog).queryByRole('button', { name: 'Aprovar' })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Reprovar' })).not.toBeInTheDocument();
  });

  it('Aprovar move a issue para Fixed', async () => {
    seedQa();
    renderTracker(IN_REVIEW);

    const dialog = await screen.findByRole('dialog', { name: `Detalhes da issue ${IN_REVIEW}` });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Aprovar' }));

    await waitFor(() => {
      expect(getIssueById(IN_REVIEW).status).toBe('Fixed');
    });
  });

  it('Reprovar sem a versão retestada não reabre a issue', async () => {
    seedQa();
    renderTracker(IN_REVIEW);

    const dialog = await screen.findByRole('dialog', { name: `Detalhes da issue ${IN_REVIEW}` });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reprovar' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar reabertura' }));

    expect(within(dialog).getByRole('alert')).toHaveTextContent('Informe a versão retestada');
    expect(getIssueById(IN_REVIEW).status).toBe('To review');
  });

  it('Reprovar com versão e evidência reabre a issue, registra no log e anexa na pasta de reopen', async () => {
    seedQa();
    renderTracker(IN_REVIEW);

    const dialog = await screen.findByRole('dialog', { name: `Detalhes da issue ${IN_REVIEW}` });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reprovar' }));

    await userEvent.type(within(dialog).getByLabelText(/Versão retestada/), '1.6.0');
    await userEvent.type(within(dialog).getByLabelText('O que continua acontecendo'), 'Ainda reproduz no Hub.');
    await userEvent.upload(
      within(dialog).getByLabelText('Arquivos de evidência'),
      new File(['x'], 'reteste.mp4', { type: 'video/mp4' }),
    );

    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar reabertura' }));

    await waitFor(() => {
      expect(getIssueById(IN_REVIEW).status).toBe('Reopen');
    });
    const issue = getIssueById(IN_REVIEW);
    expect(issue.log).toContain('reteste reprovado · versão 1.6.0');
    expect(issue.description).toContain('Ainda reproduz no Hub.');

    // A evidência do reteste aparece no bloco próprio, abaixo do original.
    expect(await within(dialog).findByText('Evidências do reteste (Reopen)')).toBeInTheDocument();
    expect(within(dialog).getByTitle('reteste.mp4')).toBeInTheDocument();
  });
});
