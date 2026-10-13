import { api } from '../api/axios.js';

// list() returns the API body ({ data, meta }) for useFetch. Mutations return the updated address array.
export const addressService = {
  list: () => api.get('/users/me/addresses').then((res) => res.data),
  add: (values) => api.post('/users/me/addresses', values).then((res) => res.data.data),
  update: (id, values) => api.patch(`/users/me/addresses/${id}`, values).then((res) => res.data.data),
  remove: (id) => api.delete(`/users/me/addresses/${id}`).then((res) => res.data.data),
};
