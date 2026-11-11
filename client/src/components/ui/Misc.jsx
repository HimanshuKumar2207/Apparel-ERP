import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Skeleton = ({ className }) => <div className={cn('skeleton h-4 w-full', className)} />;

export function Spinner({ className }) {
  return <div className={cn('h-5 w-5 animate-spin rounded-full border-2 border-brand/25 border-t-brand', className)} />;
}

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand"><Icon className="h-7 w-7" /></div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value = 0, max = 100, className, showLabel = true }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const raw = Math.round(value * 10) / 10;
  const color = value >= 100 ? 'bg-success' : value >= 70 ? 'bg-brand' : value >= 40 ? 'bg-warn' : 'bg-danger';
  return (
    <div className={cn('flex min-w-[110px] items-center gap-2', className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface2">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <span className="w-12 text-right text-xs font-medium tabular-nums text-ink/80">{raw}%</span>}
    </div>
  );
}

export function Avatar({ name, size = 'md', className }) {
  const s = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-9 w-9 text-sm';
  const initials = (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  return <div className={cn('flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent font-semibold text-white', s, className)}>{initials}</div>;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cn('scroll-thin inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-surface2 p-1', className)}>
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={cn('whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition', value === t.key ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink')}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'brand', delta, loading }) {
  const tones = { brand: 'bg-brand-soft text-brand', success: 'bg-success/10 text-success', warn: 'bg-warn/10 text-warn', info: 'bg-info/10 text-info', danger: 'bg-danger/10 text-danger' };
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card transition hover:shadow-pop">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        {Icon && <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', tones[tone])}><Icon className="h-[18px] w-[18px]" /></div>}
      </div>
      {loading ? <Skeleton className="mt-3 h-8 w-32" /> : <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-ink">{value}</p>}
      <div className="mt-1 flex items-center gap-2 text-xs">
        {delta != null && !loading && (
          <span className={cn('font-semibold', delta >= 0 ? 'text-success' : 'text-danger')}>{delta >= 0 ? '+' : ''}{Math.round(delta)}%</span>
        )}
        {hint && <span className="text-muted">{hint}</span>}
      </div>
    </div>
  );
}
