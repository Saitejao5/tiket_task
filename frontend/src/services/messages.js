import api, { data } from './api';
export const list = (ticketId) => data(api.get(`/tickets/${ticketId}/messages`));
export const send = (ticketId, form) => data(api.post(`/tickets/${ticketId}/messages`, form));
export const download = async (filename, name) => {
  const r = await api.get(`/files/${filename}`, { responseType: 'blob' });
  const url = URL.createObjectURL(r.data); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
};
