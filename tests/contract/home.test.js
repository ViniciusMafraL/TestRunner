import { describe, expect, it } from 'vitest';
import { getHomeSummary } from '../../src/api/mock/home.js';

describe('GET /home/summary (contract)', () => {
  it('retorna contadores e issues abertas da versão mais recente', async () => {
    const summary = await getHomeSummary();
    expect(summary.counts).toEqual({ open: 4, done: 1, closed: 2 });
    expect(summary.latestVersionOpenIssues.every((issue) => issue.version === '1.5.2')).toBe(true);
    expect(summary.latestVersionOpenIssues.map((issue) => issue.id)).toContain('BUG-001');
  });

  it('não quebra e não inclui issue com versão malformada na tabela de versão mais recente', async () => {
    const summary = await getHomeSummary();
    expect(summary.latestVersionOpenIssues.find((issue) => issue.id === 'BUG-008')).toBeUndefined();
  });
});
