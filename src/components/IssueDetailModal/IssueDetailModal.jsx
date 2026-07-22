import { useState } from 'react';
import { ISSUE_EDITABLE_FIELDS, allowedStatusTargetsForRole, canRoleSetStatus } from 'shared/contracts.js';
import { parseIssueLog } from 'shared/issueLog.js';
import { useSession } from '../../auth/SessionContext.jsx';
import { StatusPill, StatusPillSelect } from '../StatusPill/StatusPill.jsx';
import { AvatarGroup, AvatarWithLabel } from '../Avatar/Avatar.jsx';
import { FIELD_ICONS } from '../FieldIcons/FieldIcons.jsx';
import { EvidenceGallery } from '../EvidenceGallery/EvidenceGallery.jsx';
import { EvidencePicker } from '../EvidencePicker/EvidencePicker.jsx';
import { IssueFormFields } from '../IssueFormFields/IssueFormFields.jsx';
import { KeywordChips } from '../KeywordChips/KeywordChips.jsx';

const SEVERITY_SLUG = { Critical: 'critical', Major: 'major', Compliance: 'compliance', Normal: 'normal' };

/** Status em que a issue está aguardando a validação do QA. */
const RETEST_STATUS = 'To review';

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
 * Histórico da issue: as mudanças de status gravadas (ator + status + nota +
 * data, mais recentes no topo) seguidas de "Report criado" (data de `createdIn`).
 * O log é texto simples numa célula da planilha; parseIssueLog o transforma em
 * entradas. A nota só existe no fluxo de reteste ("reteste aprovado", etc.).
 */
function IssueLog({ issue }) {
  const entries = parseIssueLog(issue.log);
  return (
    <ul className="issue-log">
      {entries.map((entry, index) => (
        <li key={`${entry.at}-${index}`} className="issue-log-entry">
          <span className="issue-log-dot" aria-hidden="true" />
          <span className="issue-log-text">
            {entry.actor} · {entry.status}
            {entry.note ? ` — ${entry.note}` : ''}
          </span>
          {entry.at ? <span className="issue-log-date">{formatLogDate(entry.at)}</span> : null}
        </li>
      ))}
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

/**
 * Formulário do "Reprovar": a prova de que o bug continua (evidências) e a
 * versão em que o QA retestou. As evidências vão para a pasta RO- da issue e a
 * versão entra no log e na descrição.
 */
function ReopenForm({ version, onVersionChange, comment, onCommentChange, files, onFilesChange, busy, error, onCancel, onConfirm }) {
  return (
    <div className="issue-retest-form">
      <span className="fields-label">Reprovar reteste</span>

      <div className="field-row">
        <label className="field-label" htmlFor="retest-version">
          {FIELD_ICONS.version}
          Versão retestada *
        </label>
        <div className="field-control">
          <input
            id="retest-version"
            type="text"
            placeholder="0.0.0"
            value={version}
            disabled={busy}
            onChange={(event) => onVersionChange(event.target.value)}
          />
        </div>
      </div>

      <div className="field-row">
        <label className="field-label" htmlFor="retest-comment">
          O que continua acontecendo
        </label>
        <div className="field-control">
          <textarea
            id="retest-comment"
            className="form-desc-input"
            placeholder="Opcional — vai para a descrição da issue"
            value={comment}
            disabled={busy}
            onChange={(event) => onCommentChange(event.target.value)}
          />
        </div>
      </div>

      <div className="field-row">
        <span className="field-label">
          {FIELD_ICONS.attachment}
          Evidência do reteste
        </span>
        <div className="field-control">
          <EvidencePicker files={files} onChange={onFilesChange} disabled={busy} />
        </div>
      </div>

      <div className="form-footer">
        {error ? (
          <span role="alert" style={{ font: 'var(--font-label)', color: 'var(--color-status-error)', marginRight: 'auto' }}>
            {error}
          </span>
        ) : null}
        <button type="button" className="chip-button" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
        <button type="button" className="button-primary" onClick={onConfirm} disabled={busy}>
          {busy ? 'Reabrindo…' : 'Confirmar reabertura'}
        </button>
      </div>
    </div>
  );
}

function IssueDetailContent({ issue, onClose, onStatusChange, onIssueUpdate, onRetestReopen, onEvidenceUpload }) {
  const { canWrite, session } = useSession();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(() => buildForm(issue));
  const [editFiles, setEditFiles] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  // Bump depois de subir evidência: a galeria não troca de issue, então sem
  // isso ela continuaria mostrando a lista antiga.
  const [evidenceRefresh, setEvidenceRefresh] = useState(0);
  const [reopening, setReopening] = useState(false);
  const [retestVersion, setRetestVersion] = useState('');
  const [retestComment, setRetestComment] = useState('');
  const [retestFiles, setRetestFiles] = useState([]);
  const [retestBusy, setRetestBusy] = useState(false);
  const [retestError, setRetestError] = useState(null);

  const attachment = String(issue.attachment ?? '');
  const canEdit = canWrite && typeof onIssueUpdate === 'function';
  // Aprovar/Reprovar só na issue que está com o QA e só para quem pode gravar
  // essas transições (admin/qa) — o developer não ganha nada novo aqui.
  const canRetest =
    issue.status === RETEST_STATUS &&
    typeof onRetestReopen === 'function' &&
    typeof onStatusChange === 'function' &&
    canRoleSetStatus(session?.role, RETEST_STATUS, 'Fixed');

  function startEditing() {
    setForm(buildForm(issue));
    setEditFiles([]);
    setFieldErrors({});
    setSaveError(null);
    setEditing(true);
  }

  function updateField(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  /** Sobe os arquivos um a um e devolve os que falharam (mesmo laço do Reporter). */
  async function uploadFiles(files, kind) {
    const failed = [];
    for (const file of files) {
      try {
        await onEvidenceUpload(issue.id, file, kind);
      } catch {
        failed.push(file);
      }
    }
    if (files.length > failed.length) setEvidenceRefresh((previous) => previous + 1);
    return failed;
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
    if (Object.keys(patch).length === 0 && editFiles.length === 0) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      if (Object.keys(patch).length > 0) {
        await onIssueUpdate(issue.id, patch);
      }
      // Evidências depois do PATCH: o campo já está salvo mesmo se o upload
      // falhar. Os arquivos que falharem ficam na lista para nova tentativa.
      if (editFiles.length > 0) {
        const failed = await uploadFiles(editFiles, 'original');
        setEditFiles(failed);
        if (failed.length > 0) {
          setSaveError(`Alterações salvas, mas falhou o envio de: ${failed.map((file) => file.name).join(', ')}`);
          return;
        }
      }
      setEditing(false);
    } catch (error) {
      setSaveError(error.message ?? 'Não foi possível salvar a alteração');
    } finally {
      setSaving(false);
    }
  }

  function startReopen() {
    setRetestVersion('');
    setRetestComment('');
    setRetestFiles([]);
    setRetestError(null);
    setReopening(true);
  }

  async function handleConfirmReopen() {
    if (!retestVersion.trim()) {
      setRetestError('Informe a versão retestada');
      return;
    }
    setRetestBusy(true);
    setRetestError(null);
    try {
      // O status é o que importa: grava Reopen, a nota do log e o bloco na
      // descrição numa gravação só. O upload que vier depois é best-effort.
      await onRetestReopen(issue.id, { version: retestVersion.trim(), comment: retestComment.trim() });
      const failed = retestFiles.length > 0 ? await uploadFiles(retestFiles, 'reopen') : [];
      if (failed.length > 0) {
        setRetestFiles(failed);
        setRetestError(`Issue reaberta, mas falhou o envio de: ${failed.map((file) => file.name).join(', ')}`);
        return;
      }
      setReopening(false);
    } catch (error) {
      setRetestError(error.message ?? 'Não foi possível reabrir a issue');
    } finally {
      setRetestBusy(false);
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
                <EvidenceGallery issue={issue} refreshKey={evidenceRefresh} />
              </div>

              {reopening ? (
                <ReopenForm
                  version={retestVersion}
                  onVersionChange={setRetestVersion}
                  comment={retestComment}
                  onCommentChange={setRetestComment}
                  files={retestFiles}
                  onFilesChange={setRetestFiles}
                  busy={retestBusy}
                  error={retestError}
                  onCancel={() => setReopening(false)}
                  onConfirm={handleConfirmReopen}
                />
              ) : canEdit || canRetest ? (
                <div className="issue-detail-actions">
                  {canEdit ? (
                    <button type="button" className="chip-button" onClick={startEditing}>
                      Editar
                    </button>
                  ) : null}
                  {canRetest ? (
                    <>
                      <button type="button" className="chip-button" onClick={startReopen}>
                        Reprovar
                      </button>
                      <button type="button" className="button-primary" onClick={() => onStatusChange(issue.id, 'Fixed')}>
                        Aprovar
                      </button>
                    </>
                  ) : null}
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
              <FieldRow label="Responsible">
                <AvatarWithLabel name={issue.responsible} />
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

  // Modo de edição: mesma estrutura da tela de Report (título, descrição,
  // "Fields" e o mesmo IssueFormFields), para que as duas telas não divirjam.
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

        <IssueFormFields
          idPrefix="edit"
          form={form}
          onChange={updateField}
          fieldErrors={fieldErrors}
          evidenceFiles={editFiles}
          onEvidenceChange={onEvidenceUpload ? setEditFiles : undefined}
          disabled={saving}
        />

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

export function IssueDetailModal({ issue, onClose, onStatusChange, onIssueUpdate, onRetestReopen, onEvidenceUpload }) {
  if (!issue) return null;
  // key por issue: trocar de issue descarta o estado de edição/formulário.
  return (
    <IssueDetailContent
      key={issue.id}
      issue={issue}
      onClose={onClose}
      onStatusChange={onStatusChange}
      onIssueUpdate={onIssueUpdate}
      onRetestReopen={onRetestReopen}
      onEvidenceUpload={onEvidenceUpload}
    />
  );
}
