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

export function getTestRuns() {
  return request({ method: 'GET', url: '/test-runs' });
}

export function createTestRun(payload) {
  return request({ method: 'POST', url: '/test-runs', data: payload });
}

export function updateTestRunStatus(id, status) {
  return request({ method: 'PATCH', url: `/test-runs/${id}/status`, data: { status } });
}
