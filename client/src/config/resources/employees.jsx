import { KeyRound } from 'lucide-react';
import { api } from '../../lib/api';
import { ACTIVE, remote } from './shared';

export const employeesConfig = {
  key: 'employees', module: 'employees', endpoint: '/employees', title: 'Employees', singular: 'Employee',
  subtitle: 'Profiles, brand assignments, salary structure and logins.',
  searchPlaceholder: 'Search name, code, phone...', defaultSort: 'name', modalSize: 'xl', invalidate: ['salary', 'targets'],
  filters: [{ key: 'status', label: 'All statuses', options: ACTIVE }],
  columns: [
    { key: 'code', label: 'Code', type: 'mono', sortable: true },
    { key: 'name', label: 'Employee', sortable: true, render: (r) => <div><p className="font-medium text-ink">{r.name}</p><p className="text-xs text-muted">{r.designation || '-'}</p></div> },
    { key: 'phone', label: 'Phone' },
    { key: 'brands', label: 'Managed brands', type: 'tags', value: (r) => [...new Set((r.brands || []).map((b) => b.brand?.name).filter(Boolean))] },
    { key: 'loginEmail', label: 'Login', render: (r) => (r.loginEmail ? <span className="text-xs text-muted">{r.loginEmail}</span> : <span className="text-xs text-muted">No login</span>) },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
  rowActions: [
    {
      key: 'login', label: 'Set or reset login', icon: KeyRound, permission: 'edit', success: 'Login saved',
      form: {
        title: 'Employee login', subtitle: (r) => `Sign-in for ${r.name}. They must change the password at first sign-in.`, submitLabel: 'Save login',
        initial: (r) => ({ email: r.loginEmail || r.email || '' }),
        fields: [
          { name: 'email', label: 'Login email', type: 'email', required: true },
          { name: 'password', label: 'Temporary password', type: 'password', required: true, hint: '10+ characters with upper, lower, number and symbol', autoComplete: 'new-password' },
        ],
        submit: (row, payload) => api.post(`/employees/${row._id}/login`, payload),
      },
    },
  ],
  fields: [
    { type: 'section', title: 'Profile' },
    { name: 'name', label: 'Full name', required: true },
    { name: 'code', label: 'Employee code', placeholder: 'Auto-generated', createOnly: true },
    { name: 'designation', label: 'Designation' },
    { name: 'phone', label: 'Phone', type: 'tel' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'joiningDate', label: 'Joining date', type: 'date' },
    { name: 'reportingTo', label: 'Reports to', type: 'select', clearable: true, optionsFrom: remote('/employees', { labelFn: (d) => `${d.name} (${d.code})` }) },
    { name: 'status', label: 'Status', type: 'select', options: ACTIVE, defaultValue: 'active', required: true },
    { name: 'address', label: 'Address', type: 'textarea', rows: 2 },
    { type: 'section', title: 'Brands and sub-brands managed' },
    {
      name: 'brands', label: 'Assignments', type: 'array', addLabel: 'Assign brand', emptyText: 'No brands assigned. The employee will not be able to book anything.',
      itemFields: [
        { name: 'brand', label: 'Brand', type: 'select', required: true, resets: ['subBrand'], optionsFrom: remote('/brands') },
        { name: 'subBrand', label: 'Sub-brand (optional)', type: 'select', clearable: true, optionsFrom: remote('/sub-brands', { dependsOn: 'brand', params: (_v, item) => ({ brand: item?.brand }) }) },
      ],
    },
    { type: 'section', title: 'Salary structure (per month)' },
    { name: 'salary.basic', label: 'Basic', type: 'money' },
    { name: 'salary.allowances', label: 'Allowances', type: 'money' },
    { name: 'salary.deductions', label: 'Fixed deductions', type: 'money' },
    { type: 'section', title: 'Bank and identity', subtitle: 'Account numbers are encrypted. Only the last 4 digits are ever shown.' },
    { name: 'bank.holder', label: 'Account holder' },
    { name: 'bank.ifsc', label: 'IFSC', placeholder: 'HDFC0001234' },
    { name: 'bank.accountNumber', label: 'Account number', type: 'password', autoComplete: 'off', placeholder: 'Leave blank to keep the existing number' },
    { name: 'aadhaarLast4', label: 'Aadhaar (last 4 digits only)', maxLength: 4, autoComplete: 'off' },
  ],
};
