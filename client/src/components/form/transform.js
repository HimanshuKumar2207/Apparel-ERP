import { getIn, setIn } from '../../lib/utils';

const SKIP = Symbol('skip');
const empty = (v) => v === undefined || v === null || v === '';
const idOfValue = (x) => (x && typeof x === 'object' ? x._id : x);

const defaultFor = (f) => {
  if (f.defaultValue !== undefined) return typeof f.defaultValue === 'function' ? f.defaultValue() : f.defaultValue;
  switch (f.type) {
    case 'array': case 'tags': case 'multiselect': return [];
    case 'switch': return false;
    case 'permissions': return {};
    default: return '';
  }
};

export const dataFields = (fields) => fields.filter((f) => f.type !== 'section');

export function emptyValues(fields) {
  let v = {};
  for (const f of dataFields(fields)) v = setIn(v, f.name, defaultFor(f));
  return v;
}
export const emptyItem = (f) => emptyValues(f.itemFields);

function fromApi(f, raw) {
  switch (f.type) {
    case 'money': return empty(raw) ? '' : raw / 100;
    case 'date': return raw ? String(raw).slice(0, 10) : '';
    case 'select': return empty(raw) ? '' : idOfValue(raw);
    case 'multiselect': return (raw || []).map(idOfValue);
    case 'tags': return raw || [];
    case 'switch': return Boolean(raw);
    case 'permissions': return raw || {};
    case 'array': return (raw || []).map((item) => toFormValues(f.itemFields, item));
    default: return raw ?? '';
  }
}

/** API document -> form state (paise -> rupees, populated refs -> ids, ISO dates -> yyyy-mm-dd). */
export function toFormValues(fields, data = {}) {
  let v = emptyValues(fields);
  for (const f of dataFields(fields)) {
    const raw = getIn(data, f.name);
    if (raw !== undefined) v = setIn(v, f.name, fromApi(f, raw));
  }
  return v;
}

function toApi(f, v, mode) {
  switch (f.type) {
    case 'money': return empty(v) ? SKIP : Math.round(Number(v) * 100);
    case 'number': return empty(v) ? SKIP : Number(v);
    case 'date': return empty(v) ? SKIP : v;
    case 'select': return empty(v) ? (mode === 'edit' && f.clearable ? null : SKIP) : v;
    case 'multiselect': case 'tags': return v || [];
    case 'switch': return Boolean(v);
    case 'permissions': return Object.fromEntries(Object.entries(v || {}).filter(([, a]) => a.length));
    case 'array': {
      const rows = (v || []).map((item) => toPayload(f.itemFields, item, { mode })).filter((p) => Object.keys(p).length > 0);
      return rows;
    }
    default: { const s = typeof v === 'string' ? v.trim() : v; return empty(s) ? SKIP : s; }
  }
}

/** Form state -> API payload. Honors createOnly/editOnly/showIf/payload:false on each field. */
export function toPayload(fields, values, { mode = 'create', user } = {}) {
  let out = {};
  for (const f of dataFields(fields)) {
    if (f.payload === false) continue;
    if (mode === 'edit' && f.createOnly) continue;
    if (mode === 'create' && f.editOnly) continue;
    if (f.showIf && !f.showIf(values, { user }, mode)) continue;
    const v = toApi(f, getIn(values, f.name), mode);
    if (v !== SKIP) out = setIn(out, f.name, v);
  }
  return out;
}
