import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge, SlaBadge, Empty } from '../ui';
import { fromNow, fmtAge, fmtDay } from '../../utils/format';
export default function TicketTable({ items, role, showCreated, emptyHint }) {
  const staff = role !== 'student', mgr = role === 'manager' || role === 'admin';
  if (!items.length) return <Empty title="No tickets found" hint={emptyHint || (staff ? 'Try clearing a filter, or check back when new requests arrive.' : 'Create a new request and it will appear here.')}>{!staff && <Link className="btn primary" to="/tickets/new">Create a request</Link>}</Empty>;
  return (
    <div className="table-wrap"><table className="tbl">
      <thead><tr><th>Ticket</th>{staff && <th>Student</th>}<th>Subject</th>{!staff && <th className="hide-sm">Category</th>}<th>Priority</th><th>Status</th>{staff && <th className="hide-sm">Age</th>}{staff && <th className="hide-sm">SLA</th>}{mgr && <th className="hide-md">Assigned to</th>}<th className="hide-sm">{showCreated ? 'Created' : 'Updated'}</th></tr></thead>
      <tbody>{items.map((t) => (
        <tr key={t._id}>
          <td><Link to={`/tickets/${t._id}`} className="tnum">{t.ticketNumber}</Link></td>
          {staff && <td>{t.student?.name}<small className="block muted">{t.student?.studentId}</small></td>}
          <td className="subj"><Link to={`/tickets/${t._id}`}>{t.subject}</Link></td>
          {!staff && <td className="hide-sm">{t.category?.name}</td>}
          <td><PriorityBadge priority={t.priority} /></td><td><StatusBadge status={t.status} /></td>
          {staff && <td className="hide-sm">{fmtAge(t.ageHours)}</td>}{staff && <td className="hide-sm"><SlaBadge status={t.slaStatus} /></td>}
          {mgr && <td className="hide-md">{t.assignedTo ? <>{t.assignedTo.name}{t.assignedInactive && <span className="badge warnb">Inactive</span>}</> : <span className="muted">Unassigned</span>}</td>}
          <td className="hide-sm" title={t.updatedAt}>{showCreated ? fmtDay(t.createdAt) : fromNow(t.lastActivityAt)}</td>
        </tr>))}</tbody>
    </table></div>
  );
}
