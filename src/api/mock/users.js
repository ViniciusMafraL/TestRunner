import { FoundBy } from 'shared/enums.js';

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Simula GET /users: os 5 QAs históricos como usuários registrados. */
export async function getUsers() {
  await delay(100);
  return {
    users: FoundBy.map((name, index) => ({
      email: `${name.toLowerCase()}@sportia.mock`,
      name,
      role: index === 0 ? 'admin' : 'qa',
    })),
  };
}
