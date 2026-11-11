import { Check, Wallet } from 'lucide-react';
import { api } from '../../lib/api';
import { money } from '../../lib/format';
import PayrollRun from '../../components/resource/PayrollRun';
import { remote } from './shared';

export const salaryConfig = {
  key: 'salary', module: 'salary', endpoint: '/salary', title: 'Salary', singular: 'Salary record',
  subtitle: 'Monthly payroll: attendance, incentives and deductions. Approved and paid months are locked.',
  defaultSort: '-month', modalSize: 'md', noCreate: true, noDelete: true,
  canEditRow: (r) => r.status === 'draft',
  toolbar: (ctx) => <PayrollRun ctx={ctx} />,
  filters: [
    { key: 'employee', label: 'All employees', optionsFrom: remote('/employees') },
    { key: 'status', label: 'Any status', options: [{ value: 'draft', label: 'Draft' }, { value: 'approved', label: 'Approved' }, { value: 'paid', label: 'Paid' }] },
  ],
  columns: [
    { key: 'month', label: 'Month', type: 'mono', sortable: true },
    { key: 'employee.name', label: 'Employee', render: (r) => <div><p className="font-medium text-ink">{r.employee?.name}</p><p className="text-xs text-muted">{r.employee?.designation}</p></div> },
    { key: 'payableDays', label: 'Days', render: (r) => <span className="tabular-nums">{r.payableDays}/{r.daysInMonth}</span> },
    { key: 'gross', label: 'Gross', type: 'money', align: 'right' },
    { key: 'incentive', label: 'Incentive', type: 'money', align: 'right' },
    { key: 'deductions', label: 'Deductions', type: 'money', align: 'right' },
    { key: 'advances', label: 'Advances', type: 'money', align: 'right' },
    { key: 'net', label: 'Net pay', align: 'right', render: (r) => <span className="font-semibold tabular-nums text-ink">{money(r.net)}</span> },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
  rowActions: [
    { key: 'approve', label: 'Approve salary', icon: Check, tone: 'success', permission: 'approve', show: (r) => r.status === 'draft', confirm: 'Approve this salary? It will be locked for editing.', onClick: (r) => api.post(`/salary/${r._id}/approve`), success: 'Salary approved' },
    { key: 'pay', label: 'Mark as paid', icon: Wallet, tone: 'success', permission: 'approve', show: (r) => r.status === 'approved', confirm: 'Mark this salary as paid?', onClick: (r) => api.post(`/salary/${r._id}/pay`), success: 'Marked as paid' },
  ],
  fields: [
    { name: 'incentive', label: 'Incentive', type: 'money' },
    { name: 'deductions', label: 'Deductions', type: 'money' },
    { name: 'advances', label: 'Advances recovered', type: 'money' },
    { name: 'note', label: 'Note' },
  ],
};
