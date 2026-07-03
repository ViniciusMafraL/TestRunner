import { useState } from 'react';
import { Severity, Tag, FoundBy, Platform, Keywords, Store } from 'shared/enums.js';
import { api } from '../../api/client.js';
import { useSession } from '../../auth/SessionContext.jsx';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';

const SELECT_FIELDS = [
  { name: 'severity', label: 'Severity', options: Severity },
  { name: 'tag', label: 'Tag', options: Tag },
  { name: 'foundBy', label: 'Found By', options: FoundBy },
  { name: 'platform', label: 'Platform', options: Platform },
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

export function Reporter() {
  const { canWrite } = useSession();
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  if (!canWrite) {
    return (
      <div>
        <PageHeader breadcrumb="" title="Report" />
        <div className="card">
          <p>Sessões de convidado têm acesso somente leitura e não podem reportar novas issues.</p>
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
      setSuccessMessage(`Issue ${issue.id} criada com status ${issue.status}`);
      setForm(INITIAL_FORM);
    } catch (error) {
      setSubmitError(error.message ?? 'Não foi possível criar a issue');
    }
  }

  return (
    <div>
      <PageHeader breadcrumb="" title="Report Issue" />

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxWidth: 480 }}>
        <label>
          Title *
          <input type="text" value={form.title} onChange={(event) => updateField('title', event.target.value)} />
          {fieldErrors.title ? <span role="alert" style={{ color: 'var(--color-status-error)' }}>{fieldErrors.title}</span> : null}
        </label>

        <label>
          Version *
          <input type="text" placeholder="0.0.0" value={form.version} onChange={(event) => updateField('version', event.target.value)} />
          {fieldErrors.version ? <span role="alert" style={{ color: 'var(--color-status-error)' }}>{fieldErrors.version}</span> : null}
        </label>

        <label>
          Description
          <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} />
        </label>

        <label>
          Attachment (link do Google Drive)
          <input type="text" value={form.attachment} onChange={(event) => updateField('attachment', event.target.value)} />
        </label>

        {SELECT_FIELDS.map((field) => (
          <label key={field.name}>
            {field.label}
            <select value={form[field.name]} onChange={(event) => updateField(field.name, event.target.value)}>
              <option value="">—</option>
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}

        <button type="submit" className="button-primary">
          Enviar
        </button>

        {successMessage ? <p style={{ color: 'var(--color-lime)' }}>{successMessage}</p> : null}
        {submitError ? (
          <p role="alert" style={{ color: 'var(--color-status-error)' }}>
            {submitError}
          </p>
        ) : null}
      </form>
    </div>
  );
}
