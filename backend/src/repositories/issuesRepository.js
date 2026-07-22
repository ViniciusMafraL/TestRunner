import { StatusGroup } from 'shared/enums.js';
import { findLatestVersion } from 'shared/version.js';
import { validateIssuePayload, validateIssueUpdatePayload, canRoleSetStatus } from 'shared/contracts.js';
import { groupIssuesByStatus } from 'shared/groupByStatus.js';
import { appendReopenNote, appendStatusLogEntry, retestLogNote, statusAssignsResponsible } from 'shared/issueLog.js';
import { readRange, appendRow, updateRow } from '../googleSheets.js';
import { withLock } from '../keyedMutex.js';
import { HttpError } from '../HttpError.js';

// Chave do lock de escrita: uma corrente por aba (planilha + gid). Escritas na
// mesma aba serializam; abas/projetos distintos não esperam um pelo outro.
function writeKey(operation, project) {
  return `${operation.spreadsheetId}:${project.gid}`;
}

// Ordem exata das colunas da aba de issues, padrão em todas as operações.
// Com "projeto = aba", a issue vive na aba do projeto; `project` é derivado do
// nome da aba (não digitado). A coluna O continua no layout (compatibilidade),
// mas o valor devolvido/gravado é sempre o nome da aba.
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
  'project',
  'log',
];
const LAST_COLUMN = 'P';

// Cabeçalho legível da aba (linha 1) — usado ao criar uma aba-projeto nova.
export const ISSUE_SHEET_HEADER = [
  'ID',
  'Status',
  'Severity',
  'Tag',
  'Title',
  'Description',
  'Attachment',
  'Found By',
  'Version',
  'Platform',
  'Key words',
  'Store',
  'Created In',
  'Responsible',
  'Project',
  'Log',
];

function rowToIssue(rowNumber, values, projectName) {
  const issue = { rowNumber };
  COLUMNS.forEach((key, index) => {
    issue[key] = values[index] ?? '';
  });
  issue.project = projectName; // project é sempre o nome da aba
  return issue;
}

function issueToRow(issue) {
  return COLUMNS.map((key) => issue[key] ?? '');
}

function withoutRowNumber(issue) {
  const { rowNumber, ...rest } = issue;
  return rest;
}

async function listIssuesWithRowNumbers(operation, project) {
  const rows = await readRange(project.gid, `A2:${LAST_COLUMN}`, operation.spreadsheetId);
  return rows.map((row, index) => rowToIssue(index + 2, row, project.name)).filter((issue) => issue.status);
}

export async function listIssues(operation, project) {
  return (await listIssuesWithRowNumbers(operation, project)).map(withoutRowNumber);
}

export async function getHomeSummary(operation, project) {
  const issues = await listIssues(operation, project);
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

export async function getIssuesGroupedByStatus(operation, project) {
  const issues = await listIssues(operation, project);
  return { groups: groupIssuesByStatus(issues) };
}

export async function createIssue(operation, project, payload) {
  const result = validateIssuePayload(payload);
  if (!result.valid) {
    throw new HttpError(422, result.error.code, result.error.message);
  }

  // Read-modify-write serializado por aba: sem o lock, dois envios simultâneos
  // leem o mesmo maxSeq e criam duas issues com o MESMO id (o append do Sheets
  // nunca rejeita duplicata). Com o lock, o segundo espera e recebe o id seguinte.
  return withLock(writeKey(operation, project), async () => {
    const issues = await listIssues(operation, project);
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
      project: project.name, // project derivado da aba, ignora o que vier no payload
    };

    await appendRow(project.gid, issueToRow(issue), operation.spreadsheetId);
    return issue;
  });
}

/**
 * Muda o status da issue. `retest` ({ version, comment }) vem do fluxo de
 * reteste do QA e só é honrado ao reprovar (status "Reopen"): status, descrição
 * e log saem numa única gravação, dentro do mesmo lock — sem estado parcial.
 */
export async function updateIssueStatus(operation, project, id, status, actor = {}, retest = null) {
  // Serializado por aba: mantém o achar-linha → gravar atômico, sem corrida de
  // rowNumber com outra escrita concorrente na mesma aba.
  return withLock(writeKey(operation, project), async () => {
    const issues = await listIssuesWithRowNumbers(operation, project);
    const issue = issues.find((entry) => entry.id === id);
    if (!issue) {
      throw new HttpError(404, 'NOT_FOUND', 'Issue não encontrada');
    }
    // Política por papel: admin/qa mudam para qualquer status; developer só move
    // issues Open para In progress/To review; viewer/convidado não editam.
    if (!canRoleSetStatus(actor.role, issue.status, status)) {
      throw new HttpError(403, 'FORBIDDEN', 'Você não pode aplicar este status a esta issue');
    }
    const updated = { ...issue, status };
    // Ao mover para In progress/To review, quem fez a mudança vira o responsável
    // (sobrescreve). Toda mudança de status vira uma linha no log da issue.
    if (statusAssignsResponsible(status) && actor.name) {
      updated.responsible = actor.name;
    }
    updated.log = appendStatusLogEntry(issue.log, {
      actor: actor.name,
      status,
      note: retestLogNote(issue.status, status, retest),
    });
    if (status === 'Reopen' && retest) {
      updated.description = appendReopenNote(issue.description, { actor: actor.name, ...retest });
    }
    await updateRow(project.gid, issue.rowNumber, issueToRow(updated), operation.spreadsheetId);
    return withoutRowNumber(updated);
  });
}

export async function updateIssue(operation, project, id, payload) {
  const result = validateIssueUpdatePayload(payload);
  if (!result.valid) {
    throw new HttpError(422, result.error.code, result.error.message);
  }
  return withLock(writeKey(operation, project), async () => {
    const issues = await listIssuesWithRowNumbers(operation, project);
    const issue = issues.find((entry) => entry.id === id);
    if (!issue) {
      throw new HttpError(404, 'NOT_FOUND', 'Issue não encontrada');
    }
    const updated = { ...issue, ...result.patch, project: project.name };
    await updateRow(project.gid, issue.rowNumber, issueToRow(updated), operation.spreadsheetId);
    return withoutRowNumber(updated);
  });
}
