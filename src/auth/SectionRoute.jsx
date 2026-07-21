import { Navigate } from 'react-router-dom';
import { roleCanAccessSection } from 'shared/contracts.js';
import { useSession } from './SessionContext.jsx';

/**
 * Gate de rota por papel: se o papel logado não tem acesso à seção (ex.: um
 * developer tentando abrir /reporter por URL direta), redireciona para /home.
 * Complementa o filtro do menu — bloqueia navegação direta, não só o link.
 */
export function SectionRoute({ basePath, children }) {
  const { session } = useSession();
  if (!roleCanAccessSection(session?.role, basePath)) {
    return <Navigate to="/home" replace />;
  }
  return children;
}
