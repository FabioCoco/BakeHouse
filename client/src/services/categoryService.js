import { api } from '../api/axios.js';

export const categoryService = {
  list: () => api.get('/categories').then((res) => res.data),
};
