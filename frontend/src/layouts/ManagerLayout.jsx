import Shell from '../components/layout/Shell';
const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/tickets', label: 'Department tickets' },
  { to: '/reports?tab=workload', label: 'Staff workload', tab: 'workload' },
  { to: '/reports?tab=sla', label: 'SLA monitoring', tab: 'sla' },
  { to: '/reports', label: 'Reports', tab: 'summary' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/profile', label: 'Profile' },
];
export default function ManagerLayout() { return <Shell nav={nav} roleLabel="Manager" />; }
