import { api } from '../api/axios.js';

// Returns the full API body: { success, data, meta }.
export const productService = {
  list: (params) => api.get('/products', { params }).then((res) => res.data),
  getBySlug: (slug) => api.get(`/products/${slug}`).then((res) => res.data),
};
