import { money, date } from '../../lib/format';
import { remote } from './shared';

const PERIODS = [{ value: 'month', label: 'Month' }, { value: 'quarter', label: 'Quarter' }, { value: 'season', label: 'Season' }, { value: 'year', label: 'Year' }];

export const targetsConfig = {
  key: 'targets', module: 'targets', endpoint: '/targets', title: 'Targets', singular: 'Target',
  subtitle: 'Employee targets per brand with live achievement from confirmed bookings.',
  defaultSort: '-periodStart', modalSize: 'md',
  filters: [
    { key: 'employee', label: 'All employees', optionsFrom: remote('/employees') },
    { key: 'brand', label: 'All brands', optionsFrom: remote('/brands') },
    { key: 'periodType', label: 'Any period', options: PERIODS },
  ],
  columns: [
    { key: 'employee.name', label: 'Employee', render: (r) => <span className="font-medium text-ink">{r.employee?.name}</span> },
    { key: 'brand.name', label: 'Brand', render: (r) => <div><p>{r.brand?.name}</p>{r.subBrand?.name && <p className="text-xs text-muted">{r.subBrand.name}</p>}</div> },
    { key: 'periodStart', label: 'Period', sortable: true, render: (r) => <span className="text-xs text-muted">{date(r.periodStart)} - {date(r.periodEnd)}</span> },
    { key: 'targetValue', label: 'Target', type: 'money', align: 'right' },
    { key: 'achievedValue', label: 'Achieved', type: 'money', align: 'right' },
    { key: 'percent', label: 'Progress', type: 'progress', width: 190 },
    { key: 'incentive', label: 'Incentive', align: 'right', render: (r) => (r.incentive ? <span className="font-medium text-success">{money(r.incentive)}</span> : <span className="text-muted">-</span>) },
  ],
  fields: [
    { name: 'employee', label: 'Employee', type: 'select', required: true, optionsFrom: remote('/employees', { labelFn: (d) => `${d.name} (${d.code})` }) },
    { name: 'brand', label: 'Brand', type: 'select', required: true, resets: ['subBrand'], optionsFrom: remote('/brands') },
    { name: 'subBrand', label: 'Sub-brand (optional)', type: 'select', clearable: true, optionsFrom: remote('/sub-brands', { dependsOn: 'brand', params: (v) => ({ brand: v?.brand }) }) },
    { name: 'periodType', label: 'Period type', type: 'select', options: PERIODS, defaultValue: 'month', required: true },
    { name: 'periodStart', label: 'From', type: 'date', required: true },
    { name: 'periodEnd', label: 'To', type: 'date', required: true },
    { name: 'targetValue', label: 'Target value', type: 'money', required: true },
    { name: 'targetQty', label: 'Target quantity (pieces)', type: 'number', min: 0 },
    { name: 'note', label: 'Note', span: 2 },
  ],
};
