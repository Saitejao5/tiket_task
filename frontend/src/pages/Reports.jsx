import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import * as dash from '../services/dashboard';
import * as tickets from '../services/tickets';
import { Card, Skeleton, ErrorBox, Tabs, Pagination, Empty, StatusBadge, PriorityBadge, SlaBadge } from '../components/ui';
import { StatCard, BarList, TimeBars } from '../components/dashboard/widgets';
import { AGE_BUCKETS, fmtAge, fmtDay } from '../utils/format';
const TABS = [['summary', 'Summary'], ['workload', 'Staff workload'], ['sla', 'SLA monitoring'], ['ageing', 'Ageing']];
function TicketRows({ items, cols }) {
  if (!items.length) return <Empty title="No tickets found" hint="Nothing matches this report right now." />;
  return <div className="table-wrap"><table className="tbl"><thead><tr><th>Ticket</th><th>Student</th><th className="hide-sm">Category</th><th className="hide-md">Assigned to</th><th>Status</th><th>Priority</th><th>Age</th><th>SLA</th><th className="hide-sm">Created</th></tr></thead>
    <tbody>{items.map((t) => <tr key={t._id}><td><Link className="tnum" to={`/tickets/${t._id}`}>{t.ticketNumber}</Link></td><td>{t.student?.name}</td><td className="hide-sm">{t.category?.name}</td><td className="hide-md">{t.assignedTo?.name || 'Unassigned'}</td><td><StatusBadge status={t.status} /></td><td><PriorityBadge priority={t.priority} /></td><td>{fmtAge(t.ageHours)}</td><td><SlaBadge status={t.slaStatus} /></td><td className="hide-sm">{fmtDay(t.createdAt)}</td></tr>)}</tbody></table></div>;
}
function TicketReport({ params, extra }) {
  const [page, setPage] = useState(1); const k = JSON.stringify(params);
  const { data, loading, error, reload } = useFetch(() => tickets.list({ ...params, page, limit: 15, sort: 'createdAt' }), [k, page]);
  return error ? <ErrorBox message={error} onRetry={reload} /> : !data ? <Skeleton rows={6} h={30} /> : <>{extra}<TicketRows items={data.items} /><Pagination p={data.pagination} onPage={setPage} /></>;
}
export default function Reports() {
  const [sp, setSp] = useSearchParams(); const tab = sp.get('tab') || 'summary'; const [bucket, setBucket] = useState('');
  const { data: d, loading, error, reload } = useFetch(() => dash.get('manager'), []);
  return (
    <div className="page"><h1>Reports</h1><Tabs tabs={TABS} value={tab} onChange={(t) => setSp({ tab: t })} />
      {error ? <ErrorBox message={error} onRetry={reload} /> : loading ? <Skeleton rows={8} h={26} /> : <>
        {tab === 'summary' && <><div className="stats"><StatCard label="Total tickets" value={d.stats.total} /><StatCard label="Open" value={d.stats.open} /><StatCard label="In progress" value={d.stats.inProgress} /><StatCard label="Pending" value={d.stats.pending} /><StatCard label="Resolved" value={d.stats.resolved} /><StatCard label="Closed" value={d.stats.closed} /><StatCard label="Avg. resolution" value={d.avgResolutionHours == null ? '—' : fmtAge(d.avgResolutionHours)} /></div>
          <div className="grid2"><Card title="Ticket summary: created per day"><TimeBars rows={d.overTime} /></Card><Card title="Ageing of open tickets"><BarList rows={d.ageing} /></Card><Card title="Category report"><BarList rows={d.byCategory} /></Card><Card title="Status report"><BarList rows={d.byStatus} /></Card><Card title="Priority report"><BarList rows={d.byPriority} /></Card><Card title="Department report"><BarList rows={d.byDepartment} /></Card></div></>}
        {tab === 'workload' && <Card title="Staff workload" action={<small className="muted">Factual counts only; no performance ratings</small>}>{!d.workload.length ? <Empty title="No staff found" hint="Add staff members from the Users page." /> : <div className="table-wrap"><table className="tbl"><thead><tr><th>Staff</th><th>Assigned</th><th>Open</th><th>In progress</th><th>Pending</th><th>Resolved</th><th>SLA breached</th></tr></thead><tbody>{d.workload.map((w) => <tr key={w.staffId} className={w.active ? '' : 'inactive'}><td>{w.name}{!w.active && <span className="badge warnb">Inactive</span>}</td><td>{w.assigned}</td><td>{w.open}</td><td>{w.inProgress}</td><td>{w.pending}</td><td>{w.resolved}</td><td>{w.breached}</td></tr>)}</tbody></table></div>}</Card>}
        {tab === 'sla' && <><div className="stats compact"><StatCard label="Breached (open)" value={d.stats.breached} tone="bad" /><StatCard label="Due soon" value={d.stats.dueSoon} tone="warn" /><StatCard label="Unassigned" value={d.stats.unassigned} /><StatCard label="Assigned to inactive staff" value={d.stats.inactiveAssigned} /></div>
          <Card title="SLA breached: open tickets"><TicketReport params={{ open: 'true', slaStatus: 'SLA Breached' }} /></Card><Card title="Due soon"><TicketReport params={{ open: 'true', slaStatus: 'Due Soon' }} /></Card></>}
        {tab === 'ageing' && <Card title="Ageing report: open tickets"><div className="chips" role="group" aria-label="Age bucket"><button className={!bucket ? 'on' : ''} onClick={() => setBucket('')}>All open</button>{AGE_BUCKETS.map(([k, l]) => <button key={k} className={bucket === k ? 'on' : ''} onClick={() => setBucket(k)}>{l}</button>)}</div><TicketReport key={bucket} params={bucket ? { age: bucket } : { open: 'true' }} /></Card>}
      </>}
    </div>);
}
