import { api } from '../api/axios.js';

// Reads return the full API body ({ data, meta }) for useFetch. Writes return the saved review.
export const reviewService = {
  list: (slug, params) => api.get(`/products/${slug}/reviews`, { params }).then((res) => res.data),
  mine: (slug) => api.get(`/products/${slug}/reviews/me`).then((res) => res.data.data),
  create: (slug, payload) => api.post(`/products/${slug}/reviews`, payload).then((res) => res.data.data),
  update: (slug, payload) => api.patch(`/products/${slug}/reviews`, payload).then((res) => res.data.data),
  remove: (slug) => api.delete(`/products/${slug}/reviews`).then((res) => res.data.data),
  adminList: (params) => api.get('/admin/reviews', { params }).then((res) => res.data),
  setVisibility: (id, isHidden) =>
    api.patch(`/admin/reviews/${id}/visibility`, { isHidden }).then((res) => res.data.data),
};
