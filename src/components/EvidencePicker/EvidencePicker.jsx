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

function isAcceptedType(type) {
  return EVIDENCE_ACCEPTED_MIME_PREFIXES.some((prefix) => String(type ?? '').startsWith(prefix));
}

/**
 * Extrai os arquivos de mídia de um DataTransfer (drop) ou ClipboardData (paste).
 * Usa `.files` e, quando vazio, `.items[].getAsFile()`. Filtra pelos tipos aceitos
 * para não capturar texto/HTML colado — assim o Ctrl+V só age quando há mídia, sem
 * roubar a colagem de campos de texto. Prints colados costumam vir sem nome (ou
 * "image.png"): recebem um nome único `evidencia-<timestamp>.<ext>` para não
 * colidirem no dedup por nome+tamanho em colagens repetidas.
 */
function mediaFilesFrom(source) {
  if (!source) return [];
  const collected = [];
  const fromFiles = source.files ? Array.from(source.files) : [];
  if (fromFiles.length > 0) {
    collected.push(...fromFiles);
  } else if (source.items) {
    for (const item of Array.from(source.items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile?.();
        if (file) collected.push(file);
      }
    }
  }

  return collected.filter(isAcceptedType).map((file) => {
    const hasName = file.name && file.name !== 'image.png' && file.name !== 'blob';
    if (hasName) return file;
    const ext = (file.type.split('/')[1] ?? 'png').split('+')[0];
    return new File([file], `evidencia-${Date.now()}.${ext}`, { type: file.type });
  });
}

/**
 * Seletor de evidências (vídeos/imagens) com preview local, usado no Reporter
 * (e, no futuro, no Editar do modal de detalhes). Controlado pelo pai:
 * recebe `files` (File[]) e devolve a lista nova via `onChange`. Três caminhos de
 * entrada — clicar no dropzone, arrastar-e-soltar e colar (Ctrl+V) — passam pela
 * mesma validação de shared/contracts.js (os mesmos limites do mock e do backend).
 */
export function EvidencePicker({ files, onChange, disabled }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [previews, setPreviews] = useState(() => new Map());
  const full = files.length >= EVIDENCE_MAX_FILES;
  const locked = disabled || full;

  useEffect(() => {
    // jsdom não implementa createObjectURL; sem ele a lista aparece sem thumbs.
    if (typeof URL.createObjectURL !== 'function') return undefined;
    const map = new Map(files.map((file) => [file, URL.createObjectURL(file)]));
    setPreviews(map);
    return () => {
      map.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  // Mescla os novos arquivos com os já escolhidos (dedup por nome+tamanho),
  // valida a lista final e só então propaga — caminho único dos 3 modos de entrada.
  function addFiles(incoming) {
    if (incoming.length === 0) return;
    const merged = [...files];
    for (const file of incoming) {
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

  // Colar (Ctrl+V) sem precisar focar o dropzone: escuta o paste no documento
  // enquanto o picker está montado e desbloqueado; só age quando há mídia no
  // clipboard (colagem de texto passa direto). Caminho único de paste.
  useEffect(() => {
    if (locked) return undefined;
    function onPaste(event) {
      const pasted = mediaFilesFrom(event.clipboardData);
      if (pasted.length === 0) return;
      event.preventDefault();
      addFiles(pasted);
    }
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  });

  function handleSelect(event) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = '';
    addFiles(picked);
  }

  function openPicker() {
    if (!locked) inputRef.current?.click();
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  }

  function handleDragOver(event) {
    if (locked) return;
    event.preventDefault();
    setDragActive(true);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    if (locked) return;
    addFiles(mediaFilesFrom(event.dataTransfer));
  }

  function removeFile(target) {
    setError(null);
    onChange(files.filter((file) => file !== target));
  }

  return (
    <div className="evidence-picker">
      <div
        className={`evidence-dropzone${dragActive ? ' evidence-dropzone--active' : ''}${locked ? ' evidence-dropzone--disabled' : ''}`}
        role="button"
        tabIndex={locked ? -1 : 0}
        aria-disabled={locked}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <svg className="evidence-dropzone-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 16V4" />
          <path d="M7 9l5-5 5 5" />
          <path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
        </svg>
        <span className="evidence-dropzone-text">
          {full ? 'Limite de evidências atingido' : 'Arraste, cole (Ctrl+V) ou clique para anexar'}
        </span>
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
