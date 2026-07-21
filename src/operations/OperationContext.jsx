import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { useSession } from '../auth/SessionContext.jsx';
import {
  readCurrentOperation,
  writeCurrentOperation,
  readCurrentProject,
  writeCurrentProject,
} from './operationStorage.js';

const OperationContext = createContext(null);

/**
 * Operação (ambiente) atual + seus projetos (cada projeto = uma aba da planilha)
 * + o projeto atual. Carrega as operações que o usuário acessa e escolhe a
 * atual (persistida ou a primeira); depois carrega os projetos e escolhe o
 * atual da mesma forma. A seleção é gravada no localStorage ANTES de atualizar
 * o estado, para que o refetch das telas (mock lê o store; real envia
 * X-Operation / X-Project) já use a operação/projeto novos.
 */
export function OperationProvider({ children }) {
  const { session } = useSession();
  const [operations, setOperations] = useState([]);
  const [currentOperation, setCurrentOperation] = useState(() => readCurrentOperation());
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(() => readCurrentProject());

  // Rebusca ao mudar o token da sessão: após a FTUE, applySession reemite a
  // sessão com a operação anexada; sem isto a lista ficaria vazia até um reload.
  useEffect(() => {
    let cancelled = false;
    api
      .getOperations()
      .then(({ operations: list }) => {
        if (cancelled) return;
        setOperations(list);
        setCurrentOperation((previous) => {
          const chosen = previous && list.some((op) => op.id === previous) ? previous : list[0]?.id ?? null;
          if (chosen) writeCurrentOperation(chosen);
          return chosen;
        });
      })
      .catch(() => {
        // sem operações acessíveis: telas mostram vazio; o seletor fica oculto.
      });
    return () => {
      cancelled = true;
    };
  }, [session?.token]);

  useEffect(() => {
    if (!currentOperation) return undefined;
    let cancelled = false;
    api
      .getProjects(currentOperation)
      .then(({ projects: list }) => {
        if (cancelled) return;
        setProjects(list);
        setCurrentProject((previous) => {
          const chosen = previous && list.includes(previous) ? previous : list[0] ?? null;
          writeCurrentProject(chosen);
          return chosen;
        });
      })
      .catch(() => {
        if (cancelled) return;
        setProjects([]);
        setCurrentProject(null);
        writeCurrentProject(null);
      });
    return () => {
      cancelled = true;
    };
  }, [currentOperation]);

  const tagValues = useMemo(
    () => operations.find((op) => op.id === currentOperation)?.tagValues ?? [],
    [operations, currentOperation],
  );

  const value = useMemo(
    () => ({
      operations,
      currentOperation,
      projects,
      currentProject,
      tagValues,
      selectOperation(id) {
        if (id === currentOperation) return;
        writeCurrentOperation(id);
        // Esvazia a lista de projetos enquanto a nova op carrega; o efeito de
        // projetos reconcilia o projeto atual (mantém se existir na nova op,
        // senão cai no 1º). NÃO zera currentProject aqui: assim um deep-link que
        // já selecionou o projeto (?project=) sobrevive à troca de operação.
        setProjects([]);
        setCurrentOperation(id);
      },
      selectProject(name) {
        if (name === currentProject) return;
        writeCurrentProject(name);
        setCurrentProject(name);
      },
      async addProject(name) {
        const { projects: list } = await api.addProject(currentOperation, name);
        setProjects(list);
        return list;
      },
    }),
    [operations, currentOperation, projects, currentProject, tagValues],
  );

  return <OperationContext.Provider value={value}>{children}</OperationContext.Provider>;
}

export function useOperations() {
  const context = useContext(OperationContext);
  if (!context) {
    throw new Error('useOperations deve ser usado dentro de OperationProvider');
  }
  return context;
}
