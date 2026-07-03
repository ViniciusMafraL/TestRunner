import { FoundBy } from './enums.js';

export const ISSUE_REQUIRED_FIELDS = ['title', 'version'];
export const ISSUE_OPTIONAL_FIELDS = [
  'severity',
  'tag',
  'description',
  'attachment',
  'foundBy',
  'platform',
  'keywords',
  'store',
];
export const ISSUE_DEFAULT_STATUS = 'Open';

export const TEST_RUN_REQUIRED_FIELDS = ['build', 'version', 'testType', 'responsible', 'platform'];
export const TEST_RUN_DEFAULT_STATUS = 'Pendente';

export function validateIssuePayload(payload) {
  const missing = ISSUE_REQUIRED_FIELDS.filter((field) => !payload?.[field]);
  if (missing.length > 0) {
    return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Title e Version são obrigatórios', missing } };
  }
  return { valid: true };
}

export function validateTestRunPayload(payload) {
  const missing = TEST_RUN_REQUIRED_FIELDS.filter((field) => !payload?.[field]);
  if (missing.length > 0) {
    return {
      valid: false,
      error: { code: 'VALIDATION_ERROR', message: 'Build, Version, tipo de teste, responsável e plataforma são obrigatórios', missing },
    };
  }
  return { valid: true };
}

export function validateLoginPayload(payload) {
  if (!payload || typeof payload.name !== 'string' || payload.name.trim() === '') {
    return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Nome é obrigatório' } };
  }
  if (payload.type === 'fixed' && !FoundBy.includes(payload.name)) {
    return { valid: false, error: { code: 'INVALID_LOGIN', message: 'Usuário não reconhecido' } };
  }
  if (payload.type !== 'fixed' && payload.type !== 'guest') {
    return { valid: false, error: { code: 'VALIDATION_ERROR', message: 'Tipo de login inválido' } };
  }
  return { valid: true };
}
