import { api } from '../api/axios.js';

export const orderService = {
  // Returns { order, snapToken, redirectUrl, clientKey }. The snapToken opens the Midtrans payment popup.
  checkout: (payload) => api.post('/orders/checkout', payload).then((res) => res.data.data),
  // Resumes payment for an unpaid order. Returns the same shape as checkout.
  pay: (id) => api.post(`/orders/me/${id}/pay`).then((res) => res.data.data),
  // Asks the server to re-read the payment status from Midtrans (local-development fallback for the webhook).
  syncPaymentStatus: (id) => api.get(`/orders/me/${id}/payment-status`).then((res) => res.data.data),
  listMine: (params) => api.get('/orders/me', { params }).then((res) => res.data),
  getMine: (id) => api.get(`/orders/me/${id}`).then((res) => res.data),
  cancel: (id) => api.patch(`/orders/me/${id}/cancel`).then((res) => res.data.data),
};
