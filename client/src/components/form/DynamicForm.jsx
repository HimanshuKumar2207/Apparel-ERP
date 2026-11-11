import { useState } from 'react';
import toast from 'react-hot-toast';
import { errorMessage, fieldErrors } from '../../lib/api';
import { cn, getIn, setIn } from '../../lib/utils';
import Button from '../ui/Button';
import FieldRenderer from './FieldRenderer';
import { dataFields, toFormValues, toPayload } from './transform';

/**
 * Schema-driven form. Every screen in the app is described by a `fields` array:
 *   { name, label, type, required, options | optionsFrom, span, showIf, createOnly, editOnly, itemFields, ... }
 * onSubmit(payload, values) may throw; server validation errors are mapped back onto the fields.
 */
export default function DynamicForm({ fields, initial, mode = 'create', user, onSubmit, onCancel, submitLabel, footer, cancelLabel = 'Cancel' }) {
  const [values, setValues] = useState(() => toFormValues(fields, initial || {}));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const ctx = { values, user, mode };

  const visible = (f) => !f.showIf || f.showIf(values, { user }, mode);

  const change = (f, v, opt) => {
    let next = setIn(values, f.name, v);
    for (const r of f.resets || []) next = setIn(next, r, '');
    if (f.onPick && opt) next = { ...next, ...f.onPick(opt.raw, next) };
    setValues(next);
    if (errors[f.name]) setErrors((e) => { const { [f.name]: _drop, ...rest } = e; return rest; });
  };

  const validate = () => {
    const errs = {};
    for (const f of dataFields(fields)) {
      if (!visible(f) || (mode === 'edit' && f.createOnly)) continue;
      const v = getIn(values, f.name);
      const blank = v === '' || v == null || (Array.isArray(v) && v.length === 0);
      if (f.required && blank) errs[f.name] = `${f.label} is required`;
      if (f.type === 'array' && Array.isArray(v) && f.minItems && v.length < f.minItems) errs[f.name] = `Add at least ${f.minItems} ${f.minItems > 1 ? 'rows' : 'row'}`;
      if (f.type === 'array') {
        (v || []).forEach((row, i) => f.itemFields.forEach((c) => {
          const cv = row[c.name];
          if (c.required && (cv === '' || cv == null)) errs[`${f.name}.${i}.${c.name}`] = 'Required';
        }));
      }
    }
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) { toast.error('Please fix the highlighted fields'); return; }
    setBusy(true);
    try {
      await onSubmit(toPayload(fields, values, { mode, user }), values);
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
        {fields.filter(visible).map((f, i) => {
          if (f.type === 'section') {
            return (
              <div key={`s${i}`} className="col-span-full mt-2 border-b border-line pb-1.5 first:mt-0">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-brand">{f.title}</h4>
                {f.subtitle && <p className="mt-0.5 text-xs text-muted">{f.subtitle}</p>}
              </div>
            );
          }
          const span = f.span === 2 || ['array', 'permissions', 'multiselect', 'textarea'].includes(f.type);
          return (
            <div key={f.name} className={cn(span && 'sm:col-span-2')}>
              <FieldRenderer field={f} value={getIn(values, f.name)} onChange={(v, opt) => change(f, v, opt)} error={errors[f.name]} errors={errors} ctx={ctx} />
            </div>
          );
        })}
      </div>
      {footer && <div className="mt-5">{typeof footer === 'function' ? footer(values) : footer}</div>}
      <div className="mt-6 flex justify-end gap-2 border-t border-line pt-4">
        {onCancel && <Button variant="secondary" onClick={onCancel} disabled={busy}>{cancelLabel}</Button>}
        <Button type="submit" loading={busy}>{submitLabel || (mode === 'edit' ? 'Save changes' : 'Create')}</Button>
      </div>
    </form>
  );
}
