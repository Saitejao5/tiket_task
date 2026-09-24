import { useEffect, useState } from 'react';
import CrudPage from '../components/common/CrudPage';
import * as cats from '../services/categories';
import * as admin from '../services/admin';
import { PRIORITIES } from '../utils/format';
export default function Categories() {
  const [depts, setDepts] = useState([]); const [slas, setSlas] = useState([]);
  useEffect(() => { admin.departments.list().then(setDepts).catch(() => {}); admin.slaPolicies.list().then(setSlas).catch(() => {}); }, []);
  return <CrudPage title="Categories" noun="Category" api={cats} blank={{ name: '', description: '', department: '', subcategories: '', defaultPriority: 'Medium', slaPolicy: '' }}
    columns={[{ label: 'Name', key: 'name' }, { label: 'Subcategories', render: (r) => r.subcategories?.join(', ') || '—' }, { label: 'Default priority', key: 'defaultPriority' }, { label: 'Department', render: (r) => r.department?.name || 'All' }]}
    toForm={(r) => ({ name: r.name, description: r.description || '', department: r.department?._id || '', subcategories: (r.subcategories || []).join('\n'), defaultPriority: r.defaultPriority, slaPolicy: r.slaPolicy?._id || '' })}
    toPayload={(f) => ({ name: f.name, description: f.description, department: f.department || null, slaPolicy: f.slaPolicy || null, defaultPriority: f.defaultPriority, subcategories: f.subcategories.split('\n').map((s) => s.trim()).filter(Boolean) })}
    fields={(f, set, Field) => <><Field label="Name"><input required value={f.name || ''} onChange={set('name')} /></Field><Field label="Description"><input value={f.description || ''} onChange={set('description')} /></Field>
      <Field label="Subcategories" hint="One per line"><textarea rows={5} value={f.subcategories || ''} onChange={set('subcategories')} /></Field>
      <div className="grid2"><Field label="Default priority"><select value={f.defaultPriority} onChange={set('defaultPriority')}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></Field><Field label="Department" hint="Leave empty for all departments"><select value={f.department || ''} onChange={set('department')}><option value="">All departments</option>{depts.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}</select></Field></div>
      <Field label="Specific SLA policy" hint="Used when its priority matches the ticket priority"><select value={f.slaPolicy || ''} onChange={set('slaPolicy')}><option value="">Default policy for the priority</option>{slas.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select></Field></>} />;
}
