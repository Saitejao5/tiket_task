import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as notifApi from '../../services/notifications';
export default function Shell({ nav, roleLabel }) {
  const { user, logout } = useAuth(); const [open, setOpen] = useState(false); const [unread, setUnread] = useState(0); const loc = useLocation(); const tab = new URLSearchParams(loc.search).get('tab') || 'summary';
  useEffect(() => setOpen(false), [loc.pathname, loc.search]);
  useEffect(() => { let on = true; const f = () => notifApi.list({ limit: 1 }).then((d) => on && setUnread(d.unread)).catch(() => {}); f(); const t = setInterval(f, 30000); window.addEventListener('notif-changed', f); return () => { on = false; clearInterval(t); window.removeEventListener('notif-changed', f); }; }, [loc.pathname, user._id]);
  return (
    <div className="shell">
      <a href="#main" className="skip">Skip to content</a>
      <aside className={`side ${open ? 'open' : ''}`} aria-label="Main navigation">
        <div className="brand"><span className="logo" aria-hidden="true">▤</span><div><b>Campus Desk</b><small>{roleLabel}</small></div></div>
        <nav>{nav.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => ((n.tab ? loc.pathname === '/reports' && tab === n.tab : isActive) ? 'on' : '')}>{n.label}{n.to === '/notifications' && unread > 0 && <em>{unread}</em>}</NavLink>)}</nav>
        <div className="side-foot"><div className="who"><b>{user.name}</b><small>{user.email}</small></div><button className="btn ghost" onClick={logout}>Sign out</button></div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="top">
          <button className="icon-btn menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>☰</button>
          <span className="top-title">Campus Desk</span>
          <Link to="/notifications" className="bell" aria-label={`Notifications, ${unread} unread`}>Notifications{unread > 0 && <em>{unread}</em>}</Link>
        </header>
        <main id="main" tabIndex="-1"><Outlet /></main>
      </div>
    </div>
  );
}
