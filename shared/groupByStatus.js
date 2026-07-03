import { Status } from './enums.js';

export const UNRECOGNIZED_STATUS_KEY = '__unrecognized__';

export function groupIssuesByStatus(issues) {
  const groups = Status.map((status) => ({ status, issues: [] }));
  const unrecognized = { status: UNRECOGNIZED_STATUS_KEY, issues: [] };

  for (const issue of issues) {
    const group = groups.find((entry) => entry.status === issue.status);
    if (group) {
      group.issues.push(issue);
    } else {
      unrecognized.issues.push(issue);
    }
  }

  return [...groups, unrecognized];
}
