import { useEffect, useState } from 'react';
import useFetch from '../hooks/useFetch';
import useDebounce from '../hooks/useDebounce';
import * as users from '../services/users';
import * as admin from '../services/admin';
import { errMsg } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card, Skeleton, ErrorBox, Empty, Modal, Field, Confirm, Pagination, Tabs } from '../components/ui';
const TABS = [['student', 'Students'], ['staff', 'Staff'], ['manager', 'Managers'], ['admin', 'Administrators']];
const BLANK = { name: '', email: '', password: '', role: 'student', studentId: '', department: '', course: '', year: '', section: '' };
export default function Users() {
  const { user: me } = useAuth(); const toast = useToast(); const [role, setRole] = useState('student'); const [q, setQ] = useState(''); const dq = useDebounce(q); const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => users.list({ role, search: dq, page, limit: 15 }), [role, dq, page]);
  const [depts, setDepts] = useState([]); const [deptLoading, setDeptLoading] = useState(false); const [deptError, setDeptError] = useState(''); const [edit, setEdit] = useState(null); const [f, setF] = useState(BLANK); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [confirm, setConfirm] = useState(null);
  useEffect(() => setPage(1), [role, dq]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const loadDepartments = async () => {
    setDeptLoading(true); setDeptError('');
    try { setDepts(await admin.departments.list()); } catch (er) { setDeptError(errMsg(er)); } finally { setDeptLoading(false); }
  };
  const open = (u) => { setEdit(u || {}); setErr(''); setF(u ? { ...BLANK, ...u, department: u.department?._id || u.department || '', password: '' } : { ...BLANK, role }); loadDepartments(); };
  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    const b = { name: f.name, email: f.email, role: f.role, department: f.department || (edit._id ? '' : undefined), course: f.course, year: f.year, section: f.section, ...(f.role === 'student' ? { studentId: f.studentId } : {}), ...(f.password ? { password: f.password } : {}) };
    try { edit._id ? await users.update(edit._id, b) : await users.create(b); toast('User saved'); setEdit(null); reload(); } catch (er) { setErr(errMsg(er)); } finally { setBusy(false); }
  };
  const toggle = async (u) => { setBusy(true); try { await users.update(u._id, { active: !u.active }); toast(u.active ? 'User deactivated' : 'User activated'); setConfirm(null); reload(); } catch (er) { toast(errMsg(er), 'error'); setConfirm(null); } finally { setBusy(false); } };
  return (
    <div className="page"><div className="row between wrap"><h1>Users</h1><button className="btn primary" onClick={() => open()}>Add user</button></div>
      <Tabs tabs={TABS} value={role} onChange={setRole} />
      <Card><label className="filter grow"><span>Search</span><input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email or student ID" /></label>
        {error ? <ErrorBox message={error} onRetry={reload} /> : loading && !data ? <Skeleton rows={6} h={30} /> : !data.items.length ? <Empty title="No users found" hint="Try a different search or add a new user." /> : <>
          <div className="table-wrap"><table className="tbl"><thead><tr><th>Name</th><th>Email</th>{role === 'student' && <th className="hide-sm">Student ID</th>}<th className="hide-sm">Department</th><th>Status</th><th><span className="sr">Actions</span></th></tr></thead>
            <tbody>{data.items.map((u) => <tr key={u._id} className={u.active ? '' : 'inactive'}><td>{u.name}</td><td>{u.email}</td>{role === 'student' && <td className="hide-sm">{u.studentId}</td>}<td className="hide-sm">{u.department?.name || '—'}</td><td>{u.active ? 'Active' : 'Inactive'}</td><td className="actions"><button className="btn sm" onClick={() => open(u)}>Edit</button> {u._id !== me._id && <button className="btn sm" onClick={() => setConfirm(u)}>{u.active ? 'Deactivate' : 'Activate'}</button>}</td></tr>)}</tbody></table></div>
          <Pagination p={data.pagination} onPage={setPage} /></>}</Card>
      {edit && <Modal title={edit._id ? 'Edit user' : 'Add user'} onClose={() => setEdit(null)}><form className="stack" onSubmit={save}>{err && <div className="errorbox" role="alert">{err}</div>}
        <div className="grid2"><Field label="Full name"><input required value={f.name} onChange={set('name')} /></Field><Field label="Email"><input type="email" required value={f.email} onChange={set('email')} /></Field></div>
        <div className="grid2"><Field label="Role"><select value={f.role} onChange={set('role')} disabled={edit._id === me._id}>{TABS.map(([k, l]) => <option key={k} value={k}>{l.replace(/s$/, '')}</option>)}</select></Field><Field label="Department" hint={deptError || (deptLoading ? 'Loading departments...' : '')}><select value={f.department} onChange={set('department')} disabled={deptLoading}><option value="">None</option>{depts.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select>{deptError && <button type="button" className="btn sm" onClick={loadDepartments}>Retry</button>}</Field></div>
        {f.role === 'student' && <><Field label="Student ID"><input required value={f.studentId || ''} onChange={set('studentId')} /></Field><div className="grid3"><Field label="Course"><input value={f.course || ''} onChange={set('course')} /></Field><Field label="Year"><input value={f.year || ''} onChange={set('year')} /></Field><Field label="Section"><input value={f.section || ''} onChange={set('section')} /></Field></div></>}
        <Field label={edit._id ? 'Reset password' : 'Password'} hint={edit._id ? 'Leave blank to keep the current password' : 'At least 8 characters'}><input type="password" minLength={8} required={!edit._id} value={f.password} onChange={set('password')} autoComplete="new-password" /></Field>
        <div className="row end"><button type="button" className="btn" onClick={() => setEdit(null)}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div></form></Modal>}
      {confirm && <Confirm danger={confirm.active} title={`${confirm.active ? 'Deactivate' : 'Activate'} ${confirm.name}?`} message={confirm.active ? 'They will no longer be able to sign in. Tickets assigned to them stay in place and can be reassigned by a manager.' : 'They will be able to sign in again.'} confirmLabel={confirm.active ? 'Deactivate' : 'Activate'} busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => toggle(confirm)} />}
    </div>);
}
