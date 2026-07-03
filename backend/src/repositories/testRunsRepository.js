import { TestRunStatus } from 'shared/enums.js';
import { validateTestRunPayload } from 'shared/contracts.js';
import { config } from '../config.js';
import { readRange, appendRow, updateRow } from '../googleSheets.js';
import { HttpError } from '../HttpError.js';

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

async function listDemandsWithRowNumbers() {
  const rows = await readRange(config.testRunGid, 'A2:G');
  return rows.map((row, index) => rowToDemand(index + 2, row)).filter((demand) => demand.status);
}

export async function listTestRuns() {
  return (await listDemandsWithRowNumbers()).map(withoutRowNumber);
}

export async function createTestRun(payload) {
  const result = validateTestRunPayload(payload);
  if (!result.valid) {
    throw new HttpError(422, result.error.code, result.error.message);
  }

  const demands = await listTestRuns();
  const maxSeq = demands.reduce((max, demand) => {
    const match = demand.id?.match(/^RUN-(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  const demand = {
    ...payload,
    id: `RUN-${String(maxSeq + 1).padStart(3, '0')}`,
    status: 'Pendente',
  };

  await appendRow(config.testRunGid, demandToRow(demand));
  return demand;
}

export async function updateTestRunStatus(id, status) {
  if (!TestRunStatus.includes(status)) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'Status de Test Run inválido');
  }
  const demands = await listDemandsWithRowNumbers();
  const demand = demands.find((entry) => entry.id === id);
  if (!demand) {
    throw new HttpError(404, 'NOT_FOUND', 'Demanda de Test Run não encontrada');
  }
  const updated = { ...demand, status };
  await updateRow(config.testRunGid, demand.rowNumber, demandToRow(updated));
  return withoutRowNumber(updated);
}
