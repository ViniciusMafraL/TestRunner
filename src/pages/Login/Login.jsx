import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FoundBy } from 'shared/enums.js';
import { useSession } from '../../auth/SessionContext.jsx';
import { Dropdown } from '../../components/Dropdown/Dropdown.jsx';

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

export function Login() {
  const { isAuthenticated, loginGoogle, loginGuest } = useSession();
  const navigate = useNavigate();
  const [mockName, setMockName] = useState(FoundBy[0]);
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const googleButtonRef = useRef(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const useRealGoogle = import.meta.env.VITE_API_MODE === 'real' && Boolean(clientId);

  async function handleGoogleCredential(credential) {
    setError(null);
    setPending(true);
    try {
      await loginGoogle(credential);
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err.message ?? 'Não foi possível entrar com o Google');
    } finally {
      setPending(false);
    }
  }

  // Botão oficial do Google Identity Services (só no modo real): carrega o
  // script uma vez e renderiza o botão no div de destino.
  useEffect(() => {
    if (!useRealGoogle) return undefined;
    let cancelled = false;

    function renderButton() {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => handleGoogleCredential(response.credential),
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, { theme: 'outline', size: 'large', width: 312 });
    }

    if (window.google?.accounts?.id) {
      renderButton();
    } else {
      let script = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`);
      if (!script) {
        script = document.createElement('script');
        script.src = GSI_SCRIPT_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', renderButton);
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useRealGoogle, clientId]);

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  async function handleMockGoogleLogin(event) {
    event.preventDefault();
    await handleGoogleCredential(`mock:${mockName}`);
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

        {useRealGoogle ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ font: 'var(--font-label)' }}>Entrar com a conta do Workspace</span>
            <div ref={googleButtonRef} />
          </div>
        ) : (
          <form onSubmit={handleMockGoogleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <label htmlFor="mock-name" style={{ font: 'var(--font-label)' }}>
              Entrar com Google (simulado no modo mock)
            </label>
            <Dropdown id="mock-name" value={mockName} options={FoundBy} onChange={setMockName} />
            <button type="submit" className="button-primary" disabled={pending}>
              Entrar com Google
            </button>
          </form>
        )}

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
