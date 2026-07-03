import { useState } from 'react';
import { Platform, TestType } from 'shared/enums.js';

const INITIAL_FORM = { build: '', version: '', testType: TestType[0], responsible: '', platform: Platform[0] };

export function TestRunForm({ onSubmit, onClose }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState(null);

  function updateField(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.build.trim() || !form.version.trim() || !form.responsible.trim()) {
      setError('Build, Version e Responsável são obrigatórios');
      return;
    }
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err.message ?? 'Não foi possível criar a demanda');
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nova demanda de Test Run"
      style={{ position: 'fixed', inset: 0, background: 'rgba(24,24,27,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: 360 }}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 style={{ font: 'var(--font-heading-3)' }}>Nova demanda de Test Run</h2>

        <label>
          Build *
          <input type="text" value={form.build} onChange={(event) => updateField('build', event.target.value)} />
        </label>
        <label>
          Version *
          <input type="text" placeholder="0.0.0" value={form.version} onChange={(event) => updateField('version', event.target.value)} />
        </label>
        <label>
          Tipo de teste
          <select value={form.testType} onChange={(event) => updateField('testType', event.target.value)}>
            {TestType.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label>
          Responsável *
          <input
            type="text"
            placeholder="Nome de quem enviou a build"
            value={form.responsible}
            onChange={(event) => updateField('responsible', event.target.value)}
          />
        </label>
        <label>
          Plataforma
          <select value={form.platform} onChange={(event) => updateField('platform', event.target.value)}>
            {Platform.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </label>

        {error ? (
          <p role="alert" style={{ color: 'var(--color-status-error)' }}>
            {error}
          </p>
        ) : null}

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="submit" className="button-primary">
            Solicitar
          </button>
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
