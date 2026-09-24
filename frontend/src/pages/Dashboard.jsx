import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import * as dash from '../services/dashboard';
import { Card, Skeleton, ErrorBox } from '../components/ui';
import { StatCard, BarList, TimeBars } from '../components/dashboard/widgets';
import TicketTable from '../components/tickets/TicketTable';
import { fmtAge } from '../utils/format';
export default function Dashboard() {
  const { user } = useAuth(); const r = user.role; const { data: d, loading, error, reload } = useFetch(() => dash.get(r), [r]);
  const greet = <div className="row between wrap"><div><h1>Hello, {user.name.split(' ')[0]}</h1><p className="muted">{r === 'student' ? 'Here is where your requests stand.' : r === 'staff' ? 'Your assigned work at a glance.' : 'Support operations overview.'}</p></div>{r === 'student' && <Link to="/tickets/new" className="btn primary">New support request</Link>}</div>;
  if (loading) return <div className="page">{greet}<Skeleton rows={6} h={28} /></div>;
  if (error) return <div className="page">{greet}<ErrorBox message={error} onRetry={reload} /></div>;
  const s = d.stats;
  if (r === 'student') return (
    <div className="page">{greet}
      <div className="stats"><StatCard label="Total requests" value={s.total} to="/tickets" /><StatCard label="Open" value={s.open} to="/tickets?status=Open" /><StatCard label="In progress" value={s.inProgress} to="/tickets?status=In Progress" /><StatCard label="Pending" value={s.pending} to="/tickets?status=Pending" /><StatCard label="Resolved" value={s.resolved} to="/tickets?status=Resolved" tone="ok" /><StatCard label="Closed" value={s.closed} to="/tickets?status=Closed" /></div>
      <Card title="Recent requests" action={<Link to="/tickets">View all</Link>}><TicketTable items={d.recent} role={r} /></Card>
    </div>);
  if (r === 'staff') return (
    <div className="page">{greet}
      <div className="stats"><StatCard label="Assigned to me" value={s.assigned} to={`/tickets?assignedTo=${user._id}`} /><StatCard label="Open" value={s.open} /><StatCard label="In progress" value={s.inProgress} /><StatCard label="Pending" value={s.pending} /><StatCard label="Due soon" value={s.dueSoon} tone="warn" to={`/tickets?assignedTo=${user._id}&slaStatus=Due Soon`} /><StatCard label="SLA breached" value={s.breached} tone="bad" to={`/tickets?assignedTo=${user._id}&slaStatus=SLA Breached`} /></div>
      <Card title="Recently updated tickets" action={<Link to="/tickets">All tickets</Link>}><TicketTable items={d.recent} role={r} emptyHint="Tickets assigned to you will appear here." /></Card>
    </div>);
  return (
    <div className="page">{greet}
      <div className="stats"><StatCard label="Total tickets" value={s.total} to="/tickets" /><StatCard label="Open" value={s.open} /><StatCard label="In progress" value={s.inProgress} to="/tickets?status=In Progress" /><StatCard label="Pending" value={s.pending} to="/tickets?status=Pending" /><StatCard label="Resolved" value={s.resolved} to="/tickets?status=Resolved" /><StatCard label="Closed" value={s.closed} to="/tickets?status=Closed" /><StatCard label="SLA breached" value={s.breached} tone="bad" to="/tickets?slaStatus=SLA Breached" /><StatCard label="Unassigned" value={s.unassigned} tone="warn" to="/tickets?assignedTo=unassigned" note={s.inactiveAssigned ? `${s.inactiveAssigned} with inactive staff` : undefined} /></div>
      {r === 'admin' && d.system && <div className="stats compact"><StatCard label="Students" value={d.system.users.student || 0} to="/users" /><StatCard label="Staff" value={d.system.users.staff || 0} to="/users" /><StatCard label="Managers" value={d.system.users.manager || 0} to="/users" /><StatCard label="Departments" value={d.system.departments} to="/departments" /><StatCard label="Categories" value={d.system.categories} to="/categories" /></div>}
      <div className="grid2">
        <Card title="Tickets created, last 30 days"><TimeBars rows={d.overTime} /></Card>
        <Card title="Average time to resolve"><p className="bigno">{d.avgResolutionHours == null ? '—' : fmtAge(d.avgResolutionHours)}</p><p className="muted">Across all resolved tickets in scope. Open ticket ageing:</p><BarList rows={d.ageing} /></Card>
        <Card title="By category"><BarList rows={d.byCategory} /></Card><Card title="By status"><BarList rows={d.byStatus} /></Card>
        <Card title="By priority"><BarList rows={d.byPriority} /></Card><Card title="By department"><BarList rows={d.byDepartment} /></Card>
        <Card title="By staff member" action={<Link to="/reports?tab=workload">Workload</Link>}><BarList rows={d.byStaff} empty="No tickets are assigned yet" /></Card>
        <Card title="Needs attention" action={<Link to="/tickets?slaStatus=SLA Breached">Breached</Link>}><TicketTable items={d.recent.slice(0, 5)} role={r} /></Card>
      </div>
    </div>);
}
