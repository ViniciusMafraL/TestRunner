import { describe, expect, it } from 'vitest';
import { FIRST_EPOCH, isSessionOutdated, normalizeEpoch } from '../../shared/sessionEpoch.js';

describe('normalizeEpoch', () => {
  it('aceita inteiros a partir da primeira época', () => {
    expect(normalizeEpoch(1)).toBe(1);
    expect(normalizeEpoch(7)).toBe(7);
  });

  it('cai na primeira época para valores ausentes ou inválidos', () => {
    expect(normalizeEpoch(undefined)).toBe(FIRST_EPOCH);
    expect(normalizeEpoch(null)).toBe(FIRST_EPOCH);
    expect(normalizeEpoch('abc')).toBe(FIRST_EPOCH);
    expect(normalizeEpoch(0)).toBe(FIRST_EPOCH);
    expect(normalizeEpoch(-3)).toBe(FIRST_EPOCH);
    expect(normalizeEpoch(2.5)).toBe(FIRST_EPOCH);
  });
});

describe('isSessionOutdated', () => {
  it('sessão da época atual continua válida', () => {
    expect(isSessionOutdated(3, 3)).toBe(false);
  });

  it('sessão de época anterior está desatualizada', () => {
    expect(isSessionOutdated(2, 3)).toBe(true);
    expect(isSessionOutdated(1, 9)).toBe(true);
  });

  it('sessão antiga sem época é invalidada pelo primeiro force update', () => {
    // Save local/cookie anterior a este recurso: normaliza para a primeira época.
    expect(isSessionOutdated(undefined, 2)).toBe(true);
    expect(isSessionOutdated(undefined, FIRST_EPOCH)).toBe(false);
  });

  it('não desloga ninguém se a época do servidor regredir', () => {
    // Ex.: arquivo de persistência perdido — melhor manter sessões novas válidas
    // do que expulsar todo mundo sem motivo.
    expect(isSessionOutdated(5, 1)).toBe(false);
  });
});
