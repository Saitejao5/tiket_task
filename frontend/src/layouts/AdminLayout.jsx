import Shell from '../components/layout/Shell';
const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/tickets', label: 'Tickets' },
  { to: '/users', label: 'Users' },
  { to: '/departments', label: 'Departments' },
  { to: '/categories', label: 'Categories' },
  { to: '/sla-policies', label: 'SLA policies' },
  { to: '/reports', label: 'Reports', tab: 'summary' },
  { to: '/audit-logs', label: 'Audit logs' },
  { to: '/settings', label: 'System settings' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/profile', label: 'Profile' },
];
export default function AdminLayout() { return <Shell nav={nav} roleLabel="Administrator" />; }
