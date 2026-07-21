import { afterEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { SideMenu } from '../../src/components/SideMenu/SideMenu.jsx';
import { renderWithProviders, seedSession } from '../testUtils.jsx';

describe('SideMenu — navegação por papel', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('admin vê as 5 seções', async () => {
    seedSession({ kind: 'google', displayName: 'Carlos', role: 'admin', canWrite: true, operations: '*', token: 't', epoch: 1 });
    renderWithProviders(<SideMenu />);

    for (const label of ['Home', 'Test Run', 'Issue Tracker', 'Test Plan', 'Report']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('developer vê só Home e Issue Tracker', async () => {
    seedSession({ kind: 'google', displayName: 'Dev', role: 'developer', canWrite: false, operations: 'sportia', token: 't', epoch: 1 });
    renderWithProviders(<SideMenu />);

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Issue Tracker' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Test Run' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Report' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Test Plan' })).not.toBeInTheDocument();
  });

  it('exibe o rótulo "Desenvolvedor" no card de sessão', async () => {
    seedSession({ kind: 'google', displayName: 'Dev', role: 'developer', canWrite: false, operations: 'sportia', token: 't', epoch: 1 });
    renderWithProviders(<SideMenu />);

    expect(screen.getByText('Desenvolvedor')).toBeInTheDocument();
  });
});
