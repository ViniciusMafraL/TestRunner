import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useColumnVisibility } from '../../src/hooks/useColumnVisibility.js';

const ALL_FIELDS = ['id', 'status', 'title', 'severity'];
const DEFAULT_VISIBLE = ['status', 'severity'];
const ALWAYS_VISIBLE = ['title'];
const STORAGE_KEY = 'test.visibleColumns.v1';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('useColumnVisibility', () => {
  it('aplica o conjunto padrão quando não há nada salvo', () => {
    const { result } = renderHook(() => useColumnVisibility(STORAGE_KEY, ALL_FIELDS, DEFAULT_VISIBLE, ALWAYS_VISIBLE));

    expect(result.current.isVisible('status')).toBe(true);
    expect(result.current.isVisible('severity')).toBe(true);
    expect(result.current.isVisible('id')).toBe(false);
    expect(result.current.isVisible('title')).toBe(true);
  });

  it('o campo sempre-visível não pode ser desmarcado', () => {
    const { result } = renderHook(() => useColumnVisibility(STORAGE_KEY, ALL_FIELDS, DEFAULT_VISIBLE, ALWAYS_VISIBLE));

    act(() => result.current.toggle('title'));

    expect(result.current.isVisible('title')).toBe(true);
  });

  it('persiste a alteração e é recuperada em uma nova montagem do hook', () => {
    const { result, unmount } = renderHook(() => useColumnVisibility(STORAGE_KEY, ALL_FIELDS, DEFAULT_VISIBLE, ALWAYS_VISIBLE));

    act(() => result.current.toggle('status'));
    expect(result.current.isVisible('status')).toBe(false);
    unmount();

    const { result: secondMount } = renderHook(() => useColumnVisibility(STORAGE_KEY, ALL_FIELDS, DEFAULT_VISIBLE, ALWAYS_VISIBLE));
    expect(secondMount.current.isVisible('status')).toBe(false);
  });

  it('cai de volta ao padrão em memória quando localStorage.getItem lança exceção', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { result } = renderHook(() => useColumnVisibility(STORAGE_KEY, ALL_FIELDS, DEFAULT_VISIBLE, ALWAYS_VISIBLE));

    expect(result.current.isVisible('status')).toBe(true);
    expect(result.current.isVisible('id')).toBe(false);
  });

  it('não quebra quando localStorage.setItem lança exceção ao alternar uma coluna', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { result } = renderHook(() => useColumnVisibility(STORAGE_KEY, ALL_FIELDS, DEFAULT_VISIBLE, ALWAYS_VISIBLE));

    expect(() => act(() => result.current.toggle('id'))).not.toThrow();
    expect(result.current.isVisible('id')).toBe(true);
  });
});
