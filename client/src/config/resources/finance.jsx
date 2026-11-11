import { remote, today } from './shared';

const MODES = [{ value: 'bank', label: 'Bank transfer' }, { value: 'upi', label: 'UPI' }, { value: 'cheque', label: 'Cheque' }, { value: 'cash', label: 'Cash' }];

export const paymentsConfig = {
  key: 'payments', module: 'payments', endpoint: '/payments', title: 'Payments', singular: 'Payment', addLabel: 'Record payment',
  subtitle: 'Money received from parties. Each payment reduces the party outstanding.',
  searchPlaceholder: 'Search reference...', defaultSort: '-date', modalSize: 'md', invalidate: ['parties'],
  filters: [{ key: 'party', label: 'All parties', optionsFrom: remote('/parties') }, { key: 'mode', label: 'Any mode', options: MODES }],
  columns: [
    { key: 'date', label: 'Date', type: 'date', sortable: true },
    { key: 'party.name', label: 'Party', render: (r) => <span className="font-medium text-ink">{r.party?.name}</span> },
    { key: 'amount', label: 'Amount', type: 'money', align: 'right', sortable: true },
    { key: 'mode', label: 'Mode', type: 'badge' },
    { key: 'referenceNo', label: 'Reference', type: 'mono' },
    { key: 'note', label: 'Note' },
  ],
  fields: [
    { name: 'party', label: 'Party', type: 'select', required: true, span: 2, optionsFrom: remote('/parties', { labelFn: (d) => `${d.name}${d.city ? ` - ${d.city}` : ''}` }) },
    { name: 'amount', label: 'Amount received', type: 'money', required: true },
    { name: 'date', label: 'Date', type: 'date', required: true, defaultValue: today },
    { name: 'mode', label: 'Mode', type: 'select', options: MODES, defaultValue: 'bank', required: true },
    { name: 'referenceNo', label: 'Reference / cheque no.' },
    { name: 'note', label: 'Note', span: 2 },
  ],
};
