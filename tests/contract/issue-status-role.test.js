import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { updateIssueStatus } from '../../src/api/mock/issues.js';
import { resetStore } from '../../src/api/mock/store.js';

// A política de status por papel é imposta no mock lendo o papel da sessão
// armazenada (paridade com o backend, que lê do JWT). Ver canRoleSetStatus.
function seedRole(role) {
  localStorage.setItem('workflow_session', JSON.stringify({ kind: 'google', role, operations: 'sportia' }));
}

describe('PATCH /issues/:id/status — política por papel (contract)', () => {
  beforeEach(() => {
    resetStore();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it('developer move issue Open para In progress', async () => {
    seedRole('developer');
    const updated = await updateIssueStatus('BUG-001', 'In progress');
    expect(updated.status).toBe('In progress');
  });

  it('developer NÃO pode mover issue Open para Fixed (403)', async () => {
    seedRole('developer');
    await expect(updateIssueStatus('BUG-001', 'Fixed')).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });

  it('developer NÃO pode editar issue que não está Open (403)', async () => {
    seedRole('developer');
    // BUG-002 está In progress no store.
    await expect(updateIssueStatus('BUG-002', 'To review')).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });

  it('admin move para qualquer status', async () => {
    seedRole('admin');
    const updated = await updateIssueStatus('BUG-001', 'Fixed');
    expect(updated.status).toBe('Fixed');
  });
});
