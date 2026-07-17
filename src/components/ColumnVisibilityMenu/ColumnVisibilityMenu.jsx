import { useState } from 'react';
import { Checkbox } from '../Checkbox/Checkbox.jsx';

export function ColumnVisibilityMenu({ fields, isVisible, onToggle, alwaysVisibleFields = [], onResetLayout }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="chip-button" onClick={() => setOpen(true)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="9" y1="4" x2="9" y2="20" />
          <line x1="15" y1="4" x2="15" y2="20" />
        </svg>
        Columns
      </button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Colunas visíveis"
          className="modal-overlay"
          onClick={() => setOpen(false)}
        >
          <div className="card" style={{ width: 320, maxHeight: '70vh', overflowY: 'auto' }} onClick={(event) => event.stopPropagation()}>
            <h2 style={{ font: 'var(--font-heading-3)', marginBottom: 'var(--space-3)' }}>Colunas visíveis</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {fields.map(({ field, label }) => (
                <Checkbox
                  key={field}
                  checked={isVisible(field)}
                  disabled={alwaysVisibleFields.includes(field)}
                  onChange={() => onToggle(field)}
                >
                  {label}
                </Checkbox>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              {onResetLayout ? (
                <button type="button" className="button-secondary" onClick={onResetLayout}>
                  Restaurar padrão
                </button>
              ) : null}
              <button type="button" className="button-primary" onClick={() => setOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
