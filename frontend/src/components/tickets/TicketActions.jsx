import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../services/tickets';
import * as users from '../../services/users';
import { errMsg } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Card, Confirm, Modal, Field } from '../ui';
import { PRIORITIES } from '../../utils/format';
export default function TicketActions({ ticket: t, user, onChanged }) {
  const toast = useToast(); const nav = useNavigate(); const c = t.capabilities; const staff = user.role !== 'student';
  const [busy, setBusy] = useState(false); const [people, setPeople] = useState([]); const [pick, setPick] = useState(''); const [dlg, setDlg] = useState(null); const [reason, setReason] = useState('');
  useEffect(() => { if (c.assign) users.list({ role: 'staff', active: 'true', limit: 100, department: t.department?._id }).then((d) => setPeople(d.items)).catch(() => {}); }, [c.assign, t.department?._id]);
  const run = async (fn, msg) => { setBusy(true); try { const r = await fn(); toast(msg); setDlg(null); setReason(''); onChanged(r); } catch (e) { toast(errMsg(e), 'error'); } finally { setBusy(false); } };
  const moves = t.allowedTransitions.filter((s) => !['Closed', 'Reopened'].includes(s));
  if (!staff && !c.close && !c.reopen) return null;
  return (
    <Card title="Actions">
      <div className="stack">
        {staff && moves.length > 0 && <div><span className="lbl">Change status</span><div className="row wrap">{moves.map((s) => <button key={s} className="btn sm" disabled={busy} onClick={() => run(() => api.setStatus(t._id, s), `Status changed to ${s}`)}>Move to {s}</button>)}</div></div>}
        {staff && c.changePriority && !['Resolved', 'Closed'].includes(t.status) && <Field label="Priority"><select value={t.priority} disabled={busy} onChange={(e) => run(() => api.setPriority(t._id, e.target.value), 'Priority updated')}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></Field>}
        {c.assign && <div><Field label={t.assignedTo ? 'Reassign to' : 'Assign to'} hint={t.assignedInactive ? 'The current assignee is inactive. Please reassign.' : undefined}><select value={pick} onChange={(e) => setPick(e.target.value)}><option value="">Select a team member…</option>{people.filter((p) => p._id !== t.assignedTo?._id).map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select></Field><button className="btn primary sm" disabled={!pick || busy} onClick={() => run(() => api.assign(t._id, pick), 'Ticket assigned').then(() => setPick(''))}>{t.assignedTo ? 'Reassign' : 'Assign'}</button></div>}
        <div className="row wrap">
          {c.close && <button className="btn primary" disabled={busy} onClick={() => setDlg('close')}>{staff ? 'Close ticket' : 'Confirm resolved and close'}</button>}
          {c.reopen && <button className="btn" disabled={busy} onClick={() => setDlg('reopen')}>Reopen ticket</button>}
          {c.delete && <button className="btn danger" onClick={() => setDlg('delete')}>Delete ticket</button>}
        </div>
      </div>
      {dlg === 'close' && <Confirm title="Close this ticket?" message="Closing tells the support team the issue is resolved. You can reopen it later within the allowed period." confirmLabel="Close ticket" busy={busy} onCancel={() => setDlg(null)} onConfirm={() => run(() => api.close(t._id), 'Ticket closed')} />}
      {dlg === 'delete' && <Confirm danger title="Delete this ticket permanently?" message={`${t.ticketNumber} and its messages will be removed. The audit log keeps a record of the deletion.`} confirmLabel="Delete ticket" busy={busy} onCancel={() => setDlg(null)} onConfirm={async () => { setBusy(true); try { await api.remove(t._id); toast('Ticket deleted'); nav('/tickets'); } catch (e) { toast(errMsg(e), 'error'); setBusy(false); } }} />}
      {dlg === 'reopen' && <Modal title="Reopen this ticket" onClose={() => setDlg(null)}><Field label="What still needs attention? (optional)"><textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></Field><div className="row end"><button className="btn" onClick={() => setDlg(null)}>Cancel</button><button className="btn primary" disabled={busy} onClick={() => run(() => api.reopen(t._id, reason), 'Ticket reopened')}>{busy ? 'Reopening…' : 'Reopen ticket'}</button></div></Modal>}
    </Card>
  );
}
