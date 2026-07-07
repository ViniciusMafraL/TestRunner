import { validateEvidenceFiles, validateIssuePayload, validateIssueUpdatePayload } from 'shared/contracts.js';
import { groupIssuesByStatus } from 'shared/groupByStatus.js';
import { ApiError } from '../ApiError.js';
import {
  addIssue,
  attachEvidenceLinkInStore,
  listEvidenceFilesInStore,
  listIssues,
  updateIssueInStore,
  updateIssueStatusInStore,
} from './store.js';

/* Miniatura fake para o mock (sem rede): retângulo cinza com "mock" escrito. */
const MOCK_THUMBNAIL =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="#e4e4e7"/><text x="80" y="50" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#71717a">mock</text></svg>',
  );

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

export async function updateIssue(id, patch) {
  await delay(120);
  const result = validateIssueUpdatePayload(patch);
  if (!result.valid) {
    throw new ApiError(422, result.error.code, result.error.message);
  }
  try {
    const issue = updateIssueInStore(id, result.patch);
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

/**
 * Simula POST /issues/:id/evidence. Falha determinística: arquivo com "erro"
 * no nome devolve 502 DRIVE_ERROR (mesmo espírito do BUG-002 no status),
 * para validar o aviso de "issue criada, evidências falharam" na UI.
 */
export async function uploadIssueEvidence(id, file, onProgress) {
  await delay(150);
  const result = validateEvidenceFiles([file]);
  if (!result.valid) {
    throw new ApiError(422, result.error.code, result.error.message);
  }
  if (typeof onProgress === 'function') onProgress(1);
  if (String(file?.name ?? '').toLowerCase().includes('erro')) {
    throw new ApiError(502, 'DRIVE_ERROR', 'Não foi possível enviar a evidência para o Drive');
  }
  const issue = attachEvidenceLinkInStore(id, file);
  if (!issue) {
    throw new ApiError(404, 'NOT_FOUND', 'Issue não encontrada');
  }
  return issue;
}

/** Simula GET /issues/:id/evidence a partir do que o upload registrou no store. */
export async function getIssueEvidence(id) {
  await delay(150);
  const files = listEvidenceFilesInStore(id).map((file, index) => ({
    id: `mock-file-${id}-${index}`,
    name: file.name,
    mimeType: file.type,
    thumbnailUrl: MOCK_THUMBNAIL,
    previewUrl: 'about:blank',
    webViewLink: `https://drive.google.com/drive/folders/mock-${id}`,
  }));
  return { files };
}

export async function createIssue(payload) {
  await delay(150);
  const result = validateIssuePayload(payload);
  if (!result.valid) {
    throw new ApiError(422, result.error.code, result.error.message);
  }
  return addIssue(payload);
}
