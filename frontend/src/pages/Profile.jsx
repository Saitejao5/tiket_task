import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as auth from '../services/auth';
import { errMsg } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card, Field } from '../components/ui';
export default function Profile() {
  const { user, refresh } = useAuth(); const toast = useToast(); const student = user.role === 'student';
  const [f, setF] = useState({ name: user.name, course: user.course || '', year: user.year || '', section: user.section || '', currentPassword: '', newPassword: '' }); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => { e.preventDefault(); setBusy(true); setErr(''); const b = { name: f.name, ...(student ? { course: f.course, year: f.year, section: f.section } : {}), ...(f.newPassword ? { currentPassword: f.currentPassword, newPassword: f.newPassword } : {}) }; try { await auth.updateMe(b); await refresh(); toast('Profile updated'); setF({ ...f, currentPassword: '', newPassword: '' }); } catch (er) { setErr(errMsg(er)); } finally { setBusy(false); } };
  return (
    <div className="page narrow"><h1>Profile</h1>
      <Card><dl className="dl"><dt>Email</dt><dd>{user.email}</dd><dt>Role</dt><dd>{user.role}</dd>{user.studentId && <><dt>Student ID</dt><dd>{user.studentId}</dd></>}<dt>Department</dt><dd>{user.department?.name || '—'}</dd></dl></Card>
      <Card title="Edit details"><form className="stack" onSubmit={submit}>{err && <div className="errorbox" role="alert">{err}</div>}
        <Field label="Full name"><input required value={f.name} onChange={set('name')} /></Field>
        {student && <div className="grid3"><Field label="Course"><input value={f.course} onChange={set('course')} /></Field><Field label="Year"><input value={f.year} onChange={set('year')} /></Field><Field label="Section"><input value={f.section} onChange={set('section')} /></Field></div>}
        <div className="grid2"><Field label="Current password"><input type="password" value={f.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" /></Field><Field label="New password" hint="Leave blank to keep your password"><input type="password" minLength={8} value={f.newPassword} onChange={set('newPassword')} autoComplete="new-password" /></Field></div>
        <div className="row end"><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div></form></Card>
    </div>);
}
