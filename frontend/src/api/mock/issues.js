import { validateIssuePayload } from 'shared/contracts.js';
import { groupIssuesByStatus } from 'shared/groupByStatus.js';
import { ApiError } from '../ApiError.js';
import { addIssue, listIssues, updateIssueStatusInStore } from './store.js';

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getIssuesGroupedByStatus() {
  await delay(120);
  return { groups: groupIssuesByStatus(listIssues()) };
}

export async function updateIssueStatus(id, status) {
  await delay(120);
  try {
    const issue = updateIssueStatusInStore(id, status);
    if (!issue) {
      throw new ApiError(404, 'NOT_FOUND', 'Issue não encontrada');
    }
    return issue;
  } catch (error) {
    if (error.code === 'WRITE_CONFLICT') {
      throw new ApiError(409, 'WRITE_CONFLICT', 'Não foi possível salvar a alteração');
    }
    throw error;
  }
}

export async function createIssue(payload) {
  await delay(150);
  const result = validateIssuePayload(payload);
  if (!result.valid) {
    throw new ApiError(422, result.error.code, result.error.message);
  }
  return addIssue(payload);
}
