import { remote } from './shared';

const MODULES = ['auth', 'admins', 'employees', 'salary', 'attendance', 'brands', 'products', 'parties', 'bookings', 'targets', 'payments', 'invoices'];

export const auditConfig = {
  key: 'audit-logs', module: 'audit', endpoint: '/audit-logs', title: 'Audit logs', singular: 'Log entry', readOnly: true, detail: true,
  subtitle: 'A permanent, read-only record of who did what and when.',
  searchPlaceholder: 'Search summary, user or record id...', defaultSort: '-createdAt', pageSize: 20, modalSize: 'lg',
  filters: [
    { key: 'module', label: 'All modules', options: MODULES.map((m) => ({ value: m, label: m[0].toUpperCase() + m.slice(1) })) },
    { key: 'role', label: 'All roles', options: [{ value: 'superAdmin', label: 'Super Admin' }, { value: 'admin', label: 'Admin' }, { value: 'salesperson', label: 'Salesperson' }] },
  ],
  columns: [
    { key: 'createdAt', label: 'When', type: 'datetime', sortable: true },
    { key: 'userName', label: 'User', render: (r) => <span className="font-medium text-ink">{r.userName || 'System'}</span> },
    { key: 'role', label: 'Role', type: 'badge' },
    { key: 'action', label: 'Action', type: 'badge' },
    { key: 'module', label: 'Module' },
    { key: 'summary', label: 'Summary' },
    { key: 'ip', label: 'IP', type: 'mono' },
  ],
  fields: [],
};
export { remote };
