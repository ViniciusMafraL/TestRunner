import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { homeRouter } from './routes/home.js';
import { issuesRouter } from './routes/issues.js';
import { testRunsRouter } from './routes/testRuns.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.use('/auth', authRouter);
  app.use('/home', homeRouter);
  app.use('/issues', issuesRouter);
  app.use('/test-runs', testRunsRouter);

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status ?? 500;
    const code = err.code ?? 'INTERNAL_ERROR';
    res.status(status).json({ error: { code, message: err.message ?? 'Erro interno' } });
  });

  return app;
}
