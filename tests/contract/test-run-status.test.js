import { describe, expect, it } from 'vitest';
import { updateTestRunStatus } from '../../src/api/mock/testRuns.js';

describe('PATCH /test-runs/:id/status (contract)', () => {
  it('move a demanda para outra coluna válida', async () => {
    const updated = await updateTestRunStatus('RUN-001', 'Em andamento');
    expect(updated.status).toBe('Em andamento');
  });

  it('rejeita status fora das 3 colunas conhecidas', async () => {
    await expect(updateTestRunStatus('RUN-001', 'Cancelado')).rejects.toMatchObject({ status: 422 });
  });
});
