import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as tickets from '../services/tickets';
import * as cats from '../services/categories';
import { errMsg } from '../services/api';
import useFetch from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import { Card, Field, Skeleton, ErrorBox } from '../components/ui';
import { fmtSize } from '../utils/format';
export default function CreateTicket() {
  const nav = useNavigate(); const toast = useToast(); const { data: categories, loading, error, reload } = useFetch(() => cats.list(), []);
  const [f, setF] = useState({ category: '', subcategory: '', subject: '', description: '', priority: 'Normal' }); const [files, setFiles] = useState([]); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const cat = categories?.find((c) => c._id === f.category); const set = (k) => (e) => setF({ ...f, [k]: e.target.value, ...(k === 'category' ? { subcategory: '' } : {}) });
  const pick = (e) => { const list = [...e.target.files]; if (list.length > 5) toast('You can attach up to 5 files.', 'error'); setFiles(list.slice(0, 5)); e.target.value = ''; };
  const submit = async (e) => {
    e.preventDefault(); if (busy) return; setBusy(true); setErr('');
    const fd = new FormData(); Object.entries(f).forEach(([k, v]) => v && fd.append(k, v)); files.forEach((x) => fd.append('attachments', x));
    try { const t = await tickets.create(fd); toast(`Request ${t.ticketNumber} submitted`); nav(`/tickets/${t._id}`); } catch (er) { setErr(errMsg(er)); setBusy(false); }
  };
  return (
    <div className="page narrow"><h1>New support request</h1>
      {loading ? <Skeleton rows={6} /> : error ? <ErrorBox message={error} onRetry={reload} /> : (
        <Card><form onSubmit={submit} className="stack">
          {err && <div className="errorbox" role="alert">{err}</div>}
          <div className="grid2">
            <Field label="Category *"><select required value={f.category} onChange={set('category')}><option value="">Select a category…</option>{categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></Field>
            <Field label="Subcategory"><select value={f.subcategory} onChange={set('subcategory')} disabled={!cat?.subcategories?.length}><option value="">{cat?.subcategories?.length ? 'Select…' : 'Not applicable'}</option>{cat?.subcategories?.map((s) => <option key={s}>{s}</option>)}</select></Field>
          </div>
          <Field label="Subject *"><input required minLength={3} maxLength={200} value={f.subject} onChange={set('subject')} placeholder="Summarise the issue in one line" /></Field>
          <Field label="Description *"><textarea required rows={6} value={f.description} onChange={set('description')} placeholder="What happened, when, and what outcome do you need?" /></Field>
          <Field label="Priority" hint="Choose Urgent only if the issue is time-critical. Support staff make the final decision on priority."><select value={f.priority} onChange={set('priority')}><option>Normal</option><option>Urgent</option></select></Field>
          <div><label className="btn sm filebtn">Attach files<input type="file" multiple hidden accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={pick} /></label><small className="muted"> PDF, JPG, PNG, DOC, DOCX · up to 5 files, 10 MB each</small>
            {files.length > 0 && <ul className="files">{files.map((x, i) => <li key={i}>{x.name} <small>{fmtSize(x.size)}</small> <button type="button" className="link" onClick={() => setFiles(files.filter((_, j) => j !== i))}>Remove</button></li>)}</ul>}</div>
          <div className="row end"><button type="button" className="btn" onClick={() => nav(-1)}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? (files.length ? 'Uploading and submitting…' : 'Submitting…') : 'Submit request'}</button></div>
        </form></Card>)}
    </div>
  );
}
