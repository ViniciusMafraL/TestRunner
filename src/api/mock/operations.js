import { ApiError } from '../ApiError.js';
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
