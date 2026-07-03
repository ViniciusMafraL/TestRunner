import { describe, expect, it } from 'vitest';
import { login, logout } from '../../src/api/mock/auth.js';
import { ApiError } from '../../src/api/ApiError.js';

describe('POST /auth/login (contract)', () => {
  it('autentica um usuário fixo válido com canWrite true', async () => {
    const { session } = await login({ type: 'fixed', name: 'Carlos' });
    expect(session).toEqual({ kind: 'fixed', displayName: 'Carlos', canWrite: true });
  });

  it('rejeita um login fixo com nome não cadastrado', async () => {
    await expect(login({ type: 'fixed', name: 'Alguém' })).rejects.toMatchObject({
      code: 'INVALID_LOGIN',
      status: 401,
    });
  });

  it('cria uma sessão de convidado com canWrite false para qualquer nome', async () => {
    const { session } = await login({ type: 'guest', name: 'Visitante' });
    expect(session).toEqual({ kind: 'guest', displayName: 'Visitante', canWrite: false });
  });

  it('rejeita convidado sem nome', async () => {
    await expect(login({ type: 'guest', name: '' })).rejects.toBeInstanceOf(ApiError);
  });

  it('logout resolve sem erro', async () => {
    await expect(logout()).resolves.toBeNull();
  });
});
