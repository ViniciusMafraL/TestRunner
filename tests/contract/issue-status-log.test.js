import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { updateIssueStatus } from '../../src/api/mock/issues.js';
import { resetStore } from '../../src/api/mock/store.js';
import { parseIssueLog } from '../../shared/issueLog.js';

function seed(role, displayName) {
  localStorage.setItem('workflow_session', JSON.stringify({ kind: 'google', role, displayName, operations: 'sportia' }));
}

describe('PATCH /issues/:id/status — responsável + log (contract)', () => {
  beforeEach(() => resetStore());
  afterEach(() => localStorage.clear());

  it('mover para In progress preenche o responsável com quem alterou e registra no log', async () => {
    seed('developer', 'Karen');
    const updated = await updateIssueStatus('BUG-001', 'In progress');
    expect(updated.responsible).toBe('Karen');
    const entries = parseIssueLog(updated.log);
    expect(entries[0]).toMatchObject({ actor: 'Karen', status: 'In progress' });
  });

  it('mover para To review também atribui o responsável', async () => {
    seed('developer', 'Karen');
    const updated = await updateIssueStatus('BUG-001', 'To review');
    expect(updated.responsible).toBe('Karen');
  });

  it('status que não atribui (admin → Fixed) registra no log mas não mexe no responsável', async () => {
    seed('admin', 'Carlos');
    const updated = await updateIssueStatus('BUG-001', 'Fixed');
    expect(updated.responsible ?? '').toBe('');
    const entries = parseIssueLog(updated.log);
    expect(entries[0]).toMatchObject({ actor: 'Carlos', status: 'Fixed' });
  });

  it('cada mudança acrescenta uma linha (mais recente no topo)', async () => {
    seed('admin', 'Carlos');
    await updateIssueStatus('BUG-001', 'In progress');
    const updated = await updateIssueStatus('BUG-001', 'Fixed');
    const entries = parseIssueLog(updated.log);
    expect(entries).toHaveLength(2);
    expect(entries[0].status).toBe('Fixed');
    expect(entries[1].status).toBe('In progress');
  });

  it('dev resolve e marca Fixed For Next Build a partir de In progress', async () => {
    seed('developer', 'Karen');
    // BUG-001 (Open) não simula conflito de gravação, ao contrário de BUG-002.
    await updateIssueStatus('BUG-001', 'In progress');
    const updated = await updateIssueStatus('BUG-001', 'Fixed For Next Build');

    expect(updated.status).toBe('Fixed For Next Build');
    expect(updated.responsible).toBe('Karen');
    const entries = parseIssueLog(updated.log);
    expect(entries[0]).toMatchObject({ actor: 'Karen', status: 'Fixed For Next Build' });
    expect(entries[1]).toMatchObject({ actor: 'Karen', status: 'In progress' });
  });

  it('sem sessão não grava responsável nem log (retrocompatível)', async () => {
    const updated = await updateIssueStatus('BUG-001', 'In progress');
    expect(updated.responsible ?? '').toBe('');
    expect(updated.log ?? '').toBe('');
  });
});
