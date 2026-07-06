import { useEffect, useState } from 'react';

function readFromStorage(storageKey, initialValue) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw === null) return initialValue;
    return JSON.parse(raw);
  } catch {
    return initialValue;
  }
}

/**
 * useState persistido no navegador, para preferências de visualização (dado de
 * UI, não de negócio). Mesmas regras de degradação do useColumnVisibility
 * (spec 002, research.md §4): cai de volta ao valor inicial em memória, sem
 * propagar erro à UI, quando localStorage está indisponível/bloqueado ou o
 * valor salvo está corrompido.
 */
export function useLocalStorageState(storageKey, initialValue) {
  const [value, setValue] = useState(() => readFromStorage(storageKey, initialValue));

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // localStorage indisponível/bloqueado: a preferência não persiste, mas a tela continua funcionando.
    }
  }, [storageKey, value]);

  return [value, setValue];
}
