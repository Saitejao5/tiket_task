import CrudPage from '../components/common/CrudPage';
import * as admin from '../services/admin';
import { PRIORITIES } from '../utils/format';
export default function SlaPolicies() {
  return <CrudPage title="SLA policies" noun="SLA policy" api={admin.slaPolicies} blank={{ name: '', priority: 'Medium', firstResponseHours: 12, resolutionHours: 48 }}
    columns={[{ label: 'Name', key: 'name' }, { label: 'Priority', key: 'priority' }, { label: 'First response', render: (r) => `${r.firstResponseHours} h` }, { label: 'Resolution', render: (r) => `${r.resolutionHours} h` }]}
    fields={(f, set, Field) => <><Field label="Name"><input required value={f.name || ''} onChange={set('name')} /></Field><Field label="Priority"><select value={f.priority} onChange={set('priority')}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></Field><div className="grid2"><Field label="First response (hours)"><input type="number" min="0.1" step="0.1" required value={f.firstResponseHours} onChange={set('firstResponseHours')} /></Field><Field label="Resolution (hours)"><input type="number" min="0.1" step="0.1" required value={f.resolutionHours} onChange={set('resolutionHours')} /></Field></div><p className="hint">New policies apply to tickets created or re-prioritised afterwards. Existing tickets keep their stored deadlines.</p></>}
    toPayload={(f) => ({ name: f.name, priority: f.priority, firstResponseHours: Number(f.firstResponseHours), resolutionHours: Number(f.resolutionHours) })} />;
}
