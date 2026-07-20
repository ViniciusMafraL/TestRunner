import { describe, expect, it } from 'vitest';
import { groupIssuesByStatus, UNRECOGNIZED_STATUS_KEY } from 'shared/groupByStatus.js';

describe('groupIssuesByStatus', () => {
  it('agrupa cada issue em seu status conhecido', () => {
    const issues = [
      { id: '1', status: 'Open' },
      { id: '2', status: 'Fixed' },
    ];
    const groups = groupIssuesByStatus(issues);
    expect(groups.find((g) => g.status === 'Open').issues).toHaveLength(1);
    expect(groups.find((g) => g.status === 'Fixed').issues).toHaveLength(1);
  });

  it('dobra issues "Reopen" dentro da seção "Open" (sem seção própria)', () => {
    const issues = [
      { id: '1', status: 'Open' },
      { id: '2', status: 'Reopen' },
    ];
    const groups = groupIssuesByStatus(issues);
    const openGroup = groups.find((g) => g.status === 'Open');
    expect(openGroup.issues.map((i) => i.id)).toEqual(['1', '2']);
    expect(groups.some((g) => g.status === 'Reopen')).toBe(false);
  });

  it('não cria seção para o status aposentado "Done"', () => {
    const groups = groupIssuesByStatus([{ id: '1', status: 'Open' }]);
    expect(groups.some((g) => g.status === 'Done')).toBe(false);
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
