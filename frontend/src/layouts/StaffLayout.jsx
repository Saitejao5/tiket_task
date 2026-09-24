import Shell from '../components/layout/Shell';
const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/tickets', label: 'Tickets' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/profile', label: 'Profile' },
];
export default function StaffLayout() { return <Shell nav={nav} roleLabel="Support staff" />; }
