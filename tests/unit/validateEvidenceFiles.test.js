import { describe, expect, it } from 'vitest';
import { EVIDENCE_MAX_FILES, EVIDENCE_MAX_FILE_SIZE_MB, validateEvidenceFiles } from 'shared/contracts.js';

const MB = 1024 * 1024;

function file(name, type, sizeMb = 1) {
  return { name, type, size: sizeMb * MB };
}

describe('validateEvidenceFiles', () => {
  it('aceita vídeos e imagens dentro dos limites', () => {
    const result = validateEvidenceFiles([
      file('bug.mp4', 'video/mp4', 80),
      file('print.png', 'image/png', 2),
      file('tela.jpg', 'image/jpeg'),
    ]);
    expect(result.valid).toBe(true);
  });

  it('rejeita lista vazia', () => {
    expect(validateEvidenceFiles([]).valid).toBe(false);
    expect(validateEvidenceFiles(undefined).valid).toBe(false);
  });

  it(`rejeita mais de ${EVIDENCE_MAX_FILES} arquivos`, () => {
    const files = Array.from({ length: EVIDENCE_MAX_FILES + 1 }, (unused, index) => file(`v${index}.mp4`, 'video/mp4'));
    const result = validateEvidenceFiles(files);
    expect(result.valid).toBe(false);
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejeita tipos que não são vídeo nem imagem', () => {
    const result = validateEvidenceFiles([file('log.pdf', 'application/pdf')]);
    expect(result.valid).toBe(false);
    expect(result.error.message).toContain('log.pdf');
  });

  it(`rejeita arquivo acima de ${EVIDENCE_MAX_FILE_SIZE_MB} MB`, () => {
    const result = validateEvidenceFiles([file('grande.mp4', 'video/mp4', EVIDENCE_MAX_FILE_SIZE_MB + 1)]);
    expect(result.valid).toBe(false);
    expect(result.error.message).toContain('grande.mp4');
  });
});
