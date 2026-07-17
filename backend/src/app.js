import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { EVIDENCE_MAX_FILE_SIZE_MB } from 'shared/contracts.js';
import { config } from './config.js';
import { requireSession } from './authMiddleware.js';
import { requireOperation } from './operationMiddleware.js';
import { requireProject } from './projectMiddleware.js';
import { authRouter } from './routes/auth.js';
import { homeRouter } from './routes/home.js';
import { issuesRouter } from './routes/issues.js';
import { testRunsRouter } from './routes/testRuns.js';
import { usersRouter } from './routes/users.js';
import { operationsRouter } from './routes/operations.js';
import { systemRouter } from './routes/system.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.use('/auth', authRouter);
  // Rotas de dados exigem sessão + operação (X-Operation); as baseadas em issues
  // exigem também o projeto/aba (X-Project). Escrita exige papel com escrita.
  // Test Runs são por operação (sem projeto). /operations e /users só exigem sessão.
  app.use('/home', requireSession, requireOperation, requireProject, homeRouter);
  app.use('/issues', requireSession, requireOperation, requireProject, issuesRouter);
  app.use('/test-runs', requireSession, requireOperation, testRunsRouter);
  app.use('/operations', requireSession, operationsRouter);
  app.use('/users', requireSession, usersRouter);
  // Ferramentas de sistema (publicar atualização) — sessão + papel admin.
  app.use('/system', requireSession, systemRouter);

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    // Erros do multer (upload de evidências) são de validação, não internos.
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? `Arquivo excede o limite de ${EVIDENCE_MAX_FILE_SIZE_MB} MB`
          : `Upload inválido: ${err.message}`;
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message } });
    }
    console.error(err);
    const status = err.status ?? 500;
    const code = err.code ?? 'INTERNAL_ERROR';
    res.status(status).json({ error: { code, message: err.message ?? 'Erro interno' } });
  });

  return app;
}
