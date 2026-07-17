import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IssueTracker } from '../../src/pages/IssueTracker/IssueTracker.jsx';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

const LAYOUT_KEY = 'issueTracker.columnLayout.v1';

/**
 * jsdom não implementa PointerEvent (fireEvent.pointerDown cai num Event sem
 * button/clientX). MouseEvent com o type de pointer carrega as coordenadas e
 * chega nos mesmos listeners.
 */
function firePointer(target, type, init = {}) {
  fireEvent(target, new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, ...init }));
}

function seedLayout(layout) {
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
}

function firstTableHeaderLabels() {
  const table = screen.getAllByRole('table')[0];
  // Pula o primeiro columnheader (checkbox de seleção, sem data-field).
  return within(table)
    .getAllByRole('columnheader')
    .slice(1)
    .map((th) => th.textContent);
}

describe('IssueTracker - layout de colunas (largura e ordem)', () => {
  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('aplica a ordem de colunas salva no localStorage', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    seedLayout({ order: ['title', 'status', 'project', 'severity', 'foundBy', 'version', 'keywords', 'store'], widths: {} });
    renderWithProviders(<IssueTracker />);

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');
    expect(firstTableHeaderLabels().slice(0, 3)).toEqual(['Title', 'Status', 'Project']);
  });

  it('aplica largura salva como CSS var no container e via var() no th', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    seedLayout({ order: null, widths: { status: 200 } });
    const { container } = renderWithProviders(<IssueTracker />);

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');
    const groupsContainer = container.querySelector('.issue-group').parentElement;
    expect(groupsContainer.style.getPropertyValue('--col-status')).toBe('200px');
    const statusTh = container.querySelector('th[data-field="status"]');
    expect(statusTh.style.width).toBe('var(--col-status, auto)');
  });

  it('"Restaurar padrão" no menu Columns reseta ordem e larguras', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    seedLayout({ order: ['title', 'status', 'project', 'severity', 'foundBy', 'version', 'keywords', 'store'], widths: { status: 300 } });
    renderWithProviders(<IssueTracker />);

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');
    expect(firstTableHeaderLabels()[0]).toBe('Title');

    await userEvent.click(screen.getByRole('button', { name: 'Columns' }));
    await userEvent.click(screen.getByRole('button', { name: 'Restaurar padrão' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(firstTableHeaderLabels().slice(0, 3)).toEqual(['Status', 'Project', 'Title']);
    expect(JSON.parse(localStorage.getItem(LAYOUT_KEY))).toEqual({ order: null, widths: {} });
  });

  it('arrastar a alça de resize commita a nova largura no localStorage', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    const { container } = renderWithProviders(<IssueTracker />);

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');
    const handle = container.querySelector('th[data-field="status"] .col-resize-handle');

    // jsdom: rect zerado → o startWidth cai no fallback (largura padrão, 120).
    firePointer(handle, 'pointerdown', { clientX: 100 });
    firePointer(document, 'pointermove', { clientX: 140 });
    firePointer(document, 'pointerup');

    const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY));
    expect(saved.widths.status).toBe(160);
  });

  it('clicar na alça sem arrastar não fixa largura nenhuma', async () => {
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    const { container } = renderWithProviders(<IssueTracker />);

    await screen.findByText('Crash ao abrir o Hub em dispositivos Android');
    const handle = container.querySelector('th[data-field="title"] .col-resize-handle');

    firePointer(handle, 'pointerdown', { clientX: 100 });
    firePointer(document, 'pointerup');

    const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) ?? '{"widths":{}}');
    expect(saved.widths?.title).toBeUndefined();
  });

  it('segurar 200ms ativa o modo de arrasto em todas as tabelas; Escape cancela sem mover', async () => {
    vi.useFakeTimers();
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    const { container } = renderWithProviders(<IssueTracker />);

    await vi.waitFor(() => {
      expect(screen.getByText('Crash ao abrir o Hub em dispositivos Android')).toBeInTheDocument();
    });
    const orderBefore = firstTableHeaderLabels();
    const statusTh = container.querySelector('th[data-field="status"]');

    firePointer(statusTh, 'pointerdown', { clientX: 50, clientY: 10 });
    expect(container.querySelectorAll('.th--dragging').length).toBe(0);

    act(() => {
      vi.advanceTimersByTime(250);
    });

    const highlighted = container.querySelectorAll('th[data-field="status"].th--dragging');
    expect(highlighted.length).toBeGreaterThan(1); // uma por tabela de grupo renderizada

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(container.querySelectorAll('.th--dragging').length).toBe(0);
    expect(firstTableHeaderLabels()).toEqual(orderBefore);
  });

  it('soltar antes do hold completar não ativa o arrasto (clique normal)', async () => {
    vi.useFakeTimers();
    seedSession({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
    const { container } = renderWithProviders(<IssueTracker />);

    await vi.waitFor(() => {
      expect(screen.getByText('Crash ao abrir o Hub em dispositivos Android')).toBeInTheDocument();
    });
    const statusTh = container.querySelector('th[data-field="status"]');

    firePointer(statusTh, 'pointerdown', { clientX: 50, clientY: 10 });
    firePointer(document, 'pointerup');
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(container.querySelectorAll('.th--dragging').length).toBe(0);
  });
});
