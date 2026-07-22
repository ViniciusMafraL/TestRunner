import { describe, expect, it } from 'vitest';
import { reopenFolderName } from '../../shared/evidenceFolders.js';

describe('evidenceFolders — reopenFolderName', () => {
  it('usa o número da issue com o prefixo RO- (de ReOpen)', () => {
    expect(reopenFolderName('BUG-001')).toBe('RO-001');
    expect(reopenFolderName('BUG-123')).toBe('RO-123');
  });

  it('preserva os zeros à esquerda, como no id da issue', () => {
    expect(reopenFolderName('BUG-007')).toBe('RO-007');
  });

  it('id fora do padrão cai no id inteiro (pasta feia é melhor que evidência perdida)', () => {
    expect(reopenFolderName('SEM-NUMERO')).toBe('RO-SEM-NUMERO');
    expect(reopenFolderName('')).toBe('RO-');
    expect(reopenFolderName(null)).toBe('RO-');
  });
});
