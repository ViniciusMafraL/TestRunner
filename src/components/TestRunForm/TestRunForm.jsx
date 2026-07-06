import { useState } from 'react';
import { Platform, TestType } from 'shared/enums.js';
import { Dropdown } from '../Dropdown/Dropdown.jsx';

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
      className="modal-overlay"
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
        <label htmlFor="test-run-type">
          Tipo de teste
          <Dropdown id="test-run-type" value={form.testType} options={TestType} onChange={(next) => updateField('testType', next)} />
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
        <label htmlFor="test-run-platform">
          Plataforma
          <Dropdown id="test-run-platform" value={form.platform} options={Platform} onChange={(next) => updateField('platform', next)} />
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
