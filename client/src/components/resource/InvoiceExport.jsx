import { Download } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api, errorMessage } from '../../lib/api';
import { isoDay } from '../../lib/format';
import { downloadCsv } from '../../lib/utils';
import Button from '../ui/Button';

/** Month picker + CSV export of invoices (GST columns) for the accountant. */
export default function InvoiceExport({ ctx }) {
  const [month, setMonth] = useState(isoDay().slice(0, 7));
  const [busy, setBusy] = useState(false);
  if (!ctx.can('invoices', 'view')) return null;

  const run = async () => {
    setBusy(true);
    try {
      const { data } = await api.get('/invoices/export', { params: { month } });
      if (!data.data.length) { toast('No invoices in that month'); return; }
      const r = (p) => (p || 0) / 100;
      downloadCsv(`invoices-${month}.csv`, [
        { label: 'Invoice no', key: 'invoiceNo' },
        { label: 'Date', value: (i) => i.date?.slice(0, 10) },
        { label: 'Party', value: (i) => i.buyer?.name },
        { label: 'Party GSTIN', value: (i) => i.buyer?.gstin },
        { label: 'Place of supply', value: (i) => i.buyer?.state },
        { label: 'Supply', value: (i) => (i.supply === 'intra' ? 'Intra-state' : 'Inter-state') },
        { label: 'Taxable value', value: (i) => r(i.taxable) },
        { label: 'CGST', value: (i) => r(i.cgst) },
        { label: 'SGST', value: (i) => r(i.sgst) },
        { label: 'IGST', value: (i) => r(i.igst) },
        { label: 'Round off', value: (i) => r(i.roundOff) },
        { label: 'Invoice total', value: (i) => r(i.total) },
        { label: 'Status', key: 'status' },
      ], data.data);
      toast.success(`${data.data.length} invoices exported`);
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <>
      <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input !h-10 !w-auto !py-0" aria-label="Export month" />
      <Button variant="secondary" icon={Download} loading={busy} onClick={run} disabled={!month}>Export CSV</Button>
    </>
  );
}
