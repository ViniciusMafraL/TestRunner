import { StatusGroup } from 'shared/enums.js';
import { findLatestVersion } from 'shared/version.js';
import { listIssues } from './store.js';

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getHomeSummary() {
  await delay(100);
  const issues = listIssues();

  const counts = { open: 0, done: 0, closed: 0 };
  for (const issue of issues) {
    const group = StatusGroup[issue.status];
    if (group === 'aberta') counts.open += 1;
    else if (group === 'concluida') counts.done += 1;
    else if (group === 'fechada') counts.closed += 1;
    // status fora do enum conhecido: não entra em nenhum dos 3 contadores,
    // mas continua visível no Issue Tracker (FR-019).
  }

  const openIssues = issues.filter((issue) => StatusGroup[issue.status] === 'aberta');
  const latestVersion = findLatestVersion(openIssues.map((issue) => issue.version));
  const latestVersionOpenIssues = openIssues.filter((issue) => issue.version === latestVersion);

  return { counts, latestVersionOpenIssues };
}
