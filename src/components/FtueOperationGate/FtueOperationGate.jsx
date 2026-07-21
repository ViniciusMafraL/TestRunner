import { useEffect, useState } from 'react';
import { parseOperationsList } from 'shared/contracts.js';
import { api } from '../../api/client.js';
import { useSession } from '../../auth/SessionContext.jsx';
import { Dropdown } from '../Dropdown/Dropdown.jsx';

/**
 * FTUE do desenvolvedor: no primeiro login, quando ainda não há operação
 * anexada, um modal bloqueante pede que ele escolha sua operação. Ao confirmar,
 * a escolha é gravada na planilha de usuários e o backend reemite a sessão já
 * com a operação — aplicada aqui via applySession, sem relogar. A partir daí a
 * condição do gate deixa de valer e ele não reaparece.
 *
 * Aparece só para o papel `developer` sem operação: admin/qa/viewer têm acesso
 * definido por outra via (planilha), então não passam pela FTUE.
 */
export function FtueOperationGate() {
  const { session, applySession } = useSession();
  const needsFtue = session?.role === 'developer' && parseOperationsList(session?.operations).length === 0;

  const [operations, setOperations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!needsFtue) return undefined;
    let cancelled = false;
    setLoading(true);
    api
      .getOperationsCatalog()
      .then(({ operations: list }) => {
        if (cancelled) return;
        setOperations(list);
        setSelected(list[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar as operações. Tente novamente.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [needsFtue]);

  if (!needsFtue) return null;

  const labelOf = (id) => operations.find((op) => op.id === id)?.label ?? id;

  async function confirm() {
    if (!selected || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { session: newSession } = await api.setMyOperation(selected);
      applySession(newSession);
    } catch {
      setError('Não foi possível salvar sua operação. Tente novamente.');
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="ftue-operation-title">
      <div className="form-panel" style={{ width: 420, maxWidth: '100%' }}>
        <div className="form-panel-body">
          <h2 id="ftue-operation-title" className="issue-detail-title">
            Selecione sua operação
          </h2>
          <p style={{ margin: 0, font: 'var(--font-body)', color: 'var(--color-gray-600)' }}>
            Para liberar seu acesso, escolha a operação em que você vai trabalhar. Isso é definido uma única vez.
          </p>
          <div style={{ marginTop: 'var(--space-3)' }}>
            {loading ? (
              <p style={{ margin: 0, font: 'var(--font-label)', color: 'var(--color-gray-600)' }}>Carregando operações…</p>
            ) : operations.length === 0 ? (
              <p role="alert" style={{ margin: 0, font: 'var(--font-label)', color: 'var(--color-status-error)' }}>
                Nenhuma operação disponível. Fale com um administrador.
              </p>
            ) : (
              <Dropdown
                ariaLabel="Operação"
                value={selected ?? operations[0].id}
                options={operations.map((op) => op.id)}
                onChange={setSelected}
                renderValue={labelOf}
                renderOption={labelOf}
              />
            )}
          </div>
          {error ? (
            <div role="alert" style={{ marginTop: 'var(--space-2)', font: 'var(--font-label)', color: 'var(--color-status-error)' }}>
              {error}
            </div>
          ) : null}
        </div>
        <div className="form-footer">
          <button type="button" className="button-primary" onClick={confirm} disabled={submitting || loading || !selected}>
            {submitting ? 'Salvando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
