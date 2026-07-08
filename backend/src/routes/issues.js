import fs from 'node:fs';
import os from 'node:os';
import { Router } from 'express';
import multer from 'multer';
import { EVIDENCE_MAX_FILES, EVIDENCE_MAX_FILE_SIZE_MB, validateEvidenceFiles } from 'shared/contracts.js';
import { getIssuesGroupedByStatus, createIssue, updateIssueStatus, updateIssue, listIssues } from '../repositories/issuesRepository.js';
import { ensureFolder, findFolder, listFilesInFolder, shareFolderByLink, uploadFileToFolder } from '../googleDrive.js';
import { config } from '../config.js';
import { HttpError } from '../HttpError.js';
import { requireWrite } from '../authMiddleware.js';
import { asyncHandler } from '../asyncHandler.js';

// Multer grava os uploads em arquivos temporários (não em memória) para não
// segurar até 100 MB por request no heap; a rota apaga os temporários no fim.
const evidenceUpload = multer({
  dest: os.tmpdir(),
  limits: { files: EVIDENCE_MAX_FILES, fileSize: EVIDENCE_MAX_FILE_SIZE_MB * 1024 * 1024 },
});

export const issuesRouter = Router();

issuesRouter.get(
  '/grouped-by-status',
  asyncHandler(async (req, res) => {
    res.json(await getIssuesGroupedByStatus());
  }),
);

issuesRouter.post(
  '/',
  requireWrite,
  asyncHandler(async (req, res) => {
    const issue = await createIssue(req.body ?? {});
    res.status(201).json(issue);
  }),
);

issuesRouter.patch(
  '/:id/status',
  requireWrite,
  asyncHandler(async (req, res) => {
    const issue = await updateIssueStatus(req.params.id, req.body?.status);
    res.json(issue);
  }),
);

issuesRouter.patch(
  '/:id',
  requireWrite,
  asyncHandler(async (req, res) => {
    const issue = await updateIssue(req.params.id, req.body ?? {});
    res.json(issue);
  }),
);

issuesRouter.get(
  '/:id/evidence',
  asyncHandler(async (req, res) => {
    // Sem pasta (ou id desconhecido) devolve lista vazia — o modal chama este
    // endpoint a cada abertura e não deve custar uma leitura de planilha.
    if (!config.driveEvidenceFolderId) {
      res.json({ files: [] });
      return;
    }
    const folderId = await findFolder(req.params.id, config.driveEvidenceFolderId);
    if (!folderId) {
      res.json({ files: [] });
      return;
    }
    const files = await listFilesInFolder(folderId);
    res.json({
      files: files.map((file) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${file.id}&sz=w400`,
        previewUrl: `https://drive.google.com/file/d/${file.id}/preview`,
        webViewLink: file.webViewLink,
      })),
    });
  }),
);

issuesRouter.post(
  '/:id/evidence',
  requireWrite,
  evidenceUpload.array('files', EVIDENCE_MAX_FILES),
  asyncHandler(async (req, res) => {
    const files = req.files ?? [];
    try {
      const result = validateEvidenceFiles(files.map((file) => ({ name: file.originalname, size: file.size, type: file.mimetype })));
      if (!result.valid) {
        throw new HttpError(422, result.error.code, result.error.message);
      }
      if (!config.driveEvidenceFolderId) {
        throw new HttpError(502, 'DRIVE_ERROR', 'GOOGLE_DRIVE_EVIDENCE_FOLDER_ID não configurado no backend');
      }

      // Confirma a issue antes de tocar o Drive (404 barato, sem upload à toa).
      const issues = await listIssues();
      const exists = issues.some((issue) => issue.id === req.params.id);
      if (!exists) {
        throw new HttpError(404, 'NOT_FOUND', 'Issue não encontrada');
      }

      let folderLink;
      try {
        const folderId = await ensureFolder(req.params.id, config.driveEvidenceFolderId);
        for (const file of files) {
          await uploadFileToFolder({
            folderId,
            name: file.originalname,
            mimeType: file.mimetype,
            body: fs.createReadStream(file.path),
          });
        }
        folderLink = await shareFolderByLink(folderId);
      } catch (error) {
        console.error('Falha no upload de evidência para o Drive:', error);
        throw new HttpError(502, 'DRIVE_ERROR', 'Não foi possível enviar a evidência para o Drive');
      }

      const issue = await updateIssue(req.params.id, { attachment: folderLink });
      res.json(issue);
    } finally {
      await Promise.all(files.map((file) => fs.promises.unlink(file.path).catch(() => {})));
    }
  }),
);
