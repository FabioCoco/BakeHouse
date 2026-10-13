import { api } from '../api/axios.js';

// Every endpoint returns { success, data, meta }. These helpers unwrap `data` (the user object).
export const authService = {
  me: () => api.get('/auth/me').then((res) => res.data.data),
  login: (payload) => api.post('/auth/login', payload).then((res) => res.data.data),
  register: (payload) => api.post('/auth/register', payload).then((res) => res.data.data),
  googleLogin: (credential) => api.post('/auth/google', { credential }).then((res) => res.data.data),
  logout: () => api.post('/auth/logout'),
};
