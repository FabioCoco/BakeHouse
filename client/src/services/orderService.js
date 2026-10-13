import { api } from '../api/axios.js';

export const orderService = {
  // Returns { order, payment } where payment holds the bank account to transfer to.
  checkout: (payload) => api.post('/orders/checkout', payload).then((res) => res.data.data),
  listMine: (params) => api.get('/orders/me', { params }).then((res) => res.data),
  getMine: (id) => api.get(`/orders/me/${id}`).then((res) => res.data),
  cancel: (id) => api.patch(`/orders/me/${id}/cancel`).then((res) => res.data.data),
};
