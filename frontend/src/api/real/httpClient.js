import axios from 'axios';
import { ApiError } from '../ApiError.js';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
});

export async function request(config) {
  try {
    const response = await http.request(config);
    return response.data;
  } catch (error) {
    const status = error.response?.status ?? 0;
    const apiError = error.response?.data?.error;
    throw new ApiError(status, apiError?.code ?? 'UNKNOWN_ERROR', apiError?.message ?? error.message);
  }
}
