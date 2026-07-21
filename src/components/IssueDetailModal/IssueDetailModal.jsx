import { useState } from 'react';
import { Keywords, Platform, Severity, Store } from 'shared/enums.js';
import { ISSUE_EDITABLE_FIELDS, allowedStatusTargetsForRole } from 'shared/contracts.js';
import { useSession } from '../../auth/SessionContext.jsx';
import { useOperations } from '../../operations/OperationContext.jsx';
import { useQaUsers } from '../../hooks/useQaUsers.js';
import { StatusPill, StatusPillSelect } from '../StatusPill/StatusPill.jsx';
import { AvatarGroup } from '../Avatar/Avatar.jsx';
import { FIELD_ICONS } from '../FieldIcons/FieldIcons.jsx';
import { Dropdown } from '../Dropdown/Dropdown.jsx';
import { MultiSelectDropdown } from '../Dropdown/MultiSelectDropdown.jsx';
import { EvidenceGallery } from '../EvidenceGallery/EvidenceGallery.jsx';
import { KeywordChips } from '../KeywordChips/KeywordChips.jsx';

const SEVERITY_SLUG = { Critical: 'critical', Major: 'major', Compliance: 'compliance', Normal: 'normal' };

/* Mesmos seletores de valores fixos do Reporter (ver contracts/api.md).
   Found By e Keywords ficam fora (multi-seleção); Tag é montada no render pois
   depende dos valores da operação (tagValues). */
const EDIT_SELECTS = [
  { name: 'severity', label: 'Severity', options: Severity },
  { name: 'platform', label: 'Platform', options: Platform },
  { name: 'store', label: 'Store', options: Store },
];

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

/** 'YYYY-MM-DD' → 'DD/MM/YYYY' (formato do LOG). Datas fora do padrão passam intactas. */
function formatLogDate(value) {
  const text = String(value ?? '');
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : text;
}

/**
 * Histórico da issue. Hoje só temos a data de criação (`createdIn`), então a
 * única entrada é "Report criado". Quando o backend passar a gravar mudanças de
 * status (ator + de→para + timestamp), novas linhas entram acima da criação.
 */
function IssueLog({ issue }) {
  return (
    <ul className="issue-log">
      <li className="issue-log-entry">
        <span className="issue-log-dot" aria-hidden="true" />
        <span className="issue-log-text">Report criado</span>
        {issue.createdIn ? <span className="issue-log-date">{formatLogDate(issue.createdIn)}</span> : null}
      </li>
    </ul>
  );
}

function buildForm(issue) {
  const form = {};
  for (const field of ISSUE_EDITABLE_FIELDS) {
    form[field] = String(issue[field] ?? '');
  }
  return form;
}

function IssueDetailContent({ issue, onClose, onStatusChange, onIssueUpdate }) {
  const { canWrite, session } = useSession();
  const { tagValues } = useOperations();
  const qaUsers = useQaUsers();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => buildForm(issue));
  const [fieldErrors, setFieldErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  const attachment = String(issue.attachment ?? '');
  const canEdit = canWrite && typeof onIssueUpdate === 'function';

  function startEditing() {
    setForm(buildForm(issue));
    setFieldErrors({});
    setSaveError(null);
    setEditing(true);
  }

  function updateField(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSave() {
    const missing = {};
    if (!form.title.trim()) missing.title = 'Title é obrigatório';
    if (!form.version.trim()) missing.version = 'Version é obrigatório';
    setFieldErrors(missing);
    if (Object.keys(missing).length > 0) return;

    const patch = {};
    for (const field of ISSUE_EDITABLE_FIELDS) {
      if (form[field] !== String(issue[field] ?? '')) {
        patch[field] = form[field];
      }
    }
    if (Object.keys(patch).length === 0) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await onIssueUpdate(issue.id, patch);
      setEditing(false);
    } catch (error) {
      setSaveError(error.message ?? 'Não foi possível salvar a alteração');
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    // Opções de status conforme o papel (mesma política do Issue Tracker):
    // dev só move Open→In progress/To review; viewer/convidado veem texto.
    const targets = allowedStatusTargetsForRole(session?.role, issue.status);
    return (
      <div
        className="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes da issue ${issue.id}`}
        onClick={onClose}
      >
        <div className="form-panel issue-detail-panel issue-detail-panel--wide" onClick={(event) => event.stopPropagation()}>
          <div className="issue-detail-grid">
            <div className="issue-detail-main">
              <div className="issue-detail-pills">
                {targets.length > 0 && onStatusChange ? (
                  <StatusPillSelect
                    value={issue.status}
                    options={targets}
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

              <h2 className="issue-detail-title">{issue.title}</h2>

              {issue.keywords ? <KeywordChips value={issue.keywords} /> : null}

              {/* Descrição + evidências rolam juntas quando a descrição é longa. */}
              <div className="issue-detail-scroll">
                {issue.description ? <p className="issue-detail-description">{issue.description}</p> : null}
                <EvidenceGallery issue={issue} />
              </div>

              {canEdit ? (
                <div className="issue-detail-actions">
                  <button type="button" className="chip-button" onClick={startEditing}>
                    Editar
                  </button>
                </div>
              ) : null}
            </div>

            <div className="issue-detail-meta">
              <div className="issue-detail-meta-top">
                <span className="issue-detail-id">{issue.id}</span>
                <button type="button" className="issue-detail-close" onClick={onClose} aria-label="Fechar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              <div className="fields-label">Campos</div>
              <FieldRow label="Found By">
                {issue.foundBy ? <AvatarGroup names={issue.foundBy} /> : <span className="field-value--empty">—</span>}
              </FieldRow>
              <FieldRow label="Version">
                {issue.version ? <span className="cell-mono">{issue.version}</span> : <span className="field-value--empty">—</span>}
              </FieldRow>
              <FieldRow label="Platform">
                <PlainValue value={issue.platform} />
              </FieldRow>
              <FieldRow label="Store">
                <PlainValue value={issue.store} />
              </FieldRow>
              <FieldRow label="Created In">
                <PlainValue value={issue.createdIn} />
              </FieldRow>
              <FieldRow label="Attachment">
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

              <div className="fields-label">Log</div>
              <IssueLog issue={issue} />
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button type="button" className="issue-detail-close" onClick={onClose} aria-label="Fechar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </span>
        </div>

        <div className="form-panel-body">
          <div>
            <input
              className="form-title-input"
              type="text"
              aria-label="Title"
              placeholder="Título da issue"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
            />
            {fieldErrors.title ? (
              <div role="alert" style={{ font: 'var(--font-label)', color: 'var(--color-status-error)', marginTop: 'var(--space-1)' }}>
                {fieldErrors.title}
              </div>
            ) : null}
          </div>
          <div className="issue-detail-pills">
            <StatusPill status={issue.status} />
          </div>
          <textarea
            className="form-desc-input"
            aria-label="Description"
            placeholder="Adicione uma descrição — passos para reproduzir, comportamento esperado…"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
          />
        </div>

        <div className="fields-label">Fields</div>

        <div className="field-row">
              <label className="field-label" htmlFor="edit-version">
                {FIELD_ICONS.version}
                Version *
              </label>
              <div className="field-control">
                <input
                  id="edit-version"
                  type="text"
                  placeholder="0.0.0"
                  value={form.version}
                  onChange={(event) => updateField('version', event.target.value)}
                />
                {fieldErrors.version ? (
                  <span role="alert" style={{ font: 'var(--font-label)', color: 'var(--color-status-error)' }}>
                    {fieldErrors.version}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="field-row">
              <label className="field-label" htmlFor="edit-foundBy">
                {FIELD_ICONS.foundBy}
                Found By
              </label>
              <div className="field-control">
                <MultiSelectDropdown
                  id="edit-foundBy"
                  ariaLabel="Found By"
                  value={form.foundBy}
                  options={qaUsers}
                  onChange={(next) => updateField('foundBy', next)}
                />
              </div>
            </div>
            <div className="field-row">
              <label className="field-label" htmlFor="edit-keywords">
                {FIELD_ICONS.keywords}
                Keywords
              </label>
              <div className="field-control">
                <MultiSelectDropdown
                  id="edit-keywords"
                  ariaLabel="Keywords"
                  value={form.keywords}
                  options={Keywords}
                  onChange={(next) => updateField('keywords', next)}
                />
              </div>
            </div>
            {(tagValues.length > 0
              ? [{ name: 'severity', label: 'Severity', options: Severity }, { name: 'tag', label: 'Tag', options: tagValues }, ...EDIT_SELECTS.slice(1)]
              : EDIT_SELECTS
            ).map((field) => (
              <div key={field.name} className="field-row">
                <label className="field-label" htmlFor={`edit-${field.name}`}>
                  {FIELD_ICONS[field.name]}
                  {field.label}
                </label>
                <div className="field-control">
                  <Dropdown
                    id={`edit-${field.name}`}
                    value={form[field.name]}
                    options={['', ...field.options]}
                    onChange={(next) => updateField(field.name, next)}
                  />
                </div>
              </div>
            ))}
            <div className="field-row">
              <label className="field-label" htmlFor="edit-attachment">
                {FIELD_ICONS.attachment}
                Attachment
              </label>
              <div className="field-control">
                <input
                  id="edit-attachment"
                  type="text"
                  placeholder="Link do Google Drive"
                  value={form.attachment}
                  onChange={(event) => updateField('attachment', event.target.value)}
                />
              </div>
            </div>
            <FieldRow icon={FIELD_ICONS.createdIn} label="Created In">
              <PlainValue value={issue.createdIn} />
            </FieldRow>

            <div className="form-footer">
              {saveError ? (
                <span role="alert" style={{ font: 'var(--font-label)', color: 'var(--color-status-error)', marginRight: 'auto' }}>
                  {saveError}
                </span>
              ) : null}
              <button type="button" className="chip-button" onClick={() => setEditing(false)} disabled={saving}>
                Cancelar
              </button>
              <button type="button" className="button-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
      </div>
    </div>
  );
}

export function IssueDetailModal({ issue, onClose, onStatusChange, onIssueUpdate }) {
  if (!issue) return null;
  // key por issue: trocar de issue descarta o estado de edição/formulário.
  return (
    <IssueDetailContent
      key={issue.id}
      issue={issue}
      onClose={onClose}
      onStatusChange={onStatusChange}
      onIssueUpdate={onIssueUpdate}
    />
  );
}
