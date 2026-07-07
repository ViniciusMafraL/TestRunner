import { beforeEach, describe, expect, it } from 'vitest';
import { getIssueEvidence, uploadIssueEvidence } from '../../src/api/mock/issues.js';
import { getIssueById, resetStore } from '../../src/api/mock/store.js';

const MB = 1024 * 1024;

function file(name, type = 'video/mp4', sizeMb = 10) {
  return { name, type, size: sizeMb * MB };
}

describe('POST /issues/:id/evidence (contract)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('anexa a evidência e grava o link da pasta no attachment', async () => {
    const updated = await uploadIssueEvidence('BUG-001', file('bug.mp4'));
    expect(updated.attachment).toBe('https://drive.google.com/drive/folders/mock-BUG-001');
    expect(getIssueById('BUG-001').attachment).toBe(updated.attachment);
    // Os demais campos ficam intactos.
    expect(updated.title).toBe('Crash ao abrir o Hub em dispositivos Android');
    expect(updated.status).toBe('Open');
  });

  it('é idempotente: repetir o envio mantém o mesmo link de pasta', async () => {
    await uploadIssueEvidence('BUG-001', file('video1.mp4'));
    const second = await uploadIssueEvidence('BUG-001', file('print.png', 'image/png', 1));
    expect(second.attachment).toBe('https://drive.google.com/drive/folders/mock-BUG-001');
  });

  it('retorna 422 para tipo de arquivo não aceito', async () => {
    await expect(uploadIssueEvidence('BUG-001', file('log.pdf', 'application/pdf'))).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
    });
  });

  it('retorna 422 para arquivo acima do limite de tamanho', async () => {
    await expect(uploadIssueEvidence('BUG-001', file('grande.mp4', 'video/mp4', 101))).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
    });
  });

  it('retorna 404 para issue inexistente', async () => {
    await expect(uploadIssueEvidence('BUG-999', file('bug.mp4'))).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('retorna 502 DRIVE_ERROR na falha simulada, sem alterar a issue', async () => {
    await expect(uploadIssueEvidence('BUG-001', file('erro.mp4'))).rejects.toMatchObject({
      status: 502,
      code: 'DRIVE_ERROR',
    });
    expect(getIssueById('BUG-001').attachment).toBe('');
  });
});

describe('GET /issues/:id/evidence (contract)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('retorna lista vazia para issue sem evidências (sem 404)', async () => {
    await expect(getIssueEvidence('BUG-001')).resolves.toEqual({ files: [] });
    await expect(getIssueEvidence('BUG-999')).resolves.toEqual({ files: [] });
  });

  it('lista os arquivos registrados pelo upload, com URLs de preview', async () => {
    await uploadIssueEvidence('BUG-001', file('bug.mp4'));
    await uploadIssueEvidence('BUG-001', file('print.png', 'image/png', 1));

    const { files } = await getIssueEvidence('BUG-001');
    expect(files).toHaveLength(2);
    expect(files[0]).toMatchObject({ name: 'bug.mp4', mimeType: 'video/mp4' });
    expect(files[1]).toMatchObject({ name: 'print.png', mimeType: 'image/png' });
    for (const entry of files) {
      expect(entry.id).toBeTruthy();
      expect(entry.thumbnailUrl).toBeTruthy();
      expect(entry.previewUrl).toBeTruthy();
      expect(entry.webViewLink).toContain('drive.google.com');
    }
  });
});
