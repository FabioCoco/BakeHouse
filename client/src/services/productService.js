import { api } from '../api/axios.js';

// Public reads return the full API body: { success, data, meta }.
// Writes return the saved product (data only). Requires an admin session.
export const productService = {
  list: (params) => api.get('/products', { params }).then((res) => res.data),
  getBySlug: (slug) => api.get(`/products/${slug}`).then((res) => res.data),
  create: (payload) => api.post('/products', payload).then((res) => res.data.data),
  update: (id, payload) => api.patch(`/products/${id}`, payload).then((res) => res.data.data),
  // Set an absolute stock value, or pass { adjustment } for a relative change.
  setStock: (id, payload) => api.patch(`/products/${id}/stock`, payload).then((res) => res.data.data),
  // Soft delete. The product is deactivated, not removed, so old orders still resolve.
  deactivate: (id) => api.delete(`/products/${id}`).then((res) => res.data.data),
};
