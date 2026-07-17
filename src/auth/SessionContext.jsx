import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isSessionOutdated } from 'shared/sessionEpoch.js';
import { api } from '../api/client.js';
import { onOutdatedSession } from '../api/outdatedSession.js';
import { MOCK_EPOCH_KEY, readMockEpoch } from '../api/mock/system.js';
import { clearStoredSession, readStoredSession, writeStoredSession } from './sessionStorage.js';

const SessionContext = createContext(null);

const isMockMode = import.meta.env.VITE_API_MODE !== 'real';

export function SessionProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession());
  // Sessão desta aba é de uma época anterior: o admin publicou uma atualização
  // e é preciso relogar (ver OutdatedSessionGate).
  const [isOutdated, setIsOutdated] = useState(false);

  // No modo real quem avisa é a camada de API (409 OUTDATED_SESSION em qualquer
  // requisição). Nenhum polling: a descoberta pega carona no que a aba já faz.
  useEffect(() => onOutdatedSession(() => setIsOutdated(true)), []);

  // No mock não há servidor para recusar requisições, então a outra aba do mesmo
  // browser descobre pelo evento `storage` — que dispara quando o admin publica.
  useEffect(() => {
    if (!isMockMode || !session) return undefined;
    function checkMockEpoch(event) {
      if (event && event.key !== MOCK_EPOCH_KEY) return;
      if (isSessionOutdated(session.epoch, readMockEpoch())) setIsOutdated(true);
    }
    checkMockEpoch();
    window.addEventListener('storage', checkMockEpoch);
    return () => window.removeEventListener('storage', checkMockEpoch);
  }, [session]);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: session !== null,
      canWrite: session?.canWrite ?? false,
      isOutdated,
      async loginGoogle(credential) {
        const { session: newSession } = await api.login({ type: 'google', credential });
        writeStoredSession(newSession);
        setSession(newSession);
        setIsOutdated(false);
      },
      /** Grava uma sessão re-emitida pelo backend (ex.: token novo após publicar atualização). */
      applySession(newSession) {
        writeStoredSession(newSession);
        setSession(newSession);
        setIsOutdated(false);
      },
      /**
       * Ferramenta de admin: avança a época do servidor, forçando todos os
       * outros a relogar. Quem publica não pode se autodeslogar, então a
       * própria sessão é atualizada para a época nova — no backend real com o
       * token re-assinado que a rota devolve; no mock, re-carimbando local.
       */
      async publishUpdate() {
        const result = await api.bumpServerVersion();
        const refreshed = result?.session ?? { ...session, epoch: result?.epoch };
        writeStoredSession(refreshed);
        setSession(refreshed);
        setIsOutdated(false);
        return result?.epoch;
      },
      async logout() {
        await api.logout();
        clearStoredSession();
        setSession(null);
        setIsOutdated(false);
      },
    }),
    [session, isOutdated],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession deve ser usado dentro de um SessionProvider');
  }
  return context;
}
