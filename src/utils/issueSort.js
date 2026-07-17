/**
 * Ordenação de issues por severidade no Issue Tracker.
 *
 * O ranking de criticidade é próprio (não é a ordem do enum `Severity` de
 * shared/enums.js): aqui Compliance é o mais crítico — questões legais/licença
 * têm prioridade sobre bugs. Índice menor = mais crítico.
 */
export const SEVERITY_RANK = ['Compliance', 'Critical', 'Major', 'Normal', 'Low', 'Suggestion'];

/** Modos cíclicos do botão de sort da coluna Severity. */
export const SEVERITY_SORT_MODES = ['none', 'critical', 'least'];

export function nextSeveritySort(mode) {
  const index = SEVERITY_SORT_MODES.indexOf(mode);
  return SEVERITY_SORT_MODES[(index + 1) % SEVERITY_SORT_MODES.length];
}

/** Severity desconhecida/vazia vai para o fim (rank alto). */
function severityRank(severity) {
  const index = SEVERITY_RANK.indexOf(severity);
  return index === -1 ? SEVERITY_RANK.length : index;
}

/** Ordem natural de id: BUG-2 antes de BUG-10 (numérico), determinística. */
function compareById(a, b) {
  return String(a.id ?? '').localeCompare(String(b.id ?? ''), undefined, { numeric: true });
}

/**
 * Devolve um NOVO array ordenado (não muta a entrada):
 * - `none`     → por id ascendente (padrão da tabela);
 * - `critical` → mais crítico primeiro (rank ascendente), desempate por id;
 * - `least`    → menos crítico primeiro (rank descendente), desempate por id.
 */
export function sortIssuesBySeverity(issues, mode) {
  const list = [...issues];
  if (mode === 'critical' || mode === 'least') {
    const direction = mode === 'critical' ? 1 : -1;
    list.sort((a, b) => {
      const diff = severityRank(a.severity) - severityRank(b.severity);
      return diff !== 0 ? diff * direction : compareById(a, b);
    });
    return list;
  }
  list.sort(compareById);
  return list;
}
