import { Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { ACTIONS, ADMIN_GRANTABLE } from '../../config/modules';
import { cn, setIn } from '../../lib/utils';
import Button from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Input';
import { emptyItem } from './transform';
import { useOptions } from './useOptions';

function SelectField({ field, value, onChange, invalid, ctx }) {
  const { options, loading, blocked } = useOptions(field, ctx);
  const placeholder = loading ? 'Loading...' : blocked ? `Select ${field.optionsFrom.dependsOn} first` : field.placeholder || 'Select...';
  return (
    <Select value={value ?? ''} onChange={(e) => onChange(e.target.value, options.find((o) => String(o.value) === e.target.value))} invalid={invalid} options={options} placeholder={placeholder} disabled={field.disabled || blocked} />
  );
}

function MultiSelect({ field, value = [], onChange, ctx }) {
  const { options, loading } = useOptions(field, ctx);
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  if (loading) return <p className="text-xs text-muted">Loading...</p>;
  if (!options.length) return <p className="text-xs text-muted">No options available.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button type="button" key={o.value} onClick={() => toggle(o.value)}
            className={cn('rounded-full border px-3 py-1 text-xs font-medium transition', on ? 'border-brand bg-brand-soft text-brand' : 'border-line bg-surface text-muted hover:text-ink')}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function TagsInput({ field, value = [], onChange }) {
  const [text, setText] = useState('');
  const add = (raw) => {
    const t = raw.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setText('');
  };
  return (
    <div className="input flex min-h-[42px] flex-wrap items-center gap-1.5 !py-1.5">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand">
          {t}<button type="button" onClick={() => onChange(value.filter((x) => x !== t))} aria-label={`Remove ${t}`}><X className="h-3 w-3" /></button>
        </span>
      ))}
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder={value.length ? '' : field.placeholder || 'Type and press Enter'}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(text); } else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1)); }}
        onBlur={() => text && add(text)} className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted/70" />
    </div>
  );
}

function PermissionMatrix({ value = {}, onChange }) {
  const has = (m, a) => (value[m] || []).includes(a);
  const toggle = (m, a) => {
    let cur = new Set(value[m] || []);
    if (cur.has(a)) { cur.delete(a); if (a === 'view') cur = new Set(); } else { cur.add(a); cur.add('view'); }
    onChange({ ...value, [m]: [...cur] });
  };
  const preset = (kind) => {
    const next = {};
    for (const m of ADMIN_GRANTABLE) next[m.key] = kind === 'full' ? [...ACTIONS] : kind === 'read' ? ['view'] : [];
    onChange(next);
  };
  return (
    <div className="rounded-xl border border-line">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface2/60 px-3 py-2">
        <span className="text-xs text-muted">Choose what this admin can do in each module</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => preset('read')}>Read only</Button>
          <Button size="sm" variant="secondary" onClick={() => preset('full')}>Full access</Button>
          <Button size="sm" variant="ghost" onClick={() => preset('none')}>Clear</Button>
        </div>
      </div>
      <div className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead><tr className="text-xs uppercase tracking-wide text-muted">
            <th className="px-3 py-2 text-left font-semibold">Module</th>
            {ACTIONS.map((a) => <th key={a} className="px-2 py-2 text-center font-semibold">{a}</th>)}
          </tr></thead>
          <tbody>
            {ADMIN_GRANTABLE.map((m) => (
              <tr key={m.key} className="border-t border-line">
                <td className="px-3 py-2 font-medium text-ink/90">{m.label}</td>
                {ACTIONS.map((a) => (
                  <td key={a} className="px-2 py-2 text-center">
                    <input type="checkbox" checked={has(m.key, a)} onChange={() => toggle(m.key, a)} className="h-4 w-4 cursor-pointer rounded border-line accent-[rgb(var(--brand))]" aria-label={`${m.label} ${a}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ArrayField({ field, value = [], onChange, errors, ctx }) {
  const update = (i, name, v, opt) => {
    let row = setIn(value[i], name, v);
    const child = field.itemFields.find((f) => f.name === name);
    for (const r of child?.resets || []) row = setIn(row, r, '');
    if (child?.onPick && opt) row = { ...row, ...child.onPick(opt.raw, row) }; // e.g. choosing a product fills style, brand and rate
    onChange(value.map((x, idx) => (idx === i ? row : x)));
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink/80">{field.label}{field.required && <span className="ml-1 text-danger">*</span>}</span>
        <Button size="sm" variant="soft" icon={Plus} onClick={() => onChange([...value, emptyItem(field)])} disabled={field.max && value.length >= field.max}>{field.addLabel || 'Add'}</Button>
      </div>
      {!value.length && <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-xs text-muted">{field.emptyText || 'Nothing added yet.'}</p>}
      {value.map((row, i) => (
        <div key={i} className="relative rounded-xl border border-line bg-surface2/50 p-3 pr-11">
          <div className={cn('grid grid-cols-2 gap-3', field.itemFields.length > 4 ? 'lg:grid-cols-4' : field.itemFields.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
            {field.itemFields.filter((f) => !f.showIf || f.showIf(ctx.values, ctx)).map((f) => (
              <div key={f.name} className={cn(f.span === 2 && 'col-span-2')}>
                <FieldRenderer field={f} value={row[f.name]} onChange={(v, opt) => update(i, f.name, v, opt)} error={errors?.[`${field.name}.${i}.${f.name}`]} ctx={{ ...ctx, item: row }} compact />
              </div>
            ))}
          </div>
          <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} aria-label="Remove row"
            className="absolute right-2 top-2 rounded-lg p-1.5 text-muted transition hover:bg-danger/10 hover:text-danger"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      {errors?.[field.name] && <p className="text-xs text-danger">{errors[field.name]}</p>}
    </div>
  );
}

/** Renders any field definition. Used by DynamicForm and by array rows. */
export default function FieldRenderer({ field, value, onChange, error, errors, ctx, compact }) {
  const invalid = Boolean(error);
  const label = field.label;
  const common = { error, hint: field.hint, required: field.required };

  switch (field.type) {
    case 'array': return <ArrayField field={field} value={value} onChange={onChange} errors={errors} ctx={ctx} />;
    case 'permissions':
      return <div><p className="mb-1.5 text-xs font-medium text-ink/80">{label}</p><PermissionMatrix value={value} onChange={onChange} />{error && <p className="mt-1 text-xs text-danger">{error}</p>}</div>;
    case 'multiselect':
      return <div><p className="mb-1.5 text-xs font-medium text-ink/80">{label}</p><MultiSelect field={field} value={value} onChange={onChange} ctx={ctx} />{field.hint && <p className="mt-1 text-xs text-muted">{field.hint}</p>}</div>;
    case 'tags':
      return <Field label={label} {...common}><TagsInput field={field} value={value} onChange={onChange} /></Field>;
    case 'switch':
      return (
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5">
          <span className="text-sm text-ink">{label}</span>
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--brand))]" />
        </label>
      );
    case 'textarea':
      return <Field label={label} {...common}><Textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} invalid={invalid} rows={field.rows} /></Field>;
    case 'select':
      return <Field label={label} {...common}><SelectField field={field} value={value} onChange={onChange} invalid={invalid} ctx={ctx} /></Field>;
    case 'money':
      return (
        <Field label={label} {...common}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">{'\u20B9'}</span>
            <Input type="number" inputMode="decimal" min={field.min ?? 0} step="0.01" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder || '0.00'} invalid={invalid} className="pl-8" />
          </div>
        </Field>
      );
    default:
      return (
        <Field label={label} {...common}>
          <Input type={field.type || 'text'} value={value ?? ''} min={field.min} max={field.max} step={field.step} maxLength={field.maxLength} autoComplete={field.autoComplete}
            onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} invalid={invalid} disabled={field.disabled} inputMode={field.type === 'number' ? 'decimal' : undefined} />
        </Field>
      );
  }
}
