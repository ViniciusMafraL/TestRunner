import { describe, expect, it } from 'vitest';
import {
  appendReopenNote,
  appendStatusLogEntry,
  parseIssueLog,
  retestLogNote,
  statusAssignsResponsible,
} from '../../shared/issueLog.js';

describe('issueLog — statusAssignsResponsible', () => {
  it('In progress, To review e Fixed For Next Build atribuem responsável', () => {
    expect(statusAssignsResponsible('In progress')).toBe(true);
    expect(statusAssignsResponsible('To review')).toBe(true);
    expect(statusAssignsResponsible('Fixed For Next Build')).toBe(true);
    expect(statusAssignsResponsible('Open')).toBe(false);
    expect(statusAssignsResponsible('Fixed')).toBe(false);
  });
});

describe('issueLog — appendStatusLogEntry', () => {
  it('acrescenta a entrada no topo (mais recente primeiro)', () => {
    const at = new Date('2026-07-22T14:03:00.000Z');
    const log1 = appendStatusLogEntry('', { actor: 'Ana', status: 'In progress', at });
    const log2 = appendStatusLogEntry(log1, { actor: 'Bruno', status: 'To review', at });
    const lines = log2.split('\n');
    expect(lines[0]).toContain('Bruno');
    expect(lines[1]).toContain('Ana');
  });

  it('sem ator, devolve o log inalterado (não registra anônimo)', () => {
    expect(appendStatusLogEntry('logexistente', { actor: '', status: 'Fixed' })).toBe('logexistente');
    expect(appendStatusLogEntry('', { actor: '   ', status: 'Fixed' })).toBe('');
  });

  it('sem nota, a linha continua com 3 campos (formato de antes do reteste)', () => {
    const at = new Date('2026-07-22T14:03:00.000Z');
    expect(appendStatusLogEntry('', { actor: 'Ana', status: 'Fixed', at }).split('\t')).toHaveLength(3);
  });

  it('com nota, acrescenta um 4º campo', () => {
    const at = new Date('2026-07-22T14:03:00.000Z');
    const line = appendStatusLogEntry('', { actor: 'Ana', status: 'Reopen', note: 'reteste reprovado', at });
    expect(line.split('\t')).toEqual(['2026-07-22T14:03:00.000Z', 'Ana', 'Reopen', 'reteste reprovado']);
  });

  it('troca tab e quebra de linha por espaço — são os separadores do formato', () => {
    const at = new Date('2026-07-22T14:03:00.000Z');
    const line = appendStatusLogEntry('', { actor: 'Ana', status: 'Reopen', note: 'versão\t1.6.0\nquebrada', at });
    expect(line.split('\n')).toHaveLength(1);
    expect(line.split('\t')).toHaveLength(4);
    expect(parseIssueLog(line)[0].note).toBe('versão 1.6.0 quebrada');
  });
});

describe('issueLog — retestLogNote', () => {
  it('To review → Fixed é o aprovar do QA', () => {
    expect(retestLogNote('To review', 'Fixed')).toBe('reteste aprovado');
  });

  it('reprovar registra a versão retestada quando ela vem', () => {
    expect(retestLogNote('To review', 'Reopen', { version: '1.6.0' })).toBe('reteste reprovado · versão 1.6.0');
    expect(retestLogNote('To review', 'Reopen', null)).toBe('reteste reprovado');
  });

  it('transições fora do reteste não geram nota (log segue como antes)', () => {
    expect(retestLogNote('Open', 'In progress')).toBe('');
    expect(retestLogNote('In progress', 'Fixed')).toBe('');
    expect(retestLogNote('Open', 'Fixed For Next Build')).toBe('');
  });
});

describe('issueLog — appendReopenNote', () => {
  const at = new Date(2026, 6, 22); // 22/07/2026, hora local

  it('acrescenta o bloco ao fim da descrição, sem apagar o que já existia', () => {
    const result = appendReopenNote('Descrição original.', { actor: 'Karen', version: '1.6.0', at });
    expect(result).toBe('Descrição original.\n\n[Reopen 22/07/2026 · Karen · retestado na versão 1.6.0]');
  });

  it('inclui o comentário do QA embaixo do cabeçalho', () => {
    const result = appendReopenNote('Original', { actor: 'Karen', version: '1.6.0', comment: 'Ainda reproduz no Hub.', at });
    expect(result.endsWith('Ainda reproduz no Hub.')).toBe(true);
  });

  it('descrição vazia começa pelo bloco', () => {
    expect(appendReopenNote('', { actor: 'Karen', version: '1.6.0', at })).toBe(
      '[Reopen 22/07/2026 · Karen · retestado na versão 1.6.0]',
    );
  });
});

describe('issueLog — parseIssueLog', () => {
  it('faz round-trip com o append (mais recentes primeiro)', () => {
    const at = new Date('2026-07-22T14:03:00.000Z');
    let log = appendStatusLogEntry('', { actor: 'Ana', status: 'In progress', at });
    log = appendStatusLogEntry(log, { actor: 'Bruno', status: 'To review', at });
    const entries = parseIssueLog(log);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ actor: 'Bruno', status: 'To review' });
    expect(entries[1]).toMatchObject({ actor: 'Ana', status: 'In progress' });
    expect(entries[0].at).toBe('2026-07-22T14:03:00.000Z');
  });

  it('descarta linhas vazias ou malformadas', () => {
    expect(parseIssueLog('')).toEqual([]);
    expect(parseIssueLog('   \n\n')).toEqual([]);
    expect(parseIssueLog('só-um-campo')).toEqual([]);
    expect(parseIssueLog(null)).toEqual([]);
  });
});
