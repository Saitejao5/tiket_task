import { useEffect, useRef } from 'react';
const slug = (s) => String(s).toLowerCase().replace(/\s+/g, '-');
export const StatusBadge = ({ status }) => <span className={`badge st-${slug(status)}`}><i aria-hidden="true" />{status}</span>;
export const PriorityBadge = ({ priority, urgentRequested }) => <span className={`badge pr-${slug(priority)}`}>{priority}{urgentRequested ? ' (urgent requested)' : ''}</span>;
export const SlaBadge = ({ status }) => <span className={`badge sla-${slug(status)}`}>{status === 'SLA Breached' ? '! ' : status === 'Due Soon' ? '◷ ' : '✓ '}{status}</span>;
export const Skeleton = ({ rows = 4, h = 18 }) => <div className="skeleton-wrap" aria-busy="true" aria-label="Loading">{Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton" style={{ height: h, width: `${100 - (i % 3) * 12}%` }} />)}</div>;
export const Empty = ({ title, hint, children }) => <div className="empty"><h3>{title}</h3>{hint && <p>{hint}</p>}{children}</div>;
export const ErrorBox = ({ message, onRetry }) => <div className="errorbox" role="alert"><span>{message}</span>{onRetry && <button className="btn sm" onClick={onRetry}>Try again</button>}</div>;
export const Card = ({ title, action, children, className = '' }) => <section className={`card ${className}`}>{(title || action) && <header className="card-h"><h2>{title}</h2>{action}</header>}{children}</section>;
export const Field = ({ label, hint, children, error }) => <label className="field"><span className="lbl">{label}</span>{children}{hint && <small>{hint}</small>}{error && <small className="err">{error}</small>}</label>;
export function Modal({ title, onClose, children, wide }) {
  const ref = useRef();
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', k); ref.current?.querySelector('input,select,textarea,button')?.focus(); return () => document.removeEventListener('keydown', k); }, [onClose]);
  return (<div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}><header><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close dialog">✕</button></header>{children}</div></div>);
}
export const Confirm = ({ title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel, busy }) => (
  <Modal title={title} onClose={onCancel}><p>{message}</p><div className="row end"><button className="btn" onClick={onCancel}>Cancel</button><button className={`btn ${danger ? 'danger' : 'primary'}`} disabled={busy} onClick={onConfirm}>{busy ? 'Working…' : confirmLabel}</button></div></Modal>
);
export const Pagination = ({ p, onPage }) => p && p.totalPages > 1 ? (
  <nav className="pager" aria-label="Pagination"><button className="btn sm" disabled={p.page <= 1} onClick={() => onPage(p.page - 1)}>Previous</button><span>Page {p.page} of {p.totalPages} · {p.total} results</span><button className="btn sm" disabled={p.page >= p.totalPages} onClick={() => onPage(p.page + 1)}>Next</button></nav>
) : p ? <div className="pager"><span>{p.total} result{p.total === 1 ? '' : 's'}</span></div> : null;
export const Tabs = ({ tabs, value, onChange }) => <div className="tabs" role="tablist">{tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={value === k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}>{l}</button>)}</div>;
