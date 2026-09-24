import api, { data } from './api';
export const login = (b) => data(api.post('/auth/login', b));
export const register = (b) => data(api.post('/auth/register', b));
export const me = () => data(api.get('/auth/me'));
export const logout = () => api.post('/auth/logout').catch(() => {});
export const updateMe = (b) => data(api.patch('/auth/me', b));
