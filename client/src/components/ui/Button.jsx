import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const variants = {
  primary: 'bg-brand text-brand-fg shadow-sm hover:brightness-110 focus-visible:ring-brand/30',
  secondary: 'bg-surface text-ink border border-line hover:bg-surface2 focus-visible:ring-brand/20',
  ghost: 'text-muted hover:bg-surface2 hover:text-ink focus-visible:ring-brand/20',
  danger: 'bg-danger text-white hover:brightness-110 focus-visible:ring-danger/30',
  soft: 'bg-brand-soft text-brand hover:brightness-95 focus-visible:ring-brand/20',
};
const sizes = { sm: 'h-8 px-3 text-xs gap-1.5', md: 'h-10 px-4 text-sm gap-2', lg: 'h-12 px-6 text-base gap-2', icon: 'h-9 w-9 justify-center' };

export default function Button({ variant = 'primary', size = 'md', loading, icon: Icon, children, className, disabled, type = 'button', ...rest }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition focus-visible:outline-none focus-visible:ring-4 active:scale-[.98] disabled:pointer-events-none disabled:opacity-50',
        variants[variant], sizes[size], className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      {children}
    </button>
  );
}
