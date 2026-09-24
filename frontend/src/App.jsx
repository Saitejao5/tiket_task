import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Skeleton } from './components/ui';
import StudentLayout from './layouts/StudentLayout';
import StaffLayout from './layouts/StaffLayout';
import ManagerLayout from './layouts/ManagerLayout';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import TicketDetails from './pages/TicketDetails';
import CreateTicket from './pages/CreateTicket';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Users from './pages/Users';
import Categories from './pages/Categories';
import Departments from './pages/Departments';
import SlaPolicies from './pages/SlaPolicies';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
const LAYOUTS = { student: StudentLayout, staff: StaffLayout, manager: ManagerLayout, admin: AdminLayout };
const Guard = ({ roles, children }) => { const { user } = useAuth(); return roles.includes(user.role) ? children : <Navigate to="/" replace />; };
export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page"><Skeleton rows={5} h={28} /></div>;
  if (!user) return <Routes><Route path="/login" element={<Login />} /><Route path="*" element={<Navigate to="/login" replace />} /></Routes>;
  const Layout = LAYOUTS[user.role];
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="tickets/new" element={<Guard roles={['student']}><CreateTicket /></Guard>} />
        <Route path="tickets/:id" element={<TicketDetails />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        <Route path="reports" element={<Guard roles={['manager', 'admin']}><Reports /></Guard>} />
        <Route path="audit-logs" element={<Guard roles={['admin']}><AuditLogs /></Guard>} />
        <Route path="users" element={<Guard roles={['admin']}><Users /></Guard>} />
        <Route path="departments" element={<Guard roles={['admin']}><Departments /></Guard>} />
        <Route path="categories" element={<Guard roles={['admin']}><Categories /></Guard>} />
        <Route path="sla-policies" element={<Guard roles={['admin']}><SlaPolicies /></Guard>} />
        <Route path="settings" element={<Guard roles={['admin']}><Settings /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
