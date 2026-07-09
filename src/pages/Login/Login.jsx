import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FoundBy } from 'shared/enums.js';
import { useSession } from '../../auth/SessionContext.jsx';
import { Dropdown } from '../../components/Dropdown/Dropdown.jsx';

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

const LogoMark = (
  <span className="app-logo-mark" style={{ width: 44, height: 44, borderRadius: 12 }} aria-hidden="true">
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="8" y="8" width="8" height="12" rx="4" />
      <path d="M9 8a3 3 0 0 1 6 0" />
      <path d="M8 12H4m16 0h-4M8 16H5m14 0h-3" />
      <path d="M9 5 7.5 3.5M15 5l1.5-1.5" />
    </svg>
  </span>
);

export function Login() {
  const { isAuthenticated, loginGoogle } = useSession();
  const navigate = useNavigate();
  const [mockName, setMockName] = useState(FoundBy[0]);
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: 380, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {LogoMark}

        <div>
          <h1 style={{ font: 'var(--font-display)' }}>HermitCrab Studio</h1>
          <p style={{ margin: 'var(--space-2) 0 0', font: 'var(--font-body)', color: 'var(--color-gray-600)' }}>
            Ferramenta de gestão de testes e desenvolvimento ágil.
          </p>
        </div>

        {useRealGoogle ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span style={{ font: 'var(--font-label)', color: 'var(--color-gray-600)' }}>
              Entre com seu e-mail HermitCrab
            </span>
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

        <p style={{ margin: 0, font: 'var(--font-caption)', color: 'var(--color-gray-400)' }}>
          Acesso restrito à equipe — use sua conta do Workspace da HermitCrab.
        </p>

        {error ? (
          <p role="alert" style={{ margin: 0, color: 'var(--color-status-error)' }}>
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
