import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { IssueTracker } from '../../src/pages/IssueTracker/IssueTracker.jsx';
import { uploadIssueEvidence } from '../../src/api/mock/issues.js';
import { resetStore } from '../../src/api/mock/store.js';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

const MB = 1024 * 1024;

function renderIssueModal(id) {
  return renderWithProviders(
    <Routes>
      <Route path="/issue-tracker/:issueId?" element={<IssueTracker />} />
    </Routes>,
    { route: `/issue-tracker/${id}` },
  );
}

describe('EvidenceGallery - pré-visualização das evidências no modal', () => {
  beforeEach(() => {
    resetStore();
  });

  it('mostra player de vídeo e miniatura de imagem para as evidências da issue', async () => {
    await uploadIssueEvidence('BUG-001', { name: 'bug.mp4', type: 'video/mp4', size: 10 * MB });
    await uploadIssueEvidence('BUG-001', { name: 'print.png', type: 'image/png', size: MB });

    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderIssueModal('BUG-001');

    const dialog = await screen.findByRole('dialog', { name: 'Detalhes da issue BUG-001' });
    // Vídeo: player embutido (iframe) identificado pelo nome do arquivo
    // (findBy espera o fetch da lista terminar).
    expect(await within(dialog).findByTitle('bug.mp4')).toBeInTheDocument();
    expect(within(dialog).getByText('Evidências')).toBeInTheDocument();
    // Imagem: miniatura clicável.
    expect(within(dialog).getByRole('img', { name: 'print.png' })).toBeInTheDocument();
  });

  it('não mostra a seção para issue sem pasta de evidências', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderIssueModal('BUG-003');

    const dialog = await screen.findByRole('dialog', { name: 'Detalhes da issue BUG-003' });
    expect(within(dialog).queryByText('Evidências')).not.toBeInTheDocument();
  });
});
