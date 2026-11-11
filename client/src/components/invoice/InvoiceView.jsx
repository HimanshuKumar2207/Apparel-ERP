import { Printer } from 'lucide-react';
import { date, money, number } from '../../lib/format';
import Button from '../ui/Button';
import { StatusBadge } from '../ui/Badge';

const Row = ({ label, value, strong }) => (
  <div className={`flex justify-between gap-6 py-1 text-sm ${strong ? 'border-t border-line pt-2 text-base font-semibold text-ink' : 'text-muted'}`}>
    <span>{label}</span><span className="tabular-nums">{value}</span>
  </div>
);

/** Printable GST invoice. "Print / Save as PDF" uses the browser print dialog (print CSS hides everything else). */
export default function InvoiceView({ invoice: inv }) {
  const intra = inv.supply === 'intra';
  const s = inv.seller || {};
  const b = inv.buyer || {};
  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <StatusBadge value={inv.status} />
        <Button icon={Printer} onClick={() => window.print()}>Print / Save as PDF</Button>
      </div>

      <div className="print-area rounded-xl border border-line bg-surface p-6 text-ink">
        {inv.status === 'cancelled' && <p className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">CANCELLED{inv.cancelReason ? `: ${inv.cancelReason}` : ''}</p>}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <h2 className="text-lg font-semibold">{s.name}</h2>
            {s.address && <p className="mt-0.5 max-w-xs text-xs text-muted">{s.address}</p>}
            <p className="mt-1 text-xs text-muted">{s.gstin ? `GSTIN: ${s.gstin}` : 'GSTIN: not set'} | State: {s.state}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Tax invoice</p>
            <p className="font-mono text-base font-semibold">{inv.invoiceNo}</p>
            <p className="text-xs text-muted">Date: {date(inv.date)}</p>
            {inv.dueDate && <p className="text-xs text-muted">Due: {date(inv.dueDate)}</p>}
          </div>
        </div>

        <div className="grid gap-4 border-b border-line py-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Bill to</p>
            <p className="mt-1 font-medium">{b.name}</p>
            <p className="text-xs text-muted">{[b.city, b.state].filter(Boolean).join(', ')}</p>
            <p className="text-xs text-muted">{b.gstin ? `GSTIN: ${b.gstin}` : 'GSTIN: unregistered / not set'}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Place of supply</p>
            <p className="mt-1 font-medium">{b.state}</p>
            <p className="text-xs text-muted">{intra ? 'Intra-state: CGST + SGST' : 'Inter-state: IGST'}</p>
          </div>
        </div>

        <div className="scroll-thin overflow-x-auto py-3">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead><tr className="border-b border-line text-[11px] uppercase tracking-wide text-muted">
              <th className="py-2 pr-2">#</th><th className="py-2 pr-2">Item</th><th className="py-2 pr-2">Size / color</th>
              <th className="py-2 pr-2 text-right">Qty</th><th className="py-2 pr-2 text-right">Rate</th><th className="py-2 pr-2 text-right">Disc.</th>
              <th className="py-2 pr-2 text-right">Taxable</th><th className="py-2 pr-2 text-right">GST</th><th className="py-2 text-right">Amount</th>
            </tr></thead>
            <tbody>
              {inv.items.map((l, i) => (
                <tr key={i} className="border-b border-line/60 align-top">
                  <td className="py-2 pr-2 text-muted">{i + 1}</td>
                  <td className="py-2 pr-2"><p className="font-medium">{l.style || '-'}</p><p className="text-muted">{l.brand?.name}</p></td>
                  <td className="py-2 pr-2">{[l.size, l.color].filter(Boolean).join(' / ') || '-'}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{number(l.qty)}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{money(l.rate)}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{l.discountPct ? `${l.discountPct}%` : '-'}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{money(l.taxable)}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{l.gstRate}%</td>
                  <td className="py-2 text-right font-medium tabular-nums">{money(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ml-auto mt-2 w-full max-w-xs">
          <Row label="Taxable value" value={money(inv.taxable)} />
          {intra ? (<><Row label="CGST" value={money(inv.cgst)} /><Row label="SGST" value={money(inv.sgst)} /></>) : <Row label="IGST" value={money(inv.igst)} />}
          {inv.roundOff !== 0 && <Row label="Round off" value={money(inv.roundOff)} />}
          <Row strong label="Total" value={money(inv.total)} />
        </div>
        <p className="mt-6 border-t border-line pt-3 text-[11px] text-muted">This is a computer-generated invoice. Prices exclude GST; tax is shown separately above.</p>
      </div>
    </div>
  );
}
