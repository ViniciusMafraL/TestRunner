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
    // `mock:dev:<nome>` entra como desenvolvedor sem operação (exercita a FTUE em
    // modo mock local); qualquer outro nome entra como admin, como antes.
    const raw = payload.credential.replace(/^mock:/, '').trim();
    const isDev = raw.toLowerCase().startsWith('dev:');
    const name = (isDev ? raw.slice(4).trim() : raw) || 'Carlos';
    const role = isDev ? 'developer' : 'admin';
    return {
      session: {
        kind: 'google',
        displayName: name,
        email: `${name.toLowerCase()}@sportia.mock`,
        role,
        canWrite: roleCanWrite(role),
        operations: isDev ? '' : '*',
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
