import { useState } from 'react';

export function ColumnVisibilityMenu({ fields, isVisible, onToggle, alwaysVisibleFields = [] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="button-secondary" onClick={() => setOpen(true)}>
        Colunas
      </button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Colunas visíveis"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(24,24,27,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
          }}
          onClick={() => setOpen(false)}
        >
          <div className="card" style={{ width: 320, maxHeight: '70vh', overflowY: 'auto' }} onClick={(event) => event.stopPropagation()}>
            <h2 style={{ font: 'var(--font-heading-3)', marginBottom: 'var(--space-3)' }}>Colunas visíveis</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {fields.map(({ field, label }) => (
                <label key={field} style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <input
                    type="checkbox"
                    checked={isVisible(field)}
                    disabled={alwaysVisibleFields.includes(field)}
                    onChange={() => onToggle(field)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <button type="button" className="button-primary" style={{ marginTop: 'var(--space-4)' }} onClick={() => setOpen(false)}>
              Fechar
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
