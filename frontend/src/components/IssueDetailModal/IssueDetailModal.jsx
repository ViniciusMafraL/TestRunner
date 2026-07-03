import { Status } from 'shared/enums.js';
import { useSession } from '../../auth/SessionContext.jsx';
import { ISSUE_FIELD_LABELS } from '../../utils/issueFields.js';

export function IssueDetailModal({ issue, onClose, onStatusChange }) {
  if (!issue) return null;
  const { canWrite } = useSession();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes da issue ${issue.id}`}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(24,24,27,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div className="card" style={{ width: 480, maxHeight: '80vh', overflowY: 'auto' }} onClick={(event) => event.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ font: 'var(--font-heading-2)' }}>{issue.title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        {canWrite && onStatusChange ? (
          <label style={{ display: 'block', margin: 'var(--space-3) 0' }}>
            Status
            <select value={issue.status} onChange={(event) => onStatusChange(issue.id, event.target.value)}>
              {!Status.includes(issue.status) ? <option value={issue.status}>{issue.status} (não reconhecido)</option> : null}
              {Status.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <dl>
          {Object.entries(ISSUE_FIELD_LABELS).map(([field, label]) => (
            <div key={field} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-1) 0' }}>
              <dt style={{ color: 'var(--color-gray-600)' }}>{label}</dt>
              <dd style={{ margin: 0 }}>{String(issue[field] ?? '') || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
