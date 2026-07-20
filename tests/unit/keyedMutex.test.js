import { describe, expect, it } from 'vitest';
import { withLock } from '../../backend/src/keyedMutex.js';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('keyedMutex (withLock)', () => {
  it('serializa tarefas com a mesma chave: a segunda só começa quando a primeira termina', async () => {
    const events = [];
    const task = (label) => async () => {
      events.push(`${label}:start`);
      await tick();
      events.push(`${label}:end`);
      return label;
    };

    const results = await Promise.all([withLock('k', task('A')), withLock('k', task('B'))]);

    expect(results).toEqual(['A', 'B']);
    // Sem o lock a ordem seria A:start, B:start, A:end, B:end.
    expect(events).toEqual(['A:start', 'A:end', 'B:start', 'B:end']);
  });

  it('roda chaves diferentes em paralelo (não esperam uma pela outra)', async () => {
    const events = [];
    const task = (label) => async () => {
      events.push(`${label}:start`);
      await tick();
      events.push(`${label}:end`);
    };

    await Promise.all([withLock('k1', task('A')), withLock('k2', task('B'))]);

    // Ambas começam antes de qualquer uma terminar.
    expect(events.slice(0, 2).sort()).toEqual(['A:start', 'B:start']);
  });

  it('a corrente sobrevive a uma falha: a próxima tarefa da mesma chave ainda roda', async () => {
    await expect(
      withLock('k', async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    await expect(withLock('k', async () => 'ok')).resolves.toBe('ok');
  });
});
