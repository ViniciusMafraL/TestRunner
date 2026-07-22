// Nomes das pastas de evidência no Drive. Fonte única para o backend (que cria
// as pastas de verdade), para o mock e para os testes.

export const REOPEN_FOLDER_PREFIX = 'RO-';

/**
 * Pasta das evidências de reteste de uma issue reaberta: "RO-" (de ReOpen) +
 * o número da issue. Ela é criada DENTRO da pasta do bug, então o vídeo do
 * reteste fica junto do original: `.../BUG-001/RO-001/`.
 *
 * 'BUG-001' → 'RO-001'. Ids fora do padrão (sem dígitos no fim) usam o id
 * inteiro — pasta com nome feio é melhor que evidência perdida.
 * Retestes seguintes reusam a mesma pasta (ensureFolder é idempotente).
 */
export function reopenFolderName(issueId) {
  const id = String(issueId ?? '').trim();
  const match = /(\d+)$/.exec(id);
  return `${REOPEN_FOLDER_PREFIX}${match ? match[1] : id}`;
}
