import { validateLoginPayload } from 'shared/contracts.js';
import { ApiError } from '../ApiError.js';

const MOCK_LATENCY_MS = 150;

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function login(payload) {
  await delay(MOCK_LATENCY_MS);
  const result = validateLoginPayload(payload);
  if (!result.valid) {
    const status = result.error.code === 'INVALID_LOGIN' ? 401 : 422;
    throw new ApiError(status, result.error.code, result.error.message);
  }
  return {
    session: {
      kind: payload.type === 'fixed' ? 'fixed' : 'guest',
      displayName: payload.name.trim(),
      canWrite: payload.type === 'fixed',
    },
  };
}

export async function logout() {
  await delay(MOCK_LATENCY_MS);
  return null;
}
