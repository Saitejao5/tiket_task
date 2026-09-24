import api, { data } from './api';
export const list = (params) => data(api.get('/notifications', { params }));
export const read = (id) => data(api.patch(`/notifications/${id}/read`));
export const readAll = () => data(api.patch('/notifications/read-all'));
