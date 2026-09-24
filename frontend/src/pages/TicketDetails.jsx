import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import * as tickets from '../services/tickets';
import * as messages from '../services/messages';
import { Card, Skeleton, ErrorBox, StatusBadge, PriorityBadge, SlaBadge } from '../components/ui';
import { Conversation, ReplyBox } from '../components/tickets/Conversation';
import Timeline from '../components/tickets/Timeline';
import TicketActions from '../components/tickets/TicketActions';
import { fmtDate, fmtAge } from '../utils/format';
export default function TicketDetails() {
  const { id } = useParams(); const { user } = useAuth(); const staff = user.role !== 'student';
  const { data, loading, error, reload } = useFetch(() => Promise.all([tickets.get(id), messages.list(id), tickets.history(id)]), [id, user._id]);
  if (loading && !data) return <div className="page"><Skeleton rows={8} h={22} /></div>;
  if (error && !data) return <div className="page"><ErrorBox message={error} onRetry={reload} /><p><Link to="/tickets">Back to tickets</Link></p></div>;
  const [t, msgs, hist] = data; const s = t.student;
  return (
    <div className="page"><p className="crumb"><Link to="/tickets">← Tickets</Link></p>
      <header className="thead"><div><span className="tnum big">{t.ticketNumber}</span><h1>{t.subject}</h1></div><div className="row wrap"><StatusBadge status={t.status} /><PriorityBadge priority={t.priority} urgentRequested={staff && t.requestedUrgent} /><SlaBadge status={t.slaStatus} /></div></header>
      <div className="twocol">
        <div className="stack">
          <Card title="Request"><p className="pre">{t.description}</p></Card>
          <Card title="Conversation" className={loading ? 'dim' : ''}><Conversation items={msgs} userId={user._id} /><ReplyBox ticket={t} isStaff={staff} send={(fd) => messages.send(t._id, fd)} onSent={reload} /></Card>
          <Card title="Activity history"><Timeline items={hist} isStudent={!staff} /></Card>
        </div>
        <div className="stack">
          <TicketActions ticket={t} user={user} onChanged={reload} />
          <Card title="Details"><dl className="dl">
            <dt>Category</dt><dd>{t.category?.name}{t.subcategory ? ` · ${t.subcategory}` : ''}</dd>
            <dt>Assigned to</dt><dd>{t.assignedTo ? <>{t.assignedTo.name}{t.assignedInactive && <span className="badge warnb">Inactive</span>}</> : 'Not assigned yet'}</dd>
            <dt>Created</dt><dd>{fmtDate(t.createdAt)}</dd><dt>Last updated</dt><dd>{fmtDate(t.lastActivityAt)}</dd>
            <dt>{t.resolvedAt ? 'Time to resolve' : 'Age'}</dt><dd>{fmtAge(t.ageHours)}</dd>
            {staff && <><dt>First response due</dt><dd>{fmtDate(t.firstResponseDue)}{t.firstResponseAt && <small className="block muted">Responded {fmtDate(t.firstResponseAt)}</small>}</dd><dt>Resolution due</dt><dd>{fmtDate(t.resolutionDue)}{t.resolvedAt && <small className="block muted">Resolved {fmtDate(t.resolvedAt)}</small>}</dd></>}
          </dl></Card>
          <Card title="Student"><dl className="dl"><dt>Name</dt><dd>{s?.name}</dd><dt>Student ID</dt><dd>{s?.studentId}</dd><dt>Department</dt><dd>{s?.department?.name || '—'}</dd><dt>Course</dt><dd>{s?.course || '—'}</dd><dt>Year</dt><dd>{s?.year || '—'}</dd><dt>Section</dt><dd>{s?.section || '—'}</dd></dl></Card>
        </div>
      </div>
    </div>
  );
}
