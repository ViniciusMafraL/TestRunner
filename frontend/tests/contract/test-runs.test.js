import { describe, expect, it } from 'vitest';
import { getTestRuns, createTestRun } from '../../src/api/mock/testRuns.js';

describe('GET/POST /test-runs (contract)', () => {
  it('lista as demandas de exemplo', async () => {
    const { demands } = await getTestRuns();
    expect(demands.length).toBeGreaterThan(0);
  });

  it('cria uma nova demanda com status inicial Pendente', async () => {
    const demand = await createTestRun({
      build: 'build-999',
      version: '1.6.0',
      testType: 'Smoke',
      responsible: 'Carlos',
      platform: 'Web',
    });
    expect(demand.status).toBe('Pendente');
    expect(demand.id).toMatch(/^RUN-\d{3}$/);
  });

  it('rejeita payload incompleto com 422', async () => {
    await expect(createTestRun({ build: 'build-x' })).rejects.toMatchObject({ status: 422 });
  });
});
