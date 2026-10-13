import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore.js';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Some errors are expected and handled by the caller. A 401 on the initial session check is one of them.
const isSessionCheck = (config) => config?.url === '/auth/me';

// Normalizes every API error to { message, errors } so components never parse raw Axios errors.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data;

    if (status === 401 && !isSessionCheck(error.config)) {
      useAuthStore.getState().clearAuth();
    }

    const normalized = {
      message: payload?.message || error.message || 'Terjadi kesalahan, coba lagi.',
      errors: payload?.errors || [],
      status: status ?? null,
    };
    return Promise.reject(normalized);
  },
);
