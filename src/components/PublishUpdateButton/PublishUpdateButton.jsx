import { useState } from 'react';
import { useSession } from '../../auth/SessionContext.jsx';

const RocketIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3c3.5 2 5.5 5.5 5.5 9.5L14 16h-4l-3.5-3.5C6.5 8.5 8.5 5 12 3z" />
    <circle cx="12" cy="10" r="1.5" />
    <path d="M10 16.5 8 21l4-2 4 2-2-4.5" />
  </svg>
);

/**
 * "Publicar atualização" (só admin): avança a época do servidor e força todos
 * os outros usuários a relogar. Ação de consequência ampla, então pede
 * confirmação explícita antes de disparar.
 */
export function PublishUpdateButton() {
  const { session, publishUpdate } = useSession();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  if (session?.role !== 'admin') return null;

  async function handlePublish() {
    setBusy(true);
    setMessage(null);
    try {
      const epoch = await publishUpdate();
      setConfirming(false);
      setMessage(`Atualização publicada (versão ${epoch}). Os demais usuários vão relogar.`);
    } catch (error) {
      setMessage(error.message ?? 'Não foi possível publicar a atualização');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {confirming ? (
        <div className="app-session-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--font-label)' }}>Forçar todos a relogar?</span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button type="button" className="button-primary" onClick={handlePublish} disabled={busy}>
              {busy ? 'Publicando…' : 'Confirmar'}
            </button>
            <button type="button" className="chip-button" onClick={() => setConfirming(false)} disabled={busy}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="app-logout" onClick={() => setConfirming(true)}>
          {RocketIcon}
          Publicar atualização
        </button>
      )}
      {message ? (
        <span role="status" style={{ font: 'var(--font-caption)', color: 'var(--sidebar-text-muted)' }}>
          {message}
        </span>
      ) : null}
    </div>
  );
}
