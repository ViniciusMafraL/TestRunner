import { describe, expect, it } from 'vitest';
import { getIssuesGroupedByStatus } from '../../src/api/mock/issues.js';
import { UNRECOGNIZED_STATUS_KEY } from 'shared/groupByStatus.js';

describe('GET /issues/grouped-by-status (contract)', () => {
  it('sempre inclui o grupo de status não reconhecido, mesmo vazio', async () => {
    const { groups } = await getIssuesGroupedByStatus();
    const unrecognized = groups.find((group) => group.status === UNRECOGNIZED_STATUS_KEY);
    expect(unrecognized).toBeDefined();
    expect(unrecognized.issues.map((issue) => issue.id)).toContain('BUG-007');
  });

  it('agrupa issues conhecidas em seu status correspondente', async () => {
    const { groups } = await getIssuesGroupedByStatus();
    const openGroup = groups.find((group) => group.status === 'Open');
    expect(openGroup.issues.map((issue) => issue.id)).toEqual(expect.arrayContaining(['BUG-001', 'BUG-008']));
  });
});
