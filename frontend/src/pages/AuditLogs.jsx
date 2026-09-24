import { useState } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import * as admin from '../services/admin';
import { Card, Skeleton, ErrorBox, Empty, Pagination } from '../components/ui';
import { ACTIONS, actionLabel, fmtDate } from '../utils/format';
export default function AuditLogs() {
  const [action, setAction] = useState(''); const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => admin.auditLogs({ action, page, limit: 25 }), [action, page]);
  const detail = (l) => { const p = l.previousValue, n = l.newValue; const s = (v) => (typeof v === 'object' ? JSON.stringify(v) : String(v)); if (p != null || n != null) return `${p != null ? s(p) : '—'} → ${n != null ? s(n) : '—'}`; return l.metadata?.entity ? `${l.metadata.entity} ${l.metadata.name || l.metadata.email || ''}` : l.metadata?.ticketNumber || ''; };
  return (
    <div className="page"><h1>Audit logs</h1><p className="muted">A permanent, append-only record of important actions. Entries cannot be edited or deleted from the application.</p>
      <Card><label className="filter"><span>Action</span><select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}><option value="">All actions</option>{ACTIONS.map((a) => <option key={a} value={a}>{actionLabel(a)}</option>)}</select></label>
        {error ? <ErrorBox message={error} onRetry={reload} /> : loading && !data ? <Skeleton rows={8} h={26} /> : !data.items.length ? <Empty title="No audit entries found" hint="Try a different action filter." /> : <><div className="table-wrap"><table className="tbl"><thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Ticket</th><th className="hide-sm">Details</th></tr></thead><tbody>{data.items.map((l) => <tr key={l._id}><td>{fmtDate(l.createdAt)}</td><td>{l.actor?.name}<small className="block muted">{l.actor?.role}</small></td><td>{actionLabel(l.action)}</td><td>{l.ticket ? <Link className="tnum" to={`/tickets/${l.ticket._id}`}>{l.ticket.ticketNumber}</Link> : '—'}</td><td className="hide-sm">{detail(l)}</td></tr>)}</tbody></table></div><Pagination p={data.pagination} onPage={setPage} /></>}</Card>
    </div>);
}
