import { StatusGroup } from 'shared/enums.js';
import { findLatestVersion } from 'shared/version.js';
import { validateIssuePayload } from 'shared/contracts.js';
import { groupIssuesByStatus } from 'shared/groupByStatus.js';
import { config } from '../config.js';
import { readRange, appendRow, updateRow } from '../googleSheets.js';
import { HttpError } from '../HttpError.js';

// Ordem exata das colunas na aba "Sportia PC" da planilha real (confirmada
// via backend/scripts/verify-sheets-access.mjs em 2026-07-02).
const COLUMNS = [
  'id',
  'status',
  'severity',
  'tag',
  'title',
  'description',
  'attachment',
  'foundBy',
  'version',
  'platform',
  'keywords',
  'store',
  'createdIn',
  'responsible',
];

function rowToIssue(rowNumber, values) {
  const issue = { rowNumber };
  COLUMNS.forEach((key, index) => {
    issue[key] = values[index] ?? '';
  });
  return issue;
}

function issueToRow(issue) {
  return COLUMNS.map((key) => issue[key] ?? '');
}

function withoutRowNumber(issue) {
  const { rowNumber, ...rest } = issue;
  return rest;
}

async function listIssuesWithRowNumbers() {
  const rows = await readRange(config.issuesGid, 'A2:N');
  return rows.map((row, index) => rowToIssue(index + 2, row)).filter((issue) => issue.status);
}

export async function listIssues() {
  return (await listIssuesWithRowNumbers()).map(withoutRowNumber);
}

export async function getHomeSummary() {
  const issues = await listIssues();
  const counts = { open: 0, done: 0, closed: 0 };
  for (const issue of issues) {
    const group = StatusGroup[issue.status];
    if (group === 'aberta') counts.open += 1;
    else if (group === 'concluida') counts.done += 1;
    else if (group === 'fechada') counts.closed += 1;
  }
  const openIssues = issues.filter((issue) => StatusGroup[issue.status] === 'aberta');
  const latestVersion = findLatestVersion(openIssues.map((issue) => issue.version));
  const latestVersionOpenIssues = openIssues.filter((issue) => issue.version === latestVersion);
  return { counts, latestVersionOpenIssues };
}

export async function getIssuesGroupedByStatus() {
  const issues = await listIssues();
  return { groups: groupIssuesByStatus(issues) };
}

export async function createIssue(payload) {
  const result = validateIssuePayload(payload);
  if (!result.valid) {
    throw new HttpError(422, result.error.code, result.error.message);
  }

  const issues = await listIssues();
  const maxSeq = issues.reduce((max, issue) => {
    const match = issue.id?.match(/^BUG-(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  const issue = {
    severity: '',
    tag: '',
    description: '',
    attachment: '',
    foundBy: '',
    platform: '',
    keywords: '',
    store: '',
    responsible: '',
    ...payload,
    id: `BUG-${String(maxSeq + 1).padStart(3, '0')}`,
    status: 'Open',
    createdIn: new Date().toISOString().slice(0, 10),
  };

  await appendRow(config.issuesGid, issueToRow(issue));
  return issue;
}

export async function updateIssueStatus(id, status) {
  const issues = await listIssuesWithRowNumbers();
  const issue = issues.find((entry) => entry.id === id);
  if (!issue) {
    throw new HttpError(404, 'NOT_FOUND', 'Issue não encontrada');
  }
  const updated = { ...issue, status };
  await updateRow(config.issuesGid, issue.rowNumber, issueToRow(updated));
  return withoutRowNumber(updated);
}
