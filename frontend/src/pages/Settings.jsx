import { useEffect, useState } from 'react';
import useFetch from '../hooks/useFetch';
import * as admin from '../services/admin';
import { errMsg } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card, Field, Skeleton, ErrorBox } from '../components/ui';
export default function Settings() {
  const toast = useToast(); const { data, loading, error, reload } = useFetch(() => admin.getSettings(), []); const [f, setF] = useState(null); const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setF({ reopenWindowDays: data.reopenWindowDays, dueSoonPercent: data.dueSoonPercent, pendingAlertThreshold: data.pendingAlertThreshold }); }, [data]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => { e.preventDefault(); setBusy(true); try { await admin.saveSettings(Object.fromEntries(Object.entries(f).map(([k, v]) => [k, Number(v)]))); toast('Settings saved'); reload(); } catch (er) { toast(errMsg(er), 'error'); } finally { setBusy(false); } };
  return (
    <div className="page narrow"><h1>System settings</h1>
      <Card>{error ? <ErrorBox message={error} onRetry={reload} /> : loading || !f ? <Skeleton rows={4} h={36} /> : <form className="stack" onSubmit={save}>
        <Field label="Reopening period for closed tickets (days)" hint="Students can reopen a closed ticket within this many days. Staff can always reopen."><input type="number" min="0" max="365" required value={f.reopenWindowDays} onChange={set('reopenWindowDays')} /></Field>
        <Field label="“Due soon” threshold (% of SLA time remaining)" hint="A ticket is flagged Due Soon when this share of its SLA window is left."><input type="number" min="1" max="90" required value={f.dueSoonPercent} onChange={set('dueSoonPercent')} /></Field>
        <Field label="Pending tickets alert threshold" hint="Managers are notified when a department has at least this many pending tickets."><input type="number" min="1" required value={f.pendingAlertThreshold} onChange={set('pendingAlertThreshold')} /></Field>
        <div className="row end"><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button></div></form>}</Card>
    </div>);
}
