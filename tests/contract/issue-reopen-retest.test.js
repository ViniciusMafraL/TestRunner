import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getIssueEvidence, updateIssueStatus, uploadIssueEvidence } from '../../src/api/mock/issues.js';
import { getIssueById, resetStore } from '../../src/api/mock/store.js';
import { parseIssueLog } from '../../shared/issueLog.js';

// BUG-003 (Sportia) nasce em "To review" — a issue que está com o QA.
const IN_REVIEW = 'BUG-003';

function seedQa(displayName = 'Karen') {
  localStorage.setItem(
    'workflow_session',
    JSON.stringify({ kind: 'google', role: 'qa', displayName, operations: 'sportia' }),
  );
}

describe('PATCH /issues/:id/status — reteste do QA (contract)', () => {
  beforeEach(() => resetStore());
  afterEach(() => localStorage.clear());

  it('aprovar move para Fixed e registra "reteste aprovado" no log', async () => {
    seedQa();
    const updated = await updateIssueStatus(IN_REVIEW, 'Fixed');

    expect(updated.status).toBe('Fixed');
    expect(parseIssueLog(updated.log)[0]).toMatchObject({ actor: 'Karen', status: 'Fixed', note: 'reteste aprovado' });
  });

  it('reprovar move para Reopen com a versão retestada no log', async () => {
    seedQa();
    const updated = await updateIssueStatus(IN_REVIEW, 'Reopen', { version: '1.6.0' });

    expect(updated.status).toBe('Reopen');
    expect(parseIssueLog(updated.log)[0]).toMatchObject({
      actor: 'Karen',
      status: 'Reopen',
      note: 'reteste reprovado · versão 1.6.0',
    });
  });

  it('reprovar acrescenta o bloco do reteste à descrição, preservando a original', async () => {
    seedQa();
    const original = getIssueById(IN_REVIEW).description;
    const updated = await updateIssueStatus(IN_REVIEW, 'Reopen', { version: '1.6.0', comment: 'Ainda reproduz.' });

    expect(updated.description.startsWith(original)).toBe(true);
    expect(updated.description).toContain('retestado na versão 1.6.0');
    expect(updated.description).toContain('Ainda reproduz.');
  });

  it('reprovar não muda o responsável — o bug volta para quem já cuidava dele', async () => {
    seedQa();
    await updateIssueStatus(IN_REVIEW, 'Reopen', { version: '1.6.0' });
    expect(getIssueById(IN_REVIEW).responsible ?? '').toBe('');
  });

  it('mudança de status sem retest continua exatamente como antes (3 campos, sem nota)', async () => {
    seedQa();
    const updated = await updateIssueStatus('BUG-001', 'In progress');
    expect(parseIssueLog(updated.log)[0].note).toBe('');
  });

  it('a evidência do reteste entra como kind "reopen", depois das originais', async () => {
    seedQa();
    await uploadIssueEvidence(IN_REVIEW, { name: 'original.mp4', type: 'video/mp4', size: 1024 });
    await updateIssueStatus(IN_REVIEW, 'Reopen', { version: '1.6.0' });
    await uploadIssueEvidence(IN_REVIEW, { name: 'reteste.mp4', type: 'video/mp4', size: 1024 }, undefined, 'reopen');

    const { files } = await getIssueEvidence(IN_REVIEW);
    expect(files.map((file) => [file.name, file.kind])).toEqual([
      ['original.mp4', 'original'],
      ['reteste.mp4', 'reopen'],
    ]);
  });
});
