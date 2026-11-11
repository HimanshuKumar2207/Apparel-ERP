import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn, getIn } from '../../lib/utils';
import * as fmt from '../../lib/format';
import { Badge, StatusBadge } from '../ui/Badge';
import { EmptyState, ProgressBar, Skeleton } from '../ui/Misc';

/** Renders one cell from a column definition: { key, label, type, render, value, align, sortable, width } */
export function renderCell(col, row) {
  if (col.render) return col.render(row);
  const v = col.value ? col.value(row) : getIn(row, col.key);
  switch (col.type) {
    case 'money': return <span className="tabular-nums">{fmt.money(v)}</span>;
    case 'number': return <span className="tabular-nums">{fmt.number(v)}</span>;
    case 'percent': return <span className="tabular-nums">{fmt.percent(v)}</span>;
    case 'date': return fmt.date(v);
    case 'datetime': return fmt.dateTime(v);
    case 'time': return fmt.timeOnly(v);
    case 'progress': return v == null ? <span className="text-muted">-</span> : <ProgressBar value={v} />;
    case 'badge': return <StatusBadge value={v} />;
    case 'bool': return v ? <Badge tone="success" dot>Yes</Badge> : <Badge dot>No</Badge>;
    case 'mono': return <span className="font-mono text-xs text-muted">{v ?? '-'}</span>;
    case 'tags':
      return Array.isArray(v) && v.length ? (
        <div className="flex flex-wrap gap-1">{v.slice(0, 3).map((t) => <Badge key={t} tone="brand">{t}</Badge>)}{v.length > 3 && <Badge>+{v.length - 3}</Badge>}</div>
      ) : <span className="text-muted">-</span>;
    default: return v == null || v === '' ? <span className="text-muted">-</span> : <span>{String(v)}</span>;
  }
}

export default function DataTable({ columns, rows = [], loading, sort, onSort, onRowClick, renderActions, empty, skeletonRows = 6 }) {
  const sortKey = sort?.replace(/^-/, '');
  const desc = sort?.startsWith('-');
  const toggle = (c) => onSort?.(sortKey === (c.sortKey || c.key) ? (desc ? '' : `-${c.sortKey || c.key}`) : c.sortKey || c.key);

  return (
    <div className="scroll-thin overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-surface2/60">
            {columns.map((c) => {
              const active = sortKey === (c.sortKey || c.key);
              return (
                <th key={c.key + c.label} style={{ width: c.width }} className={cn('whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted', c.align === 'right' && 'text-right')}>
                  {c.sortable && onSort ? (
                    <button onClick={() => toggle(c)} className="inline-flex items-center gap-1 hover:text-ink">
                      {c.label}
                      {active ? (desc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  ) : c.label}
                </th>
              );
            })}
            {renderActions && <th className="w-px px-4 py-3" />}
          </tr>
        </thead>
        <tbody>
          {loading && !rows.length
            ? Array.from({ length: skeletonRows }).map((_, i) => (
                <tr key={i} className="border-b border-line last:border-0">
                  {columns.map((c) => <td key={c.key + c.label} className="px-4 py-3.5"><Skeleton className="h-4 w-4/5" /></td>)}
                  {renderActions && <td />}
                </tr>
              ))
            : rows.map((row) => (
                <tr key={row._id || row.id} onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn('group border-b border-line transition last:border-0 hover:bg-brand-soft/40', onRowClick && 'cursor-pointer')}>
                  {columns.map((c) => (
                    <td key={c.key + c.label} className={cn('px-4 py-3 align-middle text-ink/90', c.align === 'right' && 'text-right', c.className)}>{renderCell(c, row)}</td>
                  ))}
                  {renderActions && <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>{renderActions(row)}</td>}
                </tr>
              ))}
        </tbody>
      </table>
      {!loading && !rows.length && (empty || <EmptyState title="No records found" message="Try changing your search or filters." />)}
    </div>
  );
}
