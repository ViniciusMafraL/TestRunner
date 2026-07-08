import axios from 'axios';
import { ApiError } from '../ApiError.js';
import { readStoredSession } from '../../auth/sessionStorage.js';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
});

export async function request(config) {
  // Toda chamada leva o token de sessão emitido pelo backend no login
  // (Google ou convidado); sem ele o backend responde 401.
  const session = readStoredSession();
  const headers = { ...config.headers };
  if (session?.token) headers.Authorization = `Bearer ${session.token}`;
  try {
    const response = await http.request({ ...config, headers });
    return response.data;
  } catch (error) {
    const status = error.response?.status ?? 0;
    const apiError = error.response?.data?.error;
    throw new ApiError(status, apiError?.code ?? 'UNKNOWN_ERROR', apiError?.message ?? error.message);
  }
}
