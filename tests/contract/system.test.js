import { afterEach, describe, expect, it } from 'vitest';
import { login } from '../../src/api/mock/auth.js';
import { bumpServerVersion, getSystemState, MOCK_EPOCH_KEY } from '../../src/api/mock/system.js';
import { isSessionOutdated } from '../../shared/sessionEpoch.js';

describe('GET /system e POST /system/bump (contract)', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('começa na primeira época', async () => {
    expect(await getSystemState()).toEqual({ epoch: 1 });
  });

  it('o login carimba a sessão com a época vigente', async () => {
    const { session } = await login({ type: 'google', credential: 'mock:Carlos' });
    expect(session.epoch).toBe(1);
  });

  it('publicar atualização avança a época', async () => {
    expect(await bumpServerVersion()).toEqual({ epoch: 2 });
    expect(await getSystemState()).toEqual({ epoch: 2 });
  });

  it('sessão emitida antes do bump fica desatualizada; a de depois, não', async () => {
    const { session: antes } = await login({ type: 'google', credential: 'mock:Carlos' });
    const { epoch } = await bumpServerVersion();
    expect(isSessionOutdated(antes.epoch, epoch)).toBe(true);

    const { session: depois } = await login({ type: 'google', credential: 'mock:Carlos' });
    expect(isSessionOutdated(depois.epoch, epoch)).toBe(false);
  });

  it('época persiste no storage entre chamadas', async () => {
    await bumpServerVersion();
    expect(JSON.parse(localStorage.getItem(MOCK_EPOCH_KEY))).toBe(2);
  });
});
