import api, { data } from './api';
export const get = (role) => data(api.get(`/dashboard/${role}`));
export const workload = () => data(api.get('/dashboard/workload'));
