import { Check, FileText, PackageCheck, Send, ThumbsUp, Truck, XCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { money } from '../../lib/format';
import { remote, today } from './shared';

const setStatus = (row, status) => api.post(`/bookings/${row._id}/status`, { status });
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free'].map((s) => ({ value: s, label: s }));

export const bookingsConfig = {
  key: 'bookings', module: 'bookings', endpoint: '/bookings', title: 'Bookings', singular: 'Booking', addLabel: 'New booking',
  subtitle: 'Orders taken from parties. Confirmed bookings count towards targets and outstanding.',
  searchPlaceholder: 'Search booking number...', defaultSort: '-date', modalSize: 'xl', invalidate: ['targets', 'parties', 'invoices', 'products'],
  filters: [
    { key: 'status', label: 'All statuses', options: ['draft', 'booked', 'confirmed', 'dispatched', 'delivered', 'cancelled'].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })) },
    { key: 'approvalStatus', label: 'Any approval', options: [{ value: 'pending', label: 'Pending approval' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }] },
    { key: 'party', label: 'All parties', optionsFrom: remote('/parties') },
  ],
  canEditRow: (r, user) => !r.invoice && (['draft', 'booked'].includes(r.status) || user.role === 'superAdmin'),
  columns: [
    { key: 'bookingNo', label: 'Booking', type: 'mono', sortable: true },
    { key: 'date', label: 'Date', type: 'date', sortable: true },
    { key: 'party.name', label: 'Party', render: (r) => <div><p className="font-medium text-ink">{r.party?.name}</p><p className="text-xs text-muted">{r.party?.city}</p></div> },
    { key: 'employee.name', label: 'Taken by' },
    { key: 'brands', label: 'Brands', type: 'tags', value: (r) => [...new Set((r.items || []).map((i) => i.brand?.name).filter(Boolean))] },
    { key: 'totalQty', label: 'Qty', type: 'number', align: 'right' },
    { key: 'totalAmount', label: 'Amount', type: 'money', align: 'right', sortable: true },
    { key: 'status', label: 'Status', type: 'badge' },
    { key: 'invoice', label: 'Invoice', render: (r) => (r.invoice?.invoiceNo ? <span className="font-mono text-xs text-muted">{r.invoice.invoiceNo}</span> : <span className="text-muted">-</span>) },
    { key: 'approvalStatus', label: 'Approval', render: (r) => (r.approvalStatus === 'none' ? <span className="text-muted">-</span> : <span title={r.approvalReason}><StatusBadgeLazy v={r.approvalStatus} /></span>) },
  ],
  rowActions: [
    { key: 'submit', label: 'Submit booking', icon: Send, show: (r) => r.status === 'draft', onClick: (r) => setStatus(r, 'booked'), success: 'Booking submitted' },
    { key: 'confirm', label: 'Confirm booking', icon: Check, tone: 'success', permission: 'approve', show: (r) => r.status === 'booked' && r.approvalStatus !== 'pending', confirm: 'Confirm this booking? It will count towards targets and the party outstanding.', onClick: (r) => setStatus(r, 'confirmed'), success: 'Booking confirmed' },
    { key: 'dispatch', label: 'Mark dispatched', icon: Truck, permission: 'approve', show: (r) => r.status === 'confirmed', onClick: (r) => setStatus(r, 'dispatched'), success: 'Marked dispatched' },
    { key: 'deliver', label: 'Mark delivered', icon: PackageCheck, tone: 'success', permission: 'approve', show: (r) => r.status === 'dispatched', onClick: (r) => setStatus(r, 'delivered'), success: 'Marked delivered' },
    {
      key: 'approve', label: 'Review approval', icon: ThumbsUp, tone: 'success', permission: 'approve', show: (r) => r.approvalStatus === 'pending', success: 'Decision saved',
      form: {
        title: 'Approval needed', subtitle: (r) => `${r.bookingNo} - ${r.approvalReason || 'Requires approval'}`, submitLabel: 'Save decision',
        fields: [
          { name: 'decision', label: 'Decision', type: 'select', required: true, options: [{ value: 'approved', label: 'Approve' }, { value: 'rejected', label: 'Reject' }] },
          { name: 'note', label: 'Note', type: 'textarea', rows: 2 },
        ],
        submit: (r, payload) => api.post(`/bookings/${r._id}/approve`, payload),
      },
    },
    {
      key: 'invoice', label: 'Create GST invoice', icon: FileText, tone: 'success',
      show: (r, { can }) => can('invoices', 'add') && ['confirmed', 'dispatched', 'delivered'].includes(r.status) && !r.invoice,
      confirm: 'Create the GST invoice for this booking? Stock is deducted for product-linked lines.',
      onClick: (r) => api.post('/invoices', { booking: r._id }), success: 'Invoice created',
    },
    { key: 'cancel', label: 'Cancel booking', icon: XCircle, danger: true, show: (r, { user, can }) => !r.invoice && (['draft', 'booked'].includes(r.status) || (['confirmed'].includes(r.status) && can('bookings', 'approve'))), confirm: 'Cancel this booking? This cannot be undone.', onClick: (r) => setStatus(r, 'cancelled'), success: 'Booking cancelled' },
  ],
  fields: [
    { type: 'section', title: 'Booking details' },
    { name: 'party', label: 'Party', type: 'select', required: true, optionsFrom: remote('/parties', { labelFn: (d) => `${d.name}${d.city ? ` - ${d.city}` : ''}` }) },
    { name: 'employee', label: 'Taken by', type: 'select', required: true, showIf: (_v, { user }) => user?.role !== 'salesperson', optionsFrom: remote('/employees', { labelFn: (d) => `${d.name} (${d.code})` }) },
    { name: 'date', label: 'Booking date', type: 'date', required: true, defaultValue: today },
    { name: 'deliveryDate', label: 'Delivery date', type: 'date' },
    { name: 'status', label: 'Save as', type: 'select', createOnly: true, defaultValue: 'booked', options: [{ value: 'booked', label: 'Booked' }, { value: 'draft', label: 'Draft' }] },
    { type: 'section', title: 'Items' },
    {
      name: 'items', label: 'Order lines', type: 'array', required: true, minItems: 1, addLabel: 'Add item', emptyText: 'Add at least one item.',
      itemFields: [
        { name: 'brand', label: 'Brand', type: 'select', required: true, resets: ['subBrand', 'product'], optionsFrom: remote('/brands') },
        { name: 'subBrand', label: 'Sub-brand', type: 'select', clearable: true, resets: ['product'], optionsFrom: remote('/sub-brands', { dependsOn: 'brand', params: (_v, item) => ({ brand: item?.brand }) }) },
        {
          name: 'product', label: 'Catalog product (optional)', type: 'select', clearable: true, span: 2,
          optionsFrom: remote('/products', { dependsOn: 'subBrand', params: (_v, item) => ({ subBrand: item?.subBrand }), labelFn: (d) => `${d.styleCode} - ${d.name}` }),
          // picking a product fills the style and dealer price; size + color then decide which stock row is deducted
          onPick: (p, row) => ({ style: `${p.styleCode} ${p.name}`, rate: p.dealerPrice ? p.dealerPrice / 100 : row.rate }),
        },
        { name: 'style', label: 'Style / description' },
        { name: 'size', label: 'Size', type: 'select', options: SIZES, placeholder: 'Any' },
        { name: 'color', label: 'Color', hint: 'Must match the product stock row' },
        { name: 'qty', label: 'Qty', type: 'number', min: 1, required: true },
        { name: 'rate', label: 'Rate / piece', type: 'money', required: true },
        { name: 'discountPct', label: 'Discount %', type: 'number', min: 0, max: 100 },
      ],
    },
    { name: 'notes', label: 'Notes', type: 'textarea', rows: 2 },
  ],
  formFooter: (values) => {
    const total = (values.items || []).reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0) * (1 - (Number(i.discountPct) || 0) / 100), 0);
    const qty = (values.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0);
    return (
      <div className="flex items-center justify-between rounded-xl bg-brand-soft px-4 py-3">
        <span className="text-sm text-brand">{qty} pieces</span>
        <span className="text-lg font-semibold tabular-nums text-brand">{money(Math.round(total * 100))}</span>
      </div>
    );
  },
};

// small helper so the column above can render a status badge without a circular import at module top
import { StatusBadge } from '../../components/ui/Badge';
function StatusBadgeLazy({ v }) { return <StatusBadge value={v} />; }
