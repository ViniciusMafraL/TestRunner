import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLocalStorageState } from '../../src/hooks/useLocalStorageState.js';

const KEY = 'test.preference.v1';

describe('useLocalStorageState', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('usa o valor inicial quando não há nada salvo e persiste as mudanças', () => {
    const { result } = renderHook(() => useLocalStorageState(KEY, {}));
    expect(result.current[0]).toEqual({});

    act(() => {
      result.current[1]({ Open: true });
    });

    expect(result.current[0]).toEqual({ Open: true });
    expect(JSON.parse(localStorage.getItem(KEY))).toEqual({ Open: true });
  });

  it('restaura o valor salvo de uma sessão anterior', () => {
    localStorage.setItem(KEY, JSON.stringify({ Done: true }));

    const { result } = renderHook(() => useLocalStorageState(KEY, {}));
    expect(result.current[0]).toEqual({ Done: true });
  });

  it('cai de volta ao valor inicial quando o valor salvo está corrompido', () => {
    localStorage.setItem(KEY, '{corrompido');

    const { result } = renderHook(() => useLocalStorageState(KEY, { padrao: true }));
    expect(result.current[0]).toEqual({ padrao: true });
  });

  it('continua funcionando em memória quando localStorage está indisponível', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('localStorage bloqueado');
    });

    const { result } = renderHook(() => useLocalStorageState(KEY, {}));
    expect(result.current[0]).toEqual({});

    act(() => {
      result.current[1]({ Open: true });
    });

    // A preferência não persiste, mas o estado em memória segue normal, sem erro.
    expect(result.current[0]).toEqual({ Open: true });
  });
});
