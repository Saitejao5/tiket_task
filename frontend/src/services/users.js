import api, { data } from './api';
export const list = (params) => data(api.get('/users', { params }));
export const create = (b) => data(api.post('/users', b));
export const update = (id, b) => data(api.patch(`/users/${id}`, b));
