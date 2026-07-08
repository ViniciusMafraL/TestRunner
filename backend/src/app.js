import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { EVIDENCE_MAX_FILE_SIZE_MB } from 'shared/contracts.js';
import { config } from './config.js';
import { requireSession } from './authMiddleware.js';
import { authRouter } from './routes/auth.js';
import { homeRouter } from './routes/home.js';
import { issuesRouter } from './routes/issues.js';
import { testRunsRouter } from './routes/testRuns.js';
import { usersRouter } from './routes/users.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.use('/auth', authRouter);
  // Todas as rotas de dados exigem sessão (token do login); as de escrita
  // exigem também papel com escrita — ver authMiddleware.js.
  app.use('/home', requireSession, homeRouter);
  app.use('/issues', requireSession, issuesRouter);
  app.use('/test-runs', requireSession, testRunsRouter);
  app.use('/users', requireSession, usersRouter);

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
