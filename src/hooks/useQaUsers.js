import { useEffect, useState } from 'react';
import { WRITE_ROLES } from 'shared/contracts.js';
import { FoundBy } from 'shared/enums.js';
import { api } from '../api/client.js';

/**
 * Nomes dos QAs registrados na plataforma (papéis com escrita na planilha de
 * usuários), para o campo Found By. Enquanto carrega — ou se a chamada falhar —
 * cai no enum legado de 5 nomes, para o formulário nunca ficar sem opções.
 */
export function useQaUsers() {
  const [names, setNames] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getUsers()
      .then(({ users }) => {
        if (cancelled) return;
        const qaNames = users.filter((user) => WRITE_ROLES.includes(user.role)).map((user) => user.name);
        setNames(qaNames.length > 0 ? qaNames : FoundBy);
      })
      .catch(() => {
        if (!cancelled) setNames(FoundBy);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return names ?? FoundBy;
}
