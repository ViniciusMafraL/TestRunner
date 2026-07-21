import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
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

// BUG-001 (Sportia): keywords 'Bug', severity 'Critical', createdIn '2026-05-29'.
describe('IssueDetailModal — redesign em 2 colunas (modo leitura)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('mostra as pílulas de status/severity ANTES do título', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderTracker('/issue-tracker/BUG-001');

    const dialog = await screen.findByRole('dialog', { name: 'Detalhes da issue BUG-001' });
    const pills = dialog.querySelector('.issue-detail-pills');
    const title = within(dialog).getByRole('heading', { name: 'Crash ao abrir o Hub em dispositivos Android' });

    expect(pills).not.toBeNull();
    // As pílulas precedem o título no DOM (topo da coluna principal).
    expect(pills.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renderiza Keywords como chips logo abaixo do título (e não na lista de campos)', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderTracker('/issue-tracker/BUG-001');

    const dialog = await screen.findByRole('dialog', { name: 'Detalhes da issue BUG-001' });
    const main = dialog.querySelector('.issue-detail-main');
    expect(within(main).getByText('Bug')).toHaveClass('keyword-chip');

    // Keywords não é mais uma linha de campo na coluna direita.
    const meta = dialog.querySelector('.issue-detail-meta');
    expect(within(meta).queryByText('Keywords')).not.toBeInTheDocument();
  });

  it('mostra a seção LOG com "Report criado" e a data de criação (DD/MM/YYYY)', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderTracker('/issue-tracker/BUG-001');

    const dialog = await screen.findByRole('dialog', { name: 'Detalhes da issue BUG-001' });
    expect(within(dialog).getByText('Log')).toBeInTheDocument();
    expect(within(dialog).getByText('Report criado')).toBeInTheDocument();
    expect(within(dialog).getByText('29/05/2026')).toBeInTheDocument();
  });

  it('posiciona o chip de ID na coluna de meta (direita)', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderTracker('/issue-tracker/BUG-001');

    const dialog = await screen.findByRole('dialog', { name: 'Detalhes da issue BUG-001' });
    const meta = dialog.querySelector('.issue-detail-meta');
    expect(within(meta).getByText('BUG-001')).toHaveClass('issue-detail-id');
  });

  it('coloca o botão Fechar ao lado do ID (topo da coluna de meta)', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderTracker('/issue-tracker/BUG-001');

    const dialog = await screen.findByRole('dialog', { name: 'Detalhes da issue BUG-001' });
    const metaTop = dialog.querySelector('.issue-detail-meta-top');
    expect(within(metaTop).getByText('BUG-001')).toBeInTheDocument();
    expect(within(metaTop).getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
  });

  it('coloca o botão Editar na coluna principal, depois da área rolável de descrição/evidências', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    renderTracker('/issue-tracker/BUG-001');

    const dialog = await screen.findByRole('dialog', { name: 'Detalhes da issue BUG-001' });
    const main = dialog.querySelector('.issue-detail-main');
    const scroll = main.querySelector('.issue-detail-scroll');
    const editar = within(main).getByRole('button', { name: 'Editar' });

    expect(scroll).not.toBeNull();
    // O botão Editar vem depois da área rolável no DOM.
    expect(scroll.compareDocumentPosition(editar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
