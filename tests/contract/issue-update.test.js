import { beforeEach, describe, expect, it } from 'vitest';
import { updateIssue } from '../../src/api/mock/issues.js';
import { resetStore } from '../../src/api/mock/store.js';

describe('PATCH /issues/:id (contract)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('atualiza campos editáveis e preserva os demais', async () => {
    const updated = await updateIssue('BUG-001', { title: 'Novo título', severity: 'Low' });
    expect(updated.title).toBe('Novo título');
    expect(updated.severity).toBe('Low');
    expect(updated.id).toBe('BUG-001');
    expect(updated.status).toBe('Open');
    expect(updated.foundBy).toBe('Carlos');
  });

  it('ignora campos protegidos e desconhecidos (id, status, createdIn)', async () => {
    const updated = await updateIssue('BUG-001', {
      title: 'Outro título',
      id: 'BUG-999',
      status: 'Done',
      createdIn: '2000-01-01',
      naoExiste: 'x',
    });
    expect(updated.id).toBe('BUG-001');
    expect(updated.status).toBe('Open');
    expect(updated.createdIn).toBe('2026-05-29');
    expect(updated.naoExiste).toBeUndefined();
  });

  it('aceita valores fora do enum nos campos de seleção (dado de origem pode ser "sujo")', async () => {
    const updated = await updateIssue('BUG-001', { severity: 'Severidade customizada' });
    expect(updated.severity).toBe('Severidade customizada');
  });

  it('retorna 422 ao tentar esvaziar Title ou Version', async () => {
    await expect(updateIssue('BUG-001', { title: '' })).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
    });
    await expect(updateIssue('BUG-001', { version: '' })).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
    });
  });

  it('retorna 422 quando nenhum campo editável é informado', async () => {
    await expect(updateIssue('BUG-001', {})).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
    });
  });

  it('retorna 404 para id inexistente', async () => {
    await expect(updateIssue('BUG-999', { title: 'X' })).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('retorna 409 WRITE_CONFLICT para simular falha de gravação (BUG-002)', async () => {
    await expect(updateIssue('BUG-002', { title: 'X' })).rejects.toMatchObject({
      status: 409,
      code: 'WRITE_CONFLICT',
    });
  });
});
