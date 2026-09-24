import { useState } from 'react';
import useFetch from '../../hooks/useFetch';
import { errMsg } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, Skeleton, ErrorBox, Empty, Modal, Field, Confirm } from '../ui';
// Generic admin list + create/edit dialog + deactivate/reactivate.
export default function CrudPage({ title, noun, api, columns, fields, blank, toForm = (r) => r, toPayload = (f) => f, deps = [] }) {
  const toast = useToast(); const { data, loading, error, reload } = useFetch(() => api.list(true), []); const [edit, setEdit] = useState(null); const [f, setF] = useState({}); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [confirm, setConfirm] = useState(null);
  const open = (row) => { setEdit(row || {}); setF(row ? toForm(row) : blank); setErr(''); };
  const save = async (e) => { e.preventDefault(); setBusy(true); setErr(''); try { edit._id ? await api.update(edit._id, toPayload(f)) : await api.create(toPayload(f)); toast(`${noun} saved`); setEdit(null); reload(); } catch (er) { setErr(errMsg(er)); } finally { setBusy(false); } };
  const toggle = async (row) => { setBusy(true); try { row.active ? await api.remove(row._id) : await api.update(row._id, { active: true }); toast(row.active ? `${noun} deactivated` : `${noun} reactivated`); setConfirm(null); reload(); } catch (er) { toast(errMsg(er), 'error'); } finally { setBusy(false); } };
  return (
    <div className="page"><div className="row between wrap"><h1>{title}</h1><button className="btn primary" onClick={() => open()}>Add {noun.toLowerCase()}</button></div>
      <Card>{error ? <ErrorBox message={error} onRetry={reload} /> : loading && !data ? <Skeleton rows={6} h={30} /> : !data.length ? <Empty title={`No ${title.toLowerCase()} found`} hint={`Add your first ${noun.toLowerCase()} to get started.`} /> :
        <div className="table-wrap"><table className="tbl"><thead><tr>{columns.map((c) => <th key={c.label}>{c.label}</th>)}<th>Status</th><th><span className="sr">Actions</span></th></tr></thead>
          <tbody>{data.map((r) => <tr key={r._id} className={r.active ? '' : 'inactive'}>{columns.map((c) => <td key={c.label}>{c.render ? c.render(r) : r[c.key]}</td>)}<td>{r.active ? 'Active' : 'Inactive'}</td><td className="actions"><button className="btn sm" onClick={() => open(r)}>Edit</button> <button className="btn sm" onClick={() => setConfirm(r)}>{r.active ? 'Deactivate' : 'Reactivate'}</button></td></tr>)}</tbody></table></div>}</Card>
      {edit && <Modal title={`${edit._id ? 'Edit' : 'Add'} ${noun.toLowerCase()}`} onClose={() => setEdit(null)}><form className="stack" onSubmit={save}>{err && <div className="errorbox" role="alert">{err}</div>}
        {fields(f, (k) => (e) => setF({ ...f, [k]: e.target.type === 'number' ? e.target.value : e.target.value }), Field, deps)}
        <div className="row end"><button type="button" className="btn" onClick={() => setEdit(null)}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div></form></Modal>}
      {confirm && <Confirm danger={confirm.active} title={`${confirm.active ? 'Deactivate' : 'Reactivate'} ${noun.toLowerCase()}?`} message={confirm.active ? 'Existing tickets keep their data. It will no longer be offered for new requests.' : 'It will be available again.'} confirmLabel={confirm.active ? 'Deactivate' : 'Reactivate'} busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => toggle(confirm)} />}
    </div>);
}
