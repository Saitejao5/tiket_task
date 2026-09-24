import { useEffect, useState } from 'react';
import useDebounce from '../../hooks/useDebounce';
import * as users from '../../services/users';
import * as cats from '../../services/categories';
import * as admin from '../../services/admin';
import { STATUSES, PRIORITIES, SLA_STATUSES, AGE_BUCKETS } from '../../utils/format';
export default function TicketFilters({ role, userId, values, onChange }) {
  const staff = role !== 'student', mgr = role === 'manager' || role === 'admin';
  const [categories, setCategories] = useState([]); const [depts, setDepts] = useState([]); const [people, setPeople] = useState([]);
  const [q, setQ] = useState(values.search || ''); const dq = useDebounce(q);
  useEffect(() => { cats.list().then(setCategories).catch(() => {}); if (mgr) { admin.departments.list().then(setDepts).catch(() => {}); users.list({ role: 'staff', limit: 100 }).then((d) => setPeople(d.items)).catch(() => {}); } }, [mgr]);
  useEffect(() => { if (dq !== (values.search || '')) onChange({ search: dq }); }, [dq]); // eslint-disable-line
  const sel = (key, label, opts, extra) => (
    <label className="filter"><span>{label}</span><select value={values[key] || ''} onChange={(e) => onChange({ [key]: e.target.value })}><option value="">All</option>{extra}{opts.map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select></label>
  );
  const active = Object.keys(values).some((k) => values[k] && !['page'].includes(k));
  return (
    <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
      <label className="filter grow"><span>Search</span><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={staff ? 'Ticket number, student, subject…' : 'Ticket number or subject…'} /></label>
      {sel('status', 'Status', STATUSES.map((s) => [s, s]))}
      {sel('priority', 'Priority', PRIORITIES.map((s) => [s, s]))}
      {sel('category', 'Category', categories.map((c) => [c._id, c.name]))}
      {staff && sel('slaStatus', 'SLA', SLA_STATUSES.map((s) => [s, s]))}
      {staff && sel('age', 'Age', AGE_BUCKETS)}
      {mgr && sel('department', 'Department', depts.map((d) => [d._id, d.name]))}
      {staff && sel('assignedTo', 'Assigned to', [...(mgr ? people.map((p) => [p._id, p.name]) : [])], <><option value={userId}>Me</option>{mgr && <><option value="unassigned">Unassigned</option><option value="inactive">Inactive staff</option></>}</>)}
      <label className="filter"><span>From</span><input type="date" value={values.from || ''} onChange={(e) => onChange({ from: e.target.value })} /></label>
      <label className="filter"><span>To</span><input type="date" value={values.to || ''} onChange={(e) => onChange({ to: e.target.value })} /></label>
      {active && <button type="button" className="btn sm" onClick={() => { setQ(''); onChange({ reset: true }); }}>Clear filters</button>}
    </form>
  );
}
