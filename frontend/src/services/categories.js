import api, { data } from './api';
export const list = (all) => data(api.get('/categories', { params: all ? { all: true } : {} }));
export const create = (b) => data(api.post('/categories', b));
export const update = (id, b) => data(api.patch(`/categories/${id}`, b));
export const remove = (id) => data(api.delete(`/categories/${id}`));
