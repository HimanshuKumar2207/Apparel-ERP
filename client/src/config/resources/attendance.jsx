import { remote, today } from './shared';
import CheckInOut from '../../components/resource/CheckInOut';

const STATUSES = [{ value: 'present', label: 'Present' }, { value: 'halfDay', label: 'Half day' }, { value: 'leave', label: 'Paid leave' }, { value: 'absent', label: 'Absent' }];

export const attendanceConfig = {
  key: 'attendance', module: 'attendance', endpoint: '/attendance', title: 'Attendance', singular: 'Attendance record', addLabel: 'Mark attendance',
  subtitle: 'Daily attendance used by the monthly salary run.',
  defaultSort: '-date', modalSize: 'md', noDelete: true, invalidate: ['salary'],
  hideCreate: (user) => user.role === 'salesperson',
  canEditRow: (_r, user) => user.role !== 'salesperson',
  toolbar: (ctx) => <CheckInOut ctx={ctx} />,
  filters: [{ key: 'employee', label: 'All employees', optionsFrom: remote('/employees') }, { key: 'status', label: 'Any status', options: STATUSES }],
  columns: [
    { key: 'date', label: 'Date', type: 'mono', sortable: true },
    { key: 'employee.name', label: 'Employee', render: (r) => <span className="font-medium text-ink">{r.employee?.name}</span> },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'checkIn', label: 'Check-in', type: 'time' },
    { key: 'checkOut', label: 'Check-out', type: 'time' },
    { key: 'note', label: 'Note' },
  ],
  fields: [
    { name: 'employee', label: 'Employee', type: 'select', required: true, createOnly: true, optionsFrom: remote('/employees', { labelFn: (d) => `${d.name} (${d.code})` }) },
    { name: 'date', label: 'Date', type: 'date', required: true, createOnly: true, defaultValue: today },
    { name: 'status', label: 'Status', type: 'select', options: STATUSES, defaultValue: 'present', required: true },
    { name: 'note', label: 'Note' },
  ],
};
