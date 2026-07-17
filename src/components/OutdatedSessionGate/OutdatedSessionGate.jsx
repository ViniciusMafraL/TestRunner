import { useSession } from '../../auth/SessionContext.jsx';

/**
 * Aviso bloqueante de "força relogar": aparece quando o admin publica uma
 * atualização e a sessão desta aba fica de uma época anterior.
 *
 * É um modal, e não um toast discreto, porque nesse estado o backend recusa
 * todas as rotas de dados — inclusive leitura. Um aviso passageiro deixaria a
 * pessoa diante de uma tela vazia sem entender o motivo; o modal explica e já
 * oferece a saída. De quebra, cobre a tela e impede criar/editar issues até
 * relogar.
 */
export function OutdatedSessionGate() {
  const { isOutdated, logout } = useSession();
  if (!isOutdated) return null;

  return (
    <div className="modal-overlay" role="alertdialog" aria-modal="true" aria-labelledby="outdated-session-title">
      <div className="form-panel" style={{ width: 420, maxWidth: '100%' }}>
        <div className="form-panel-body">
          <h2 id="outdated-session-title" className="issue-detail-title">
            Nova versão disponível
          </h2>
          <p style={{ margin: 0, font: 'var(--font-body)', color: 'var(--color-gray-600)' }}>
            Uma atualização foi publicada enquanto você trabalhava. Entre novamente para continuar — a criação e a edição
            de issues ficam bloqueadas até lá.
          </p>
        </div>
        <div className="form-footer">
          <button type="button" className="button-primary" onClick={logout}>
            Relogar
          </button>
        </div>
      </div>
    </div>
  );
}
