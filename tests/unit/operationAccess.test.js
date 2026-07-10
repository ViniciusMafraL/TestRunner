import { describe, expect, it } from 'vitest';
import { parseOperationsList, userCanAccessOperation, validateIssuePayload } from 'shared/contracts.js';

describe('parseOperationsList', () => {
  it('normaliza string separada por vírgula', () => {
    expect(parseOperationsList('sportia, roblox ,')).toEqual(['sportia', 'roblox']);
  });

  it('aceita array e ignora vazios', () => {
    expect(parseOperationsList(['sportia', '', ' fortnite '])).toEqual(['sportia', 'fortnite']);
  });

  it('trata valor ausente como lista vazia', () => {
    expect(parseOperationsList(undefined)).toEqual([]);
  });
});

describe('userCanAccessOperation', () => {
  it('permite quando o id está na lista', () => {
    expect(userCanAccessOperation('sportia, roblox', 'roblox')).toBe(true);
  });

  it('nega quando o id não está na lista', () => {
    expect(userCanAccessOperation('sportia', 'roblox')).toBe(false);
  });

  it('"*" libera qualquer operação (admin)', () => {
    expect(userCanAccessOperation('*', 'gameloft')).toBe(true);
  });

  it('nega operação vazia', () => {
    expect(userCanAccessOperation('*', '')).toBe(false);
  });
});

describe('validateIssuePayload (project derivado da aba, não obrigatório)', () => {
  it('aceita com apenas title e version', () => {
    expect(validateIssuePayload({ title: 'Bug', version: '1.0.0' }).valid).toBe(true);
  });

  it('rejeita quando falta title ou version', () => {
    const result = validateIssuePayload({ title: 'Bug' });
    expect(result.valid).toBe(false);
    expect(result.error.missing).toContain('version');
  });

  it('não exige project', () => {
    const result = validateIssuePayload({ title: 'Bug', version: '1.0.0' });
    expect(result.error?.missing ?? []).not.toContain('project');
  });
});
