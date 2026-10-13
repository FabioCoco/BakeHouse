import { api } from '../api/axios.js';

// Every call returns the full server cart view: { items, itemCount, subtotal, hasIssues }.
export const cartService = {
  get: () => api.get('/cart').then((res) => res.data),
  addItem: (productId, quantity) => api.post('/cart/items', { productId, quantity }).then((res) => res.data),
  updateItem: (productId, quantity) =>
    api.patch(`/cart/items/${productId}`, { quantity }).then((res) => res.data),
  removeItem: (productId) => api.delete(`/cart/items/${productId}`).then((res) => res.data),
  clear: () => api.delete('/cart').then((res) => res.data),
};
