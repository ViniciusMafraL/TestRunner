import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FoundBy } from 'shared/enums.js';
import { useSession } from '../../auth/SessionContext.jsx';
import { Dropdown } from '../../components/Dropdown/Dropdown.jsx';

export function Login() {
  const { isAuthenticated, loginFixed, loginGuest } = useSession();
  const navigate = useNavigate();
  const [fixedName, setFixedName] = useState(FoundBy[0]);
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  async function handleFixedLogin(event) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await loginFixed(fixedName);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.message ?? 'Não foi possível entrar');
    } finally {
      setPending(false);
    }
  }

  async function handleGuestLogin(event) {
    event.preventDefault();
    setError(null);
    if (!guestName.trim()) {
      setError('Informe um nome para entrar como convidado');
      return;
    }
    setPending(true);
    try {
      await loginGuest(guestName);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.message ?? 'Não foi possível entrar');
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <h1 style={{ font: 'var(--font-display)' }}>✦HermitCrab</h1>

        <form onSubmit={handleFixedLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <label htmlFor="fixed-name" style={{ font: 'var(--font-label)' }}>
            Entrar como membro da equipe
          </label>
          <Dropdown id="fixed-name" value={fixedName} options={FoundBy} onChange={setFixedName} />
          <button type="submit" className="button-primary" disabled={pending}>
            Entrar
          </button>
        </form>

        <form onSubmit={handleGuestLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <label htmlFor="guest-name" style={{ font: 'var(--font-label)' }}>
            Ou entre como convidado (somente visualização)
          </label>
          <input
            id="guest-name"
            type="text"
            placeholder="Seu nome"
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
          />
          <button type="submit" className="button-secondary" disabled={pending}>
            Entrar como convidado
          </button>
        </form>

        {error ? (
          <p role="alert" style={{ color: 'var(--color-status-error)' }}>
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
