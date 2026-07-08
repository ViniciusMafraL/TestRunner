import { Router } from 'express';
import { google } from 'googleapis';
import { validateLoginPayload, roleCanWrite } from 'shared/contracts.js';
import { config } from '../config.js';
import { HttpError } from '../HttpError.js';
import { signSession } from '../sessionToken.js';
import { upsertUserOnLogin } from '../repositories/usersRepository.js';
import { asyncHandler } from '../asyncHandler.js';

export const authRouter = Router();

// Client OAuth só para validar ID tokens (assinatura/audience/expiração);
// não precisa de client secret nesse fluxo.
const oauthClient = new google.auth.OAuth2();

async function verifyGoogleCredential(credential) {
  let payload;
  try {
    const ticket = await oauthClient.verifyIdToken({ idToken: credential, audience: config.googleClientId });
    payload = ticket.getPayload();
  } catch {
    throw new HttpError(401, 'INVALID_LOGIN', 'Não foi possível validar o login do Google');
  }
  if (!payload?.email || payload.email_verified !== true) {
    throw new HttpError(401, 'INVALID_LOGIN', 'Conta Google sem e-mail verificado');
  }
  if (config.allowedDomain && payload.hd !== config.allowedDomain) {
    throw new HttpError(403, 'FORBIDDEN', 'Use a conta do Workspace da equipe para entrar');
  }
  return payload;
}

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const payload = req.body ?? {};
    const result = validateLoginPayload(payload);
    if (!result.valid) {
      throw new HttpError(422, result.error.code, result.error.message);
    }

    if (payload.type === 'google') {
      if (!config.googleClientId || !config.sessionSecret || !config.usersSheetId) {
        throw new HttpError(500, 'INTERNAL_ERROR', 'Login Google não configurado no backend (ver .env)');
      }
      const info = await verifyGoogleCredential(payload.credential);
      const user = await upsertUserOnLogin(info.email, info.name ?? info.email);
      const session = {
        kind: 'google',
        displayName: user.name,
        email: user.email,
        role: user.role,
        canWrite: roleCanWrite(user.role),
      };
      res.json({ session: { ...session, token: signSession(session) } });
      return;
    }

    const session = {
      kind: 'guest',
      displayName: payload.name.trim(),
      role: 'guest',
      canWrite: false,
    };
    res.json({ session: { ...session, token: signSession(session) } });
  }),
);

authRouter.post('/logout', (req, res) => {
  res.status(204).end();
});
