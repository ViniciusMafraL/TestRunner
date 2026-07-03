import { describe, expect, it } from 'vitest';
import { groupIssuesByStatus, UNRECOGNIZED_STATUS_KEY } from 'shared/groupByStatus.js';

describe('groupIssuesByStatus', () => {
  it('agrupa cada issue em seu status conhecido', () => {
    const issues = [
      { id: '1', status: 'Open' },
      { id: '2', status: 'Done' },
    ];
    const groups = groupIssuesByStatus(issues);
    expect(groups.find((g) => g.status === 'Open').issues).toHaveLength(1);
    expect(groups.find((g) => g.status === 'Done').issues).toHaveLength(1);
  });

  it('coloca status desconhecido no grupo unrecognized sem lançar erro', () => {
    const issues = [{ id: '3', status: 'Estado inexistente' }];
    const groups = groupIssuesByStatus(issues);
    const unrecognized = groups.find((g) => g.status === UNRECOGNIZED_STATUS_KEY);
    expect(unrecognized.issues).toHaveLength(1);
  });

  it('sempre inclui o grupo unrecognized mesmo sem issues desconhecidas', () => {
    const groups = groupIssuesByStatus([]);
    expect(groups.some((g) => g.status === UNRECOGNIZED_STATUS_KEY)).toBe(true);
  });
});
