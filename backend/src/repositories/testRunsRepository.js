import { TestRunStatus } from 'shared/enums.js';
import { validateTestRunPayload } from 'shared/contracts.js';
import { readRange, appendRow, updateRow } from '../googleSheets.js';
import { withLock } from '../keyedMutex.js';
import { HttpError } from '../HttpError.js';

// Chave do lock de escrita: uma corrente por aba de Test Run (planilha + gid).
function writeKey(operation) {
  return `${operation.spreadsheetId}:${operation.testRunGid}`;
}

// Ordem exata das colunas na aba "Test Run" (criada via
// backend/scripts/setup-test-run-tab.mjs em 2026-07-02).
const COLUMNS = ['id', 'build', 'version', 'testType', 'responsible', 'platform', 'status'];

function rowToDemand(rowNumber, values) {
  const demand = { rowNumber };
  COLUMNS.forEach((key, index) => {
    demand[key] = values[index] ?? '';
  });
  return demand;
}

function demandToRow(demand) {
  return COLUMNS.map((key) => demand[key] ?? '');
}

function withoutRowNumber(demand) {
  const { rowNumber, ...rest } = demand;
  return rest;
}

async function listDemandsWithRowNumbers(operation) {
  const rows = await readRange(operation.testRunGid, 'A2:G', operation.spreadsheetId);
  return rows.map((row, index) => rowToDemand(index + 2, row)).filter((demand) => demand.status);
}

export async function listTestRuns(operation) {
  return (await listDemandsWithRowNumbers(operation)).map(withoutRowNumber);
}

export async function createTestRun(operation, payload) {
  const result = validateTestRunPayload(payload);
  if (!result.valid) {
    throw new HttpError(422, result.error.code, result.error.message);
  }

  // Serializado por aba: sem o lock, dois envios simultâneos leem o mesmo maxSeq
  // e criam dois RUN com o mesmo id.
  return withLock(writeKey(operation), async () => {
    const demands = await listTestRuns(operation);
    const maxSeq = demands.reduce((max, demand) => {
      const match = demand.id?.match(/^RUN-(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);

    const demand = {
      ...payload,
      id: `RUN-${String(maxSeq + 1).padStart(3, '0')}`,
      status: 'Pendente',
    };

    await appendRow(operation.testRunGid, demandToRow(demand), operation.spreadsheetId);
    return demand;
  });
}

export async function updateTestRunStatus(operation, id, status) {
  if (!TestRunStatus.includes(status)) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'Status de Test Run inválido');
  }
  return withLock(writeKey(operation), async () => {
    const demands = await listDemandsWithRowNumbers(operation);
    const demand = demands.find((entry) => entry.id === id);
    if (!demand) {
      throw new HttpError(404, 'NOT_FOUND', 'Demanda de Test Run não encontrada');
    }
    const updated = { ...demand, status };
    await updateRow(operation.testRunGid, demand.rowNumber, demandToRow(updated), operation.spreadsheetId);
    return withoutRowNumber(updated);
  });
}
