import { ApiError } from '../ApiError.js';
import { readStoredSession } from '../../auth/sessionStorage.js';
import { addProjectInStore, listOperationsInStore, listProjectsInStore } from './store.js';

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** GET /operations — no mock, todas as operações de exemplo. */
export async function getOperations() {
  await delay(80);
  return { operations: listOperationsInStore() };
}

/** GET /operations/catalog — catálogo p/ FTUE (todas as operações, só id/label). */
export async function getOperationsCatalog() {
  await delay(80);
  return { operations: listOperationsInStore().map((op) => ({ id: op.id, label: op.label })) };
}

/**
 * POST /users/me/operation — conclui a FTUE no mock: devolve a sessão atual com
 * a operação anexada (e sem ser mais "developer sem operação"), para o
 * SessionContext aplicar via applySession, como faz o backend real.
 */
export async function setMyOperation(operationId) {
  await delay(120);
  const id = String(operationId ?? '').trim();
  if (!id) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Operação é obrigatória');
  }
  const current = readStoredSession() ?? {};
  return { session: { ...current, operations: id } };
}

/** GET /operations/:op/projects — projetos (abas) da operação informada. */
export async function getProjects(op) {
  await delay(80);
  return { projects: listProjectsInStore(op) };
}

/** POST /operations/:op/projects — adiciona um projeto à operação atual. */
export async function addProject(op, name) {
  await delay(120);
  const trimmed = String(name ?? '').trim();
  if (!trimmed) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Nome do projeto é obrigatório');
  }
  return { projects: addProjectInStore(trimmed) };
}
