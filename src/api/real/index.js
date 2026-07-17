import { request } from './httpClient.js';

// Implementação real, contra o backend Node.js + Google Sheets API (fase futura,
// fora do escopo desta build — ver specs/001-qa-bug-tracker/spec.md, Assumptions).
// Segue exatamente o mesmo contrato descrito em
// specs/001-qa-bug-tracker/contracts/api.md, para que a troca com o mock
// (frontend/src/api/mock/index.js) não exija mudanças em nenhuma tela (FR-020).

export function login(payload) {
  return request({ method: 'POST', url: '/auth/login', data: payload });
}

export function logout() {
  return request({ method: 'POST', url: '/auth/logout' });
}

export function getHomeSummary() {
  return request({ method: 'GET', url: '/home/summary' });
}

export function getIssuesGroupedByStatus() {
  return request({ method: 'GET', url: '/issues/grouped-by-status' });
}

export function updateIssueStatus(id, status) {
  return request({ method: 'PATCH', url: `/issues/${id}/status`, data: { status } });
}

export function updateIssue(id, patch) {
  return request({ method: 'PATCH', url: `/issues/${id}`, data: patch });
}

export function createIssue(payload) {
  return request({ method: 'POST', url: '/issues', data: payload });
}

export function getIssueEvidence(id) {
  return request({ method: 'GET', url: `/issues/${encodeURIComponent(id)}/evidence` });
}

export function uploadIssueEvidence(id, file, onProgress) {
  const formData = new FormData();
  formData.append('files', file);
  return request({
    method: 'POST',
    url: `/issues/${encodeURIComponent(id)}/evidence`,
    data: formData,
    onUploadProgress: (event) => {
      if (typeof onProgress === 'function' && event.total) onProgress(event.loaded / event.total);
    },
  });
}

export function getUsers() {
  return request({ method: 'GET', url: '/users' });
}

export function getOperations() {
  return request({ method: 'GET', url: '/operations' });
}

export function getProjects(op) {
  return request({ method: 'GET', url: `/operations/${encodeURIComponent(op)}/projects` });
}

export function addProject(op, name) {
  return request({ method: 'POST', url: `/operations/${encodeURIComponent(op)}/projects`, data: { name } });
}

export function getSystemState() {
  return request({ method: 'GET', url: '/system' });
}

export function bumpServerVersion() {
  return request({ method: 'POST', url: '/system/bump' });
}

export function getTestRuns() {
  return request({ method: 'GET', url: '/test-runs' });
}

export function createTestRun(payload) {
  return request({ method: 'POST', url: '/test-runs', data: payload });
}

export function updateTestRunStatus(id, status) {
  return request({ method: 'PATCH', url: `/test-runs/${id}/status`, data: { status } });
}
