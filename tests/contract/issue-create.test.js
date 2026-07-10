import { describe, expect, it } from 'vitest';
import { createIssue } from '../../src/api/mock/issues.js';

describe('POST /issues (contract)', () => {
  it('cria a issue com id, status Open, createdIn e project (da aba atual) automáticos', async () => {
    const issue = await createIssue({ title: 'Nova issue', version: '2.0.0' });
    expect(issue.id).toMatch(/^BUG-\d{3}$/);
    expect(issue.status).toBe('Open');
    expect(issue.title).toBe('Nova issue');
    // project é derivado da aba/projeto atual (Sportia por padrão), não do payload.
    expect(issue.project).toBe('Sportia');
    expect(issue.createdIn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('ignora id/status/createdIn enviados pelo cliente e sempre gera os próprios', async () => {
    const issue = await createIssue({ title: 'Tentativa de forjar campos', version: '1.0.0', id: 'BUG-999', status: 'Closed', createdIn: '2000-01-01' });
    expect(issue.id).not.toBe('BUG-999');
    expect(issue.status).toBe('Open');
    expect(issue.createdIn).not.toBe('2000-01-01');
  });

  it('rejeita payload sem Title ou Version com 422', async () => {
    await expect(createIssue({ title: '', version: '1.0.0' })).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
    });
    await expect(createIssue({ title: 'Sem versão', version: '' })).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
    });
  });
});
