import { describe, expect, it } from 'vitest';
import { updateIssueStatus } from '../../src/api/mock/issues.js';

describe('PATCH /issues/:id/status (contract)', () => {
  it('atualiza o status com sucesso', async () => {
    const updated = await updateIssueStatus('BUG-001', 'In progress');
    expect(updated.status).toBe('In progress');
  });

  it('aceita valores fora do enum (dado de origem pode ser "sujo")', async () => {
    const updated = await updateIssueStatus('BUG-001', 'Estado customizado');
    expect(updated.status).toBe('Estado customizado');
  });

  it('retorna 409 WRITE_CONFLICT para simular falha de gravação', async () => {
    await expect(updateIssueStatus('BUG-002', 'Fixed')).rejects.toMatchObject({
      status: 409,
      code: 'WRITE_CONFLICT',
    });
  });
});
