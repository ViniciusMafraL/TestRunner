import { TestRunStatus } from 'shared/enums.js';
import { validateTestRunPayload } from 'shared/contracts.js';
import { ApiError } from '../ApiError.js';
import { addTestRun, listTestRuns, updateTestRunStatusInStore } from './store.js';

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getTestRuns() {
  await delay(100);
  return { demands: listTestRuns() };
}

export async function createTestRun(payload) {
  await delay(150);
  const result = validateTestRunPayload(payload);
  if (!result.valid) {
    throw new ApiError(422, result.error.code, result.error.message);
  }
  return addTestRun(payload);
}

export async function updateTestRunStatus(id, status) {
  await delay(100);
  if (!TestRunStatus.includes(status)) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Status de Test Run inválido');
  }
  try {
    const demand = updateTestRunStatusInStore(id, status);
    if (!demand) {
      throw new ApiError(404, 'NOT_FOUND', 'Demanda de Test Run não encontrada');
    }
    return demand;
  } catch (error) {
    if (error.code === 'WRITE_CONFLICT') {
      throw new ApiError(409, 'WRITE_CONFLICT', 'Não foi possível salvar a alteração');
    }
    throw error;
  }
}
