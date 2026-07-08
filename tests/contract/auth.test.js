import { describe, expect, it } from 'vitest';
import { login, logout } from '../../src/api/mock/auth.js';
import { ApiError } from '../../src/api/ApiError.js';

describe('POST /auth/login (contract)', () => {
  it('autentica com Google e devolve sessão com papel, e-mail e token', async () => {
    const { session } = await login({ type: 'google', credential: 'mock:Carlos' });
    expect(session).toMatchObject({
      kind: 'google',
      displayName: 'Carlos',
      email: 'carlos@sportia.mock',
      role: 'admin',
      canWrite: true,
    });
    expect(session.token).toBeTruthy();
  });

  it('rejeita login Google sem credencial', async () => {
    await expect(login({ type: 'google', credential: '' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 422,
    });
  });

  it('cria uma sessão de convidado somente leitura com token', async () => {
    const { session } = await login({ type: 'guest', name: 'Visitante' });
    expect(session).toMatchObject({ kind: 'guest', displayName: 'Visitante', role: 'guest', canWrite: false });
    expect(session.token).toBeTruthy();
  });

  it('rejeita convidado sem nome', async () => {
    await expect(login({ type: 'guest', name: '' })).rejects.toBeInstanceOf(ApiError);
  });

  it('rejeita tipo de login desconhecido (o tipo "fixed" foi removido)', async () => {
    await expect(login({ type: 'fixed', name: 'Carlos' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 422,
    });
  });

  it('logout resolve sem erro', async () => {
    await expect(logout()).resolves.toBeNull();
  });
});
