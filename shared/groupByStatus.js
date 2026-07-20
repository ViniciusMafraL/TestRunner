import { Status } from './enums.js';

export const UNRECOGNIZED_STATUS_KEY = '__unrecognized__';

// Status sem seção própria no Issue Tracker: em vez de gerar uma seção, suas
// issues são exibidas dentro da seção de outro status. "Reopen" (issue reaberta)
// aparece dentro da seção "Open".
export const STATUS_SECTION_ALIAS = { Reopen: 'Open' };

// Resolve em qual seção uma issue entra: status apelidado dobra no host; status
// conhecido usa a própria seção; qualquer outro cai em "não reconhecido".
export function resolveSectionStatus(status) {
  if (STATUS_SECTION_ALIAS[status]) return STATUS_SECTION_ALIAS[status];
  return Status.includes(status) ? status : UNRECOGNIZED_STATUS_KEY;
}

export function groupIssuesByStatus(issues) {
  const sectionStatuses = Status.filter((status) => !(status in STATUS_SECTION_ALIAS));
  const groups = sectionStatuses.map((status) => ({ status, issues: [] }));
  const unrecognized = { status: UNRECOGNIZED_STATUS_KEY, issues: [] };

  for (const issue of issues) {
    const target = resolveSectionStatus(issue.status);
    const group = target === UNRECOGNIZED_STATUS_KEY ? unrecognized : groups.find((entry) => entry.status === target);
    (group ?? unrecognized).issues.push(issue);
  }

  return [...groups, unrecognized];
}
