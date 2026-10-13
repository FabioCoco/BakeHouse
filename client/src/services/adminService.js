import { api } from '../api/axios.js';

// Admin endpoints. Lists return the full API body ({ data, meta }) for useFetch.
export const adminService = {
  summary: () => api.get('/admin/summary').then((res) => res.data),
  listOrders: (params) => api.get('/admin/orders', { params }).then((res) => res.data),
  getOrder: (id) => api.get(`/admin/orders/${id}`).then((res) => res.data.data),
  updateOrderStatus: (id, status) =>
    api.patch(`/admin/orders/${id}/status`, { status }).then((res) => res.data.data),
};
