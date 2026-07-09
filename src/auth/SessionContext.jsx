import { createContext, useContext, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { clearStoredSession, readStoredSession, writeStoredSession } from './sessionStorage.js';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession());

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: session !== null,
      canWrite: session?.canWrite ?? false,
      async loginGoogle(credential) {
        const { session: newSession } = await api.login({ type: 'google', credential });
        writeStoredSession(newSession);
        setSession(newSession);
      },
      async logout() {
        await api.logout();
        clearStoredSession();
        setSession(null);
      },
    }),
    [session],
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
