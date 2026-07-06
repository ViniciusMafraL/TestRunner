import { Status } from 'shared/enums.js';
import { useSession } from '../../auth/SessionContext.jsx';
import { StatusPill, StatusPillSelect } from '../StatusPill/StatusPill.jsx';
import { AvatarWithLabel } from '../Avatar/Avatar.jsx';
import { FIELD_ICONS } from '../FieldIcons/FieldIcons.jsx';

const SEVERITY_SLUG = { Critical: 'critical', Major: 'major', Compliance: 'compliance' };

function FieldRow({ icon, label, children }) {
  return (
    <div className="field-row">
      <span className="field-label">
        {icon}
        {label}
      </span>
      <span className="field-value">{children}</span>
    </div>
  );
}

function PlainValue({ value }) {
  const text = String(value ?? '');
  return text ? text : <span className="field-value--empty">—</span>;
}

export function IssueDetailModal({ issue, onClose, onStatusChange }) {
  if (!issue) return null;
  const { canWrite } = useSession();

  const attachment = String(issue.attachment ?? '');

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes da issue ${issue.id}`}
      onClick={onClose}
    >
      <div className="form-panel issue-detail-panel" onClick={(event) => event.stopPropagation()}>
        <div className="issue-detail-header">
          <span className="issue-detail-id">{issue.id}</span>
          <button type="button" className="issue-detail-close" onClick={onClose} aria-label="Fechar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="form-panel-body">
          <h2 className="issue-detail-title">{issue.title}</h2>

          <div className="issue-detail-pills">
            {canWrite && onStatusChange ? (
              <StatusPillSelect
                value={issue.status}
                options={Status}
                onChange={(status) => onStatusChange(issue.id, status)}
                ariaLabel="Status"
              />
            ) : (
              <StatusPill status={issue.status} />
            )}
            {issue.severity ? (
              <span className={`severity-chip severity-chip--${SEVERITY_SLUG[issue.severity] ?? 'muted'}`}>{issue.severity}</span>
            ) : null}
            {issue.tag ? <span className="tag-chip">{issue.tag}</span> : null}
          </div>

          {issue.description ? <p className="issue-detail-description">{issue.description}</p> : null}
        </div>

        <div className="fields-label">Fields</div>

        <FieldRow icon={FIELD_ICONS.foundBy} label="Found By">
          {issue.foundBy ? <AvatarWithLabel name={issue.foundBy} /> : <span className="field-value--empty">—</span>}
        </FieldRow>
        <FieldRow icon={FIELD_ICONS.version} label="Version">
          {issue.version ? <span className="cell-mono">{issue.version}</span> : <span className="field-value--empty">—</span>}
        </FieldRow>
        <FieldRow icon={FIELD_ICONS.platform} label="Platform">
          <PlainValue value={issue.platform} />
        </FieldRow>
        <FieldRow icon={FIELD_ICONS.keywords} label="Keywords">
          {issue.keywords ? <span className="keyword-chip">{issue.keywords}</span> : <span className="field-value--empty">—</span>}
        </FieldRow>
        <FieldRow icon={FIELD_ICONS.store} label="Store">
          <PlainValue value={issue.store} />
        </FieldRow>
        <FieldRow icon={FIELD_ICONS.createdIn} label="Created In">
          <PlainValue value={issue.createdIn} />
        </FieldRow>
        <FieldRow icon={FIELD_ICONS.attachment} label="Attachment">
          {attachment ? (
            attachment.startsWith('http') ? (
              <a className="attachment-link" href={attachment} target="_blank" rel="noreferrer">
                <span className="table-cell-ellipsis">{attachment}</span>
              </a>
            ) : (
              attachment
            )
          ) : (
            <span className="field-value--empty">—</span>
          )}
        </FieldRow>
      </div>
    </div>
  );
}
