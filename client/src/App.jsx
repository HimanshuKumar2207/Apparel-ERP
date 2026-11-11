import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './app/AuthContext';
import AppShell from './components/layout/AppShell';
import ResourcePage from './components/resource/ResourcePage';
import { Spinner } from './components/ui/Misc';
import { adminsConfig } from './config/resources/admins';
import { attendanceConfig } from './config/resources/attendance';
import { auditConfig } from './config/resources/audit';
import { bookingsConfig } from './config/resources/bookings';
import { brandsConfig, subBrandsConfig } from './config/resources/brands';
import { employeesConfig } from './config/resources/employees';
import { paymentsConfig } from './config/resources/finance';
import { invoicesConfig } from './config/resources/invoices';
import { partiesConfig } from './config/resources/parties';
import { productsConfig } from './config/resources/products';
import { salaryConfig } from './config/resources/salary';
import { targetsConfig } from './config/resources/targets';
import ChangePasswordPage from './pages/ChangePasswordPage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import { Forbidden, NotFound } from './pages/NotFound';
import ReportsPage from './pages/ReportsPage';
import SecurityPage from './pages/SecurityPage';

// Every CRUD screen is just a config; add a module = add a config + one line here.
const RESOURCES = [
  ['/bookings', bookingsConfig], ['/targets', targetsConfig], ['/parties', partiesConfig], ['/invoices', invoicesConfig], ['/payments', paymentsConfig],
  ['/brands', brandsConfig], ['/sub-brands', subBrandsConfig], ['/products', productsConfig],
  ['/employees', employeesConfig], ['/attendance', attendanceConfig], ['/salary', salaryConfig],
  ['/admins', adminsConfig], ['/audit-logs', auditConfig],
];

function Protected({ children }) {
  const { user, booting } = useAuth();
  const { pathname } = useLocation();
  if (booting) return <div className="flex min-h-screen items-center justify-center"><Spinner className="h-8 w-8" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword && pathname !== '/change-password') return <Navigate to="/change-password" replace />;
  if (user.twoFactorSetupRequired && pathname !== '/security') return <Navigate to="/security" replace />;
  return children;
}

function Guard({ module, children }) {
  const { can } = useAuth();
  return can(module, 'view') ? children : <Forbidden />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<Protected><ChangePasswordPage /></Protected>} />
      <Route element={<Protected><AppShell /></Protected>}>
        <Route index element={<DashboardPage />} />
        {RESOURCES.map(([path, config]) => (
          <Route key={path} path={path} element={<Guard module={config.module}><ResourcePage key={config.key} config={config} /></Guard>} />
        ))}
        <Route path="/reports" element={<Guard module="reports"><ReportsPage /></Guard>} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
