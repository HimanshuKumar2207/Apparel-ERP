import { Ban } from 'lucide-react';
import { api } from '../../lib/api';
import { money } from '../../lib/format';
import InvoiceView from '../../components/invoice/InvoiceView';
import InvoiceExport from '../../components/resource/InvoiceExport';
import { remote } from './shared';

export const invoicesConfig = {
  key: 'invoices', module: 'invoices', endpoint: '/invoices', title: 'Invoices', singular: 'Invoice', readOnly: true,
  subtitle: 'GST invoices raised from confirmed bookings. Create them from the Bookings page.',
  searchPlaceholder: 'Search invoice no, party or GSTIN...', defaultSort: '-date', pageSize: 15,
  invalidate: ['bookings', 'products', 'parties'],
  detail: true, detailLabel: 'View / print', detailSize: 'xl',
  detailTitle: (i) => `Invoice ${i.invoiceNo}`,
  renderDetail: (i) => <InvoiceView invoice={i} />,
  toolbar: (ctx) => <InvoiceExport ctx={ctx} />,
  filters: [
    { key: 'party', label: 'All parties', optionsFrom: remote('/parties') },
    { key: 'status', label: 'Any status', options: [{ value: 'issued', label: 'Issued' }, { value: 'cancelled', label: 'Cancelled' }] },
  ],
  columns: [
    { key: 'invoiceNo', label: 'Invoice', type: 'mono', sortable: true },
    { key: 'date', label: 'Date', type: 'date', sortable: true },
    { key: 'party.name', label: 'Party', render: (r) => <div><p className="font-medium text-ink">{r.buyer?.name}</p><p className="text-xs text-muted">{r.buyer?.gstin || 'No GSTIN'}</p></div> },
    { key: 'supply', label: 'Supply', render: (r) => <span className="text-xs text-muted">{r.supply === 'intra' ? 'CGST + SGST' : 'IGST'}</span> },
    { key: 'taxable', label: 'Taxable', type: 'money', align: 'right' },
    { key: 'tax', label: 'GST', type: 'money', align: 'right', value: (r) => r.cgst + r.sgst + r.igst },
    { key: 'total', label: 'Total', align: 'right', sortable: true, render: (r) => <span className="font-semibold tabular-nums text-ink">{money(r.total)}</span> },
    { key: 'dueDate', label: 'Due', type: 'date' },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
  rowActions: [
    {
      key: 'cancel', label: 'Cancel invoice', icon: Ban, danger: true, permission: 'approve', show: (r) => r.status === 'issued', success: 'Invoice cancelled',
      form: {
        title: 'Cancel invoice', subtitle: (r) => `${r.invoiceNo} - stock will be returned and the booking can be invoiced again.`, submitLabel: 'Cancel invoice',
        fields: [{ name: 'reason', label: 'Reason', type: 'textarea', rows: 2, required: true }],
        submit: (r, payload) => api.post(`/invoices/${r._id}/cancel`, payload),
      },
    },
  ],
  fields: [],
};
