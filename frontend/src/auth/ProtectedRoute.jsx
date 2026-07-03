import { Navigate } from 'react-router-dom';
import { useSession } from './SessionContext.jsx';

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSession();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
