export function matchesIssueSearch(issue, query) {
  const normalizedQuery = String(query ?? '').trim().toLowerCase();
  if (!normalizedQuery) return true;

  const title = String(issue?.title ?? '').toLowerCase();
  const id = String(issue?.id ?? '').toLowerCase();
  return title.includes(normalizedQuery) || id.includes(normalizedQuery);
}
