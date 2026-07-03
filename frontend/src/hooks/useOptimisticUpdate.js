import { useState } from 'react';

/**
 * Aplica uma mudança de valor imediatamente na UI (otimista) e reverte
 * automaticamente se a persistência falhar (FR-010, research.md §2).
 */
export function useOptimisticUpdate() {
  const [error, setError] = useState(null);

  async function run({ previousValue, nextValue, applyLocally, persist }) {
    setError(null);
    applyLocally(nextValue);
    try {
      await persist(nextValue);
    } catch (err) {
      applyLocally(previousValue);
      setError(err.message ?? 'Não foi possível salvar a alteração');
    }
  }

  return { run, error, clearError: () => setError(null) };
}
