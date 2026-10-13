import { api } from '../api/axios.js';

export const settingsService = {
  // Storefront: announcement, active banners, and featured categories.
  getPublic: () => api.get('/settings').then((res) => res.data.data),
  // Admin: the full settings document, including inactive banners.
  getAdmin: () => api.get('/admin/settings').then((res) => res.data.data),
  updateAdmin: (payload) => api.put('/admin/settings', payload).then((res) => res.data.data),
};
