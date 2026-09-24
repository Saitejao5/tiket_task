import api, { data } from './api';
const crud = (path) => ({ list: (all) => data(api.get(path, { params: all ? { all: true } : {} })), create: (b) => data(api.post(path, b)), update: (id, b) => data(api.patch(`${path}/${id}`, b)), remove: (id) => data(api.delete(`${path}/${id}`)) });
export const departments = crud('/departments');
export const slaPolicies = crud('/sla-policies');
export const auditLogs = (params) => data(api.get('/audit-logs', { params }));
export const getSettings = () => data(api.get('/settings'));
export const saveSettings = (b) => data(api.patch('/settings', b));
