import { api } from '../api/axios.js';

export const categoryService = {
  list: () => api.get('/categories').then((res) => res.data),
  create: (payload) => api.post('/categories', payload).then((res) => res.data.data),
  update: (id, payload) => api.patch(`/categories/${id}`, payload).then((res) => res.data.data),
  remove: (id) => api.delete(`/categories/${id}`).then((res) => res.data.data),
};
