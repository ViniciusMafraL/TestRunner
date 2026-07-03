import { Router } from 'express';
import { validateLoginPayload } from 'shared/contracts.js';
import { HttpError } from '../HttpError.js';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const payload = req.body ?? {};
  const result = validateLoginPayload(payload);
  if (!result.valid) {
    const status = result.error.code === 'INVALID_LOGIN' ? 401 : 422;
    throw new HttpError(status, result.error.code, result.error.message);
  }
  res.json({
    session: {
      kind: payload.type === 'fixed' ? 'fixed' : 'guest',
      displayName: payload.name.trim(),
      canWrite: payload.type === 'fixed',
    },
  });
});

authRouter.post('/logout', (req, res) => {
  res.status(204).end();
});
