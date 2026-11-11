import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';

export default function Pagination({ meta, onPage, onLimit }) {
  if (!meta) return null;
  const { page, pages, total, limit } = meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-muted">
      <span>Showing <b className="text-ink">{from}-{to}</b> of <b className="text-ink">{total}</b></span>
      <div className="flex items-center gap-2">
        {onLimit && (
          <select value={limit} onChange={(e) => onLimit(Number(e.target.value))} className="rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-ink outline-none">
            {[10, 15, 25, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
        )}
        <Button size="icon" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
        <span className="min-w-[4.5rem] text-center text-xs">Page {page} / {pages}</span>
        <Button size="icon" variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
