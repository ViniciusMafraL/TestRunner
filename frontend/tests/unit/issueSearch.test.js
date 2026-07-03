import { describe, expect, it } from 'vitest';
import { matchesIssueSearch } from '../../src/utils/issueSearch.js';

describe('matchesIssueSearch', () => {
  const issue = { id: 'BUG-007', title: 'Crash ao abrir o Hub em dispositivos Android' };

  it('casa por Title parcial, sem diferenciar maiúsculas/minúsculas', () => {
    expect(matchesIssueSearch(issue, 'hub')).toBe(true);
    expect(matchesIssueSearch(issue, 'CRASH')).toBe(true);
  });

  it('casa por ID parcial', () => {
    expect(matchesIssueSearch(issue, 'bug-007')).toBe(true);
    expect(matchesIssueSearch(issue, '007')).toBe(true);
  });

  it('não casa quando o termo não corresponde a Title nem ID', () => {
    expect(matchesIssueSearch(issue, 'placar')).toBe(false);
  });

  it('considera qualquer termo vazio/ausente como correspondência (sem filtro aplicado)', () => {
    expect(matchesIssueSearch(issue, '')).toBe(true);
    expect(matchesIssueSearch(issue, undefined)).toBe(true);
  });

  it('não quebra quando o title da issue é nulo/ausente (dado "sujo")', () => {
    expect(matchesIssueSearch({ id: 'BUG-999', title: null }, 'bug')).toBe(true);
    expect(matchesIssueSearch({ id: 'BUG-999', title: undefined }, 'xyz')).toBe(false);
  });
});
