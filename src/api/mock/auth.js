import { validateLoginPayload, roleCanWrite } from 'shared/contracts.js';
import { ApiError } from '../ApiError.js';
import { readMockEpoch } from './system.js';

const MOCK_LATENCY_MS = 150;

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * No mock, o "login com Google" é simulado: a credencial é o próprio nome do
 * usuário fingido (a tela envia `mock:<nome>`), sempre com papel admin — o
 * fluxo real de token/planilha de usuários só existe no backend.
 */
export async function login(payload) {
  await delay(MOCK_LATENCY_MS);
  const result = validateLoginPayload(payload);
  if (!result.valid) {
    const status = result.error.code === 'INVALID_LOGIN' ? 401 : 422;
    throw new ApiError(status, result.error.code, result.error.message);
  }

  if (payload.type === 'google') {
    const name = payload.credential.replace(/^mock:/, '').trim() || 'Carlos';
    const role = 'admin';
    return {
      session: {
        kind: 'google',
        displayName: name,
        email: `${name.toLowerCase()}@sportia.mock`,
        role,
        canWrite: roleCanWrite(role),
        token: 'mock-session-token',
        // Época vigente no login — um force update posterior invalida a sessão.
        epoch: readMockEpoch(),
      },
    };
  }

  return {
    session: {
      kind: 'guest',
      displayName: payload.name.trim(),
      role: 'guest',
      canWrite: false,
      token: 'mock-session-token',
      epoch: readMockEpoch(),
    },
  };
}

export async function logout() {
  await delay(MOCK_LATENCY_MS);
  return null;
}
