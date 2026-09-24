import Shell from '../components/layout/Shell';
const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/tickets', label: 'My tickets', end: true },
  { to: '/tickets/new', label: 'New request' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/profile', label: 'Profile' },
];
export default function StudentLayout() { return <Shell nav={nav} roleLabel="Student support" />; }
