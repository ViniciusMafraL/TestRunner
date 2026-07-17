import { describe, expect, it } from 'vitest';
import { nextSeveritySort, sortIssuesBySeverity } from '../../src/utils/issueSort.js';

const ISSUES = [
  { id: 'BUG-2', severity: 'Suggestion' },
  { id: 'BUG-10', severity: 'Critical' },
  { id: 'BUG-1', severity: 'Compliance' },
  { id: 'BUG-3', severity: 'Major' },
  { id: 'BUG-4', severity: '' },
];

const ids = (list) => list.map((issue) => issue.id);

describe('nextSeveritySort', () => {
  it('cicla none → critical → least → none', () => {
    expect(nextSeveritySort('none')).toBe('critical');
    expect(nextSeveritySort('critical')).toBe('least');
    expect(nextSeveritySort('least')).toBe('none');
  });
});

describe('sortIssuesBySeverity', () => {
  it('modo none ordena por id em ordem natural (BUG-2 antes de BUG-10)', () => {
    expect(ids(sortIssuesBySeverity(ISSUES, 'none'))).toEqual(['BUG-1', 'BUG-2', 'BUG-3', 'BUG-4', 'BUG-10']);
  });

  it('modo critical: Compliance › Critical › Major › … e severity vazia por último', () => {
    expect(ids(sortIssuesBySeverity(ISSUES, 'critical'))).toEqual(['BUG-1', 'BUG-10', 'BUG-3', 'BUG-2', 'BUG-4']);
  });

  it('modo least inverte a criticidade (vazia continua no fim? não — passa a ser a mais "baixa")', () => {
    // least = rank descendente: severity vazia tem o maior rank, então vem primeiro.
    expect(ids(sortIssuesBySeverity(ISSUES, 'least'))).toEqual(['BUG-4', 'BUG-2', 'BUG-3', 'BUG-10', 'BUG-1']);
  });

  it('desempata por id quando a severidade é igual', () => {
    const same = [
      { id: 'BUG-10', severity: 'Major' },
      { id: 'BUG-2', severity: 'Major' },
      { id: 'BUG-1', severity: 'Major' },
    ];
    expect(ids(sortIssuesBySeverity(same, 'critical'))).toEqual(['BUG-1', 'BUG-2', 'BUG-10']);
  });

  it('não muta o array de entrada', () => {
    const input = [...ISSUES];
    const snapshot = ids(input);
    sortIssuesBySeverity(input, 'critical');
    expect(ids(input)).toEqual(snapshot);
  });
});
