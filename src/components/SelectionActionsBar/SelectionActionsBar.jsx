const CopyIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const ArchiveIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="5" rx="1" />
    <path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
    <path d="M10 13h4" />
  </svg>
);

/**
 * Barra flutuante de ações em lote do Issue Tracker. Aparece enquanto o modo
 * de seleção está ativo; as ações só habilitam com ao menos 1 issue marcada.
 * "Arquivar" é ação de escrita, então segue o mesmo canWrite das demais.
 */
export function SelectionActionsBar({ count, canWrite, busy, message, onCopyLinks, onArchive, onCancel }) {
  return (
    <div className="selection-bar" role="toolbar" aria-label="Ações das issues selecionadas">
      <span className="selection-bar-count">{count === 1 ? '1 selecionada' : `${count} selecionadas`}</span>
      {message ? (
        <span className="selection-bar-message" role="status">
          {message}
        </span>
      ) : null}
      <button type="button" className="chip-button" onClick={onCopyLinks} disabled={count === 0 || busy}>
        {CopyIcon}
        Copiar links
      </button>
      {canWrite ? (
        <button type="button" className="button-primary selection-bar-archive" onClick={onArchive} disabled={count === 0 || busy}>
          {ArchiveIcon}
          {busy ? 'Arquivando…' : 'Arquivar'}
        </button>
      ) : null}
      <button type="button" className="selection-bar-cancel" onClick={onCancel} disabled={busy}>
        Cancelar
      </button>
    </div>
  );
}
