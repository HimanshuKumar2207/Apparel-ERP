// Mirrors server/src/config/permissions.js (used for the permission matrix UI).
export const ADMIN_GRANTABLE = [
  { key: 'employees', label: 'Employees' },
  { key: 'salary', label: 'Salary' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'brands', label: 'Brands & sub-brands' },
  { key: 'products', label: 'Products' },
  { key: 'parties', label: 'Parties' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'targets', label: 'Targets' },
  { key: 'payments', label: 'Payments' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'reports', label: 'Reports' },
];
export const ACTIONS = ['view', 'add', 'edit', 'delete', 'approve'];
