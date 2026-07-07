import { useEffect, useRef, useState } from 'react';
import {
  EVIDENCE_ACCEPTED_MIME_PREFIXES,
  EVIDENCE_MAX_FILES,
  EVIDENCE_MAX_FILE_SIZE_MB,
  validateEvidenceFiles,
} from 'shared/contracts.js';

const MB = 1024 * 1024;

function formatSize(bytes) {
  const size = Number(bytes ?? 0);
  if (size >= MB) return `${(size / MB).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

/**
 * Seletor de evidências (vídeos/imagens) com preview local, usado no Reporter
 * (e, no futuro, no Editar do modal de detalhes). Controlado pelo pai:
 * recebe `files` (File[]) e devolve a lista nova via `onChange`. A validação
 * usa os limites de shared/contracts.js — os mesmos do mock e do backend.
 */
export function EvidencePicker({ files, onChange, disabled }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const [previews, setPreviews] = useState(() => new Map());

  useEffect(() => {
    // jsdom não implementa createObjectURL; sem ele a lista aparece sem thumbs.
    if (typeof URL.createObjectURL !== 'function') return undefined;
    const map = new Map(files.map((file) => [file, URL.createObjectURL(file)]));
    setPreviews(map);
    return () => {
      map.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  function handleSelect(event) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (picked.length === 0) return;

    const merged = [...files];
    for (const file of picked) {
      if (!merged.some((existing) => existing.name === file.name && existing.size === file.size)) {
        merged.push(file);
      }
    }
    const result = validateEvidenceFiles(merged);
    if (!result.valid) {
      setError(result.error.message);
      return;
    }
    setError(null);
    onChange(merged);
  }

  function removeFile(target) {
    setError(null);
    onChange(files.filter((file) => file !== target));
  }

  return (
    <div className="evidence-picker">
      <div className="evidence-picker-actions">
        <button
          type="button"
          className="chip-button"
          disabled={disabled || files.length >= EVIDENCE_MAX_FILES}
          onClick={() => inputRef.current?.click()}
        >
          Adicionar evidências
        </button>
        <span className="evidence-picker-hint">
          até {EVIDENCE_MAX_FILES} vídeos/imagens, {EVIDENCE_MAX_FILE_SIZE_MB} MB cada
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={EVIDENCE_ACCEPTED_MIME_PREFIXES.map((prefix) => `${prefix}*`).join(',')}
        aria-label="Arquivos de evidência"
        style={{ display: 'none' }}
        onChange={handleSelect}
      />

      {error ? (
        <p role="alert" className="evidence-picker-error">
          {error}
        </p>
      ) : null}

      {files.length > 0 ? (
        <ul className="evidence-list">
          {files.map((file) => {
            const url = previews.get(file);
            const isImage = String(file.type).startsWith('image/');
            return (
              <li key={`${file.name}-${file.size}`} className="evidence-item">
                {url ? (
                  isImage ? (
                    <img className="evidence-thumb" src={url} alt="" />
                  ) : (
                    <video className="evidence-thumb" src={url} muted preload="metadata" />
                  )
                ) : (
                  <span className="evidence-thumb evidence-thumb--empty" aria-hidden="true" />
                )}
                <span className="evidence-name table-cell-ellipsis">{file.name}</span>
                <span className="evidence-size">{formatSize(file.size)}</span>
                <button
                  type="button"
                  className="issue-detail-close"
                  aria-label={`Remover ${file.name}`}
                  disabled={disabled}
                  onClick={() => removeFile(file)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
