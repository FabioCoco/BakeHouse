import { api } from '../api/axios.js';

export const profileService = {
  updateProfile: (payload) => api.patch('/users/me', payload).then((res) => res.data.data),
  changePassword: (payload) => api.patch('/users/me/password', payload).then((res) => res.data.data),
};
