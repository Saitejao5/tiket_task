import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useFetch from '../hooks/useFetch';
import * as tickets from '../services/tickets';
import { Card, Skeleton, ErrorBox, Pagination } from '../components/ui';
import TicketTable from '../components/tickets/TicketTable';
import TicketFilters from '../components/tickets/TicketFilters';
export default function Tickets() {
  const { user } = useAuth(); const [sp, setSp] = useSearchParams(); const values = Object.fromEntries(sp.entries());
  const change = (patch) => { if (patch.reset) return setSp({}); const next = { ...values, ...patch }; if (!('page' in patch)) delete next.page; Object.keys(next).forEach((k) => !next[k] && delete next[k]); setSp(next); };
  const key = sp.toString(); const { data, loading, error, reload } = useFetch(() => tickets.list({ ...values, limit: 15 }), [key, user._id]);
  return (
    <div className="page"><h1>{user.role === 'student' ? 'My tickets' : user.role === 'staff' ? 'Tickets' : user.role === 'manager' ? 'Department tickets' : 'All tickets'}</h1>
      <Card><TicketFilters role={user.role} userId={user._id} values={values} onChange={change} /></Card>
      <Card className={loading && data ? 'dim' : ''}>{error ? <ErrorBox message={error} onRetry={reload} /> : !data ? <Skeleton rows={7} h={30} /> : <><TicketTable items={data.items} role={user.role} emptyHint={Object.keys(values).length ? 'No tickets match these filters. Clear a filter or change your search.' : undefined} /><Pagination p={data.pagination} onPage={(p) => change({ page: String(p) })} /></>}</Card>
    </div>);
}
