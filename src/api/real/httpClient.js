import axios from 'axios';
import { OUTDATED_SESSION_CODE } from 'shared/sessionEpoch.js';
import { ApiError } from '../ApiError.js';
import { notifyOutdatedSession } from '../outdatedSession.js';
import { readStoredSession } from '../../auth/sessionStorage.js';
import { readCurrentOperation, readCurrentProject } from '../../operations/operationStorage.js';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
});

export async function request(config) {
  // Toda chamada leva o token de sessão emitido pelo backend no login
  // (Google ou convidado); sem ele o backend responde 401. As rotas de dados
  // exigem também a operação atual (X-Operation) e, nas rotas baseadas em
  // issues, o projeto/aba atual (X-Project).
  const session = readStoredSession();
  const operation = readCurrentOperation();
  const project = readCurrentProject();
  const headers = { ...config.headers };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;
  if (operation) headers['X-Operation'] = operation;
  if (project) headers['X-Project'] = project;
  try {
    const response = await http.request({ ...config, headers });
    return response.data;
  } catch (error) {
    const status = error.response?.status ?? 0;
    const apiError = error.response?.data?.error;
    // O admin publicou uma atualização: a sessão desta aba é de uma época
    // anterior e o backend recusa tudo até relogar. Avisa a app inteira aqui,
    // de carona na requisição que o usuário já faria — sem polling.
    if (apiError?.code === OUTDATED_SESSION_CODE) {
      notifyOutdatedSession();
    }
    throw new ApiError(status, apiError?.code ?? 'UNKNOWN_ERROR', apiError?.message ?? error.message);
  }
}
