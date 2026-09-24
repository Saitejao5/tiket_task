import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../services/api';
import * as admin from '../services/admin';
import { Field } from '../components/ui';
const DEMO = [['Student', 'student1@college.edu'], ['Staff', 'staff1@college.edu'], ['Manager', 'manager1@college.edu'], ['Admin', 'admin@college.edu']];
export default function Login() {
  const { user, login, register } = useAuth(); const nav = useNavigate();
  const [mode, setMode] = useState('login'); const [f, setF] = useState({ email: '', password: '', name: '', studentId: '', department: '', course: '', year: '', section: '' });
  const [depts, setDepts] = useState([]); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { if (mode === 'register') admin.departments.list().then(setDepts).catch(() => {}); }, [mode]);
  if (user) return <Navigate to="/" replace />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => { e.preventDefault(); if (busy) return; setBusy(true); setErr(''); try { mode === 'login' ? await login({ email: f.email, password: f.password }) : await register(f); nav('/'); } catch (er) { setErr(errMsg(er)); setBusy(false); } };
  return (
    <div className="login">
      <div className="login-art"><h1>Campus Desk</h1><p>One place to raise a request, follow its progress, and get it resolved — fees, attendance, certificates, exams and more.</p></div>
      <form className="login-card" onSubmit={submit}>
        <h2>{mode === 'login' ? 'Sign in' : 'Create a student account'}</h2>
        {err && <div className="errorbox" role="alert">{err}</div>}
        {mode === 'register' && <><Field label="Full name"><input required value={f.name} onChange={set('name')} autoComplete="name" /></Field><Field label="Student ID"><input required value={f.studentId} onChange={set('studentId')} /></Field><Field label="Department"><select value={f.department} onChange={set('department')}><option value="">Select…</option>{depts.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></Field><div className="grid3"><Field label="Course"><input value={f.course} onChange={set('course')} /></Field><Field label="Year"><input value={f.year} onChange={set('year')} /></Field><Field label="Section"><input value={f.section} onChange={set('section')} /></Field></div></>}
        <Field label="Email"><input type="email" required value={f.email} onChange={set('email')} autoComplete="username" /></Field>
        <Field label="Password" hint={mode === 'register' ? 'At least 8 characters' : undefined}><input type="password" required minLength={mode === 'register' ? 8 : 1} value={f.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></Field>
        <button className="btn primary block" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        <button type="button" className="link center" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>{mode === 'login' ? 'New student? Create an account' : 'Already have an account? Sign in'}</button>
        {import.meta.env.DEV && mode === 'login' && <div className="demo"><small>Development demo accounts (password: Password@123)</small><div className="row wrap">{DEMO.map(([l, e]) => <button type="button" key={e} className="btn sm" onClick={() => setF({ ...f, email: e, password: 'Password@123' })}>{l}</button>)}</div></div>}
      </form>
    </div>
  );
}
