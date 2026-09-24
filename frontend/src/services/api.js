import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'https://tiket-task.onrender.com/api' });
api.interceptors.request.use((c) => { const t = localStorage.getItem('token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });
api.interceptors.response.use((r) => r, (e) => {
  if (e.response?.status === 401 && !e.config.url.includes('/auth/login')) { localStorage.removeItem('token'); if (!location.pathname.startsWith('/login')) location.href = '/login'; }
  return Promise.reject(e);
});
export const data = (p) => p.then((r) => r.data.data);
export const errMsg = (e) => e.response?.data?.message || (e.code === 'ERR_NETWORK' ? 'Cannot reach the server. Check that the backend is running.' : 'Something went wrong. Please try again.');
export default api;
