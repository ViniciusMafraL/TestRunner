import { describe, expect, it } from 'vitest';
import { getUsers } from '../../src/api/mock/users.js';

describe('GET /users (contract)', () => {
  it('lista os usuários registrados com e-mail, nome e papel', async () => {
    const { users } = await getUsers();
    expect(users).toHaveLength(5);
    expect(users[0]).toMatchObject({ name: 'Carlos', role: 'admin' });
    for (const user of users) {
      expect(user.email).toContain('@');
      expect(['admin', 'qa', 'viewer']).toContain(user.role);
    }
  });
});
