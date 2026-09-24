import { Link } from 'react-router-dom';
export const StatCard = ({ label, value, to, tone, note }) => {
  const inner = <><span className="stat-v">{value ?? '—'}</span><span className="stat-l">{label}</span>{note && <small>{note}</small>}</>;
  return to ? <Link to={to} className={`stat ${tone || ''}`}>{inner}</Link> : <div className={`stat ${tone || ''}`}>{inner}</div>;
};
export const BarList = ({ rows = [], empty = 'No data yet' }) => {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (!rows.length) return <p className="muted">{empty}</p>;
  return <ul className="bars">{rows.map((r) => <li key={r.label}><span className="bl">{r.label}</span><span className="bt"><span style={{ width: `${(r.count / max) * 100}%` }} /></span><b>{r.count}</b></li>)}</ul>;
};
export const TimeBars = ({ rows = [] }) => {
  const max = Math.max(1, ...rows.map((r) => r.count)); const total = rows.reduce((a, r) => a + r.count, 0);
  return (<div><div className="timebars" role="img" aria-label={`Tickets created per day over the last 30 days, ${total} in total`}>{rows.map((r) => <span key={r.label} title={`${r.label}: ${r.count}`} style={{ height: `${Math.max(4, (r.count / max) * 100)}%` }} className={r.count ? 'has' : ''} />)}</div><div className="row between muted"><small>{rows[0]?.label}</small><small>{total} tickets in 30 days</small><small>{rows[rows.length - 1]?.label}</small></div></div>);
};
