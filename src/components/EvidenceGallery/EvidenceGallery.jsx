import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Loading } from '../Loading/Loading.jsx';

/**
 * Player embutido do Drive para vídeos. O iframe demora a carregar, então um
 * indicador fica por cima até o onLoad do player.
 */
function VideoPreview({ file }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="evidence-video">
      {!loaded ? (
        <div className="evidence-video-loading">
          <Loading label={`Carregando ${file.name}`} />
        </div>
      ) : null}
      <iframe
        className="evidence-video-frame"
        src={file.previewUrl}
        title={file.name}
        allow="autoplay; fullscreen"
        allowFullScreen
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

/**
 * Pré-visualizador das evidências da issue (GET /issues/:id/evidence).
 * Só aparece quando o attachment é uma pasta de evidências do Drive; issues
 * com attachment manual (link avulso) continuam mostrando apenas o link.
 */
export function EvidenceGallery({ issue }) {
  const attachment = String(issue.attachment ?? '');
  const isEvidenceFolder = attachment.includes('drive.google.com/drive/folders');
  // null = carregando; [] = sem arquivos (ou erro — o link da pasta segue no campo Attachment).
  const [files, setFiles] = useState(null);

  useEffect(() => {
    if (!isEvidenceFolder) return undefined;
    let cancelled = false;
    setFiles(null);
    api
      .getIssueEvidence(issue.id)
      .then((data) => {
        if (!cancelled) setFiles(data.files ?? []);
      })
      .catch(() => {
        if (!cancelled) setFiles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [issue.id, isEvidenceFolder]);

  if (!isEvidenceFolder) return null;
  if (files === null) {
    return (
      <div className="evidence-gallery">
        <span className="evidence-gallery-title">Evidências</span>
        <Loading label="Carregando evidências" />
      </div>
    );
  }
  if (files.length === 0) return null;

  const videos = files.filter((file) => String(file.mimeType).startsWith('video/'));
  const images = files.filter((file) => String(file.mimeType).startsWith('image/'));
  const others = files.filter((file) => !videos.includes(file) && !images.includes(file));

  return (
    <div className="evidence-gallery">
      <span className="evidence-gallery-title">Evidências</span>
      {videos.map((file) => (
        <VideoPreview key={file.id} file={file} />
      ))}
      {images.length > 0 ? (
        <div className="evidence-gallery-grid">
          {images.map((file) => (
            <a key={file.id} href={file.webViewLink} target="_blank" rel="noreferrer" title={file.name}>
              <img className="evidence-gallery-thumb" src={file.thumbnailUrl} alt={file.name} loading="lazy" />
            </a>
          ))}
        </div>
      ) : null}
      {others.map((file) => (
        <a key={file.id} className="attachment-link" href={file.webViewLink} target="_blank" rel="noreferrer">
          {file.name}
        </a>
      ))}
    </div>
  );
}
