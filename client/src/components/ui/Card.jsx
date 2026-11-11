import { cn } from '../../lib/utils';

export function Card({ className, children, ...rest }) {
  return <div className={cn('rounded-2xl border border-line bg-surface shadow-card', className)} {...rest}>{children}</div>;
}
export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-5 pt-5', className)}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
