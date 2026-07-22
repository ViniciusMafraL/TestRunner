import { useState } from 'react';
import { api } from '../../api/client.js';
import { useSession } from '../../auth/SessionContext.jsx';
import { useOperations } from '../../operations/OperationContext.jsx';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { FIELD_ICONS } from '../../components/FieldIcons/FieldIcons.jsx';
import { IssueFormFields } from '../../components/IssueFormFields/IssueFormFields.jsx';

const INITIAL_FORM = {
  title: '',
  version: '',
  description: '',
  attachment: '',
  severity: '',
  tag: '',
  foundBy: '',
  platform: '',
  keywords: '',
  store: '',
};

export function Reporter() {
  const { canWrite } = useSession();
  const { operations, currentOperation, currentProject, projects } = useOperations();
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  // { index, total, percent } enquanto as evidências sobem; null fora disso.
  const [uploadProgress, setUploadProgress] = useState(null);
  const operationLabel = operations.find((op) => op.id === currentOperation)?.label ?? currentOperation;
  // Sportia tem 1 projeto (aba única): o destino é a operação. Multi-projeto
  // (Roblox/Fortnite/Gameloft) mostra o projeto/aba onde a issue será criada.
  const destination = projects.length > 1 ? `${operationLabel} · ${currentProject ?? '—'}` : operationLabel;

  if (!canWrite) {
    return (
      <div>
        <PageHeader breadcrumb="" title="Report" />
        <div className="form-panel">
          <div className="form-panel-body">
            <p style={{ margin: 0 }}>Sessões de convidado têm acesso somente leitura e não podem reportar novas issues.</p>
          </div>
        </div>
      </div>
    );
  }

  function updateField(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSuccessMessage(null);
    setSubmitError(null);

    const missing = {};
    if (!form.title.trim()) missing.title = 'Title é obrigatório';
    if (!form.version.trim()) missing.version = 'Version é obrigatório';
    setFieldErrors(missing);
    if (Object.keys(missing).length > 0) return;

    try {
      const issue = await api.createIssue(form);

      // Evidências sobem uma a uma (limite de ~100 MB por request no túnel);
      // falha de upload nunca desfaz a issue — só vira aviso (ver contrato).
      let attachmentLink = null;
      const failed = [];
      for (const [index, file] of evidenceFiles.entries()) {
        setUploadProgress({ index: index + 1, total: evidenceFiles.length, percent: 0 });
        try {
          const updated = await api.uploadIssueEvidence(issue.id, file, (fraction) => {
            setUploadProgress({ index: index + 1, total: evidenceFiles.length, percent: Math.round(fraction * 100) });
          });
          attachmentLink = updated.attachment;
        } catch {
          failed.push(file.name);
        }
      }
      setUploadProgress(null);

      if (failed.length > 0) {
        setSubmitError(
          `Issue ${issue.id} criada, mas ${failed.length === 1 ? 'a evidência falhou' : `${failed.length} evidências falharam`}: ` +
            `${failed.join(', ')} — anexe depois pelo Editar do Issue Tracker`,
        );
      } else if (attachmentLink) {
        setSuccessMessage(
          <>
            Issue {issue.id} criada com status {issue.status} —{' '}
            <a href={attachmentLink} target="_blank" rel="noreferrer">
              evidências na pasta do Drive
            </a>
          </>,
        );
      } else {
        setSuccessMessage(`Issue ${issue.id} criada com status ${issue.status}`);
      }
      setForm(INITIAL_FORM);
      setEvidenceFiles([]);
    } catch (error) {
      setUploadProgress(null);
      setSubmitError(error.message ?? 'Não foi possível criar a issue');
    }
  }

  return (
    <div>
      <PageHeader breadcrumb="" title="Report Issue" />

      <form onSubmit={handleSubmit} className="form-panel">
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
          idPrefix="field"
          form={form}
          onChange={updateField}
          fieldErrors={fieldErrors}
          evidenceFiles={evidenceFiles}
          onEvidenceChange={setEvidenceFiles}
          disabled={uploadProgress !== null}
          // Exclusivo do Reporter: para qual operação/aba a issue vai.
          afterVersion={
            <div className="field-row">
              <span className="field-label">
                {FIELD_ICONS.tag}
                Destino
              </span>
              <div className="field-control">
                <span style={{ font: 'var(--font-label)' }} aria-label="Destino da issue">
                  {destination}
                </span>
                <span style={{ font: 'var(--font-label)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                  O projeto vem da aba selecionada no menu lateral.
                </span>
              </div>
            </div>
          }
        />

        <div className="form-footer">
          {uploadProgress ? (
            <span role="status" style={{ font: 'var(--font-label)', marginRight: 'auto' }}>
              Enviando evidência {uploadProgress.index} de {uploadProgress.total} — {uploadProgress.percent}%
            </span>
          ) : null}
          {successMessage ? (
            <span style={{ font: 'var(--font-label)', color: 'var(--text-success)', marginRight: 'auto' }}>{successMessage}</span>
          ) : null}
          {submitError ? (
            <span role="alert" style={{ font: 'var(--font-label)', color: 'var(--color-status-error)', marginRight: 'auto' }}>
              {submitError}
            </span>
          ) : null}
          <button type="submit" className="button-primary" disabled={uploadProgress !== null}>
            {uploadProgress ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}
