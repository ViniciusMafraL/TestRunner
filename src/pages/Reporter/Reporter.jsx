import { useState } from 'react';
import { Severity, Tag, FoundBy, Platform, Keywords, Store } from 'shared/enums.js';
import { api } from '../../api/client.js';
import { useSession } from '../../auth/SessionContext.jsx';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { FIELD_ICONS } from '../../components/FieldIcons/FieldIcons.jsx';
import { Dropdown } from '../../components/Dropdown/Dropdown.jsx';
import { EvidencePicker } from '../../components/EvidencePicker/EvidencePicker.jsx';

/* Campos principais sempre visíveis; os demais ficam atrás de "Mais campos". */
const PRIMARY_SELECTS = [
  { name: 'severity', label: 'Severity', options: Severity },
  { name: 'foundBy', label: 'Found By', options: FoundBy },
  { name: 'platform', label: 'Platform', options: Platform },
];

const EXTRA_SELECTS = [
  { name: 'tag', label: 'Tag', options: Tag },
  { name: 'keywords', label: 'Keywords', options: Keywords },
  { name: 'store', label: 'Store', options: Store },
];

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

function SelectRow({ field, value, onChange }) {
  const id = `field-${field.name}`;
  return (
    <div className="field-row">
      <label className="field-label" htmlFor={id}>
        {FIELD_ICONS[field.name]}
        {field.label}
      </label>
      <div className="field-control">
        <Dropdown id={id} value={value} options={['', ...field.options]} onChange={(next) => onChange(field.name, next)} />
      </div>
    </div>
  );
}

export function Reporter() {
  const { canWrite } = useSession();
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [showExtra, setShowExtra] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  // { index, total, percent } enquanto as evidências sobem; null fora disso.
  const [uploadProgress, setUploadProgress] = useState(null);

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

        <div className="field-row">
          <label className="field-label" htmlFor="field-version">
            {FIELD_ICONS.version}
            Version *
          </label>
          <div className="field-control">
            <input
              id="field-version"
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

        {PRIMARY_SELECTS.map((field) => (
          <SelectRow key={field.name} field={field} value={form[field.name]} onChange={updateField} />
        ))}

        <div className="field-row">
          <span className="field-label">
            {FIELD_ICONS.attachment}
            Evidências
          </span>
          <div className="field-control">
            <EvidencePicker files={evidenceFiles} onChange={setEvidenceFiles} disabled={uploadProgress !== null} />
          </div>
        </div>

        <button type="button" className="form-more-toggle" onClick={() => setShowExtra((previous) => !previous)}>
          <span aria-hidden="true">{showExtra ? '▾' : '▸'}</span>
          {showExtra ? 'Ocultar campos extras' : 'Mais campos (Tag, Keywords, Store, Attachment)'}
        </button>

        {showExtra ? (
          <>
            {EXTRA_SELECTS.map((field) => (
              <SelectRow key={field.name} field={field} value={form[field.name]} onChange={updateField} />
            ))}
            <div className="field-row">
              <label className="field-label" htmlFor="field-attachment">
                {FIELD_ICONS.attachment}
                Attachment
              </label>
              <div className="field-control">
                <input
                  id="field-attachment"
                  type="text"
                  placeholder="Link do Google Drive"
                  value={form.attachment}
                  onChange={(event) => updateField('attachment', event.target.value)}
                />
              </div>
            </div>
          </>
        ) : null}

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
