import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export function Field({ label, error, hint, required, children, className }) {
  return (
    <label className={cn('block', className)}>
      {label && (
        <span className="mb-1.5 flex items-center gap-1 text-xs font-medium text-ink/80">
          {label}{required && <span className="text-danger">*</span>}
        </span>
      )}
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const Input = forwardRef(function Input({ className, invalid, ...rest }, ref) {
  return <input ref={ref} className={cn('input', invalid && 'input-error', className)} {...rest} />;
});

export const Textarea = forwardRef(function Textarea({ className, invalid, rows = 3, ...rest }, ref) {
  return <textarea ref={ref} rows={rows} className={cn('input resize-y', invalid && 'input-error', className)} {...rest} />;
});

export const Select = forwardRef(function Select({ className, invalid, options = [], placeholder, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cn('input appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-9', invalid && 'input-error', className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")" }}
      {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      {children}
    </select>
  );
});
