import { describe, expect, it } from 'vitest';
import {
  MAX_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  clampWidth,
  computeDropAnchor,
  mergeStoredOrder,
  moveFieldBefore,
} from '../../src/utils/columnLayout.js';

const CANONICAL = ['status', 'title', 'severity', 'foundBy', 'version'];

describe('mergeStoredOrder', () => {
  it('devolve a ordem canônica quando não há ordem salva', () => {
    expect(mergeStoredOrder(null, CANONICAL)).toEqual(CANONICAL);
    expect(mergeStoredOrder(undefined, CANONICAL)).toEqual(CANONICAL);
  });

  it('preserva a ordem customizada salva', () => {
    const stored = ['title', 'status', 'version', 'foundBy', 'severity'];
    expect(mergeStoredOrder(stored, CANONICAL)).toEqual(stored);
  });

  it('anexa ao final campos novos que a versão salva não conhecia', () => {
    const stored = ['title', 'status'];
    expect(mergeStoredOrder(stored, CANONICAL)).toEqual(['title', 'status', 'severity', 'foundBy', 'version']);
  });

  it('descarta campos salvos que não existem mais', () => {
    const stored = ['title', 'obsoleto', 'status', 'severity', 'foundBy', 'version'];
    expect(mergeStoredOrder(stored, CANONICAL)).toEqual(['title', 'status', 'severity', 'foundBy', 'version']);
  });
});

describe('moveFieldBefore', () => {
  it('move um campo para antes de outro (para a esquerda)', () => {
    expect(moveFieldBefore(CANONICAL, 'foundBy', 'title')).toEqual(['status', 'foundBy', 'title', 'severity', 'version']);
  });

  it('move um campo para antes de outro (para a direita)', () => {
    expect(moveFieldBefore(CANONICAL, 'status', 'version')).toEqual(['title', 'severity', 'foundBy', 'status', 'version']);
  });

  it('âncora null move para o fim', () => {
    expect(moveFieldBefore(CANONICAL, 'status', null)).toEqual(['title', 'severity', 'foundBy', 'version', 'status']);
  });

  it('não muda nada quando campo e âncora são o mesmo', () => {
    expect(moveFieldBefore(CANONICAL, 'status', 'status')).toBe(CANONICAL);
  });

  it('mantém campos ocultos na posição relativa ao mover com âncora visível', () => {
    // 'severity' está oculta entre title e foundBy; mover version para antes de title não a desloca.
    expect(moveFieldBefore(CANONICAL, 'version', 'title')).toEqual(['status', 'version', 'title', 'severity', 'foundBy']);
  });
});

describe('clampWidth', () => {
  it('limita ao mínimo e ao máximo e arredonda', () => {
    expect(clampWidth(10)).toBe(MIN_COLUMN_WIDTH);
    expect(clampWidth(5000)).toBe(MAX_COLUMN_WIDTH);
    expect(clampWidth(150.6)).toBe(151);
  });
});

describe('computeDropAnchor', () => {
  const rects = [
    { field: 'status', left: 0, width: 100 },
    { field: 'title', left: 100, width: 200 },
    { field: 'severity', left: 300, width: 100 },
  ];

  it('aponta para o campo cujo ponto médio está à direita do ponteiro', () => {
    expect(computeDropAnchor(rects, 40)).toBe('status');
    expect(computeDropAnchor(rects, 60)).toBe('title');
    expect(computeDropAnchor(rects, 210)).toBe('severity');
  });

  it('devolve null depois do ponto médio da última coluna (soltar no fim)', () => {
    expect(computeDropAnchor(rects, 380)).toBe(null);
  });
});
