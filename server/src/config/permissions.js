// Single source of truth for roles, modules and actions.
export const ROLES = ['superAdmin', 'admin', 'salesperson'];

export const MODULES = [
  'employees', 'salary', 'attendance', 'brands', 'products', 'parties',
  'bookings', 'targets', 'payments', 'invoices', 'reports', 'audit', 'admins',
];

// Modules a Super Admin may delegate to an Admin ('audit' and 'admins' stay Super Admin only).
export const ADMIN_GRANTABLE = [
  'employees', 'salary', 'attendance', 'brands', 'products', 'parties',
  'bookings', 'targets', 'payments', 'invoices', 'reports',
];

export const ACTIONS = ['view', 'add', 'edit', 'delete', 'approve'];

// What a salesperson can do. Data is additionally limited to "own" records by services/scope.service.js.
export const SALESPERSON_RULES = {
  employees: ['view'],
  salary: ['view'],
  attendance: ['view', 'add'],
  brands: ['view'],
  products: ['view'],
  parties: ['view'],
  bookings: ['view', 'add', 'edit'],
  targets: ['view'],
  payments: ['view'],
  invoices: ['view'],
  reports: ['view'],
};

export const BOOKING_STATUSES = ['draft', 'booked', 'confirmed', 'dispatched', 'delivered', 'cancelled'];
export const ACHIEVED_STATUSES = ['confirmed', 'dispatched', 'delivered'];
export const BOOKING_TRANSITIONS = {
  draft: ['booked', 'cancelled'],
  booked: ['confirmed', 'cancelled'],
  confirmed: ['dispatched', 'cancelled'],
  dispatched: ['delivered'],
  delivered: [],
  cancelled: [],
};

// Incentive slabs (achievement % -> % of achieved value). Adjust to your company policy.
export const INCENTIVE_SLABS = [
  { min: 100, rate: 0.02 },
  { min: 80, rate: 0.01 },
];
