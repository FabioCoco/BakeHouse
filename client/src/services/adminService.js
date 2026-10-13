import { api } from '../api/axios.js';

// Admin endpoints. Lists return the full API body ({ data, meta }) for useFetch.
export const adminService = {
  summary: () => api.get('/admin/summary').then((res) => res.data),
  listOrders: (params) => api.get('/admin/orders', { params }).then((res) => res.data),
  getOrder: (id) => api.get(`/admin/orders/${id}`).then((res) => res.data.data),
  // Uploads one image. kind is "product" or "banner". Resolves to { filename, url }.
  uploadImage: (file, kind) => {
    const form = new FormData();
    form.append('file', file);
    // Leaving Content-Type unset lets the browser add the multipart boundary.
    return api
      .post(`/admin/uploads?kind=${kind}`, form, { headers: { 'Content-Type': undefined } })
      .then((res) => res.data.data);
  },
  // range is 7d, 30d, or 90d. Returns the analytics object directly.
  analytics: (range) => api.get('/admin/analytics', { params: { range } }).then((res) => res.data.data),
  updateOrderStatus: (id, status) =>
    api.patch(`/admin/orders/${id}/status`, { status }).then((res) => res.data.data),
};
