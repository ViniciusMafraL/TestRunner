import * as mockApi from './mock/index.js';
import * as realApi from './real/index.js';

/**
 * Única interface de acesso a dados do frontend (FR-020). A escolha entre a
 * implementação mock (dados de exemplo em memória) e a real (backend + Google
 * Sheets, fase futura) é feita uma única vez aqui, via VITE_API_MODE. Nenhuma
 * tela deve importar `mock/` ou `real/` diretamente.
 */
const impl = import.meta.env.VITE_API_MODE === 'real' ? realApi : mockApi;

export const api = {
  login: impl.login,
  logout: impl.logout,
  getHomeSummary: impl.getHomeSummary,
  getIssuesGroupedByStatus: impl.getIssuesGroupedByStatus,
  updateIssueStatus: impl.updateIssueStatus,
  updateIssue: impl.updateIssue,
  createIssue: impl.createIssue,
  getTestRuns: impl.getTestRuns,
  createTestRun: impl.createTestRun,
  updateTestRunStatus: impl.updateTestRunStatus,
};
