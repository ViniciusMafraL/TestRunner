import { beforeEach, describe, expect, it, vi } from 'vitest';

// Estado do Sheets mockado com pontos de espera reais (setTimeout) para que
// dois createIssue concorrentes possam de fato interlear a leitura: é
// exatamente essa janela que gerava IDs duplicados antes do lock por aba.
const sheets = vi.hoisted(() => {
  const rows = [];
  const delay = () => new Promise((resolve) => setTimeout(resolve, 5));
  return {
    rows,
    readRange: async () => {
      await delay();
      return rows.map((row) => [...row]);
    },
    appendRow: async (_gid, row) => {
      await delay();
      rows.push([...row]);
    },
    updateRow: async () => {},
  };
});

vi.mock('../../backend/src/googleSheets.js', () => ({
  readRange: sheets.readRange,
  appendRow: sheets.appendRow,
  updateRow: sheets.updateRow,
}));

const { createIssue } = await import('../../backend/src/repositories/issuesRepository.js');

const operation = { spreadsheetId: 'SS-1', testRunGid: 999 };
const project = { name: 'Proj', gid: 1 };

describe('createIssue sob concorrência (lock por aba)', () => {
  beforeEach(() => {
    sheets.rows.length = 0;
  });

  it('dois envios simultâneos criam DUAS issues com IDs distintos e sequenciais', async () => {
    const [a, b] = await Promise.all([
      createIssue(operation, project, { title: 'Issue A', version: '1.0.0' }),
      createIssue(operation, project, { title: 'Issue B', version: '1.0.0' }),
    ]);

    // Ambas foram criadas (nenhuma descartada)...
    expect(sheets.rows).toHaveLength(2);
    // ...e receberam IDs diferentes (sem o lock, ambas seriam BUG-001).
    expect(a.id).not.toBe(b.id);
    expect([a.id, b.id].sort()).toEqual(['BUG-001', 'BUG-002']);
  });

  it('cinco envios simultâneos geram cinco IDs únicos e sequenciais', async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        createIssue(operation, project, { title: `Issue ${i}`, version: '1.0.0' }),
      ),
    );

    const ids = results.map((issue) => issue.id).sort();
    expect(new Set(ids).size).toBe(5);
    expect(ids).toEqual(['BUG-001', 'BUG-002', 'BUG-003', 'BUG-004', 'BUG-005']);
  });
});
