import { cn } from '../../lib/utils';
import { titleCase } from '../../lib/format';

const tones = {
  neutral: 'bg-surface2 text-muted',
  brand: 'bg-brand-soft text-brand',
  success: 'bg-success/10 text-success',
  warn: 'bg-warn/10 text-warn',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
};
const statusTone = {
  active: 'success', issued: 'success', confirmed: 'success', delivered: 'success', paid: 'success', approved: 'success', present: 'success', create: 'success', login: 'success',
  booked: 'info', dispatched: 'info', pending: 'warn', draft: 'neutral', halfDay: 'warn', leave: 'info', update: 'info', none: 'neutral',
  cancelled: 'danger', inactive: 'neutral', rejected: 'danger', absent: 'danger', disabled: 'danger', delete: 'danger', login_failed: 'danger',
  superAdmin: 'brand', admin: 'info', salesperson: 'neutral',
  cash: 'neutral', upi: 'info', bank: 'brand', cheque: 'warn',
};

export function Badge({ tone = 'neutral', children, className, dot }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function StatusBadge({ value }) {
  if (!value) return <span className="text-muted">-</span>;
  return <Badge tone={statusTone[value] || 'neutral'} dot>{titleCase(String(value).replace(/_/g, ' '))}</Badge>;
}
