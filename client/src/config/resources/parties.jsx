import { ACTIVE, remote } from './shared';
import { money } from '../../lib/format';

export const partiesConfig = {
  key: 'parties', module: 'parties', endpoint: '/parties', title: 'Parties', singular: 'Party',
  subtitle: 'Dealers and retailers, the brands they sell, credit limits and outstanding.',
  searchPlaceholder: 'Search name, code, city or GST...', defaultSort: 'name', modalSize: 'xl', invalidate: ['payments'],
  filters: [{ key: 'status', label: 'All statuses', options: ACTIVE }],
  columns: [
    { key: 'code', label: 'Code', type: 'mono', sortable: true },
    { key: 'name', label: 'Party', sortable: true, render: (r) => <div><p className="font-medium text-ink">{r.name}</p><p className="text-xs text-muted">{[r.city, r.region].filter(Boolean).join(' - ')}</p></div> },
    { key: 'assignedTo.name', label: 'Handled by' },
    { key: 'brands', label: 'Sells', type: 'tags', value: (r) => (r.brands || []).map((b) => b.brand?.name).filter(Boolean) },
    { key: 'creditLimit', label: 'Credit limit', type: 'money', align: 'right', render: (r) => (r.creditLimit ? money(r.creditLimit) : <span className="text-muted">No limit</span>) },
    { key: 'outstanding', label: 'Outstanding', type: 'money', align: 'right', render: (r) => <span className={r.outstanding > 0 ? 'font-medium text-warn' : 'text-muted'}>{money(r.outstanding)}</span> },
    { key: 'creditUsedPct', label: 'Credit used', type: 'progress', value: (r) => r.creditUsedPct },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
  fields: [
    { type: 'section', title: 'Business' },
    { name: 'name', label: 'Party name', required: true },
    { name: 'code', label: 'Code', placeholder: 'Auto-generated', createOnly: true },
    { name: 'city', label: 'City' },
    { name: 'region', label: 'Region / territory', hint: 'Used to scope admins to a region' },
    { name: 'state', label: 'State' },
    { name: 'gstNumber', label: 'GSTIN', placeholder: '22AAAAA0000A1Z5' },
    { type: 'section', title: 'Terms' },
    { name: 'assignedTo', label: 'Handled by (employee)', type: 'select', clearable: true, optionsFrom: remote('/employees', { labelFn: (d) => `${d.name} (${d.code})` }) },
    { name: 'creditLimit', label: 'Credit limit', type: 'money', hint: 'Leave empty or 0 for no limit' },
    { name: 'paymentTermsDays', label: 'Payment terms (days)', type: 'number', min: 0, max: 365, defaultValue: 30 },
    { name: 'status', label: 'Status', type: 'select', options: ACTIVE, defaultValue: 'active', required: true },
    { type: 'section', title: 'Brands this party sells' },
    {
      name: 'brands', label: 'Brands and discounts', type: 'array', addLabel: 'Add brand', emptyText: 'No brands linked yet.',
      itemFields: [
        { name: 'brand', label: 'Brand', type: 'select', required: true, optionsFrom: remote('/brands') },
        { name: 'discountPct', label: 'Discount (%)', type: 'number', min: 0, max: 100 },
      ],
    },
    { type: 'section', title: 'Contacts' },
    {
      name: 'contacts', label: 'Contact persons', type: 'array', addLabel: 'Add contact', emptyText: 'No contacts added.',
      itemFields: [{ name: 'name', label: 'Name' }, { name: 'phone', label: 'Phone', type: 'tel' }, { name: 'email', label: 'Email', type: 'email' }],
    },
  ],
};
