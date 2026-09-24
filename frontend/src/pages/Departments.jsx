import CrudPage from '../components/common/CrudPage';
import * as admin from '../services/admin';
export default function Departments() {
  return <CrudPage title="Departments" noun="Department" api={admin.departments} blank={{ name: '', code: '', description: '' }} columns={[{ label: 'Name', key: 'name' }, { label: 'Code', key: 'code' }, { label: 'Description', key: 'description' }]}
    fields={(f, set, Field) => <><Field label="Name"><input required value={f.name || ''} onChange={set('name')} /></Field><Field label="Code" hint="2–10 letters, e.g. CSE"><input required minLength={2} maxLength={10} value={f.code || ''} onChange={set('code')} /></Field><Field label="Description"><textarea rows={3} value={f.description || ''} onChange={set('description')} /></Field></>}
    toPayload={(f) => ({ name: f.name, code: f.code, description: f.description })} />;
}
