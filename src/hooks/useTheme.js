import { useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';

function currentTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

/** Lê/alterna o tema aplicado via data-theme na raiz, persistindo a escolha. */
export function useTheme() {
  const [theme, setTheme] = useState(currentTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((previous) => (previous === 'dark' ? 'light' : 'dark'));
  }

  return { theme, toggleTheme };
}
