import {
  BarChart3, Building2, CalendarCheck, ClipboardList, CreditCard, History, LayoutDashboard, Layers,
  Package, Receipt, ShieldCheck, Store, Target, UserCog, Users, Wallet,
} from 'lucide-react';

// `module` = permission module required to see the item (omit = always visible)
export const NAV = [
  { label: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    label: 'Sales',
    items: [
      { to: '/bookings', label: 'Bookings', icon: ClipboardList, module: 'bookings' },
      { to: '/targets', label: 'Targets', icon: Target, module: 'targets' },
      { to: '/parties', label: 'Parties', icon: Store, module: 'parties' },
      { to: '/invoices', label: 'Invoices', icon: Receipt, module: 'invoices' },
      { to: '/payments', label: 'Payments', icon: CreditCard, module: 'payments' },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { to: '/brands', label: 'Brands', icon: Building2, module: 'brands' },
      { to: '/sub-brands', label: 'Sub-brands', icon: Layers, module: 'brands' },
      { to: '/products', label: 'Products', icon: Package, module: 'products' },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/employees', label: 'Employees', icon: Users, module: 'employees' },
      { to: '/attendance', label: 'Attendance', icon: CalendarCheck, module: 'attendance' },
      { to: '/salary', label: 'Salary', icon: Wallet, module: 'salary' },
    ],
  },
  { label: 'Insights', items: [{ to: '/reports', label: 'Reports', icon: BarChart3, module: 'reports' }] },
  {
    label: 'Administration',
    items: [
      { to: '/admins', label: 'Admins', icon: UserCog, module: 'admins' },
      { to: '/audit-logs', label: 'Audit logs', icon: History, module: 'audit' },
    ],
  },
  { label: 'Account', items: [{ to: '/security', label: 'Security', icon: ShieldCheck }] },
];
