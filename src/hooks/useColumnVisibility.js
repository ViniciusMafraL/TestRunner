import { useEffect, useState } from 'react';

function buildDefaults(allFields, defaultVisibleFields, alwaysVisibleFields) {
  return Object.fromEntries(
    allFields.map((field) => [field, alwaysVisibleFields.includes(field) || defaultVisibleFields.includes(field)]),
  );
}

function readFromStorage(storageKey, defaults) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

/**
 * Preferência de colunas visíveis, persistida no navegador (spec 002,
 * research.md §4). Cai de volta ao padrão em memória, sem propagar erro à UI,
 * quando localStorage está indisponível/bloqueado ou o valor salvo está corrompido.
 */
export function useColumnVisibility(storageKey, allFields, defaultVisibleFields, alwaysVisibleFields = []) {
  const defaults = buildDefaults(allFields, defaultVisibleFields, alwaysVisibleFields);
  const [visibility, setVisibility] = useState(() => readFromStorage(storageKey, defaults));

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(visibility));
    } catch {
      // localStorage indisponível/bloqueado: a preferência não persiste, mas a tela continua funcionando.
    }
  }, [storageKey, visibility]);

  function isVisible(field) {
    return alwaysVisibleFields.includes(field) || Boolean(visibility[field]);
  }

  function toggle(field) {
    if (alwaysVisibleFields.includes(field)) return;
    setVisibility((previous) => ({ ...previous, [field]: !previous[field] }));
  }

  return { isVisible, toggle, alwaysVisibleFields };
}
