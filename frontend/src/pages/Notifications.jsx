import { useNavigate } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import * as api from '../services/notifications';
import { errMsg } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card, Skeleton, ErrorBox, Empty, Pagination } from '../components/ui';
import { fromNow } from '../utils/format';
import { useState } from 'react';
export default function Notifications() {
  const nav = useNavigate(); const toast = useToast(); const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => api.list({ page, limit: 15 }), [page]);
  const changed = () => window.dispatchEvent(new Event('notif-changed'));
  const open = async (n) => { if (!n.read) { await api.read(n._id).catch(() => {}); changed(); } if (n.ticket) nav(`/tickets/${n.ticket._id}`); else reload(); };
  const all = async () => { try { await api.readAll(); toast('All notifications marked as read'); changed(); reload(); } catch (e) { toast(errMsg(e), 'error'); } };
  return (
    <div className="page narrow"><div className="row between wrap"><h1>Notifications</h1><button className="btn" onClick={all} disabled={!data?.unread}>Mark all as read</button></div>
      <Card>{error ? <ErrorBox message={error} onRetry={reload} /> : loading && !data ? <Skeleton rows={6} h={40} /> : !data.items.length ? <Empty title="No notifications found" hint="Updates about your tickets will show up here." /> : <><ul className="notifs">{data.items.map((n) => <li key={n._id} className={n.read ? '' : 'unread'}><button onClick={() => open(n)}><span className="dot" aria-hidden="true" /><span className="nt"><b>{n.title}{!n.read && <em className="sr"> (unread)</em>}</b><span>{n.message}</span></span><time>{fromNow(n.createdAt)}</time></button></li>)}</ul><Pagination p={data.pagination} onPage={setPage} /></>}</Card>
    </div>);
}
